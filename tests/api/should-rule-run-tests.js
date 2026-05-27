// SPDX-FileCopyrightText: 2017 TODO Group
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
//
// SPDX-License-Identifier: Apache-2.0

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { shouldRuleRun } from '../../dist/index.js'

describe('api', () => {
  describe('validateConfig', () => {
    it('should allow a rule to run if axioms match', () => {
      const result = shouldRuleRun(
        ['language=javascript', 'language=*'],
        ['language=javascript']
      )
      assert.deepStrictEqual(result, [])
    })

    it('should allow a rule to run if axioms wildcard match', () => {
      const result = shouldRuleRun(
        ['language=javascript', 'language=*'],
        ['language=*']
      )
      assert.deepStrictEqual(result, [])
    })

    it('should not allow a rule to run if no axioms match', () => {
      const result = shouldRuleRun(
        ['language=javascript', 'language=*'],
        ['language=cheese']
      )
      assert.deepStrictEqual(result, ['language=cheese'])
    })

    it('should not allow non-numerical axioms with numerical comparisons', () => {
      const result = shouldRuleRun(
        ['language=javascript', 'language=*'],
        ['language>=3']
      )
      assert.deepStrictEqual(result, ['language>=3'])
    })

    it('should not allow invalid operators', () => {
      const result = shouldRuleRun(
        ['language=3', 'language=*'],
        ['language=>3']
      )
      assert.deepStrictEqual(result, ['language=>3'])
    })

    it('should handle a mix of axoims', () => {
      const resultPass = shouldRuleRun(
        [
          'commits=hello',
          'commits=*',
          'contributor-count=blah',
          'contributors=*'
        ],
        ['commits=hello', 'contributor-count=blah']
      )
      assert.deepStrictEqual(resultPass, [])
      const resultFail = shouldRuleRun(
        [
          'commits=hello',
          'commits=*',
          'contributor-count=blah',
          'contributors=*'
        ],
        ['commits=nothello', 'contributor-count=blah']
      )
      assert.deepStrictEqual(resultFail, ['commits=nothello'])
    })

    it('should handle a numerical = axiom', () => {
      const result = shouldRuleRun(
        [
          'language=javascript',
          'language=*',
          'contributors=7',
          'contributors=*'
        ],
        ['contributors=7']
      )
      assert.deepStrictEqual(result, [])
    })

    it('should handle a numerical > axiom', () => {
      const resultPass = shouldRuleRun(
        [
          'language=javascript',
          'language=*',
          'contributors=7',
          'contributors=*'
        ],
        ['contributors>6']
      )
      assert.deepStrictEqual(resultPass, [])
      const resultFail = shouldRuleRun(
        [
          'language=javascript',
          'language=*',
          'contributors=7',
          'contributors=*'
        ],
        ['contributors>7']
      )
      assert.deepStrictEqual(resultFail, ['contributors>7'])
    })

    it('should handle a numerical >= axiom', () => {
      const resultPass = shouldRuleRun(
        [
          'language=javascript',
          'language=*',
          'contributors=7',
          'contributors=*'
        ],
        ['contributors>=7']
      )
      assert.deepStrictEqual(resultPass, [])
      const resultFail = shouldRuleRun(
        [
          'language=javascript',
          'language=*',
          'contributors=7',
          'contributors=*'
        ],
        ['contributors>=8']
      )
      assert.deepStrictEqual(resultFail, ['contributors>=8'])
    })

    it('should handle a numerical < axiom', () => {
      const resultPass = shouldRuleRun(
        [
          'language=javascript',
          'language=*',
          'contributors=7',
          'contributors=*'
        ],
        ['contributors<8']
      )
      assert.deepStrictEqual(resultPass, [])
      const resultFail = shouldRuleRun(
        [
          'language=javascript',
          'language=*',
          'contributors=7',
          'contributors=*'
        ],
        ['contributors<7']
      )
      assert.deepStrictEqual(resultFail, ['contributors<7'])
    })

    it('should handle a numerical <= axiom', () => {
      const resultPass = shouldRuleRun(
        [
          'language=javascript',
          'language=*',
          'contributors=7',
          'contributors=*'
        ],
        ['contributors<=7']
      )
      assert.deepStrictEqual(resultPass, [])
      const resultFail = shouldRuleRun(
        [
          'language=javascript',
          'language=*',
          'contributors=7',
          'contributors=*'
        ],
        ['contributors<=6']
      )
      assert.deepStrictEqual(resultFail, ['contributors<=6'])
    })

    it('should handle a mix of numerical axoims', () => {
      const resultPass = shouldRuleRun(
        ['commits=700', 'commits=*', 'contributors=7', 'contributors=*'],
        ['contributors<=7', 'contributors>4', 'commits>500']
      )
      assert.deepStrictEqual(resultPass, [])
      const resultFail = shouldRuleRun(
        ['commits=700', 'commits=*', 'contributors=7', 'contributors=*'],
        ['contributors<=6', 'contributors>4', 'commits>900']
      )
      assert.deepStrictEqual(resultFail, ['contributors<=6', 'commits>900'])
    })

    it('should handle both numerical and regular axioms', () => {
      const resultPass = shouldRuleRun(
        [
          'commits=700',
          'commits=*',
          'contributors=7',
          'contributors=*',
          'language=javascript',
          'language=*',
          'git=yes',
          'git=*'
        ],
        ['contributors<=7', 'contributors>4', 'commits>600', 'git=*']
      )
      assert.deepStrictEqual(resultPass, [])
      const resultFail = shouldRuleRun(
        [
          'commits=700',
          'commits=*',
          'contributors=7',
          'contributors=*',
          'language=javascript',
          'language=*',
          'git=yes',
          'git=*'
        ],
        ['contributors<=7', 'contributors>4', 'commits>900', 'git=no']
      )
      assert.deepStrictEqual(resultFail, ['commits>900', 'git=no'])
    })
  })
})
