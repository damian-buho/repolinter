// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import path from 'path'
import fs from 'fs'
import * as config from './lib/config.js'
import Result from './lib/result.js'
import RuleInfo from './lib/ruleinfo.js'
import FormatResultBase from './lib/formatresult.js'
import FileSystem from './lib/file_system.js'
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
    targetDir: string
    filterPaths: string[]
    rulesetPath: string | null
    ruleset: any
  }
  passed: boolean
  errored: boolean
  errMsg?: string
  results: any[]
  targets: Record<string, any>
  formatOptions?: Record<string, any>
}

export interface Formatter {
  formatOutput(output: LintResult, dryRun: boolean): string
}

import defaultFormatter from './formatters/symbol_formatter.js'
export { defaultFormatter }

import jsonFormatter from './formatters/json_formatter.js'
export { jsonFormatter }

import markdownFormatter from './formatters/markdown_formatter.js'
export { markdownFormatter }

export const resultFormatter: Formatter = defaultFormatter

export async function lint(
  targetDir: string,
  filterPaths: string[] = [],
  ruleset: any = null,
  dryRun: boolean = false
): Promise<LintResult> {
  const fileSystem = new FileSystem()
  fileSystem.targetDir = targetDir
  if (filterPaths.length > 0) {
    fileSystem.filterPaths = filterPaths
  }

  let rulesetPath: string | null = null
  let isEncoded = false
  if (ruleset !== undefined && ruleset !== null) {
    isEncoded = config.isBase64(ruleset)
  }

  if (isEncoded) {
    ruleset = await config.decodeConfig(ruleset)
  } else {
    if (typeof ruleset === 'string') {
      if (config.isAbsoluteURL(ruleset)) {
        rulesetPath = ruleset
      } else {
        if (fs.existsSync(path.resolve(targetDir, ruleset))) {
          rulesetPath = path.resolve(targetDir, ruleset)
        } else {
          const moduleDir = path.dirname(new URL(import.meta.url).pathname)
          const herePath = path.join(moduleDir, ruleset)
          const rootPath = path.join(moduleDir, '..', ruleset)
          if (fs.existsSync(herePath)) {
            rulesetPath = herePath
          } else if (fs.existsSync(rootPath)) {
            rulesetPath = rootPath
          } else {
            rulesetPath = null
          }
        }
      }
    } else if (!ruleset) {
      rulesetPath = config.findConfig(targetDir)
    }

    if (rulesetPath !== null) {
      try {
        ruleset = await config.loadConfig(rulesetPath)
      } catch (e) {
        return {
          params: {
            targetDir,
            filterPaths,
            rulesetPath,
            ruleset
          },
          passed: false,
          errored: true,
          errMsg: String(e),
          results: [],
          targets: {},
          formatOptions: ruleset && ruleset.formatOptions
        }
      }
    }
  }

  const val = await config.validateConfig(ruleset)
  if (!val.passed) {
    return {
      params: {
        targetDir,
        filterPaths,
        rulesetPath,
        ruleset
      },
      passed: false,
      errored: true,
      errMsg: val.error,
      results: [],
      targets: {},
      formatOptions: ruleset.formatOptions
    }
  }
  const configParsed = config.parseConfig(ruleset)
  let targetObj: Record<string, any> = {}
  if (ruleset.axioms) {
    targetObj = await determineTargets(ruleset.axioms, fileSystem)
  }
  const result = await runRuleset(configParsed, targetObj, fileSystem, dryRun)
  const passed = !result.find(
    r =>
      r.status === FormatResult.ERROR ||
      (r.status !== FormatResult.IGNORED &&
        r.ruleInfo.level === 'error' &&
        !r.lintResult.passed)
  )

  return {
    params: {
      targetDir,
      filterPaths,
      rulesetPath,
      ruleset
    },
    passed,
    errored: false,
    results: result,
    targets: targetObj,
    formatOptions: ruleset.formatOptions
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
      !isNaN(parseInt(match[3]))
    ) {
      numericalRuleAxioms.push({
        axiom: ruleax,
        name: match[1],
        operand: match[2],
        number: parseInt(match[3])
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
      parseInt(maybeNumber)
    ])
    .filter(([, maybeNumber]) => !isNaN(maybeNumber))
  const numericalTargetsMap = new Map(numericalTargets)
  return numericalRuleAxioms
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
    .concat(failedRuleAxioms)
}

export async function runRuleset(
  ruleset: any[],
  targets: boolean | Record<string, any>,
  fileSystem: FileSystem,
  dryRun: boolean
): Promise<any[]> {
  let targetArray: string[] = []
  if (typeof targets !== 'boolean') {
    targetArray = Object.entries(targets)
      .filter(([, result]) => result.passed)
      .map(([axiomId, result]): [string, string[]] => [
        axiomId,
        result.targets.map((t: any) => t.path)
      ])
      .map(([axiomId, paths]: [string, string[]]) => [
        `${axiomId}=*`,
        ...paths.map(p => `${axiomId}=${p}`)
      ])
      .reduce((a: string[], c: string[]) => a.concat(c), [])
  }
  const results = ruleset.map(async (r: any) => {
    if (r.level === 'off') {
      return FormatResult.CreateIgnored(r, 'ignored because level is "off"')
    }
    if (typeof targets !== 'boolean' && r.where && r.where.length) {
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
    let result: any
    try {
      const ruleFunc = Rules[r.ruleType]!
      result = await ruleFunc(fileSystem, r.ruleConfig)
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      return FormatResult.CreateError(
        r,
        `${r.ruleType} threw an error: ${message}`
      )
    }
    const fixTargets = !result.passed
      ? result.targets
          .filter((t: any) => !t.passed && t.path)
          .map((t: any) => t.path)
      : []
    if (!r.fixType || result.passed) {
      return FormatResult.CreateLintOnly(r, result)
    }
    if (!Object.hasOwn(Fixes, r.fixType)) {
      return FormatResult.CreateError(r, `${r.fixType} is not a valid fix`)
    }
    let fixresult: any
    try {
      const fixFunc = Fixes[r.fixType]!
      fixresult = await fixFunc(fileSystem, r.fixConfig, fixTargets, dryRun)
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
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
): Promise<Record<string, any>> {
  const ruleresults = await Promise.all(
    Object.entries(axiomconfig).map(async ([axiomId, axiomName]) => {
      if (!Object.hasOwn(Axioms, axiomId)) {
        return [
          axiomName,
          new Result(`invalid axiom name ${axiomId}`, [], false)
        ] as [string, any]
      }
      const axiomFunction = Axioms[axiomId]!
      return [axiomName, await axiomFunction(fs)] as [string, any]
    })
  )
  return ruleresults.reduce<Record<string, any>>((a, [k, v]) => {
    a[k] = v
    return a
  }, {})
}

export const validateConfig = config.validateConfig
export const parseConfig = config.parseConfig
export { Result, RuleInfo, FileSystem, FormatResultBase as FormatResult }
