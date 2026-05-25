// Copyright 2017 TODO Group. All rights reserved.
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

  status: FormatResultStatus
  declare runMessage?: string
  declare lintResult?: Result
  declare fixResult?: Result
  ruleInfo: RuleInfo

  constructor(
    ruleInfo: RuleInfo,
    message: string | null,
    status: FormatResultStatus,
    lintRes: Result | null,
    fixRes: Result | null
  ) {
    this.ruleInfo = ruleInfo
    if (message) this.runMessage = message
    this.status = status
    if (lintRes) this.lintResult = lintRes
    if (fixRes) this.fixResult = fixRes
  }

  static getStatus(ruleInfo: RuleInfo, lintRes: Result): FormatResultStatus {
    if (lintRes.passed) {
      return FormatResult.RULE_PASSED
    }
    if (ruleInfo.level === 'warning') {
      return FormatResult.RULE_NOT_PASSED_WARN
    }
    if (ruleInfo.level === 'error') {
      return FormatResult.RULE_NOT_PASSED_ERROR
    }
    return FormatResult.ERROR
  }

  static getAllStatus(): FormatResultStatus[] {
    return [
      FormatResult.RULE_PASSED,
      FormatResult.RULE_NOT_PASSED_WARN,
      FormatResult.RULE_NOT_PASSED_ERROR,
      FormatResult.ERROR,
      FormatResult.IGNORED
    ]
  }

  static CreateIgnored(ruleInfo: RuleInfo, message: string): FormatResult {
    return new FormatResult(ruleInfo, message, FormatResult.IGNORED, null, null)
  }

  static CreateError(ruleInfo: RuleInfo, message: string): FormatResult {
    return new FormatResult(ruleInfo, message, FormatResult.ERROR, null, null)
  }

  static CreateLintOnly(ruleInfo: RuleInfo, lintRes: Result): FormatResult {
    return new FormatResult(
      ruleInfo,
      null,
      FormatResult.getStatus(ruleInfo, lintRes),
      lintRes,
      null
    )
  }

  static CreateLintAndFix(
    ruleInfo: RuleInfo,
    lintRes: Result,
    fixRes: Result
  ): FormatResult {
    return new FormatResult(
      ruleInfo,
      null,
      FormatResult.getStatus(ruleInfo, lintRes),
      lintRes,
      fixRes
    )
  }
}
