// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { styleText } from 'node:util'
import FormatResultBase from '../lib/formatresult.js'
import type { ResultTarget } from '../lib/result.js'
import type Result from '../lib/result.js'
import type { LintResult } from '../index.js'

const FormatResult = FormatResultBase as typeof FormatResultBase & {
  RULE_PASSED: string
  RULE_NOT_PASSED_ERROR: string
  RULE_NOT_PASSED_WARN: string
  IGNORED: string
  ERROR: string
}

const logSymbols = {
  info: 'i',
  success: '✔',
  warning: '⚠',
  error: '🗙'
}

function frontSpace(string: string | undefined): string {
  return string ? ' ' + string : ''
}

function colorSymbol(symbol: string, passed: boolean): string {
  return passed ? styleText('green', symbol) : styleText('red', symbol)
}

const SymbolFormatter = {
  formatResult(
    result: Result,
    ruleName: string,
    rulePolicyUrl: string | undefined = undefined,
    rulePolicyInfo: string | undefined = undefined,
    errorSymbol: string,
    okSymbol: string = logSymbols.success
  ): string {
    let policyLines = ''
    if (!result.passed) {
      if (rulePolicyUrl)
        policyLines += `\n\t${styleText('gray', logSymbols.info)} PolicyUrl: ${rulePolicyUrl}`
      if (rulePolicyInfo)
        policyLines += `\n\t${styleText('gray', logSymbols.info)} PolicyInfo: ${rulePolicyInfo}`
    }
    const formatbase = `\n${colorSymbol(
      result.passed ? okSymbol : errorSymbol,
      result.passed
    )} ${ruleName}:${frontSpace(result.message)}${
      result.passed ? '' : policyLines
    }`
    if (result.targets.length === 0) {
      return formatbase
    }
    if (result.targets.length === 1) {
      const target = result.targets[0]!
      return (
        formatbase +
        `${frontSpace(target.message)} (${target.path || target.pattern})`
      )
    }
    return (
      formatbase +
      result.targets
        .map(
          (t: ResultTarget) =>
            `\n\t${colorSymbol(
              t.passed ? okSymbol : errorSymbol,
              t.passed
            )} ${t.path || t.pattern}${t.message ? ': ' + t.message : ''}`
        )
        .join('')
    )
  },

  getSymbol(level: string): string {
    switch (level) {
      case 'info': {
        return logSymbols.info
      }
      case 'warning': {
        return logSymbols.warning
      }
      case 'error': {
        return logSymbols.error
      }
      default: {
        return logSymbols.error
      }
    }
  },

  formatOutput(output: LintResult, dryRun: boolean): string {
    const returnValue = [`Target directory: ${output.params.targetDirectory}`]
    if (output.params.filterPaths.length > 0) {
      returnValue.push(
        `\nPaths to include in checks:\n\t${output.params.filterPaths.join(
          '\n\t'
        )}`
      )
    }
    if (output.errored) {
      return returnValue.join('') + `\n${styleText('red', output.errMsg!)}`
    }
    returnValue.push(
      Object.entries(output.targets)
        .filter(([, v]) => v.passed !== true)
        .map(([k, v]) =>
          styleText(
            'yellow',
            `\nAxiom ${k} failed to run with error: ${v.message}`
          )
        )
        .join(''),
      styleText('bold', '\nLint:') +
        output.results
          .map(result => {
            if (result.status === FormatResult.ERROR) {
              return `\n${styleText('red', logSymbols.error)} ${styleText(
                'red',
                `${result.ruleInfo.name} failed to run:`
              )} ${result.runMessage}`
            }
            if (result.status === FormatResult.IGNORED) {
              return `\n${styleText('gray', logSymbols.info)} ${styleText(
                'gray',
                `${result.ruleInfo.name}: ${result.runMessage}`
              )}`
            }
            return SymbolFormatter.formatResult(
              result.lintResult!,
              result.ruleInfo.name,
              result.ruleInfo.policyUrl,
              result.ruleInfo.policyInfo,
              SymbolFormatter.getSymbol(result.ruleInfo.level)
            )
          })
          .join('')
    )
    const fixresults = output.results.filter(r => r.fixResult)
    if (fixresults.length > 0) {
      returnValue.push(
        styleText('bold', `\nFix(es) ${dryRun ? 'suggested' : 'applied'}:`) +
          fixresults.map(result =>
            SymbolFormatter.formatResult(
              result.fixResult!,
              result.ruleInfo.name,
              result.ruleInfo.policyUrl,
              result.ruleInfo.policyInfo,
              SymbolFormatter.getSymbol(result.ruleInfo.level),
              dryRun ? logSymbols.info : logSymbols.success
            )
          )
      )
    }
    return returnValue.join('')
  }
}

export default SymbolFormatter
