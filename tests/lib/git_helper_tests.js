// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect } from 'chai'
import { gitAllCommits } from '../../lib/git_helper.js'
import FileSystem from '../../lib/file_system.js'

describe('gitAllCommits', () => {
  describe('git_grep_commits', function () {
    describe('full commits list', () => {
      it('#gitAllCommits should return full list (> 100) of gitrefs', () => {
        const actual = gitAllCommits(new FileSystem().targetDir)
        expect(actual).to.have.length.greaterThan(100)
      })
    })
  })
})
