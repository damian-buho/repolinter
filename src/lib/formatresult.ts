// SPDX-FileCopyrightText: 2017 TODO Group.
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
// SPDX-License-Identifier: Apache-2.0

import type Result from './result.js'
import type RuleInfo from './ruleinfo.js'

export type FormatResultStatus =
  | 'PASSED'
  | 'NOT_PASSED_ERROR'
  | 'NOT_PASSED_WARN'
  | 'IGNORED'
  | 'ERROR'

export default class FormatResult {
  static readonly RULE_PASSED: FormatResultStatus = 'PASSED'
  static readonly RULE_NOT_PASSED_ERROR: FormatResultStatus = 'NOT_PASSED_ERROR'
  static readonly RULE_NOT_PASSED_WARN: FormatResultStatus = 'NOT_PASSED_WARN'
  static readonly IGNORED: FormatResultStatus = 'IGNORED'
  static readonly ERROR: FormatResultStatus = 'ERROR'

  static getStatus(ruleInfo: RuleInfo, lintResult: Result): FormatResultStatus {
    if (lintResult.passed) {
      return this.RULE_PASSED
    }
    if (ruleInfo.level === 'warning') {
      return this.RULE_NOT_PASSED_WARN
    }
    if (ruleInfo.level === 'error') {
      return this.RULE_NOT_PASSED_ERROR
    }
    return this.ERROR
  }

  static getAllStatus(): FormatResultStatus[] {
    return [
      this.RULE_PASSED,
      this.RULE_NOT_PASSED_WARN,
      this.RULE_NOT_PASSED_ERROR,
      this.ERROR,
      this.IGNORED
    ]
  }

  static CreateIgnored(ruleInfo: RuleInfo, message: string): FormatResult {
    return new FormatResult(
      ruleInfo,
      message,
      this.IGNORED,
      undefined,
      undefined
    )
  }

  static CreateError(ruleInfo: RuleInfo, message: string): FormatResult {
    return new FormatResult(ruleInfo, message, this.ERROR, undefined, undefined)
  }

  static CreateLintOnly(ruleInfo: RuleInfo, lintResult: Result): FormatResult {
    return new FormatResult(
      ruleInfo,
      undefined,
      this.getStatus(ruleInfo, lintResult),
      lintResult,
      undefined
    )
  }

  static CreateLintAndFix(
    ruleInfo: RuleInfo,
    lintResult: Result,
    fixResult: Result
  ): FormatResult {
    return new FormatResult(
      ruleInfo,
      undefined,
      this.getStatus(ruleInfo, lintResult),
      lintResult,
      fixResult
    )
  }

  status: FormatResultStatus
  declare runMessage?: string
  declare lintResult?: Result
  declare fixResult?: Result
  ruleInfo: RuleInfo

  constructor(
    ruleInfo: RuleInfo,
    message: string | undefined,
    status: FormatResultStatus,
    lintResult: Result | undefined,
    fixResult: Result | undefined
  ) {
    this.ruleInfo = ruleInfo
    if (message) this.runMessage = message
    this.status = status
    if (lintResult) this.lintResult = lintResult
    if (fixResult) this.fixResult = fixResult
  }
}
