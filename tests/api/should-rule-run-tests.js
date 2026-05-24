// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect } from 'chai'
import { shouldRuleRun } from '../../dist/index.js'

describe('api', () => {
  describe('validateConfig', () => {
    it('should allow a rule to run if axioms match', () => {
      const result = shouldRuleRun(
        ['language=javascript', 'language=*'],
        ['language=javascript']
      )
      expect(result).to.deep.equal([])
    })

    it('should allow a rule to run if axioms wildcard match', () => {
      const result = shouldRuleRun(
        ['language=javascript', 'language=*'],
        ['language=*']
      )
      expect(result).to.deep.equal([])
    })

    it('should not allow a rule to run if no axioms match', () => {
      const result = shouldRuleRun(
        ['language=javascript', 'language=*'],
        ['language=cheese']
      )
      expect(result).to.deep.equal(['language=cheese'])
    })

    it('should not allow non-numerical axioms with numerical comparisons', () => {
      const result = shouldRuleRun(
        ['language=javascript', 'language=*'],
        ['language>=3']
      )
      expect(result).to.deep.equal(['language>=3'])
    })

    it('should not allow invalid operators', () => {
      const result = shouldRuleRun(
        ['language=3', 'language=*'],
        ['language=>3']
      )
      expect(result).to.deep.equal(['language=>3'])
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
      expect(resultPass).to.deep.equal([])
      const resultFail = shouldRuleRun(
        [
          'commits=hello',
          'commits=*',
          'contributor-count=blah',
          'contributors=*'
        ],
        ['commits=nothello', 'contributor-count=blah']
      )
      expect(resultFail).to.deep.equal(['commits=nothello'])
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
      expect(result).to.deep.equal([])
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
      expect(resultPass).to.deep.equal([])
      const resultFail = shouldRuleRun(
        [
          'language=javascript',
          'language=*',
          'contributors=7',
          'contributors=*'
        ],
        ['contributors>7']
      )
      expect(resultFail).to.deep.equal(['contributors>7'])
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
      expect(resultPass).to.deep.equal([])
      const resultFail = shouldRuleRun(
        [
          'language=javascript',
          'language=*',
          'contributors=7',
          'contributors=*'
        ],
        ['contributors>=8']
      )
      expect(resultFail).to.deep.equal(['contributors>=8'])
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
      expect(resultPass).to.deep.equal([])
      const resultFail = shouldRuleRun(
        [
          'language=javascript',
          'language=*',
          'contributors=7',
          'contributors=*'
        ],
        ['contributors<7']
      )
      expect(resultFail).to.deep.equal(['contributors<7'])
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
      expect(resultPass).to.deep.equal([])
      const resultFail = shouldRuleRun(
        [
          'language=javascript',
          'language=*',
          'contributors=7',
          'contributors=*'
        ],
        ['contributors<=6']
      )
      expect(resultFail).to.deep.equal(['contributors<=6'])
    })

    it('should handle a mix of numerical axoims', () => {
      const resultPass = shouldRuleRun(
        ['commits=700', 'commits=*', 'contributors=7', 'contributors=*'],
        ['contributors<=7', 'contributors>4', 'commits>500']
      )
      expect(resultPass).to.deep.equal([])
      const resultFail = shouldRuleRun(
        ['commits=700', 'commits=*', 'contributors=7', 'contributors=*'],
        ['contributors<=6', 'contributors>4', 'commits>900']
      )
      expect(resultFail).to.deep.equal(['contributors<=6', 'commits>900'])
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
      expect(resultPass).to.deep.equal([])
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
      expect(resultFail).to.deep.equal(['commits>900', 'git=no'])
    })
  })
})
