// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import FileSystem from '../../dist/lib/file-system.js'
import gitWorkingTree from '../../dist/rules/git-working-tree.js'

describe(
  'rule',
  () => {
    describe('git_working_tree', () => {
      it('passes if the specified directory is managed with Git', () => {
        const result = gitWorkingTree(new FileSystem(), {
          allowSubDir: false
        })

        assert.strictEqual(result.passed, true)
      })

      it('passes if the specified sub-directory is managed in Git and sub-directories are allowed', () => {
        const result = gitWorkingTree(new FileSystem('tests'), {
          allowSubDir: true
        })

        assert.strictEqual(result.passed, true)
      })

      it('fails if the specified sub-directory is managed in Git but sub-directories are not allowed', () => {
        const result = gitWorkingTree(new FileSystem('tests'), {
          allowSubDir: false
        })

        assert.strictEqual(result.passed, false)
      })

      it('fails if the specified directory is not managed in Git', () => {
        const result = gitWorkingTree(new FileSystem('/'), {
          allowSubDir: false
        })

        assert.strictEqual(result.passed, false)
      })
    })
  },
  { timeout: 5000 }
)
