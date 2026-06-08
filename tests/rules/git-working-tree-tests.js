// SPDX-FileCopyrightText: 2017 TODO Group
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
//
// SPDX-License-Identifier: Apache-2.0

import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import FileSystem from '../../dist/lib/file-system.js'
import gitWorkingTree from '../../dist/rules/git-working-tree.js'
import {
  mktempRepo,
  commitFile,
  mktempPlainDirectory,
  rmRepo
} from '../lib/git-fixture.js'

describe(
  'rule',
  () => {
    describe('git_working_tree', () => {
      // Fixtures:
      //   repoDirectory  — a fresh git repo (root of a working tree)
      //   subdirectory   — a subdirectory inside that repo
      //   plainDirectory — a temp dir that is NOT a git repo
      let repoDirectory, subdirectory, plainDirectory

      before(() => {
        repoDirectory = mktempRepo()
        // Seed at least one commit so the working tree is in a normal state.
        commitFile(repoDirectory, 'README.md', '# fixture\n', 'init')
        subdirectory = path.join(repoDirectory, 'nested')
        fs.mkdirSync(subdirectory)
        plainDirectory = mktempPlainDirectory()
      })

      after(() => {
        rmRepo(repoDirectory)
        rmRepo(plainDirectory)
      })

      it('passes if the specified directory is managed with Git', () => {
        const result = gitWorkingTree(new FileSystem(repoDirectory), {
          allowSubDir: false
        })

        assert.strictEqual(result.passed, true)
      })

      it('passes if the specified sub-directory is managed in Git and sub-directories are allowed', () => {
        const result = gitWorkingTree(new FileSystem(subdirectory), {
          allowSubDir: true
        })

        assert.strictEqual(result.passed, true)
      })

      it('fails if the specified sub-directory is managed in Git but sub-directories are not allowed', () => {
        const result = gitWorkingTree(new FileSystem(subdirectory), {
          allowSubDir: false
        })

        assert.strictEqual(result.passed, false)
      })

      it('fails if the specified directory is not managed in Git', () => {
        const result = gitWorkingTree(new FileSystem(plainDirectory), {
          allowSubDir: false
        })

        assert.strictEqual(result.passed, false)
      })
    })
  },
  { timeout: 5000 }
)
