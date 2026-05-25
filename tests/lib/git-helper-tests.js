// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { gitAllCommits } from '../../dist/lib/git-helper.js'
import FileSystem from '../../dist/lib/file-system.js'

describe('gitAllCommits', () => {
  describe('git_grep_commits', () => {
    describe('full commits list', () => {
      it('#gitAllCommits should return full list (> 100) of gitrefs', () => {
        const actual = gitAllCommits(new FileSystem().targetDirectory)
        assert.ok(actual.length > 100)
      })
    })
  })
})
