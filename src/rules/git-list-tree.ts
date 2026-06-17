// SPDX-FileCopyrightText: 2017 TODO Group
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
//
// SPDX-License-Identifier: Apache-2.0

import { spawnSync } from 'node:child_process'
import type FileSystem from '../lib/file-system.js'
import Result from '../lib/result.js'
import GitHelper, { GIT_TIMEOUT_MS } from '../lib/git-helper.js'

interface GitListTreeOptions {
  denylist?: string[]
  blacklist?: string[]
  ignoreCase?: boolean
}

interface FileEntry {
  path: string
  commits: string[]
}

function gitFilesAtCommit(targetDirectory: string, commit: string): string[] {
  const arguments_ = [
    '-C',
    targetDirectory,
    'ls-tree',
    '-r',
    '--name-only',
    commit
  ]
  return spawnSync('git', arguments_, { timeout: GIT_TIMEOUT_MS })
    .stdout.toString()
    .split('\n')
}

function listFiles(
  fileSystem: FileSystem,
  options: GitListTreeOptions
): FileEntry[] {
  const files: FileEntry[] = []

  const denylist = options.denylist ?? options.blacklist ?? []
  const pattern = new RegExp(
    '(' + denylist.join('|') + ')',
    options.ignoreCase ? 'i' : ''
  )
  const commits = GitHelper.gitAllCommits(fileSystem.targetDirectory)
  for (const commit of commits) {
    const includedFiles = gitFilesAtCommit(fileSystem.targetDirectory, commit)
      .filter(file => file.match(pattern))
      .filter(file => fileSystem.shouldInclude(file))
    for (const filePath of includedFiles) {
      const existingFile = files.find(f => f.path === filePath)
      if (existingFile) {
        existingFile.commits.push(commit)
      } else {
        files.push({ path: filePath, commits: [commit] })
      }
    }
  }

  return files
}

function gitListTree(fs: FileSystem, options: GitListTreeOptions): Result {
  options.denylist ||= options.blacklist
  if (!options.denylist || options.denylist.length === 0) {
    return new Result(
      'No denylisted paths configured, all files pass',
      [],
      true
    )
  }

  const files = listFiles(fs, options)

  const targets = files.map(file => {
    const [firstCommit, ...rest] = file.commits
    const restMessage =
      rest.length > 0 ? `, and ${rest.length} more commits` : ''

    const message = [
      `denylisted path (${file.path}) found in commit ${firstCommit!.slice(
        0,
        7
      )}${restMessage}.`,
      `\tdenylist: ${options.denylist!.join(', ')}`
    ].join('\n')

    return {
      passed: false,
      path: file.path,
      message
    }
  })

  if (targets.length === 0) {
    const message = `No denylisted paths found in any commits.\n\tdenylist: ${options.denylist!.join(
      ', '
    )}`
    return new Result(message, [], true)
  }

  return new Result('', targets, false)
}

export default gitListTree
