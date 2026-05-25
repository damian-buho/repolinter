// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import jsonSchemaPasses from '../../dist/rules/json-schema-passes.js'

describe('rule', () => {
  describe('json_schema_passes', () => {
    it('returns passes if requested file matches the schema', async () => {
      /** @type {any} */
      const mockfs = {
        findFirstFile() {
          return 'README.md'
        },
        getFileContents() {
          return '{ "thing": "hello" }'
        },
        targetDir: '.'
      }

      const ruleopts = {
        glob: 'README.md',
        schema: {
          properties: {
            thing: { const: 'hello' }
          },
          required: ['thing']
        }
      }

      const actual = await jsonSchemaPasses(mockfs, ruleopts)

      assert.strictEqual(actual.passed, true)
      assert.strictEqual(actual.targets.length, 1)
      assert.strictEqual(actual.targets[0].passed, true)
      assert.strictEqual(actual.targets[0].path, mockfs.findFirstFile())
      assert.strictEqual(actual.targets[0].pattern, ruleopts.glob)
    })

    it('returns fail if requested file does not match the schema', async () => {
      /** @type {any} */
      const mockfs = {
        findFirstFile() {
          return 'README.md'
        },
        getFileContents() {
          return '{ "thing": "nothello" }'
        },
        targetDir: '.'
      }

      const ruleopts = {
        glob: 'README.md',
        schema: {
          properties: {
            thing: { const: 'hello' }
          },
          required: ['thing']
        }
      }

      const actual = await jsonSchemaPasses(mockfs, ruleopts)

      assert.strictEqual(actual.passed, false)
      assert.strictEqual(actual.targets.length, 1)
      assert.strictEqual(actual.targets[0].passed, false)
      assert.strictEqual(actual.targets[0].path, mockfs.findFirstFile())
      assert.strictEqual(actual.targets[0].pattern, ruleopts.glob)
    })

    it('throws if the schema is invalid', async () => {
      /** @type {any} */
      const mockfs = {
        findFirstFile() {
          return 'README.md'
        },
        getFileContents() {
          return '{ "thing": "hello" }'
        },
        targetDir: '.'
      }

      const ruleopts = {
        glob: 'README.md',
        schema: {
          properties: {
            thing: { type: 'any' }
          },
          required: ['thing']
        }
      }

      await assert.rejects(() => jsonSchemaPasses(mockfs, ruleopts), Error)
    })

    it('returns fail if the file had invalid JSON', async () => {
      /** @type {any} */
      const mockfs = {
        findFirstFile() {
          return 'README.md'
        },
        getFileContents() {
          return '{ "thing": "hello"'
        },
        targetDir: '.'
      }

      const ruleopts = {
        glob: 'README.md',
        schema: {
          properties: {
            thing: { const: 'hello' }
          },
          required: ['thing']
        }
      }

      const actual = await jsonSchemaPasses(mockfs, ruleopts)

      assert.strictEqual(actual.passed, false)
      assert.strictEqual(actual.targets.length, 1)
      assert.strictEqual(actual.targets[0].passed, false)
      assert.strictEqual(actual.targets[0].path, mockfs.findFirstFile())
      assert.strictEqual(actual.targets[0].pattern, ruleopts.glob)
    })

    it('succeeds if the file does not exist and succeed-on-non-existent is set', async () => {
      /** @type {any} */
      const mockfs = {
        findFirstFile() {
          return
        },
        getFileContents() {
          return
        },
        targetDir: '.'
      }

      const ruleopts = {
        glob: 'README.md',
        schema: {
          properties: {
            thing: { const: 'hello' }
          },
          required: ['thing']
        },
        'succeed-on-non-existent': true
      }

      const actual = await jsonSchemaPasses(mockfs, ruleopts)

      assert.strictEqual(actual.passed, true)
      assert.strictEqual(actual.targets.length, 1)
      assert.strictEqual(actual.targets[0].pattern, ruleopts.glob)
      assert.strictEqual(actual.targets[0].path, undefined)
    })

    it('returns fail if the file does not exist', async () => {
      /** @type {any} */
      const mockfs = {
        findFirstFile() {
          return
        },
        getFileContents() {
          return
        },
        targetDir: '.'
      }

      const ruleopts = {
        glob: 'README.md',
        schema: {
          properties: {
            thing: { const: 'hello' }
          },
          required: ['thing']
        }
      }

      const actual = await jsonSchemaPasses(mockfs, ruleopts)

      assert.strictEqual(actual.passed, false)
      assert.strictEqual(actual.targets.length, 1)
      assert.strictEqual(actual.targets[0].pattern, ruleopts.glob)
      assert.strictEqual(actual.targets[0].path, undefined)
    })

    it('includes human-readable-message in the output', async () => {
      /** @type {any} */
      const mockfs = {
        findFirstFile() {
          return 'README.md'
        },
        getFileContents() {
          return '{ "thing": "nothello" }'
        },
        targetDir: '.'
      }

      const ruleopts = {
        glob: 'README.md',
        schema: {
          properties: {
            thing: { const: 'hello' }
          },
          required: ['thing']
        },
        'human-readable-message': 'foo'
      }

      const actual = await jsonSchemaPasses(mockfs, ruleopts)

      assert.strictEqual(actual.passed, false)
      assert.strictEqual(actual.targets.length, 1)
      assert.strictEqual(actual.targets[0].passed, false)
      assert.strictEqual(actual.targets[0].path, mockfs.findFirstFile())
      assert.strictEqual(actual.targets[0].pattern, ruleopts.glob)
      assert.ok(
        actual.targets[0].message.includes(ruleopts['human-readable-message'])
      )
    })
  })
})
