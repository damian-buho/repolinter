// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
//
// SPDX-License-Identifier: Apache-2.0

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import prCommentFormatter from '../../src/formatters/pr-comment-formatter.js'
import FormatResult from '../../src/lib/formatresult.js'
import RuleInfo from '../../src/lib/ruleinfo.js'
import Result from '../../src/lib/result.js'
import * as repolinter from '../../src/index.js'
import type { LintResult } from '../../src/index.js'

const SYMBOLS: Record<string, string> = {
  success: '\u{2714}',
  warning: '\u{26A0}',
  error: '\u{2718}'
}

describe('formatters', () => {
  describe('pr_comment_formatter', () => {
    it('formats passed rules without targets', () => {
      const output: LintResult = {
        passed: true,
        errored: false,
        results: [
          FormatResult.CreateLintOnly(
            new RuleInfo('file-existence', 'error', [], 'file-existence', {}),
            new Result('All files passed', [], true)
          )
        ],
        targets: {},
        params: {
          targetDirectory: '.',
          filterPaths: [],
          rulesetPath: undefined,
          ruleset: {}
        }
      }
      const result: string = prCommentFormatter.formatOutput(output, true)
      assert.ok(result.includes(`${SYMBOLS.success} file-existence`))
    })

    it('formats failed rules with targets', () => {
      const output: LintResult = {
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
        params: {
          targetDirectory: '.',
          filterPaths: [],
          rulesetPath: undefined,
          ruleset: {}
        }
      }
      const result: string = prCommentFormatter.formatOutput(output, true)
      assert.ok(result.includes(`${SYMBOLS.error} file-contents`))
      assert.ok(result.includes('LICENSE'))
      assert.ok(result.includes('missing header'))
    })

    it('formats warning-level rules', () => {
      const output: LintResult = {
        passed: true,
        errored: false,
        results: [
          FormatResult.CreateLintOnly(
            new RuleInfo('file-hashes', 'warning', [], 'file-hashes', {}),
            new Result('No broken links', [], true)
          )
        ],
        targets: {},
        params: {
          targetDirectory: '.',
          filterPaths: [],
          rulesetPath: undefined,
          ruleset: {}
        }
      }
      const result: string = prCommentFormatter.formatOutput(output, true)
      assert.ok(result.includes(`${SYMBOLS.warning} file-hashes`))
    })

    it('formats ignored rules', () => {
      const output: LintResult = {
        passed: true,
        errored: false,
        results: [
          FormatResult.CreateIgnored(
            new RuleInfo('apache-notice', 'error', [], 'apache-notice', {}),
            'ignored due to unsatisfied condition'
          )
        ],
        targets: {},
        params: {
          targetDirectory: '.',
          filterPaths: [],
          rulesetPath: undefined,
          ruleset: {}
        }
      }
      const result: string = prCommentFormatter.formatOutput(output, true)
      assert.ok(result.includes('apache-notice: ignored'))
    })

    it('formats error rules', () => {
      const output: LintResult = {
        passed: false,
        errored: false,
        results: [
          FormatResult.CreateError(
            new RuleInfo('bad-rule', 'error', [], 'bad-rule', {}),
            'bad-rule is not a valid rule'
          )
        ],
        targets: {},
        params: {
          targetDirectory: '.',
          filterPaths: [],
          rulesetPath: undefined,
          ruleset: {}
        }
      }
      const result: string = prCommentFormatter.formatOutput(output, true)
      assert.ok(result.includes(`${SYMBOLS.error} bad-rule: error`))
    })

    it('formats errored output', () => {
      const output: LintResult = {
        passed: false,
        errored: true,
        errMsg: 'Config validation failed',
        results: [],
        targets: {},
        params: {
          targetDirectory: '.',
          filterPaths: [],
          rulesetPath: undefined,
          ruleset: {}
        }
      }
      const result: string = prCommentFormatter.formatOutput(output, true)
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

      const output: LintResult = {
        passed: false,
        errored: false,
        results: [fr],
        targets: {},
        params: {
          targetDirectory: '.',
          filterPaths: [],
          rulesetPath: undefined,
          ruleset: {}
        }
      }
      const result: string = prCommentFormatter.formatOutput(output, true)
      assert.ok(result.includes('Suggested fixes'))
      assert.ok(result.includes('SECURITY.md'))
    })

    it('handles multiple targets', () => {
      const output: LintResult = {
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
        params: {
          targetDirectory: '.',
          filterPaths: [],
          rulesetPath: undefined,
          ruleset: {}
        }
      }
      const result: string = prCommentFormatter.formatOutput(output, true)
      assert.ok(result.includes('3 failed'))
      assert.ok(result.includes(`${SYMBOLS.error} LICENSE`))
      assert.ok(result.includes(`${SYMBOLS.error} README.md`))
      assert.ok(result.includes(`${SYMBOLS.error} CONTRIBUTING.md`))
    })

    it('never returns empty output when results exist', () => {
      const cases = [
        {
          label: 'all passing',
          results: [
            FormatResult.CreateLintOnly(
              new RuleInfo('file-existence', 'error', [], 'file-existence', {}),
              new Result(
                'Found',
                [{ path: 'LICENSE', passed: true, message: 'Found file' }],
                true
              )
            )
          ]
        },
        {
          label: 'all failing',
          results: [
            FormatResult.CreateLintOnly(
              new RuleInfo('file-existence', 'error', [], 'file-existence', {}),
              new Result(
                'Missing',
                [{ path: 'LICENSE', passed: false, message: 'not found' }],
                false
              )
            )
          ]
        },
        {
          label: 'mixed pass/fail',
          results: [
            FormatResult.CreateLintOnly(
              new RuleInfo('rule-a', 'error', [], 'file-existence', {}),
              new Result(
                'Found',
                [{ path: 'README.md', passed: true, message: 'Found file' }],
                true
              )
            ),
            FormatResult.CreateLintOnly(
              new RuleInfo('rule-b', 'error', [], 'file-existence', {}),
              new Result(
                'Missing',
                [{ path: 'LICENSE', passed: false, message: 'not found' }],
                false
              )
            )
          ]
        },
        {
          label: 'ignored rules',
          results: [
            FormatResult.CreateIgnored(
              new RuleInfo(
                'ruby-package-metadata-exists',
                'error',
                [],
                'file-existence',
                {}
              ),
              'ignored due to unsatisfied condition(s): "language=ruby"'
            )
          ]
        },
        {
          label: 'error rules',
          results: [
            FormatResult.CreateError(
              new RuleInfo('bad-rule', 'error', [], 'bad-rule', {}),
              'bad-rule is not a valid rule'
            )
          ]
        }
      ]

      for (const { label, results } of cases) {
        const output: LintResult = {
          passed: true,
          errored: false,
          results,
          targets: {},
          params: {
            targetDirectory: '.',
            filterPaths: [],
            rulesetPath: undefined,
            ruleset: {}
          }
        }
        const result: string = prCommentFormatter.formatOutput(output, false)
        assert.ok(
          result.trim().length > 0,
          `pr-comment formatter returned empty output for case: ${label}`
        )
      }
    })

    it(
      'produces non-empty output against the real codebase',
      async () => {
        const lintres: LintResult = await repolinter.lint(path.resolve('.'))
        const result: string = prCommentFormatter.formatOutput(lintres, false)
        assert.ok(
          result.trim().length > 0,
          'pr-comment formatter returned empty output for the real codebase'
        )
        assert.ok(result.includes(SYMBOLS.success))
      },
      { timeout: 30_000 }
    )

    it(
      'produces non-empty output with error symbols for a broken repo',
      async () => {
        const lintres: LintResult = await repolinter.lint(
          path.resolve('tests/package')
        )
        assert.strictEqual(lintres.passed, false, 'expected lint to fail')

        const result: string = prCommentFormatter.formatOutput(lintres, false)
        assert.ok(
          result.trim().length > 0,
          'pr-comment formatter returned empty output for a broken repo'
        )
        assert.ok(
          result.includes(SYMBOLS.error),
          'output should contain error symbol for failing rules'
        )
        assert.ok(
          result.includes('readme-file-exists'),
          'output should mention the failing rule'
        )
      },
      { timeout: 30_000 }
    )
  })
})
