// SPDX-FileCopyrightText: 2017 TODO Group
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
//
// SPDX-License-Identifier: Apache-2.0

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fileTypeExclusion from '../../src/rules/file-type-exclusion.js'

describe('rule', () => {
  describe('file_type_exclusion', () => {
    it("returns passed result if requested file type doesn't exist", async () => {
      /**
      @type {any}
      */
      const mockfs = {
        findAll: (): string[] => [],
        targetDir: '.'
      }

      const ruleopts = {
        type: ['*.dll']
      }

      const actual = await fileTypeExclusion(mockfs, ruleopts)

      assert.strictEqual(actual.passed, true)
    })

    it('returns failed result if requested file type exists', async () => {
      /**
      @type {any}
      */
      const mockfs = {
        findAll: (): string[] => ['foo.dll'],
        targetDir: '.'
      }

      const ruleopts = {
        type: ['*.dll']
      }

      const actual = await fileTypeExclusion(mockfs, ruleopts)

      assert.strictEqual(actual.passed, false)
      assert.strictEqual(actual.targets.length, 1)
      assert.strictEqual(actual.targets[0].passed, false)
      assert.strictEqual(actual.targets[0].path, 'foo.dll')
    })
  })
})
