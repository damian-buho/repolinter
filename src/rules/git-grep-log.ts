// SPDX-FileCopyrightText: 2017 TODO Group
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
//
// SPDX-License-Identifier: Apache-2.0

import { spawnSync } from 'node:child_process'
import type FileSystem from '../lib/file-system.js'
import Result from '../lib/result.js'
import { GIT_TIMEOUT_MS } from '../lib/git-helper.js'

interface GitGrepLogOptions {
  denylist?: string[]
  blacklist?: string[]
  ignoreCase?: boolean
}

interface CommitInfo {
  hash: string | undefined
  message: string
}

function grepLog(
  fileSystem: FileSystem,
  options: GitGrepLogOptions
): CommitInfo[] {
  const denylist = options.denylist ?? options.blacklist ?? []
  const arguments_ = [
    '-C',
    fileSystem.targetDirectory,
    'log',
    '--all',
    '--format=full',
    '-E',
    ...denylist.map(pattern => `--grep=${pattern}`)
  ]
  if (options.ignoreCase) {
    arguments_.push('-i')
  }
  const log = spawnSync('git', arguments_, {
    timeout: GIT_TIMEOUT_MS
  }).stdout.toString()
  return parseLog(log)
}

function parseLog(log: string): CommitInfo[] {
  const logEntries = log.split('\ncommit ').filter(x => !!x)

  return logEntries.map(entry => extractInfo(entry))
}

function extractInfo(commit: string): CommitInfo {
  const lines = commit.split('\n')
  const hash = lines[0]
  const message = lines.slice(3).join('\n')
  return {
    hash: (hash ?? '').split(' ', 2)[1],
    message
  }
}

function gitGrepLog(fs: FileSystem, options: GitGrepLogOptions): Result {
  options.denylist ||= options.blacklist

  const commits = grepLog(fs, options)

  const targets = commits.map(commit => {
    const message = [
      `The commit message for commit ${commit.hash?.slice(
        0,
        7
      )} contains denylisted words.\n`,
      `\tDenylist: ${options.denylist!.join(', ')}`
    ].join('\n')

    return {
      passed: false,
      message,
      path: commit.hash ?? ''
    }
  })

  if (targets.length === 0) {
    const message = `No denylisted words found in any commit messages.\n\tDenylist: ${options.denylist!.join(
      ', '
    )}`
    return new Result(message, [], true)
  }

  return new Result('', targets, false)
}

export default gitGrepLog
