// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
// SPDX-License-Identifier: Apache-2.0

import FormatResult from '../lib/formatresult.js'
import type FormatResultType from '../lib/formatresult.js'
import type { ResultTarget } from '../lib/result.js'
import type { LintResult } from '../index.js'

const LOG_SYMBOLS = {
  success: '\u{2714}',
  warning: '\u{26A0}',
  error: '\u{2718}'
}

function symbolFor(level: string, isPassed: boolean): string {
  if (isPassed) {
    return level === 'warning' ? LOG_SYMBOLS.warning : LOG_SYMBOLS.success
  }
  return level === 'warning' ? LOG_SYMBOLS.warning : LOG_SYMBOLS.error
}

function formatTarget(t: ResultTarget, indent: string): string {
  const path = t.path || t.pattern || ''
  const message = t.message ? `: ${t.message}` : ''
  const sym = t.passed ? LOG_SYMBOLS.success : LOG_SYMBOLS.error
  return `${indent}${sym} ${path}${message}`
}

function formatLintResult(result: FormatResultType): string {
  if (result.status === FormatResult.ERROR) {
    return `${LOG_SYMBOLS.error} ${result.ruleInfo.name}: error \u{2014} ${result.runMessage}`
  }
  if (result.status === FormatResult.IGNORED) {
    return `${result.ruleInfo.name}: ignored \u{2014} ${result.runMessage}`
  }

  const lint = result.lintResult!
  const sym = symbolFor(result.ruleInfo.level, lint.passed)
  const failed = lint.targets.filter((t: ResultTarget) => !t.passed)

  if (lint.targets.length === 0) {
    return `${sym} ${result.ruleInfo.name}`
  }

  if (lint.targets.length === 1) {
    const t = lint.targets[0]!
    const path = t.path || t.pattern || ''
    const message = t.message ? ` \u{2014} ${t.message}` : ''
    return `${sym} ${result.ruleInfo.name}${path ? ` (${path})` : ''}${message}`
  }

  if (failed.length === 0) {
    return `${sym} ${result.ruleInfo.name}: ${lint.message}`
  }

  if (failed.length === 1) {
    const t = failed[0]!
    const path = t.path || t.pattern || ''
    const message = t.message ? `: ${t.message}` : ''
    return `${sym} ${result.ruleInfo.name}${path ? ` (${path})` : ''}${message}`
  }

  const lines = [`${sym} ${result.ruleInfo.name}: ${failed.length} failed`]
  for (const t of failed) {
    lines.push(formatTarget(t, '  '))
  }
  return lines.join('\n')
}

function formatFixResult(result: FormatResultType): string | undefined {
  const fix = result.fixResult
  if (!fix) return undefined

  const targets = fix.targets
  if (targets.length === 0 && !fix.message) return undefined

  const sym = LOG_SYMBOLS.success
  if (targets.length === 0) {
    return `${sym} ${result.ruleInfo.name}: ${fix.message}`
  }
  if (targets.length === 1) {
    const t = targets[0]!
    return `${sym} ${result.ruleInfo.name}: ${t.path || t.pattern}${t.message ? ` \u{2014} ${t.message}` : ''}`
  }
  const lines = [`${sym} ${result.ruleInfo.name}: ${targets.length} files`]
  for (const t of targets) {
    lines.push(
      `  ${sym} ${t.path || t.pattern}${t.message ? ` \u{2014} ${t.message}` : ''}`
    )
  }
  return lines.join('\n')
}

const PrCommentFormatter = {
  formatOutput(output: LintResult, isDryRun: boolean): string {
    if (output.errored) {
      return `Error: ${output.errMsg}`
    }

    const sections: string[] = []

    const lintLines: string[] = []
    const fixLines: string[] = []

    for (const result of output.results) {
      lintLines.push(formatLintResult(result))
      const fix = formatFixResult(result)
      if (fix) fixLines.push(fix)
    }

    sections.push(lintLines.join('\n'))

    if (fixLines.length > 0) {
      const label = isDryRun ? 'Suggested fixes' : 'Applied fixes'
      sections.push(`${label}:\n${fixLines.join('\n')}`)
    }

    return sections.join('\n\n')
  }
}

export default PrCommentFormatter
