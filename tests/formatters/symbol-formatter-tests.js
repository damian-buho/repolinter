// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import symbolFormatter from '../../dist/formatters/symbol_formatter.js'
const logSymbols = { info: 'ℹ', success: '✔', warning: '⚠', error: '✖' }
import Result from '../../dist/lib/result.js'
import FormatResult from '../../dist/lib/formatresult.js'
import RuleInfo from '../../dist/lib/ruleinfo.js'
import path from 'node:path'
import * as repolinter from '../../dist/index.js'

describe('formatters', () => {
  describe('symbol_formatter', () => {
    it('returns a simple string with the correct log symbol', () => {
      const result = new Result('a message', [], true)
      const successResult = symbolFormatter.formatResult(
        result,
        'myrule',
        undefined,
        undefined,
        logSymbols.error
      )
      assert.ok(successResult.includes(logSymbols.success))
      assert.ok(successResult.includes(result.message))
      assert.ok(successResult.includes('myrule'))

      result.passed = false
      const errorResult = symbolFormatter.formatResult(
        result,
        'myrule',
        undefined,
        undefined,
        logSymbols.error
      )
      assert.ok(errorResult.includes(logSymbols.error))
      assert.ok(errorResult.includes(result.message))
      assert.ok(errorResult.includes('myrule'))
    })

    it('contains all results in output', () => {
      const output = {
        params: {
          targetDir: 'dir',
          filterPaths: [],
          ruleset: {}
        },
        passed: true,
        errored: false,
        targets: [],
        results: [
          FormatResult.CreateLintOnly(
            new RuleInfo('rule1', 'error', [], 'file-existence', {}),
            new Result('did it', [], true)
          ),
          FormatResult.CreateIgnored(
            new RuleInfo('rule2', 'error', [], 'file-existence', {}),
            'ignored'
          ),
          new FormatResult.CreateError(
            new RuleInfo('rule3', 'error', [], 'file-existence', {}),
            'errored'
          )
        ]
      }

      const formatResult = symbolFormatter.formatOutput(output, false)
      assert.ok(formatResult.includes('rule1'))
      assert.ok(formatResult.includes('rule2'))
      assert.ok(formatResult.includes('rule3'))
      assert.ok(formatResult.includes('did it'))
      assert.ok(formatResult.includes('ignored'))
      assert.ok(formatResult.includes('errored'))
      assert.ok(formatResult.includes('dir'))
    })

    it(
      'does not contain the string undefined',
      async () => {
        const lintres = await repolinter.lint(path.resolve('.'))

        const actual = symbolFormatter.formatOutput(lintres, false)

        assert.ok(!actual.includes('undefined'))
      },
      { timeout: 30_000 }
    )
  })
})
