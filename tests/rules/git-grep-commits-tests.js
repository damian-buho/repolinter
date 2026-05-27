// SPDX-FileCopyrightText: 2017 TODO Group
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
//
// SPDX-License-Identifier: Apache-2.0

import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import FileSystem from '../../dist/lib/file-system.js'
import gitGrepCommits from '../../dist/rules/git-grep-commits.js'
import { mktempRepo, commitFile, rmRepo } from '../lib/git-fixture.js'

describe('rule', () => {
  describe('git_grep_commits', () => {
    // Fixture repo containing a known copyright line that the test patterns
    // target case-sensitively and case-insensitively.
    const NEEDLE = 'Copyright 2017 TODO Group. All rights reserved.'
    const NEEDLE_PATTERN = String.raw`Copyright 2017 TODO Group\. All rights reserved\.`
    const WRONG_CASE_PATTERN = String.raw`COPYRIGHT 2017 TODO GROUP\. ALL RIGHTS RESERVED\.`

    let tmpdir

    before(() => {
      tmpdir = mktempRepo()
      commitFile(
        tmpdir,
        'src/with-copyright.js',
        `// ${NEEDLE}\nexport const value = 1\n`,
        'add file with copyright'
      )
      commitFile(
        tmpdir,
        'src/plain.js',
        'export const other = 2\n',
        'add unrelated file'
      )
    })

    after(() => rmRepo(tmpdir))

    it('passes if the denylist pattern does not match any commit', () => {
      const ruleopts = {
        denylist: [WRONG_CASE_PATTERN],
        ignoreCase: false
      }

      const actual = gitGrepCommits(new FileSystem(tmpdir), ruleopts)

      assert.strictEqual(actual.passed, true)
      assert.ok(actual.message.includes(ruleopts.denylist[0]))
    })

    it('is backwards compatible with blacklist', () => {
      const ruleopts = {
        blacklist: [WRONG_CASE_PATTERN],
        ignoreCase: false
      }

      const actual = gitGrepCommits(new FileSystem(tmpdir), ruleopts)

      assert.strictEqual(actual.passed, true)
      assert.ok(actual.message.includes(ruleopts.blacklist[0]))
    })

    it('fails if the denylist pattern matches a commit', () => {
      const ruleopts = {
        denylist: [NEEDLE_PATTERN],
        ignoreCase: true
      }

      const actual = gitGrepCommits(new FileSystem(tmpdir), ruleopts)

      assert.strictEqual(actual.passed, false)
      assert.ok(actual.targets.length > 0)
      for (const target of actual.targets) {
        assert.strictEqual(target.passed, false)
        assert.ok(target.message.includes(ruleopts.denylist[0]))
      }
    })
  })
})
