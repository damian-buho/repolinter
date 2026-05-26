// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

// Hermetic git fixture helpers — tests build their own repos under $TMPDIR so
// they never depend on the host repo's history (which is fragile across forks,
// rebases, shallow clones, and runner-global gitconfig).

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

// Ignore /etc/gitconfig and ~/.gitconfig so runner-global hooks, signing keys,
// safe.directory, or core.hooksPath cannot interfere with test commits.
const HERMETIC_ENV = {
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_AUTHOR_NAME: 'Repolinter Test',
  GIT_AUTHOR_EMAIL: 'test@example.com',
  GIT_COMMITTER_NAME: 'Repolinter Test',
  GIT_COMMITTER_EMAIL: 'test@example.com'
}

export function git(cwd, ...arguments_) {
  return gitWithEnvironment(cwd, arguments_, {})
}

// Internal — allows per-call env overrides (used to vary commit author).
function gitWithEnvironment(cwd, arguments_, extraEnvironment) {
  const result = spawnSync('git', ['-C', cwd, ...arguments_], {
    encoding: 'utf8',
    env: { ...process.env, ...HERMETIC_ENV, ...extraEnvironment }
  })
  if (result.status !== 0) {
    throw new Error(
      `git ${arguments_.join(' ')} in ${cwd} failed (status=${result.status}): ${
        result.stderr || result.stdout
      }`
    )
  }
  return result.stdout
}

// Build an empty git repo in a fresh temp dir and return its path.
export function mktempRepo() {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'repolinter-fixture-')
  )
  git(directory, 'init', '-q', '-b', 'main')
  // Local-level guards — second line of defence on top of HERMETIC_ENV in case
  // an exotic git build still picks up some global state.
  git(directory, 'config', 'commit.gpgsign', 'false')
  git(directory, 'config', 'core.hooksPath', '/dev/null')
  return directory
}

// Write `content` at `relativePath` inside `repoDirectory` and commit it.
// Creates intermediate directories as needed.
export function commitFile(repoDirectory, relativePath, content, message) {
  const full = path.join(repoDirectory, relativePath)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content)
  git(repoDirectory, 'add', '--', relativePath)
  git(repoDirectory, 'commit', '--no-verify', '-q', '-m', message)
}

// Empty commit — cheap way to grow the rev-list count without touching files.
export function commitEmpty(repoDirectory, message) {
  git(
    repoDirectory,
    'commit',
    '--allow-empty',
    '--no-verify',
    '-q',
    '-m',
    message
  )
}

// Empty commit attributed to a specific author. Used by tests that exercise
// commit-history aggregation (e.g. contributor counting).
export function commitEmptyAs(repoDirectory, message, authorName) {
  const email = `${authorName.toLowerCase().replaceAll(' ', '.')}@example.com`
  gitWithEnvironment(
    repoDirectory,
    ['commit', '--allow-empty', '--no-verify', '-q', '-m', message],
    {
      GIT_AUTHOR_NAME: authorName,
      GIT_AUTHOR_EMAIL: email,
      GIT_COMMITTER_NAME: authorName,
      GIT_COMMITTER_EMAIL: email
    }
  )
}

export function rmRepo(directory) {
  fs.rmSync(directory, { recursive: true, force: true })
}

// Make a throwaway directory that is NOT a git repo — used to assert
// "not-a-git-repo" code paths without leaning on filesystem root.
export function mktempPlainDirectory() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'repolinter-nogit-'))
}
