// SPDX-FileCopyrightText: 2017 TODO Group.
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
// SPDX-License-Identifier: Apache-2.0

import FormatResult from '../lib/formatresult.js'
import type FormatResultType from '../lib/formatresult.js'
import type { ResultTarget } from '../lib/result.js'
import { slug as slugger } from '../lib/github-slugger.js'
import type { LintResult } from '../index.js'

const ERROR_SYMBOL = '\u{2757}'
const FAIL_SYMBOL = '\u{274C}'
const WARN_SYMBOL = '\u{26A0}\u{FE0F}'
const PASS_SYMBOL = '\u{2705}'
const FIX_SYMBOL = '\u{1F528}'

const SUGGESTED_FIX = `${FIX_SYMBOL} **Suggested Fix**:`
const APPLIED_FIX = `${PASS_SYMBOL} **Applied Fix**:`

const DISCLAIMER =
  '*This report was generated automatically by the Repolinter.*'

const COLLAPSE_TOP = `<details>
<summary>Click to see rules</summary>`
const COLLAPSE_BOTTOM = '</details>'

function opWrap(
  pre: string | undefined,
  base: string | number | undefined | false,
  suf: string | undefined
): string {
  if (base) return (pre || '') + base + (suf || '')
  return ''
}

const MarkdownFormatter = {
  formatRuleHeading: (name: string, symbol: string): string =>
    `${opWrap(undefined, symbol, ' ')}\`${name}\``,

  makeHeaderLink(name: string): string {
    const s = slugger(name)
    return `<a href="#user-content-${s}" id="user-content-${s}">#</a>`
  },

  formatResult(
    result: FormatResultType,
    symbol: string,
    isDryRun: boolean
  ): string {
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
    } else if (result.lintResult!.targets.length <= 1 && !result.fixResult) {
      const body =
        '\n\n' +
        opWrap(undefined, result.lintResult!.message, '. ') +
        opWrap(
          undefined,
          result.lintResult!.targets.length > 0 &&
            result.lintResult!.targets[0]!.message,
          ' '
        ) +
        opWrap(
          '(`',
          result.lintResult!.targets.length > 0 &&
            (result.lintResult!.targets[0]!.path ||
              result.lintResult!.targets[0]!.pattern),
          '`). '
        ) +
        opWrap(undefined, result.ruleInfo.policyInfo, '. ') +
        opWrap(
          'For more information please visit ',
          result.ruleInfo.policyUrl,
          '.'
        )
      formatBase.push(body)
    } else {
      const start =
        '\n\n' +
        opWrap(undefined, result.ruleInfo.policyInfo, '. ') +
        opWrap(
          'For more information please visit ',
          result.ruleInfo.policyUrl,
          '. '
        ) +
        opWrap(undefined, result.lintResult!.message, '. ')
      formatBase.push(start)
      const failedList = result.lintResult!.targets.filter(
        (t: ResultTarget) => t.passed === false
      )
      if (failedList.length === 0) {
        formatBase.push('All files passed this test.')
      } else {
        formatBase.push('Below is a list of files or patterns that failed:\n\n')
        const list = failedList
          .map((t: ResultTarget) =>
            result.fixResult && t.path
              ? ([
                  t,
                  result.fixResult.targets.find(
                    (f: ResultTarget) => f.path === t.path
                  )
                ] as [ResultTarget, ResultTarget | undefined])
              : ([t, undefined] as [ResultTarget, ResultTarget | undefined])
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
              `\n  - ${isDryRun ? SUGGESTED_FIX : APPLIED_FIX} ${
                fixTarget.message || result.fixResult!.message
              }`
            )
          })
          .join('\n')
        formatBase.push(list)
      }
    }
    if (result.fixResult && result.fixResult.passed) {
      const unassociatedFixList = result.fixResult.targets.filter(
        (t: ResultTarget) =>
          !t.path ||
          result.lintResult!.targets.every(
            (l: ResultTarget) => l.path !== t.path
          )
      )
      if (result.fixResult.message || unassociatedFixList.length > 0) {
        const fixSuggest = `\n\n${isDryRun ? SUGGESTED_FIX : APPLIED_FIX}${opWrap(
          ' ',
          result.fixResult.message,
          '.'
        )}`
        formatBase.push(fixSuggest)
        const fixList = unassociatedFixList.map(
          (f: ResultTarget) =>
            `\n- \`${f.path || f.pattern}\`${opWrap(': ', f.message, '.')}`
        )
        if (fixList.length > 0) {
          formatBase.push('\n')
        }
        formatBase.push(...fixList)
      }
    }
    return formatBase.join('')
  },

  sortResults(results: FormatResultType[]): Record<string, FormatResultType[]> {
    const out: Record<string, FormatResultType[]> = {}
    for (const key of FormatResult.getAllStatus()) {
      out[key] = []
    }
    for (const result of results) {
      out[result.status]!.push(result)
    }
    return out
  },

  createSection(
    name: string,
    body: string,
    isCollapse: boolean = false
  ): string {
    const section = `\n\n## ${name} ${MarkdownFormatter.makeHeaderLink(name)}
${isCollapse ? `\n${COLLAPSE_TOP}\n` : ''}
${body}
${isCollapse ? `\n${COLLAPSE_BOTTOM}` : ''}`
    return section
  },

  formatOutput(output: LintResult, isDryRun: boolean): string {
    const formatBase = [
      `# Repolinter Report\n\n${
        (output.formatOptions && output.formatOptions.disclaimer) || DISCLAIMER
      }`
    ]
    const sorted = MarkdownFormatter.sortResults(output.results)
    const values = [
      sorted[FormatResult.ERROR]!.length,
      sorted[FormatResult.RULE_NOT_PASSED_ERROR]!.length,
      sorted[FormatResult.RULE_NOT_PASSED_WARN]!.length,
      sorted[FormatResult.RULE_PASSED]!.length,
      sorted[FormatResult.IGNORED]!.length,
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
    const colWidths = headCells.map((h, index) =>
      Math.max(h.length, dataCells[index]!.length)
    )
    const tableHead = headCells.join('|')
    const tableSeparator = colWidths.map(w => '-'.repeat(w)).join('|')
    const tableData = dataCells.join('|')
    const summary = `\n\nThis Repolinter run generated the following results:\n\n|${tableHead}|\n|${tableSeparator}|\n|${tableData}|`
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
      config => sorted[config.type]!.length > 0
    )
    formatBase.push('\n')
    const toc = relevantSections.map(config => {
      const subItems = sorted[config.type]!.map(r => {
        const heading = MarkdownFormatter.formatRuleHeading(
          r.ruleInfo.name,
          config.symbol
        )
        return `\n  - [${heading}](#user-content-${slugger(heading)})`
      })
      return `\n- [${config.name}](#user-content-${slugger(
        config.name
      )})${subItems.join('')}`
    })
    formatBase.push(...toc)
    const allSections = relevantSections.map(config =>
      MarkdownFormatter.createSection(
        config.name,
        sorted[config.type]!.map(r =>
          MarkdownFormatter.formatResult(r, config.symbol, isDryRun)
        ).join('\n\n'),
        config.collapse
      )
    )
    formatBase.push(...allSections, '\n')
    return formatBase
      .join('')
      .replaceAll(/\n{3,}/g, '\n\n')
      .replaceAll(/[^\S\r\n]+$/gm, '')
  }
}

export default MarkdownFormatter
