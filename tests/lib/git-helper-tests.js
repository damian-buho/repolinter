// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { gitAllCommits } from '../../dist/lib/git-helper.js'
import { mktempRepo, commitEmpty, rmRepo } from './git-fixture.js'

describe('gitAllCommits', () => {
  describe('non-empty repo', () => {
    // Small enough to be fast on every CI runner, large enough that any
    // trailing-newline bug in the splitter would still show up as +1.
    const COMMIT_COUNT = 25
    let tmpdir

    before(() => {
      tmpdir = mktempRepo()
      for (let index = 0; index < COMMIT_COUNT; index++) {
        commitEmpty(tmpdir, `commit ${index}`)
      }
    })

    after(() => rmRepo(tmpdir))

    it('returns every commit reachable from any ref', () => {
      const actual = gitAllCommits(tmpdir)
      // Exact equality guards against the trailing-newline bug
      // (split('\n') used to leak a phantom '' entry).
      assert.equal(actual.length, COMMIT_COUNT)
      assert.ok(actual.every(sha => /^[0-9a-f]{40}$/.test(sha)))
      // All SHAs must be distinct — duplicate output would indicate a deeper
      // bug in the helper or in the upstream git invocation.
      assert.equal(new Set(actual).size, COMMIT_COUNT)
    })
  })

  describe('empty repo', () => {
    let tmpdir

    before(() => {
      tmpdir = mktempRepo()
    })

    after(() => rmRepo(tmpdir))

    it('returns [] when the repo has no commits', () => {
      assert.deepEqual(gitAllCommits(tmpdir), [])
    })
  })
})
