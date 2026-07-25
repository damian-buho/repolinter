// SPDX-FileCopyrightText: 2017 TODO Group
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
//
// SPDX-License-Identifier: Apache-2.0

import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import FileSystem from '../../src/lib/file-system.js'
import gitGrepLog from '../../src/rules/git-grep-log.js'
import { mktempRepo, commitFile, rmRepo } from '../lib/git-fixture.js'

describe(
  'rule',
  () => {
    describe('git_grep_log', () => {
      // The needle lives in a commit message; an unrelated commit ensures we
      // can also assert non-matching paths return zero targets.
      const NEEDLE =
        'The git ruleset contains two new rules that search the commit messages'
      const WRONG_CASE =
        'THE GIT RULESET CONTAINS TWO NEW RULES THAT SEARCH THE COMMIT MESSAGES'

      let tmpdir: string

      before(() => {
        tmpdir = mktempRepo()
        commitFile(tmpdir, 'a.txt', 'hello\n', NEEDLE)
        commitFile(tmpdir, 'b.txt', 'world\n', 'unrelated commit message')
      })

      after(() => rmRepo(tmpdir))

      it('passes if the denylist pattern does not match any commit message', () => {
        const ruleopts = {
          denylist: [WRONG_CASE],
          ignoreCase: false
        }

        const actual = gitGrepLog(new FileSystem(tmpdir), ruleopts)

        assert.strictEqual(actual.passed, true)
        assert.strictEqual(actual.targets.length, 0)
        assert.ok(actual.message.includes(ruleopts.denylist[0]))
      })

      it('is backwards compatible with blacklist', () => {
        const ruleopts = {
          blacklist: [WRONG_CASE],
          ignoreCase: false
        }

        const actual = gitGrepLog(new FileSystem(tmpdir), ruleopts)

        assert.strictEqual(actual.passed, true)
        assert.strictEqual(actual.targets.length, 0)
        assert.ok(actual.message.includes(ruleopts.blacklist[0]))
      })

      it('fails if the denylist pattern matches a commit message', () => {
        const ruleopts = {
          denylist: [WRONG_CASE],
          ignoreCase: true
        }

        const actual = gitGrepLog(new FileSystem(tmpdir), ruleopts)

        assert.strictEqual(actual.passed, false)
        assert.strictEqual(actual.targets.length, 1)
        assert.strictEqual(actual.targets[0].passed, false)
        assert.ok(actual.targets[0].message.includes(ruleopts.denylist[0]))
      })
    })
  },
  { timeout: 30_000 }
)
