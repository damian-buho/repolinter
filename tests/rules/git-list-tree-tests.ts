// SPDX-FileCopyrightText: 2017 TODO Group
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
//
// SPDX-License-Identifier: Apache-2.0

import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import FileSystem from '../../src/lib/file-system.js'
import gitListTree from '../../src/rules/git-list-tree.js'
import { mktempRepo, commitFile, rmRepo } from '../lib/git-fixture.js'

describe('rule', () => {
  describe('git_list_tree', () => {
    // Fixture repo with a path that the case-insensitive test pattern matches
    // and a sibling path that nothing should match.
    const TARGET_PATH = 'rules/git-list-tree.js'
    const PATTERN_WRONG_CASE = String.raw`rules/git-list-TREE\.js`

    let tmpdir: string

    before(() => {
      tmpdir = mktempRepo()
      commitFile(
        tmpdir,
        TARGET_PATH,
        '// fixture file for git-list-tree rule\n',
        'add target file'
      )
      commitFile(
        tmpdir,
        'rules/other.js',
        '// unrelated\n',
        'add unrelated file'
      )
    })

    after(() => rmRepo(tmpdir))

    it('passes if the denylist pattern does not match any path', () => {
      const ruleopts = {
        denylist: [PATTERN_WRONG_CASE],
        ignoreCase: false
      }

      const actual = gitListTree(new FileSystem(tmpdir), ruleopts)

      assert.strictEqual(actual.passed, true)
      assert.strictEqual(actual.targets.length, 0)
    })

    it('is backwards compatible with blacklist', () => {
      const ruleopts = {
        blacklist: [PATTERN_WRONG_CASE],
        ignoreCase: false
      }

      const actual = gitListTree(new FileSystem(tmpdir), ruleopts)

      assert.strictEqual(actual.passed, true)
      assert.strictEqual(actual.targets.length, 0)
    })

    it('fails if the denylist pattern matches a path', () => {
      const ruleopts = {
        denylist: [PATTERN_WRONG_CASE],
        ignoreCase: true
      }

      const actual = gitListTree(new FileSystem(tmpdir), ruleopts)

      assert.strictEqual(actual.passed, false)
      assert.ok(actual.targets.length > 0)
      for (const target of actual.targets) {
        assert.strictEqual(target.passed, false)
        assert.ok(target.message.includes(ruleopts.denylist[0]))
      }
    })
  })
})
