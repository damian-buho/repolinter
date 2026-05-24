// Copyright 2022 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect } from 'chai'
import FileSystem from '../../lib/file_system.js'
import largeFile from '../../rules/large-file.js'

describe('rule', () => {
  describe('largeFile', () => {
    it('returns a passed result if file is smaller than threshold size.', async () => {
      const ruleOptions = {
        // file size ~41KB
        globsAll: ['tests/rules/image_for_test.png'],
        size: 42000
      }

      const actual = await largeFile(new FileSystem(), ruleOptions)

      expect(actual.passed).to.equal(true)
    })

    it('returns a failure result if file is larger than threshold size.', async () => {
      const ruleOptions = {
        // file size ~41KB
        globsAll: ['tests/rules/image_for_test.png'],
        size: 40000
      }

      const actual = await largeFile(new FileSystem(), ruleOptions)

      expect(actual.passed).to.equal(false)
    })
  })
})
