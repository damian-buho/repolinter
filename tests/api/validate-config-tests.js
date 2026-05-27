// SPDX-FileCopyrightText: 2017 TODO Group
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
//
// SPDX-License-Identifier: Apache-2.0

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import * as repolinter from '../../dist/index.js'

describe('api', () => {
  describe('validateConfig', () => {
    it('validates a configuration', async () => {
      const mockconfig = {
        axioms: {},
        rules: {
          myrule: {
            level: 'error',
            rule: {
              type: 'apache-notice',
              options: {}
            }
          }
        },
        version: 2
      }

      const { passed, error } = await repolinter.validateConfig(mockconfig)

      assert.strictEqual(error, undefined)
      assert.strictEqual(passed, true)
    })

    it('validates a legacy configuration', async () => {
      const mockconfig = {
        axioms: {},
        rules: {}
      }

      const { passed, error } = await repolinter.validateConfig(mockconfig)

      assert.strictEqual(error, undefined)
      assert.strictEqual(passed, true)
    })

    it('rejects an invalid configuration', async () => {
      const mockconfig = {
        version: 2
      }

      const { passed, error } = await repolinter.validateConfig(mockconfig)

      assert.notStrictEqual(error, undefined)
      assert.strictEqual(passed, false)
    })

    it('rejects a non-object configuration', async () => {
      const { passed, error } = await repolinter.validateConfig(7)

      assert.notStrictEqual(error, undefined)
      assert.strictEqual(passed, false)
    })

    it('rejects an invalid error level', async () => {
      const mockconfig = {
        axioms: {},
        rules: {
          myrule: {
            level: 'banana',
            rule: {
              type: 'apache-notice',
              options: {}
            }
          }
        },
        version: 2
      }

      const { passed, error } = await repolinter.validateConfig(mockconfig)

      assert.notStrictEqual(error, undefined)
      assert.strictEqual(passed, false)
    })

    it('rejects invalid rule options', async () => {
      const mockconfig = {
        axioms: {},
        rules: {
          myrule: {
            level: 'error',
            rule: {
              type: 'file-contents',
              options: {}
            }
          }
        },
        version: 2
      }

      const { passed, error } = await repolinter.validateConfig(mockconfig)

      assert.notStrictEqual(error, undefined)
      assert.strictEqual(passed, false)
    })
  })
})
