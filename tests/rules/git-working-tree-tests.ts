// SPDX-FileCopyrightText: 2017 TODO Group
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
//
// SPDX-License-Identifier: Apache-2.0

import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import FileSystem from '../../src/lib/file-system.js'
import gitWorkingTree from '../../src/rules/git-working-tree.js'
import {
  mktempRepository,
  commitFile,
  mktempPlainDirectory,
  rmRepository
} from '../lib/git-fixture.js'

describe(
  'rule',
  () => {
    describe('git_working_tree', () => {
      // Fixtures:
      //   repoDirectory  — a fresh git repo (root of a working tree)
      //   subdirectory   — a subdirectory inside that repo
      //   plainDirectory — a temp dir that is NOT a git repo
      let repositoryDirectory: string
      let subdirectory: string
      let plainDirectory: string

      before(() => {
        repositoryDirectory = mktempRepository()
        // Seed at least one commit so the working tree is in a normal state.
        commitFile(repositoryDirectory, 'README.md', '# fixture\n', 'init')
        subdirectory = path.join(repositoryDirectory, 'nested')
        fs.mkdirSync(subdirectory)
        plainDirectory = mktempPlainDirectory()
      })

      after(() => {
        rmRepository(repositoryDirectory)
        rmRepository(plainDirectory)
      })

      it('passes if the specified directory is managed with Git', () => {
        const result = gitWorkingTree(new FileSystem(repositoryDirectory), {
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
