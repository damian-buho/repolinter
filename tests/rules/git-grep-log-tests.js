// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import FileSystem from '../../dist/lib/file-system.js'
import gitGrepLog from '../../dist/rules/git-grep-log.js'

describe(
  'rule',
  () => {
    describe('git_grep_log', () => {
      const LOG_WRONG_CASE =
        'THE GIT RULESET CONTAINS TWO NEW RULES THAT SEARCH THE COMMIT MESSAGES'

      it('passes if the denylist pattern does not match any commit message', () => {
        const ruleopts = {
          denylist: [LOG_WRONG_CASE],
          ignoreCase: false
        }

        const actual = gitGrepLog(new FileSystem(), ruleopts)

        assert.strictEqual(actual.passed, true)
        assert.strictEqual(actual.targets.length, 0)
        assert.ok(actual.message.includes(ruleopts.denylist[0]))
      })

      it('is backwards compatible with blacklist', () => {
        const ruleopts = {
          blacklist: [LOG_WRONG_CASE],
          ignoreCase: false
        }

        const actual = gitGrepLog(new FileSystem(), ruleopts)

        assert.strictEqual(actual.passed, true)
        assert.strictEqual(actual.targets.length, 0)
        assert.ok(actual.message.includes(ruleopts.blacklist[0]))
      })

      it('fails if the denylist pattern matches a commit message', () => {
        const ruleopts = {
          denylist: [LOG_WRONG_CASE],
          ignoreCase: true
        }

        const actual = gitGrepLog(new FileSystem(), ruleopts)

        assert.strictEqual(actual.passed, false)
        assert.strictEqual(actual.targets.length, 1)
        assert.strictEqual(actual.targets[0].passed, false)
        assert.ok(actual.targets[0].message.includes(ruleopts.denylist[0]))
      })
    })
  },
  { timeout: 30_000 }
)
