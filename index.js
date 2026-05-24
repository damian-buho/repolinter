// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** @module repolinter */

import path from 'path'
import fs from 'fs'
import * as config from './lib/config.js'
import Result from './lib/result.js'
import RuleInfo from './lib/ruleinfo.js'
import FormatResult from './lib/formatresult.js'
import FileSystem from './lib/file_system.js'
import Rules from './rules/rules.js'
import Fixes from './fixes/fixes.js'
import Axioms from './axioms/axioms.js'

/**
 * @typedef {Object} Formatter
 * @property {function(LintResult, boolean): string} formatOutput A function to format the entire linter output.
 */

/**
 * This formatter outputs the LintResult CLI style, including
 * colors on supported platforms.
 *
 * @type {Formatter}
 */
import defaultFormatter from './formatters/symbol_formatter.js'
export { defaultFormatter }

/**
 * This formatter outputs the raw JSON string of the LintResult object.
 *
 * @type {Formatter}
 */
import jsonFormatter from './formatters/json_formatter.js'
export { jsonFormatter }

/**
 * This formatter outputs a markdown document designed to created into
 * a GitHub issue or similar.
 *
 * @type {Formatter}
 */
import markdownFormatter from './formatters/markdown_formatter.js'
export { markdownFormatter }

/** The same as defaultFormatter @type {Formatter} */
export const resultFormatter = defaultFormatter

/**
 * @typedef {Object} LintResult
 *
 * @property {Object} params
 * The parameters to the lint function call, including the found/supplied ruleset object.
 * @property {string} params.targetDir The target directory repolinter was called with. May also be a git URL.
 * @property {string[]} params.filterPaths The filter paths repolinter was called with.
 * @property {string?} [params.rulesetPath] The path to the ruleset configuration repolinter was called with.
 * @property {Object} params.ruleset The deserialized ruleset that Repolinter ran.
 *
 * @property {boolean} passed Whether or not all lint rules and fix rules succeeded. Will be false if an error occurred during linting.
 * @property {boolean} errored Whether or not an error occurred during the linting process (ex. the configuration failed validation).
 * @property {string} [errMsg] A string indication error information, will be present if errored is true.
 * @property {FormatResult[]} results The output of all the linter rules.
 * @property {Object.<string, Result>} targets An object representing axiom type: axiom targets.
 * @property {Object} [formatOptions] Additional options to pass to the formatter, generated from the output or config.
 */

/**
 * An exposed function for the repolinter engine. Use this function
 * to run repolinter on a specified directory targetDir. You can
 * also optionally specify which paths to allowlist (filterPaths),
 * whether or not to actually commit modifications (fixes), and
 * a custom ruleset object to use. This function will not throw
 * an error on failure, instead indicating that an error has
 * ocurred in returned value.
 *
 * @memberof repolinter
 * @param {string} targetDir The directory of the repository to lint.
 * @param {string[]} [filterPaths] A list of directories to allow linting of, or [] for all.
 * @param {Object|string|null} [ruleset] A custom ruleset object with the same structure as the JSON ruleset configs, or a string path to a JSON config.
 * Set to null for repolinter to automatically find it in the repository.
 * @param {boolean} [dryRun] If true, repolinter will report suggested fixes, but will make no disk modifications.
 * @returns {Promise<LintResult>} An object representing the output of the linter
 */
export async function lint(
  targetDir,
  filterPaths = [],
  ruleset = null,
  dryRun = false
) {
  const fileSystem = new FileSystem()
  fileSystem.targetDir = targetDir
  if (filterPaths.length > 0) {
    fileSystem.filterPaths = filterPaths
  }

  let rulesetPath = null
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
          const herePath = path.join(
            path.dirname(new URL(import.meta.url).pathname),
            ruleset
          )
          if (fs.existsSync(herePath)) {
            rulesetPath = herePath
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
          /** @ignore */
          errMsg: e && e.toString(),
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
      /** @ignore */
      errMsg: val.error,
      results: [],
      targets: {},
      formatOptions: ruleset.formatOptions
    }
  }
  const configParsed = config.parseConfig(ruleset)
  /** @ignore @type {Object.<string, Result>} */
  let targetObj = {}
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

  const allFormatInfo = {
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

  return allFormatInfo
}

/**
 * Checks a rule's list of axioms against a list of valid
 * targets, and determines if the rule should run or not.
 *
 * @memberof repolinter
 * @param {string[]} validTargets The axiom target list in "target=thing" format, including the wildcard entry ("target=*").
 * @param {string[]} ruleAxioms The rule "where" specification to validate against.
 * @returns {string[]} The list of unsatisfied axioms, if any. Empty array indicates the rule should run.
 */
export function shouldRuleRun(validTargets, ruleAxioms) {
  const ruleRegex = /([\w-]+)((?:>|<)=?)(\d+)/i
  const numericalRuleAxioms = []
  const regularRuleAxioms = []
  for (const ruleax of ruleAxioms) {
    const match = ruleRegex.exec(ruleax)
    if (match !== null && match[1] && match[2] && !isNaN(parseInt(match[3]))) {
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
    .map(([targetName, maybeNumber]) => [targetName, parseInt(maybeNumber)])
    .filter(([, maybeNumber]) => !isNaN(maybeNumber))
  /** @ts-ignore */
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

/**
 * Run all operations in a ruleset, including linting and fixing. Returns
 * a list of objects with the output of the linter rules
 *
 * @memberof repolinter
 * @param {RuleInfo[]} ruleset A ruleset (list of rules with information about each). This parameter can be generated from a config using parseConfig.
 * @param {Object.<string, Result>|boolean} targets The axiom targets to enable for this run of the ruleset. Structure is from the output of determineTargets. Use true for all targets.
 * @param {FileSystem} fileSystem A filesystem object configured with filter paths and a target directory.
 * @param {boolean} dryRun If true, repolinter will report suggested fixes, but will make no disk modifications.
 * @returns {Promise<FormatResult[]>} Objects indicating the result of the linter rules
 */
export async function runRuleset(ruleset, targets, fileSystem, dryRun) {
  /** @ignore @type {string[]} */
  let targetArray = []
  if (typeof targets !== 'boolean') {
    targetArray = Object.entries(targets)
      .filter(([, res]) => res.passed)
      .map(([axiomId, res]) => [axiomId, res.targets.map(t => t.path)])
      .map(([axiomId, paths]) => [
        `${axiomId}=*`,
        ...paths.map(p => `${axiomId}=${p}`)
      ])
      .reduce((a, c) => a.concat(c), [])
  }
  const results = ruleset.map(async r => {
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
    let result
    try {
      const ruleFunc = Rules[r.ruleType]
      result = await ruleFunc(fileSystem, r.ruleConfig)
    } catch (e) {
      return FormatResult.CreateError(
        r,
        `${r.ruleType} threw an error: ${e.message}`
      )
    }
    const fixTargets = !result.passed
      ? result.targets.filter(t => !t.passed && t.path).map(t => t.path)
      : []
    if (!r.fixType || result.passed) {
      return FormatResult.CreateLintOnly(r, result)
    }
    if (!Object.hasOwn(Fixes, r.fixType)) {
      return FormatResult.CreateError(r, `${r.fixType} is not a valid fix`)
    }
    let fixresult
    try {
      const fixFunc = Fixes[r.fixType]
      fixresult = await fixFunc(fileSystem, r.fixConfig, fixTargets, dryRun)
    } catch (e) {
      return FormatResult.CreateError(
        r,
        `${r.fixType} threw an error: ${e.message}`
      )
    }
    return FormatResult.CreateLintAndFix(r, result, fixresult)
  })

  return Promise.all(results)
}

/**
 * Given an axiom configuration, determine the appropriate targets to run against
 * (e.g. "target=javascript").
 *
 * @memberof repolinter
 * @param {Object} axiomconfig A configuration conforming to the "axioms" section in schema.json
 * @param {FileSystem} fs The filesystem to run axioms against
 * @returns {Promise<Object.<string, Result>>} An object representing axiom name: axiom results. The array will be null if the axiom could not run.
 */
export async function determineTargets(axiomconfig, fs) {
  const ruleresults = await Promise.all(
    Object.entries(axiomconfig).map(async ([axiomId, axiomName]) => {
      if (!Object.hasOwn(Axioms, axiomId)) {
        return [
          axiomName,
          new Result(`invalid axiom name ${axiomId}`, [], false)
        ]
      }
      const axiomFunction = Axioms[axiomId]
      return [axiomName, await axiomFunction(fs)]
    })
  )
  return ruleresults.reduce((a, [k, v]) => {
    a[k] = v
    return a
  }, {})
}

export const validateConfig = config.validateConfig
export const parseConfig = config.parseConfig
export { Result, RuleInfo, FileSystem, FormatResult }
