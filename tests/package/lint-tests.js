// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import path from 'node:path'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import RuleInfo from '../../dist/lib/ruleinfo.js'
import Result from '../../dist/lib/result.js'
import * as repolinter from '../../dist/index.js'

describe('package', () => {
  describe(
    'repolinter',
    () => {
      it('does not pass', async () => {
        const result = await repolinter.lint(path.resolve('tests/package'))

        assert.strictEqual(result.passed, false)
        assert.strictEqual(result.errored, false)
      })

      it('returns the correct results', async () => {
        const result = await repolinter.lint(path.resolve('tests/package'))

        assert.strictEqual(result.results.length, 2)
        assert.strictEqual(
          result.results[0].ruleInfo.name,
          'readme-file-exists'
        )
        assert.strictEqual(
          result.results[0].ruleInfo.ruleType,
          'file-existence'
        )
        assert.strictEqual(result.results[0].ruleInfo.fixType, undefined)
        assert.strictEqual(result.results[0].lintResult.passed, false)
        assert.strictEqual(result.results[1].ruleInfo.name, 'test-file-exists')
        assert.strictEqual(
          result.results[1].ruleInfo.ruleType,
          'file-existence'
        )
        assert.strictEqual(result.results[1].ruleInfo.fixType, undefined)
        assert.strictEqual(result.results[1].lintResult.passed, true)
        assert.strictEqual(result.results[1].lintResult.targets.length, 1)
        assert.strictEqual(result.results[1].lintResult.targets[0].passed, true)
        assert.strictEqual(
          result.results[1].lintResult.targets[0].path,
          'lint-tests.js'
        )
      })

      it('returns the correct results for a YAML config', async () => {
        const result = await repolinter.lint(
          path.resolve('tests/package'),
          undefined,
          path.resolve('tests/package/repolinter-yaml.yml')
        )

        assert.strictEqual(result.results.length, 2)
        assert.strictEqual(
          result.results[0].ruleInfo.name,
          'readme-file-exists'
        )
        assert.strictEqual(
          result.results[0].ruleInfo.ruleType,
          'file-existence'
        )
        assert.strictEqual(result.results[0].ruleInfo.fixType, undefined)
        assert.strictEqual(result.results[0].lintResult.passed, false)
        assert.strictEqual(result.results[1].ruleInfo.name, 'test-file-exists')
        assert.strictEqual(
          result.results[1].ruleInfo.ruleType,
          'file-existence'
        )
        assert.strictEqual(result.results[1].ruleInfo.fixType, undefined)
        assert.strictEqual(result.results[1].lintResult.passed, true)
        assert.strictEqual(result.results[1].lintResult.targets.length, 1)
        assert.strictEqual(result.results[1].lintResult.targets[0].passed, true)
        assert.strictEqual(
          result.results[1].lintResult.targets[0].path,
          'lint-tests.js'
        )
      })

      it('outputs the same results for new and old-style config', async () => {
        const expected = await repolinter.lint(
          path.resolve('tests/package'),
          [],
          path.resolve('tests/package/default.json')
        )
        const actual = await repolinter.lint(
          path.resolve('tests/package'),
          [],
          path.resolve('tests/package/default-legacy.json')
        )

        assert.strictEqual(expected.errored, false)
        assert.strictEqual(actual.errored, false)
        assert.strictEqual(actual.passed, expected.passed)
        assert.deepStrictEqual(actual.results, expected.results)
      })

      it('ignores failed axioms', async () => {
        const actual = await repolinter.runRuleset(
          [
            new RuleInfo('myrule', 'error', ['myAxiom=true'], 'fix-dohicky', {})
          ],
          { myAxiom: new Result('', [], false) },
          false
        )
        assert.strictEqual(actual.length, 1)
        assert.strictEqual(actual[0].status, 'IGNORED')
      })

      it('passes through formatOptions', async () => {
        const actual = await repolinter.lint(
          path.resolve('tests/package'),
          [],
          path.resolve('tests/package/repolinter-formatter-opts.json')
        )
        assert.deepStrictEqual(actual.formatOptions, { hello: 'world' })
      })
    },
    { timeout: 30_000 }
  )
})
