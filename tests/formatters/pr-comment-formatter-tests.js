// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
//
// SPDX-License-Identifier: Apache-2.0

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import prCommentFormatter from '../../dist/formatters/pr-comment-formatter.js'
import FormatResult from '../../dist/lib/formatresult.js'
import RuleInfo from '../../dist/lib/ruleinfo.js'
import Result from '../../dist/lib/result.js'

const SYMBOLS = {
  success: '\u{2714}',
  warning: '\u{26A0}',
  error: '\u{2718}'
}

describe('formatters', () => {
  describe('pr_comment_formatter', () => {
    it('formats passed rules without targets', () => {
      const output = {
        passed: true,
        errored: false,
        results: [
          FormatResult.CreateLintOnly(
            new RuleInfo('file-existence', 'error', [], 'file-existence', {}),
            new Result('All files passed', [], true)
          )
        ],
        targets: {},
        params: { targetDirectory: '.', filterPaths: [], ruleset: {} }
      }
      const result = prCommentFormatter.formatOutput(output, true)
      assert.ok(result.includes(`${SYMBOLS.success} file-existence`))
    })

    it('formats failed rules with targets', () => {
      const output = {
        passed: false,
        errored: false,
        results: [
          FormatResult.CreateLintOnly(
            new RuleInfo('file-contents', 'error', [], 'file-contents', {}),
            new Result(
              '1 failed',
              [{ path: 'LICENSE', passed: false, message: 'missing header' }],
              false
            )
          )
        ],
        targets: {},
        params: { targetDirectory: '.', filterPaths: [], ruleset: {} }
      }
      const result = prCommentFormatter.formatOutput(output, true)
      assert.ok(result.includes(`${SYMBOLS.error} file-contents`))
      assert.ok(result.includes('LICENSE'))
      assert.ok(result.includes('missing header'))
    })

    it('formats warning-level rules', () => {
      const output = {
        passed: true,
        errored: false,
        results: [
          FormatResult.CreateLintOnly(
            new RuleInfo('file-hashes', 'warning', [], 'file-hashes', {}),
            new Result('No broken links', [], true)
          )
        ],
        targets: {},
        params: { targetDirectory: '.', filterPaths: [], ruleset: {} }
      }
      const result = prCommentFormatter.formatOutput(output, true)
      assert.ok(result.includes(`${SYMBOLS.warning} file-hashes`))
    })

    it('formats ignored rules', () => {
      const output = {
        passed: true,
        errored: false,
        results: [
          FormatResult.CreateIgnored(
            new RuleInfo('apache-notice', 'error', [], 'apache-notice', {}),
            'ignored due to unsatisfied condition'
          )
        ],
        targets: {},
        params: { targetDirectory: '.', filterPaths: [], ruleset: {} }
      }
      const result = prCommentFormatter.formatOutput(output, true)
      assert.ok(result.includes('apache-notice: ignored'))
    })

    it('formats error rules', () => {
      const output = {
        passed: false,
        errored: false,
        results: [
          FormatResult.CreateError(
            new RuleInfo('bad-rule', 'error', [], 'bad-rule', {}),
            'bad-rule is not a valid rule'
          )
        ],
        targets: {},
        params: { targetDirectory: '.', filterPaths: [], ruleset: {} }
      }
      const result = prCommentFormatter.formatOutput(output, true)
      assert.ok(result.includes(`${SYMBOLS.error} bad-rule: error`))
    })

    it('formats errored output', () => {
      const output = {
        passed: false,
        errored: true,
        errMsg: 'Config validation failed',
        results: [],
        targets: {},
        params: { targetDirectory: '.', filterPaths: [], ruleset: {} }
      }
      const result = prCommentFormatter.formatOutput(output, true)
      assert.strictEqual(result, 'Error: Config validation failed')
    })

    it('includes fix results when present', () => {
      const rule = new RuleInfo(
        'file-existence',
        'error',
        [],
        'file-existence',
        {}
      )
      const lintResult = new Result(
        '1 failed',
        [{ path: 'SECURITY.md', passed: false }],
        false
      )
      const fixResult = new Result(
        'Created file',
        [{ path: 'SECURITY.md', passed: true, message: 'Created SECURITY.md' }],
        true
      )
      const fr = FormatResult.CreateLintAndFix(rule, lintResult, fixResult)

      const output = {
        passed: false,
        errored: false,
        results: [fr],
        targets: {},
        params: { targetDirectory: '.', filterPaths: [], ruleset: {} }
      }
      const result = prCommentFormatter.formatOutput(output, true)
      assert.ok(result.includes('Suggested fixes'))
      assert.ok(result.includes('SECURITY.md'))
    })

    it('handles multiple targets', () => {
      const output = {
        passed: false,
        errored: false,
        results: [
          FormatResult.CreateLintOnly(
            new RuleInfo('file-contents', 'error', [], 'file-contents', {}),
            new Result(
              '3 failed',
              [
                { path: 'LICENSE', passed: false },
                { path: 'README.md', passed: false },
                { path: 'CONTRIBUTING.md', passed: false }
              ],
              false
            )
          )
        ],
        targets: {},
        params: { targetDirectory: '.', filterPaths: [], ruleset: {} }
      }
      const result = prCommentFormatter.formatOutput(output, true)
      assert.ok(result.includes('3 failed'))
      assert.ok(result.includes(`${SYMBOLS.error} LICENSE`))
      assert.ok(result.includes(`${SYMBOLS.error} README.md`))
      assert.ok(result.includes(`${SYMBOLS.error} CONTRIBUTING.md`))
    })
  })
})
