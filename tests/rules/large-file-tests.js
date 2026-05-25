// Copyright 2022 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import FileSystem from '../../dist/lib/file_system.js'
import largeFile from '../../dist/rules/large-file.js'

describe('rule', () => {
  describe('largeFile', () => {
    it('returns a passed result if file is smaller than threshold size.', async () => {
      const ruleOptions = {
        globsAll: ['tests/rules/image_for_test.png'],
        size: 42_000
      }

      const actual = await largeFile(new FileSystem(), ruleOptions)

      assert.strictEqual(actual.passed, true)
    })

    it('returns a failure result if file is larger than threshold size.', async () => {
      const ruleOptions = {
        globsAll: ['tests/rules/image_for_test.png'],
        size: 40_000
      }

      const actual = await largeFile(new FileSystem(), ruleOptions)

      assert.strictEqual(actual.passed, false)
    })
  })
})
