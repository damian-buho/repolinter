// SPDX-FileCopyrightText: 2017 TODO Group
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
//
// SPDX-License-Identifier: Apache-2.0

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fileNotExists from '../../src/rules/file-not-exists.js'

describe('rule', () => {
  describe('files_not_exists', () => {
    it('returns a passed result if no files exist', async () => {
      /** @type {any} */
      const mockfs = {
        findAllFiles: (): string[] => [],
        targetDir: '.'
      }

      const ruleopts = {
        globsAll: ['LICENSE*']
      }

      const actual = await fileNotExists(mockfs, ruleopts)

      assert.strictEqual(actual.passed, true)
      assert.strictEqual(actual.targets.length, 1)
      assert.strictEqual(actual.targets[0].pattern, ruleopts.globsAll[0])
    })

    it('returns a passed result if no directories or files exist', async () => {
      /** @type {any} */
      const mockfs = {
        findAll: (): string[] => [],
        targetDir: '.'
      }

      const ruleopts = {
        globsAll: ['LICENSE*'],
        dirs: true
      }

      const actual = await fileNotExists(mockfs, ruleopts)

      assert.strictEqual(actual.passed, true)
      assert.strictEqual(actual.targets.length, 1)
      assert.strictEqual(actual.targets[0].pattern, ruleopts.globsAll[0])
    })

    it('returns a failure result if requested file exists', async () => {
      /** @type {any} */
      const mockfs = {
        findAllFiles: (): string[] => ['somefile'],
        targetDir: '.'
      }

      const ruleopts = {
        globsAll: ['LICENSE*']
      }

      const actual = await fileNotExists(mockfs, ruleopts)

      assert.strictEqual(actual.passed, false)
      assert.strictEqual(actual.targets.length, 1)
      assert.deepStrictEqual(actual.targets[0], {
        passed: false,
        path: 'somefile'
      })
    })

    it("returns a pass result if requested file doesn't exist with a pass message", async () => {
      /** @type {any} */
      const mockfs = {
        findAllFiles: (): string[] => [],
        targetDir: '.'
      }

      const ruleopts = {
        globsAll: ['LICENSE*'],
        'pass-message': 'The license file should exist.'
      }

      const actual = await fileNotExists(mockfs, ruleopts)

      assert.strictEqual(actual.passed, true)
      assert.strictEqual(actual.targets.length, 1)
      assert.strictEqual(actual.targets[0].pattern, ruleopts.globsAll[0])
      assert.ok(actual.message.includes(ruleopts['pass-message']))
    })
  })
})
