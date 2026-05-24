// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import path from 'node:path'
import { expect } from 'chai'
import RuleInfo from '../../dist/lib/ruleinfo.js'
import Result from '../../dist/lib/result.js'
import * as repolinter from '../../dist/index.js'

describe('package', () => {
  describe('repolinter', function () {
    this.timeout(30_000)

    it('does not pass', async () => {
      const result = await repolinter.lint(path.resolve('tests/package'))

      expect(result.passed).to.equal(false)
      expect(result.errored).to.equal(false)
    })

    it('returns the correct results', async () => {
      const result = await repolinter.lint(path.resolve('tests/package'))

      expect(result.results).to.have.length(2)
      // readme-file-exists rule
      expect(result.results[0].ruleInfo.name).to.equal('readme-file-exists')
      expect(result.results[0].ruleInfo.ruleType).to.equal('file-existence')
      expect(result.results[0].ruleInfo.fixType).to.equal(undefined)
      expect(result.results[0].lintResult.passed).to.equal(false)
      // test-file-exists rule
      expect(result.results[1].ruleInfo.name).to.equal('test-file-exists')
      expect(result.results[1].ruleInfo.ruleType).to.equal('file-existence')
      expect(result.results[1].ruleInfo.fixType).to.equal(undefined)
      expect(result.results[1].lintResult.passed).to.equal(true)
      expect(result.results[1].lintResult.targets).to.have.length(1)
      expect(result.results[1].lintResult.targets[0].passed).to.equal(true)
      expect(result.results[1].lintResult.targets[0].path).to.equal(
        'lint-tests.js'
      )
    })

    it('returns the correct results for a YAML config', async () => {
      const result = await repolinter.lint(
        path.resolve('tests/package'),
        undefined,
        path.resolve('tests/package/repolinter-yaml.yml')
      )

      expect(result.results).to.have.length(2)
      // readme-file-exists rule
      expect(result.results[0].ruleInfo.name).to.equal('readme-file-exists')
      expect(result.results[0].ruleInfo.ruleType).to.equal('file-existence')
      expect(result.results[0].ruleInfo.fixType).to.equal(undefined)
      expect(result.results[0].lintResult.passed).to.equal(false)
      // test-file-exists rule
      expect(result.results[1].ruleInfo.name).to.equal('test-file-exists')
      expect(result.results[1].ruleInfo.ruleType).to.equal('file-existence')
      expect(result.results[1].ruleInfo.fixType).to.equal(undefined)
      expect(result.results[1].lintResult.passed).to.equal(true)
      expect(result.results[1].lintResult.targets).to.have.length(1)
      expect(result.results[1].lintResult.targets[0].passed).to.equal(true)
      expect(result.results[1].lintResult.targets[0].path).to.equal(
        'lint-tests.js'
      )
    })

    it('outputs the same results for new and old-style config', async function () {
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

      expect(expected.errored).to.equal(false)
      expect(actual.errored).to.equal(false)
      expect(actual.passed).to.equal(expected.passed)
      expect(actual.results).to.deep.equal(expected.results)
    })

    it('ignores failed axioms', async () => {
      const actual = await repolinter.runRuleset(
        [new RuleInfo('myrule', 'error', ['myAxiom=true'], 'fix-dohicky', {})],
        { myAxiom: new Result('', [], false) },
        false
      )
      expect(actual).to.have.length(1)
      expect(actual[0].status).to.equal('IGNORED')
    })

    it('passes through formatOptions', async function () {
      const actual = await repolinter.lint(
        path.resolve('tests/package'),
        [],
        path.resolve('tests/package/repolinter-formatter-opts.json')
      )
      expect(actual.formatOptions).to.deep.equal({ hello: 'world' })
    })
  })
})
