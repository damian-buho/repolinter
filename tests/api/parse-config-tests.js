// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import * as repolinter from '../../dist/index.js'

describe('api', () => {
  describe('parseConfig', () => {
    it('parses a config into RuleInfo object', () => {
      const mockConfig = {
        version: 2,
        rules: {
          'my-rule': {
            level: 'error',
            rule: {
              type: 'some-rule',
              options: {}
            }
          }
        }
      }

      const parsed = repolinter.parseConfig(mockConfig)

      assert.strictEqual(parsed.length, 1)
      assert.strictEqual(parsed[0].name, 'my-rule')
      assert.strictEqual(parsed[0].level, 'error')
      assert.strictEqual(parsed[0].where.length, 0)
      assert.strictEqual(parsed[0].ruleType, 'some-rule')
      assert.deepStrictEqual(parsed[0].ruleConfig, {})
      assert.strictEqual(parsed[0].fixType, undefined)
    })

    it('parses multiple config objects', () => {
      const mockConfig = {
        version: 2,
        rules: {
          'my-rule': {
            level: 'error',
            rule: {
              type: 'some-rule',
              options: {}
            }
          },
          'my-other-rule': {
            level: 'error',
            rule: {
              type: 'some-other-rule',
              options: {}
            }
          }
        }
      }

      const parsed = repolinter.parseConfig(mockConfig)

      assert.strictEqual(parsed.length, 2)
      assert.strictEqual(parsed[0].name, 'my-rule')
      assert.strictEqual(parsed[0].level, 'error')
      assert.strictEqual(parsed[0].where.length, 0)
      assert.strictEqual(parsed[0].ruleType, 'some-rule')
      assert.deepStrictEqual(parsed[0].ruleConfig, {})
      assert.strictEqual(parsed[0].fixType, undefined)
      assert.strictEqual(parsed[1].name, 'my-other-rule')
      assert.strictEqual(parsed[1].level, 'error')
      assert.strictEqual(parsed[1].where.length, 0)
      assert.strictEqual(parsed[1].ruleType, 'some-other-rule')
      assert.deepStrictEqual(parsed[1].ruleConfig, {})
      assert.strictEqual(parsed[1].fixType, undefined)
    })

    it('parses a where condition', () => {
      const mockConfig = {
        version: 2,
        rules: {
          'my-rule': {
            level: 'error',
            where: ['condition=true'],
            rule: {
              type: 'some-rule',
              options: {}
            }
          }
        }
      }

      const parsed = repolinter.parseConfig(mockConfig)

      assert.strictEqual(parsed.length, 1)
      assert.strictEqual(parsed[0].name, 'my-rule')
      assert.strictEqual(parsed[0].level, 'error')
      assert.strictEqual(parsed[0].where.length, 1)
      assert.strictEqual(parsed[0].where[0], 'condition=true')
      assert.strictEqual(parsed[0].ruleType, 'some-rule')
      assert.deepStrictEqual(parsed[0].ruleConfig, {})
      assert.strictEqual(parsed[0].fixType, undefined)
    })

    it('parses a fix', () => {
      const mockConfig = {
        version: 2,
        rules: {
          'my-rule': {
            level: 'error',
            rule: {
              type: 'some-rule',
              options: {}
            },
            fix: {
              type: 'some-fix',
              options: {}
            }
          }
        }
      }

      const parsed = repolinter.parseConfig(mockConfig)

      assert.strictEqual(parsed.length, 1)
      assert.strictEqual(parsed[0].name, 'my-rule')
      assert.strictEqual(parsed[0].level, 'error')
      assert.strictEqual(parsed[0].where.length, 0)
      assert.strictEqual(parsed[0].ruleType, 'some-rule')
      assert.deepStrictEqual(parsed[0].ruleConfig, {})
      assert.strictEqual(parsed[0].fixType, 'some-fix')
      assert.deepStrictEqual(parsed[0].fixConfig, {})
    })

    it('reads the policyInfo and policyUrl', () => {
      const mockConfig = {
        version: 2,
        rules: {
          'my-rule': {
            rule: {
              type: 'some-rule',
              options: {}
            },
            policyInfo: 'This is some official guidance',
            policyUrl: 'www.example.com'
          }
        }
      }

      const parsed = repolinter.parseConfig(mockConfig)

      assert.strictEqual(parsed.length, 1)
      assert.strictEqual(parsed[0].policyInfo, mockConfig.rules['my-rule'].policyInfo)
      assert.strictEqual(parsed[0].policyUrl, mockConfig.rules['my-rule'].policyUrl)
    })
  })
})
