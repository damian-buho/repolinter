// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import FormatResult from '../lib/formatresult.js'
import { slug as slugger } from '../lib/github_slugger.js'

const ERROR_SYMBOL = '\u2757'
const FAIL_SYMBOL = '\u274C'
const WARN_SYMBOL = '\u26A0\uFE0F'
const PASS_SYMBOL = '\u2705'
const FIX_SYMBOL = '\uD83D\uDD28'

const SUGGESTED_FIX = `${FIX_SYMBOL} **Suggested Fix**:`
const APPLIED_FIX = `${PASS_SYMBOL} **Applied Fix**:`

const DISCLAIMER =
  '*This report was generated automatically by the Repolinter.*'

const COLLAPSE_TOP = `<details>
<summary>Click to see rules</summary>`
const COLLAPSE_BOTTOM = '</details>'

function opWrap(pre, base, suf) {
  if (base) return (pre || '') + base + (suf || '')
  return ''
}

/**
 * A markdown formatter for Repolinter output, designed to be used with GH issues.
 * Exported as markdownFormatter.
 *
 * @protected
 */
class MarkdownFormatter {
  static formatRuleHeading(name, symbol) {
    return `${opWrap(null, symbol, ' ')}\`${name}\``
  }

  static makeHeaderLink(name) {
    const slug = slugger(name)
    return `<a href="#user-content-${slug}" id="user-content-${slug}">#</a>`
  }

  static formatResult(result, symbol, dryRun) {
    const header = MarkdownFormatter.formatRuleHeading(
      result.ruleInfo.name,
      symbol
    )
    const formatBase = [
      `### ${header} ${MarkdownFormatter.makeHeaderLink(header)}`
    ]
    if (result.status === FormatResult.ERROR) {
      const content = `\n\nThis rule failed to run with the following error: ${result.runMessage}. `
      formatBase.push(content)
      if (result.ruleInfo.policyInfo) {
        formatBase.push(
          `${result.ruleInfo.policyInfo}.${opWrap(
            ' For more information please visit: ',
            result.ruleInfo.policyUrl,
            '.'
          )}`
        )
      }
    } else if (result.status === FormatResult.IGNORED) {
      formatBase.push(
        `\n\nThis rule was ignored for the following reason: ${result.runMessage}`
      )
      if (result.ruleInfo.policyInfo) {
        formatBase.push(
          `${result.ruleInfo.policyInfo}.${opWrap(
            ' For more information please visit: ',
            result.ruleInfo.policyUrl,
            '.'
          )}`
        )
      }
    } else if (result.lintResult.targets.length <= 1 && !result.fixResult) {
      const body =
        '\n\n' +
        opWrap(null, result.lintResult.message, '. ') +
        opWrap(
          null,
          result.lintResult.targets.length &&
            result.lintResult.targets[0].message,
          ' '
        ) +
        opWrap(
          '(`',
          result.lintResult.targets.length &&
            (result.lintResult.targets[0].path ||
              result.lintResult.targets[0].pattern),
          '`). '
        ) +
        opWrap(null, result.ruleInfo.policyInfo, '. ') +
        opWrap(
          'For more information please visit ',
          result.ruleInfo.policyUrl,
          '.'
        )
      formatBase.push(body)
    } else {
      const start =
        '\n\n' +
        opWrap(null, result.ruleInfo.policyInfo, '. ') +
        opWrap(
          'For more information please visit ',
          result.ruleInfo.policyUrl,
          '. '
        ) +
        opWrap(null, result.lintResult.message, '. ')
      formatBase.push(start)
      const failedList = result.lintResult.targets.filter(
        t => t.passed === false
      )
      if (failedList.length === 0) {
        formatBase.push('All files passed this test.')
      } else {
        formatBase.push('Below is a list of files or patterns that failed:\n\n')
        const list = failedList
          .map(t =>
            result.fixResult && t.path
              ? [
                  t,
                  result.fixResult.targets.find(f => f.path === t.path) || null
                ]
              : [t, null]
          )
          .map(([lintTarget, fixTarget]) => {
            const base = `- \`${
              lintTarget.path || lintTarget.pattern
            }\`${opWrap(': ', lintTarget.message, '.')}`
            if (!fixTarget || !fixTarget.passed) {
              return base
            }
            return (
              base +
              `\n  - ${dryRun ? SUGGESTED_FIX : APPLIED_FIX} ${
                fixTarget.message || result.fixResult.message
              }`
            )
          })
          .join('\n')
        formatBase.push(list)
      }
    }
    if (result.fixResult && result.fixResult.passed) {
      const unassociatedFixList = result.fixResult.targets.filter(
        t => !t.path || !result.lintResult.targets.find(l => l.path === t.path)
      )
      if (result.fixResult.message || unassociatedFixList.length !== 0) {
        const fixSuggest = `\n\n${dryRun ? SUGGESTED_FIX : APPLIED_FIX}${opWrap(
          ' ',
          result.fixResult.message,
          '.'
        )}`
        formatBase.push(fixSuggest)
        const fixList = unassociatedFixList.map(
          f => `\n- \`${f.path || f.pattern}\`${opWrap(': ', f.message, '.')}`
        )
        if (fixList.length) {
          formatBase.push('\n')
        }
        formatBase.push(...fixList)
      }
    }
    return formatBase.join('')
  }

  static sortResults(results) {
    const out = {}
    for (const key of FormatResult.getAllStatus()) {
      out[key] = []
    }
    return results.reduce((a, c) => {
      a[c.status].push(c)
      return a
    }, out)
  }

  static createSection(name, body, collapse = false) {
    const section = `\n\n## ${name} ${MarkdownFormatter.makeHeaderLink(name)}
${collapse ? `\n${COLLAPSE_TOP}\n` : ''}
${body}
${collapse ? `\n${COLLAPSE_BOTTOM}` : ''}`
    return section
  }

  static formatOutput(output, dryRun) {
    const formatBase = [
      `# Repolinter Report\n\n${
        (output.formatOptions && output.formatOptions.disclaimer) || DISCLAIMER
      }`
    ]
    const sorted = MarkdownFormatter.sortResults(output.results)
    const values = [
      sorted[FormatResult.ERROR].length,
      sorted[FormatResult.RULE_NOT_PASSED_ERROR].length,
      sorted[FormatResult.RULE_NOT_PASSED_WARN].length,
      sorted[FormatResult.RULE_PASSED].length,
      sorted[FormatResult.IGNORED].length,
      output.results.length
    ]
    const headCells = [
      `${ERROR_SYMBOL} Error`,
      `${FAIL_SYMBOL} Fail`,
      `${WARN_SYMBOL} Warn`,
      `${PASS_SYMBOL} Pass`,
      'Ignored',
      'Total'
    ]
    const dataCells = values.map(String)
    const colWidths = headCells.map((h, i) =>
      Math.max(h.length, dataCells[i].length)
    )
    const tableHead = headCells.join('|')
    const tableSep = colWidths.map(w => '-'.repeat(w)).join('|')
    const tableData = dataCells.join('|')
    const summary = `\n\nThis Repolinter run generated the following results:\n\n|${tableHead}|\n|${tableSep}|\n|${tableData}|`
    formatBase.push(summary)
    const sectionConfig = [
      {
        type: FormatResult.ERROR,
        name: 'Error',
        symbol: ERROR_SYMBOL,
        collapse: false
      },
      {
        type: FormatResult.RULE_NOT_PASSED_ERROR,
        name: 'Fail',
        symbol: FAIL_SYMBOL,
        collapse: false
      },
      {
        type: FormatResult.RULE_NOT_PASSED_WARN,
        name: 'Warning',
        symbol: WARN_SYMBOL,
        collapse: true
      },
      {
        type: FormatResult.RULE_PASSED,
        name: 'Passed',
        symbol: PASS_SYMBOL,
        collapse: true
      },
      {
        type: FormatResult.IGNORED,
        name: 'Ignored',
        symbol: '',
        collapse: true
      }
    ]
    const relevantSections = sectionConfig.filter(
      cfg => sorted[cfg.type].length > 0
    )
    formatBase.push('\n')
    const toc = relevantSections.map(cfg => {
      const subItems = sorted[cfg.type].map(r => {
        const heading = MarkdownFormatter.formatRuleHeading(
          r.ruleInfo.name,
          cfg.symbol
        )
        return `\n  - [${heading}](#user-content-${slugger(heading)})`
      })
      return `\n- [${cfg.name}](#user-content-${slugger(
        cfg.name
      )})${subItems.join('')}`
    })
    formatBase.push(...toc)
    const allSections = relevantSections.map(cfg =>
      MarkdownFormatter.createSection(
        cfg.name,
        sorted[cfg.type]
          .map(r => MarkdownFormatter.formatResult(r, cfg.symbol, dryRun))
          .join('\n\n'),
        cfg.collapse
      )
    )
    formatBase.push(...allSections)
    formatBase.push('\n')
    return formatBase.join('').replace(/[^\S\r\n]+$/gm, '')
  }
}

export default MarkdownFormatter
