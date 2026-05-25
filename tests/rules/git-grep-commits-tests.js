// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, it, before, after, mock } from 'node:test'
import assert from 'node:assert/strict'
import FileSystem from '../../dist/lib/file_system.js'
import GitHelper from '../../dist/lib/git_helper.js'
import gitGrepCommits from '../../dist/rules/git-grep-commits.js'

describe('rule', () => {
  describe('git_grep_commits', () => {
    before(() => {
      const stubValue = [
        '3e66e3ec616d59f813bdb878e1146d03872a096e',
        'c9e1b59c86c119a5a67389ffd13d026c6058492a',
        '260f8cc14d6ecf0ff1f0162f88086143d813967a'
      ]

      mock.method(GitHelper, 'gitAllCommits', () => stubValue)
    })

    after(() => {
      mock.restoreAll()
    })

    const DIFF_CORRECT_CASE = String.raw`Copyright 2017 TODO Group\. All rights reserved\.`
    const DIFF_WRONG_CASE = String.raw`COPYRIGHT 2017 TODO GROUP\. ALL RIGHTS RESERVED\.`

    it('passes if the denylist pattern does not match any commit', () => {
      const ruleopts = {
        denylist: [DIFF_WRONG_CASE],
        ignoreCase: false
      }

      const actual = gitGrepCommits(new FileSystem(), ruleopts)

      assert.strictEqual(actual.passed, true)
      assert.ok(actual.message.includes(ruleopts.denylist[0]))
    })

    it('is backwards compatible with blacklist', () => {
      const ruleopts = {
        blacklist: [DIFF_WRONG_CASE],
        ignoreCase: false
      }

      const actual = gitGrepCommits(new FileSystem(), ruleopts)

      assert.strictEqual(actual.passed, true)
      assert.ok(actual.message.includes(ruleopts.blacklist[0]))
    })

    it('fails if the denylist pattern matches a commit', () => {
      const ruleopts = {
        denylist: [DIFF_CORRECT_CASE],
        ignoreCase: true
      }

      const actual = gitGrepCommits(new FileSystem(), ruleopts)

      assert.strictEqual(actual.passed, false)
      assert.ok(actual.targets.length > 0)
      for (const target of actual.targets) {
        assert.strictEqual(target.passed, false)
      }
      for (const target of actual.targets) {
        assert.ok(target.message.includes(ruleopts.denylist[0]))
      }
    })
  })
})
