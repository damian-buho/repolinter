// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { spawnSync } from 'child_process'
import type FileSystem from '../lib/file_system.js'
import Result from '../lib/result.js'
import GitHelper from '../lib/git_helper.js'

interface GitGrepCommitsOptions {
  denylist?: string[]
  blacklist?: string[]
  ignoreCase?: boolean
}

interface LineEntry {
  path: string
  content: string
}

interface CommitWithLines {
  hash: string
  lines: LineEntry[]
}

interface FileWithCommits {
  path: string
  commits: Array<{ hash: string; lines: string[] }>
}

function listCommitsWithLines(
  fileSystem: FileSystem,
  options: GitGrepCommitsOptions
): CommitWithLines[] {
  const denylist = options.denylist ?? options.blacklist ?? []
  const pattern = '(' + denylist.join('|') + ')'

  const commits = GitHelper.gitAllCommits(fileSystem.targetDir)
  return commits
    .map(commit => {
      return {
        hash: commit,
        lines: gitLinesAtCommit(
          fileSystem.targetDir,
          pattern,
          !!options.ignoreCase,
          commit
        ).filter(line => fileSystem.shouldInclude(line.path))
      }
    })
    .filter(commit => commit.lines.length > 0)
}

function gitGrep(
  targetDir: string,
  pattern: string,
  ignoreCase: boolean,
  commit: string
): string[] {
  const args = [
    '-C',
    targetDir,
    'grep',
    '-E',
    ignoreCase ? '-i' : '',
    pattern,
    commit
  ]
  return spawnSync('git', args)
    .stdout.toString()
    .split('\n')
    .filter(x => !!x)
}

function gitLinesAtCommit(
  targetDir: string,
  pattern: string,
  ignoreCase: boolean,
  commit: string
): LineEntry[] {
  const lines = gitGrep(targetDir, pattern, ignoreCase, commit).map(entry => {
    const [filePath, ...rest] = entry.substring(commit.length + 1).split(':')
    return { path: filePath!, content: rest.join(':') }
  })

  return lines
}

function listFiles(
  fileSystem: FileSystem,
  options: GitGrepCommitsOptions
): FileWithCommits[] {
  const files: FileWithCommits[] = []

  const commits = listCommitsWithLines(fileSystem, options)
  commits.forEach(commit => {
    commit.lines.forEach(line => {
      const existingFile = files.find(f => f.path === line.path)

      if (existingFile) {
        const existingCommit = existingFile.commits.find(
          c => c.hash === commit.hash
        )

        if (existingCommit) {
          existingCommit.lines.push(line.content)
        } else {
          existingFile.commits.push({
            hash: commit.hash,
            lines: [line.content]
          })
        }
      } else {
        files.push({
          path: line.path,
          commits: [{ hash: commit.hash, lines: [line.content] }]
        })
      }
    })
  })

  return files
}

function gitGrepCommits(
  fs: FileSystem,
  options: GitGrepCommitsOptions
): Result {
  options.denylist = options.denylist || options.blacklist

  const files = listFiles(fs, options)
  const targets = files.map(file => {
    const [firstCommit, ...rest] = file.commits
    const restMessage =
      rest.length > 0 ? `, and ${rest.length} more commits` : ''

    const message = [
      `(${
        file.path
      }) contains denylisted words in commit ${firstCommit!.hash.substr(
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
    const message = [
      'No denylisted words found in any commits.',
      `\tdenylist: ${options.denylist!.join(', ')}`
    ].join('\n')
    return new Result(message, [], true)
  }

  return new Result('', targets, false)
}

export default gitGrepCommits
