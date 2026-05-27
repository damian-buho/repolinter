// SPDX-FileCopyrightText: 2017 TODO Group
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
//
// SPDX-License-Identifier: Apache-2.0

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fileExistence from '../../dist/rules/file-existence.js'

describe('rule', () => {
  describe('files_existence', () => {
    it('returns a passed result if requested file exists', async () => {
      /** @type {any} */
      const mockfs = {
        findFirstFile() {
          return 'LICENSE.md'
        },
        targetDir: '.'
      }

      const ruleopts = {
        globsAny: ['LICENSE*']
      }

      const actual = await fileExistence(mockfs, ruleopts)

      assert.strictEqual(actual.passed, true)
      assert.strictEqual(actual.targets.length, 1)
      assert.deepStrictEqual(actual.targets[0], {
        passed: true,
        path: 'LICENSE.md',
        message: 'Found file'
      })
    })

    it('returns a passed result if requested file exists case-insensitivly', async () => {
      /** @type {any} */
      const mockfs = {
        findFirstFile() {
          return 'LICENSE.md'
        },
        targetDir: '.'
      }

      const ruleopts = {
        globsAny: ['lIcEnSe*'],
        nocase: true
      }

      const actual = await fileExistence(mockfs, ruleopts)

      assert.strictEqual(actual.passed, true)
      assert.strictEqual(actual.targets.length, 1)
      assert.deepStrictEqual(actual.targets[0], {
        passed: true,
        path: 'LICENSE.md',
        message: 'Found file'
      })
    })

    it("returns a failure result if requested file doesn't exist", async () => {
      /** @type {any} */
      const mockfs = {
        findFirstFile() {},
        targetDir: '.'
      }

      const ruleopts = {
        globsAny: ['LICENSE*']
      }

      const actual = await fileExistence(mockfs, ruleopts)

      assert.strictEqual(actual.passed, false)
    })

    it("returns a failure result if requested file doesn't exist with a failure message", async () => {
      /** @type {any} */
      const mockfs = {
        findFirstFile() {},
        targetDir: '.'
      }

      const ruleopts = {
        globsAny: ['LICENSE*'],
        'fail-message': 'The license file should exist.'
      }

      const actual = await fileExistence(mockfs, ruleopts)

      assert.strictEqual(actual.passed, false)
      assert.strictEqual(actual.targets.length, 1)
      assert.strictEqual(actual.targets[0].pattern, ruleopts.globsAny[0])
      assert.ok(actual.message.includes(ruleopts['fail-message']))
    })
  })
})
