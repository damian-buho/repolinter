// SPDX-FileCopyrightText: 2017 TODO Group
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
//
// SPDX-License-Identifier: Apache-2.0

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import * as repolinter from '../../dist/index.js'
import RuleInfo from '../../dist/lib/ruleinfo.js'
import FileSystem from '../../dist/lib/file-system.js'
import FormatResult from '../../dist/lib/formatresult.js'
import Result from '../../dist/lib/result.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

describe('api', () => {
  describe('runRuleset', () => {
    const realFs = new FileSystem(path.resolve(__dirname, '../../'))

    it('runs a passing rule', async () => {
      const mockconfig = [
        new RuleInfo('my-rule', 'error', [], 'apache-notice', {})
      ]
      const result = await repolinter.runRuleset(
        mockconfig,
        false,
        realFs,
        false
      )
      assert.strictEqual(result.length, 1)
      assert.deepStrictEqual(structuredClone(result[0].ruleInfo), {
        level: 'error',
        name: 'my-rule',
        ruleConfig: {},
        ruleType: 'apache-notice',
        where: []
      })
      assert.strictEqual(result[0].status, FormatResult.RULE_PASSED)
      assert.strictEqual(result[0].lintResult.passed, true)
      assert.strictEqual(result[0].fixResult, undefined)
    })

    it('runs a failing rule', async () => {
      const mockconfig = [
        new RuleInfo('my-rule', 'error', [], 'file-existence', {
          globsAny: ['notafile']
        })
      ]
      const result = await repolinter.runRuleset(
        mockconfig,
        false,
        realFs,
        false
      )
      assert.strictEqual(result.length, 1)
      assert.deepStrictEqual(structuredClone(result[0].ruleInfo), {
        level: 'error',
        name: 'my-rule',
        ruleConfig: { globsAny: ['notafile'] },
        ruleType: 'file-existence',
        where: []
      })
      assert.strictEqual(result[0].status, FormatResult.RULE_NOT_PASSED_ERROR)
      assert.strictEqual(result[0].lintResult.passed, false)
      assert.strictEqual(result[0].fixResult, undefined)
    })

    it('runs a failing rule with level warning', async () => {
      const mockconfig = [
        new RuleInfo('my-rule', 'warning', [], 'file-existence', {
          globsAny: ['notafile']
        })
      ]
      const result = await repolinter.runRuleset(
        mockconfig,
        false,
        realFs,
        false
      )
      assert.strictEqual(result.length, 1)
      assert.deepStrictEqual(structuredClone(result[0].ruleInfo), {
        level: 'warning',
        name: 'my-rule',
        ruleConfig: { globsAny: ['notafile'] },
        ruleType: 'file-existence',
        where: []
      })
      assert.strictEqual(result[0].status, FormatResult.RULE_NOT_PASSED_WARN)
      assert.strictEqual(result[0].lintResult.passed, false)
      assert.strictEqual(result[0].fixResult, undefined)
    })

    it('disables a rule with level off', async () => {
      const mockconfig = [
        new RuleInfo('my-rule', 'off', [], 'file-existence', {
          globsAny: ['notafile']
        })
      ]
      const result = await repolinter.runRuleset(
        mockconfig,
        false,
        realFs,
        false
      )
      assert.strictEqual(result.length, 1)
      assert.strictEqual(result[0].status, FormatResult.IGNORED)
      assert.strictEqual(result[0].lintResult, undefined)
      assert.strictEqual(result[0].fixResult, undefined)
    })

    it('runs a rule conditionally with axioms', async () => {
      const mockconfig = [
        new RuleInfo(
          'my-rule',
          'error',
          ['language=javascript'],
          'apache-notice',
          {}
        )
      ]
      const result = await repolinter.runRuleset(
        mockconfig,
        {
          language: new Result('', [{ passed: true, path: 'javascript' }], true)
        },
        realFs,
        false
      )
      assert.strictEqual(result.length, 1)
      assert.strictEqual(result[0].status, FormatResult.RULE_PASSED)
      assert.strictEqual(result[0].lintResult.passed, true)
      assert.strictEqual(result[0].fixResult, undefined)
    })

    it('runs a rule conditionally with an axiom wildcard', async () => {
      const mockconfig = [
        new RuleInfo('my-rule', 'error', ['language=*'], 'apache-notice', {})
      ]
      const result = await repolinter.runRuleset(
        mockconfig,
        {
          language: new Result('', [{ passed: true, path: 'javascript' }], true)
        },
        realFs,
        false
      )
      assert.strictEqual(result.length, 1)
      assert.strictEqual(result[0].status, FormatResult.RULE_PASSED)
      assert.strictEqual(result[0].lintResult.passed, true)
      assert.strictEqual(result[0].fixResult, undefined)
    })

    it('ignores a rule conditionally with axioms', async () => {
      const mockconfig = [
        new RuleInfo(
          'my-rule',
          'error',
          ['language=javascript'],
          'apache-notice',
          {}
        )
      ]
      const result = await repolinter.runRuleset(
        mockconfig,
        {
          language: new Result(
            '',
            [{ passed: true, path: 'not-javascript' }],
            true
          )
        },
        realFs,
        false
      )
      assert.strictEqual(result.length, 1)
      assert.strictEqual(result[0].status, FormatResult.IGNORED)
      assert.strictEqual(result[0].lintResult, undefined)
      assert.strictEqual(result[0].fixResult, undefined)
    })

    it('runs a rule conditionally with a numerical axiom', async () => {
      const mockconfig = [
        new RuleInfo('my-rule', 'error', ['number>3'], 'apache-notice', {})
      ]
      const result = await repolinter.runRuleset(
        mockconfig,
        { number: new Result('', [{ passed: true, path: '4' }], true) },
        realFs,
        false
      )
      assert.strictEqual(result.length, 1)
      assert.strictEqual(result[0].status, FormatResult.RULE_PASSED)
      assert.strictEqual(result[0].lintResult.passed, true)
      assert.strictEqual(result[0].fixResult, undefined)
    })

    it('ignores a rule conditionally with a numerical axiom', async () => {
      const mockconfig = [
        new RuleInfo('my-rule', 'error', ['number>4'], 'apache-notice', {})
      ]
      const result = await repolinter.runRuleset(
        mockconfig,
        { number: new Result('', [{ passed: true, path: '4' }], true) },
        realFs,
        false
      )
      assert.strictEqual(result.length, 1)
      assert.strictEqual(result[0].status, FormatResult.IGNORED)
      assert.strictEqual(result[0].lintResult, undefined)
      assert.strictEqual(result[0].fixResult, undefined)
    })

    it('ignores a fix if the rule passes', async () => {
      const mockconfig = [
        new RuleInfo(
          'my-rule',
          'error',
          [],
          'file-existence',
          { globsAny: ['README*'] },
          'garbage-fix',
          {}
        )
      ]
      const result = await repolinter.runRuleset(
        mockconfig,
        false,
        realFs,
        false
      )
      assert.strictEqual(result.length, 1)
      assert.strictEqual(result[0].status, FormatResult.RULE_PASSED)
      assert.strictEqual(result[0].lintResult.passed, true)
      assert.strictEqual(result[0].fixResult, undefined)
    })

    it('runs a fix if the rule fails', async () => {
      const mockconfig = [
        new RuleInfo(
          'my-rule',
          'error',
          [],
          'file-existence',
          { globsAny: ['notafile'] },
          'file-create',
          { file: 'myfile', text: 'hello!' }
        )
      ]
      const result = await repolinter.runRuleset(
        mockconfig,
        false,
        realFs,
        true
      )
      assert.strictEqual(result.length, 1)
      assert.strictEqual(result[0].status, FormatResult.RULE_NOT_PASSED_ERROR)
      assert.strictEqual(result[0].lintResult.passed, false)
      assert.strictEqual(result[0].fixResult.passed, true)
      assert.deepStrictEqual(structuredClone(result[0].ruleInfo), {
        level: 'error',
        name: 'my-rule',
        ruleConfig: { globsAny: ['notafile'] },
        ruleType: 'file-existence',
        where: [],
        fixType: 'file-create',
        fixConfig: { file: 'myfile', text: 'hello!' }
      })
    })

    it('returns a failing result with an invalid rule', async () => {
      const mockconfig = [
        new RuleInfo('my-rule', 'error', [], 'garbage-rule', {
          globsAny: ['notafile']
        })
      ]
      const result = await repolinter.runRuleset(
        mockconfig,
        false,
        realFs,
        false
      )
      assert.strictEqual(result.length, 1)
      assert.strictEqual(result[0].status, FormatResult.ERROR)
      assert.strictEqual(result[0].lintResult, undefined)
      assert.strictEqual(result[0].fixResult, undefined)
    })

    it('returns a failing result with an invalid fix', async () => {
      const mockconfig = [
        new RuleInfo(
          'my-rule',
          'error',
          [],
          'file-existence',
          { globsAny: ['notafile'] },
          'garbage-fix',
          {}
        )
      ]
      const result = await repolinter.runRuleset(
        mockconfig,
        false,
        realFs,
        false
      )
      assert.strictEqual(result.length, 1)
      assert.strictEqual(result[0].status, FormatResult.ERROR)
      assert.strictEqual(result[0].fixResult, undefined)
    })
  })
})
