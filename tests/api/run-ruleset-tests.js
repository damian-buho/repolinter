// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect } from 'chai'
import * as repolinter from '../../dist/index.js'
import RuleInfo from '../../dist/lib/ruleinfo.js'
import FileSystem from '../../dist/lib/file_system.js'
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
      expect(result).to.have.length(1)
      expect(result[0].ruleInfo).to.deep.equal({
        level: 'error',
        name: 'my-rule',
        ruleConfig: {},
        ruleType: 'apache-notice',
        where: []
      })
      expect(result[0].status).to.equal(FormatResult.RULE_PASSED)
      expect(result[0].lintResult.passed).to.equal(true)
      expect(result[0].fixResult).to.equal(undefined)
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
      expect(result).to.have.length(1)
      expect(result[0].ruleInfo).to.deep.equal({
        level: 'error',
        name: 'my-rule',
        ruleConfig: { globsAny: ['notafile'] },
        ruleType: 'file-existence',
        where: []
      })
      expect(result[0].status).to.equal(FormatResult.RULE_NOT_PASSED_ERROR)
      expect(result[0].lintResult.passed).to.equal(false)
      expect(result[0].fixResult).to.equal(undefined)
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
      expect(result).to.have.length(1)
      expect(result[0].ruleInfo).to.deep.equal({
        level: 'warning',
        name: 'my-rule',
        ruleConfig: { globsAny: ['notafile'] },
        ruleType: 'file-existence',
        where: []
      })
      expect(result[0].status).to.equal(FormatResult.RULE_NOT_PASSED_WARN)
      expect(result[0].lintResult.passed).to.equal(false)
      expect(result[0].fixResult).to.equal(undefined)
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
      expect(result).to.have.length(1)
      expect(result[0].status).to.equal(FormatResult.IGNORED)
      expect(result[0].lintResult).to.equal(undefined)
      expect(result[0].fixResult).to.equal(undefined)
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
      expect(result).to.have.length(1)
      expect(result[0].status).to.equal(FormatResult.RULE_PASSED)
      expect(result[0].lintResult.passed).to.equal(true)
      expect(result[0].fixResult).to.equal(undefined)
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
      expect(result).to.have.length(1)
      expect(result[0].status).to.equal(FormatResult.RULE_PASSED)
      expect(result[0].lintResult.passed).to.equal(true)
      expect(result[0].fixResult).to.equal(undefined)
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
      expect(result).to.have.length(1)
      expect(result[0].status).to.equal(FormatResult.IGNORED)
      expect(result[0].lintResult).to.equal(undefined)
      expect(result[0].fixResult).to.equal(undefined)
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
      expect(result).to.have.length(1)
      expect(result[0].status).to.equal(FormatResult.RULE_PASSED)
      expect(result[0].lintResult.passed).to.equal(true)
      expect(result[0].fixResult).to.equal(undefined)
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
      expect(result).to.have.length(1)
      expect(result[0].status).to.equal(FormatResult.IGNORED)
      expect(result[0].lintResult).to.equal(undefined)
      expect(result[0].fixResult).to.equal(undefined)
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
      expect(result).to.have.length(1)
      expect(result[0].status).to.equal(FormatResult.RULE_PASSED)
      expect(result[0].lintResult.passed).to.equal(true)
      expect(result[0].fixResult).to.equal(undefined)
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
      expect(result).to.have.length(1)
      expect(result[0].status).to.equal(FormatResult.RULE_NOT_PASSED_ERROR)
      expect(result[0].lintResult.passed).to.equal(false)
      expect(result[0].fixResult.passed).to.equal(true)
      expect(result[0].ruleInfo).to.deep.equal({
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
      expect(result).to.have.length(1)
      expect(result[0].status).to.equal(FormatResult.ERROR)
      expect(result[0].lintResult).to.equal(undefined)
      expect(result[0].fixResult).to.equal(undefined)
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
      expect(result).to.have.length(1)
      expect(result[0].status).to.equal(FormatResult.ERROR)
      expect(result[0].fixResult).to.equal(undefined)
    })
  })
})
