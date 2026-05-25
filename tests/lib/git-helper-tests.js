// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { gitAllCommits } from '../../dist/lib/git-helper.js'

function git(cwd, ...arguments_) {
  const result = spawnSync('git', ['-C', cwd, ...arguments_], {
    encoding: 'utf8'
  })
  if (result.status !== 0) {
    throw new Error(
      `git ${arguments_.join(' ')} failed: ${result.stderr || result.stdout}`
    )
  }
  return result.stdout
}

// Build a throwaway repo so the test owns its fixture and does not depend on
// the host repo's history (shallow CI clones used to break the > 100 assertion).
function initRepo() {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'repolinter-git-helper-')
  )
  git(directory, 'init', '-q', '-b', 'main')
  git(directory, 'config', 'user.email', 'test@example.com')
  git(directory, 'config', 'user.name', 'Test')
  git(directory, 'config', 'commit.gpgsign', 'false')
  return directory
}

describe('gitAllCommits', () => {
  describe('full commits list', () => {
    const COMMIT_COUNT = 105
    let tmpdir

    before(() => {
      tmpdir = initRepo()
      for (let index = 0; index < COMMIT_COUNT; index++) {
        git(tmpdir, 'commit', '--allow-empty', '-q', '-m', `commit ${index}`)
      }
    })

    after(() => {
      fs.rmSync(tmpdir, { recursive: true, force: true })
    })

    it('returns every commit reachable from any ref', () => {
      const actual = gitAllCommits(tmpdir)
      // Exact equality also guards against the trailing-newline bug
      // (split('\n') used to leak a phantom '' entry).
      assert.equal(actual.length, COMMIT_COUNT)
      assert.ok(actual.every(sha => /^[0-9a-f]{40}$/.test(sha)))
    })
  })

  describe('empty repo', () => {
    let tmpdir

    before(() => {
      tmpdir = initRepo()
    })

    after(() => {
      fs.rmSync(tmpdir, { recursive: true, force: true })
    })

    it('returns [] when the repo has no commits', () => {
      assert.deepEqual(gitAllCommits(tmpdir), [])
    })
  })
})
