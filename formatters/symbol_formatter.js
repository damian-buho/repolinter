// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { styleText } from 'util'
import FormatResult from '../lib/formatresult.js'

const logSymbols = {
  info: '\u2139',
  success: '\u2714',
  warning: '\u26A0',
  error: '\u2716'
}

function frontSpace(string) {
  return string ? ' ' + string : ''
}

/**
 * The default CLI formatter. Exported as defaultFormatter and resultFormatter.
 *
 * @protected
 */
class SymbolFormatter {
  static formatResult(
    result,
    ruleName,
    rulePolicyUrl = undefined,
    rulePolicyInfo = undefined,
    errorSymbol,
    okSymbol = logSymbols.success
  ) {
    let policyLines = ''
    if (!result.passed) {
      if (rulePolicyUrl)
        policyLines += `\n\t${logSymbols.info} PolicyUrl: ${rulePolicyUrl}`
      if (rulePolicyInfo)
        policyLines += `\n\t${logSymbols.info} PolicyInfo: ${rulePolicyInfo}`
    }
    const formatbase = `\n${
      result.passed ? okSymbol : errorSymbol
    }  ${ruleName}:${frontSpace(result.message)}${
      !result.passed ? policyLines : ''
    }`
    if (result.targets.length === 0) {
      return formatbase
    }
    if (result.targets.length === 1) {
      return (
        formatbase +
        `${frontSpace(result.targets[0].message)} (${
          result.targets[0].path || result.targets[0].pattern
        })`
      )
    }
    return (
      formatbase +
      result.targets
        .map(
          t =>
            `\n\t${t.passed ? okSymbol : errorSymbol} ${t.path || t.pattern}${
              t.message ? ': ' + t.message : ''
            }`
        )
        .join('')
    )
  }

  static getSymbol(level) {
    switch (level) {
      case 'info':
        return logSymbols.info
      case 'warning':
        return logSymbols.warning
      case 'error':
        return logSymbols.error
      default:
        return logSymbols.error
    }
  }

  static formatOutput(output, dryRun) {
    const ret = [`Target directory: ${output.params.targetDir}`]
    if (output.params.filterPaths.length) {
      ret.push(
        `\nPaths to include in checks:\n\t${output.params.filterPaths.join(
          '\n\t'
        )}`
      )
    }
    if (output.errored) {
      return ret.join('') + `\n${styleText(['bgRed', 'white'], output.errMsg)}`
    }
    ret.push(
      Object.entries(output.targets)
        .filter(([, v]) => v.passed !== true)
        .map(([k, v]) =>
          styleText(
            'yellow',
            `\nAxiom ${k} failed to run with error: ${v.message}`
          )
        )
        .join('')
    )
    ret.push(
      styleText('inverse', '\nLint:') +
        output.results
          .map(result => {
            if (result.status === FormatResult.ERROR) {
              return `\n${logSymbols.error} ${styleText(
                ['bgRed', 'white'],
                `${result.ruleInfo.name} failed to run:`
              )} ${result.runMessage}`
            }
            if (result.status === FormatResult.IGNORED) {
              return `\n${logSymbols.info} ${result.ruleInfo.name}: ${result.runMessage}`
            }
            return SymbolFormatter.formatResult(
              result.lintResult,
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
      ret.push(
        styleText('inverse', `\nFix(es) ${dryRun ? 'suggested' : 'applied'}:`) +
          fixresults.map(result =>
            SymbolFormatter.formatResult(
              result.fixResult,
              result.ruleInfo.name,
              result.ruleInfo.policyUrl,
              result.ruleInfo.policyInfo,
              SymbolFormatter.getSymbol(result.ruleInfo.level),
              dryRun ? logSymbols.info : logSymbols.success
            )
          )
      )
    }
    return ret.join('')
  }
}

export default SymbolFormatter
