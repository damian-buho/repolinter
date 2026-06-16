// SPDX-FileCopyrightText: 2017 TODO Group
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
//
// SPDX-License-Identifier: Apache-2.0

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fileRemove from '../../dist/fixes/file-remove.js'

describe('fixes', () => {
  describe('file-remove', () => {
    it('removes a file', async () => {
      const removePaths = []
      /** @type {any} */
      const mockFs = {
        removeFile(path) {
          removePaths.push(path)
        }
      }

      const result = await fileRemove(mockFs, {}, ['myfile'], false)
      assert.strictEqual(result.passed, true)
      assert.strictEqual(result.targets.length, 1)
      assert.strictEqual(result.targets[0].passed, true)
      assert.strictEqual(result.targets[0].path, 'myfile')
      assert.deepStrictEqual(removePaths, ['myfile'])
    })

    it('does nothing if dryRun is true', async () => {
      const removePaths = []
      /** @type {any} */
      const mockFs = {
        removeFile(path) {
          removePaths.push(path)
        }
      }

      const result = await fileRemove(mockFs, {}, ['myfile'], true)
      assert.strictEqual(result.passed, true)
      assert.strictEqual(result.targets.length, 1)
      assert.strictEqual(result.targets[0].passed, true)
      assert.strictEqual(result.targets[0].path, 'myfile')
      assert.deepStrictEqual(removePaths, [])
    })

    it('removes multiple files', async () => {
      const removePaths = []
      /** @type {any} */
      const mockFs = {
        removeFile(path) {
          removePaths.push(path)
        }
      }

      const result = await fileRemove(
        mockFs,
        {},
        ['myfile', 'otherfile'],
        false
      )
      assert.strictEqual(result.passed, true)
      assert.strictEqual(result.targets.length, 2)
      assert.strictEqual(result.targets[0].passed, true)
      assert.strictEqual(result.targets[0].path, 'myfile')
      assert.strictEqual(result.targets[1].passed, true)
      assert.strictEqual(result.targets[1].path, 'otherfile')
      assert.deepStrictEqual(removePaths, ['myfile', 'otherfile'])
    })

    it('uses the glob option', async () => {
      const removePaths = []
      /** @type {any} */
      const mockFs = {
        removeFile(path) {
          removePaths.push(path)
        },
        findAllFiles: () => ['myfile.txt']
      }

      const result = await fileRemove(
        mockFs,
        { globsAll: ['myfile'] },
        [],
        false
      )
      assert.strictEqual(result.passed, true)
      assert.strictEqual(result.targets.length, 1)
      assert.strictEqual(result.targets[0].passed, true)
      assert.strictEqual(result.targets[0].path, 'myfile.txt')
      assert.deepStrictEqual(removePaths, ['myfile.txt'])
    })

    it('overrides targets with the glob option', async () => {
      const removePaths = []
      /** @type {any} */
      const mockFs = {
        removeFile(path) {
          removePaths.push(path)
        },
        findAllFiles: () => ['myfile.txt']
      }

      const result = await fileRemove(
        mockFs,
        { globsAll: ['myfile'] },
        ['otherfile'],
        false
      )
      assert.strictEqual(result.passed, true)
      assert.strictEqual(result.targets.length, 1)
      assert.strictEqual(result.targets[0].passed, true)
      assert.strictEqual(result.targets[0].path, 'myfile.txt')
      assert.deepStrictEqual(removePaths, ['myfile.txt'])
    })

    it('returns failure if no files are found', async () => {
      /** @type {any} */
      const mockFs = {}

      const result = await fileRemove(mockFs, {}, [], false)
      assert.strictEqual(result.passed, false)
      assert.strictEqual(result.targets.length, 0)
    })
  })
})
