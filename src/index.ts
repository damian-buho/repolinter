// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import path from 'node:path'
import fs from 'node:fs'
import * as config from './lib/config.js'
import type { RulesetConfig } from './lib/config.js'
import Result from './lib/result.js'
import type { ResultTarget } from './lib/result.js'
import RuleInfo from './lib/ruleinfo.js'
import FormatResultBase from './lib/formatresult.js'

import FileSystem from './lib/file-system.js'

import Rules from './rules/rules.js'
import Fixes from './fixes/fixes.js'
import Axioms from './axioms/axioms.js'

const FormatResult = FormatResultBase as typeof FormatResultBase & {
  RULE_PASSED: string
  RULE_NOT_PASSED_ERROR: string
  RULE_NOT_PASSED_WARN: string
  IGNORED: string
  ERROR: string
}

export interface LintResult {
  params: {
    targetDirectory: string
    filterPaths: string[]
    rulesetPath: string | undefined
    ruleset: unknown
  }
  passed: boolean
  errored: boolean
  errMsg?: string
  results: InstanceType<typeof FormatResultBase>[]
  targets: Record<string, Result>
  formatOptions?: Record<string, unknown>
}

export interface Formatter {
  formatOutput(output: LintResult, dryRun: boolean): string
}

import defaultFormatter from './formatters/symbol-formatter.js'

export const resultFormatter: Formatter = defaultFormatter

export async function lint(
  targetDirectory: string,
  filterPaths: string[] = [],
  ruleset: unknown = undefined,
  dryRun: boolean = false
): Promise<LintResult> {
  const fileSystem = new FileSystem()
  fileSystem.targetDirectory = targetDirectory
  if (filterPaths.length > 0) {
    fileSystem.filterPaths = filterPaths
  }

  let rulesetPath: string | undefined = undefined

  if (typeof ruleset === 'string' && config.isBase64(ruleset)) {
    ruleset = await config.decodeConfig(ruleset)
  } else {
    if (typeof ruleset === 'string') {
      if (config.isAbsoluteURL(ruleset)) {
        rulesetPath = ruleset
      } else {
        if (fs.existsSync(path.resolve(targetDirectory, ruleset))) {
          rulesetPath = path.resolve(targetDirectory, ruleset)
        } else {
          const moduleDirectory = path.dirname(
            new URL(import.meta.url).pathname
          )
          const herePath = path.join(moduleDirectory, ruleset)
          const rootPath = path.join(moduleDirectory, '..', ruleset)
          if (fs.existsSync(herePath)) {
            rulesetPath = herePath
          } else if (fs.existsSync(rootPath)) {
            rulesetPath = rootPath
          } else {
            rulesetPath = undefined
          }
        }
      }
    } else if (!ruleset) {
      rulesetPath = config.findConfig(targetDirectory)
    }

    if (rulesetPath !== null && rulesetPath !== undefined) {
      try {
        ruleset = await config.loadConfig(rulesetPath)
      } catch (error) {
        return {
          params: {
            targetDirectory,
            filterPaths,
            rulesetPath,
            ruleset
          },
          passed: false,
          errored: true,
          errMsg: String(error),
          results: [],
          targets: {},
          formatOptions:
            ruleset !== null && typeof ruleset === 'object'
              ? (ruleset as RulesetConfig).formatOptions
              : undefined
        }
      }
    }
  }

  const value = await config.validateConfig(ruleset as RulesetConfig)
  if (!value.passed) {
    return {
      params: {
        targetDirectory,
        filterPaths,
        rulesetPath,
        ruleset
      },
      passed: false,
      errored: true,
      errMsg: value.error,
      results: [],
      targets: {},
      formatOptions:
        ruleset !== null && typeof ruleset === 'object'
          ? (ruleset as RulesetConfig).formatOptions
          : undefined
    }
  }
  const parsedRuleset = ruleset as Record<string, unknown>
  const configParsed = config.parseConfig(parsedRuleset)
  let targetObject: Record<string, Result> = {}
  if (parsedRuleset.axioms) {
    targetObject = await determineTargets(
      parsedRuleset.axioms as Record<string, string>,
      fileSystem
    )
  }
  const result = await runRuleset(
    configParsed,
    targetObject,
    fileSystem,
    dryRun
  )
  const passed = !result.some(
    r =>
      r.status === FormatResult.ERROR ||
      (r.status !== FormatResult.IGNORED &&
        r.ruleInfo.level === 'error' &&
        !r.lintResult!.passed)
  )

  return {
    params: {
      targetDirectory,
      filterPaths,
      rulesetPath,
      ruleset: parsedRuleset
    },
    passed,
    errored: false,
    results: result,
    targets: targetObject,
    formatOptions: parsedRuleset.formatOptions as
      | Record<string, unknown>
      | undefined
  }
}

export function shouldRuleRun(
  validTargets: string[],
  ruleAxioms: string[]
): string[] {
  const ruleRegex = /([\w-]+)((?:>|<)=?)(\d+)/i
  interface NumericalRuleAxiom {
    axiom: string
    name: string
    operand: string
    number: number
  }
  const numericalRuleAxioms: NumericalRuleAxiom[] = []
  const regularRuleAxioms: string[] = []
  for (const ruleax of ruleAxioms) {
    const match = ruleRegex.exec(ruleax)
    if (
      match !== null &&
      match[1] &&
      match[2] &&
      match[3] &&
      !Number.isNaN(Number.parseInt(match[3]))
    ) {
      numericalRuleAxioms.push({
        axiom: ruleax,
        name: match[1],
        operand: match[2],
        number: Number.parseInt(match[3])
      })
    } else {
      regularRuleAxioms.push(ruleax)
    }
  }
  const table = new Set(validTargets)
  const failedRuleAxioms = regularRuleAxioms.filter(r => !table.has(r))
  const numericalTargets = validTargets
    .map(r => r.split('='))
    .map(([targetName = '', maybeNumber = '']): [string, number] => [
      targetName,
      Number.parseInt(maybeNumber)
    ])
    .filter(([, maybeNumber]) => !Number.isNaN(maybeNumber))
  const numericalTargetsMap = new Map(numericalTargets)
  const failedNumerical = numericalRuleAxioms
    .filter(({ name, operand, number }) => {
      const target = numericalTargetsMap.get(name)
      if (target === undefined) return true
      return !(
        (operand === '<' && target < number) ||
        (operand === '<=' && target <= number) ||
        (operand === '>' && target > number) ||
        (operand === '>=' && target >= number)
      )
    })
    .map(({ axiom }) => axiom)
  return [...failedNumerical, ...failedRuleAxioms]
}

export async function runRuleset(
  ruleset: RuleInfo[],
  targets: boolean | Record<string, Result>,
  fileSystem: FileSystem,
  dryRun: boolean
): Promise<InstanceType<typeof FormatResultBase>[]> {
  let targetArray: string[] = []
  if (typeof targets !== 'boolean') {
    targetArray = Object.entries(targets)
      .filter(([, result]) => result.passed)
      .map(([axiomId, result]): [string, string[]] => [
        axiomId,
        result.targets
          .map((t: ResultTarget) => t.path)
          .filter((p): p is string => !!p)
      ])
      .flatMap(([axiomId, paths]: [string, string[]]) => [
        `${axiomId}=*`,
        ...paths.map(p => `${axiomId}=${p}`)
      ])
  }
  const results = ruleset.map(async (r: RuleInfo) => {
    if (r.level === 'off') {
      return FormatResult.CreateIgnored(r, 'ignored because level is "off"')
    }
    if (typeof targets !== 'boolean' && r.where && r.where.length > 0) {
      const ignoreReasons = shouldRuleRun(targetArray, r.where)
      if (ignoreReasons.length > 0) {
        return FormatResult.CreateIgnored(
          r,
          `ignored due to unsatisfied condition(s): "${ignoreReasons.join(
            '", "'
          )}"`
        )
      }
    }
    if (!Object.hasOwn(Rules, r.ruleType)) {
      return FormatResult.CreateError(r, `${r.ruleType} is not a valid rule`)
    }
    let result: Result
    try {
      const ruleFunction = Rules[r.ruleType]!
      result = await ruleFunction(fileSystem, r.ruleConfig)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return FormatResult.CreateError(
        r,
        `${r.ruleType} threw an error: ${message}`
      )
    }
    const fixTargets = result.passed
      ? []
      : result.targets
          .filter(
            (t: ResultTarget): t is ResultTarget & { path: string } =>
              !t.passed && !!t.path
          )
          .map(t => t.path)
    if (!r.fixType || result.passed) {
      return FormatResult.CreateLintOnly(r, result)
    }
    if (!Object.hasOwn(Fixes, r.fixType)) {
      return FormatResult.CreateError(r, `${r.fixType} is not a valid fix`)
    }
    let fixresult: Result
    try {
      const fixFunction = Fixes[r.fixType]!
      fixresult = await fixFunction(
        fileSystem,
        r.fixConfig as Record<string, unknown>,
        fixTargets,
        dryRun
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return FormatResult.CreateError(
        r,
        `${r.fixType} threw an error: ${message}`
      )
    }
    return FormatResult.CreateLintAndFix(r, result, fixresult)
  })

  return Promise.all(results)
}

export async function determineTargets(
  axiomconfig: Record<string, string>,
  fs: FileSystem
): Promise<Record<string, Result>> {
  const ruleresults = await Promise.all(
    Object.entries(axiomconfig).map(async ([axiomId, axiomName]) => {
      if (!Object.hasOwn(Axioms, axiomId)) {
        return [
          axiomName,
          new Result(`invalid axiom name ${axiomId}`, [], false)
        ] as [string, Result]
      }
      const axiomFunction = Axioms[axiomId]!
      return [axiomName, await axiomFunction(fs)] as [string, Result]
    })
  )
  return Object.fromEntries(ruleresults)
}

export const validateConfig = config.validateConfig
export const parseConfig = config.parseConfig

export {
  type FormatResultStatus,
  default as FormatResult
} from './lib/formatresult.js'
export { type GlobOptions, default as FileSystem } from './lib/file-system.js'
export { default as defaultFormatter } from './formatters/symbol-formatter.js'
export { default as jsonFormatter } from './formatters/json-formatter.js'
export { default as markdownFormatter } from './formatters/markdown-formatter.js'
export { default as Result, type ResultTarget } from './lib/result.js'
export { default as RuleInfo } from './lib/ruleinfo.js'
