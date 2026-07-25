// Copyright 2022 TODO Group. All rights reserved.
// SPDX-FileCopyrightText: 2017 TODO Group
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
//
// SPDX-License-Identifier: Apache-2.0

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import FileSystem from '../../src/lib/file-system.js'
import largeFile from '../../src/rules/large-file.js'

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
