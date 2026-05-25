// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, it, before, after, mock } from 'node:test'
import assert from 'node:assert/strict'
import FileSystem from '../../dist/lib/file-system.js'
import GitHelper from '../../dist/lib/git-helper.js'
import gitListTree from '../../dist/rules/git-list-tree.js'

describe('rule', () => {
  describe('git_list_tree', () => {
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

    const PATH_WRONG_CASE = String.raw`rules/git-list-TREE\.js`

    it('passes if the denylist pattern does not match any path', () => {
      const ruleopts = {
        denylist: [PATH_WRONG_CASE],
        ignoreCase: false
      }

      const actual = gitListTree(new FileSystem(), ruleopts)

      assert.strictEqual(actual.passed, true)
      assert.strictEqual(actual.targets.length, 0)
    })

    it('is backwards compatible with blacklist', () => {
      const ruleopts = {
        blacklist: [PATH_WRONG_CASE],
        ignoreCase: false
      }

      const actual = gitListTree(new FileSystem(), ruleopts)

      assert.strictEqual(actual.passed, true)
      assert.strictEqual(actual.targets.length, 0)
    })

    it('fails if the denylist pattern matches a path', () => {
      const ruleopts = {
        denylist: [PATH_WRONG_CASE],
        ignoreCase: true
      }

      const actual = gitListTree(new FileSystem(), ruleopts)

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
