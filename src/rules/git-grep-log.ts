// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { spawnSync } from 'child_process'
import type FileSystem from '../lib/file_system.js'
import Result from '../lib/result.js'

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
  const args = [
    '-C',
    fileSystem.targetDir,
    'log',
    '--all',
    '--format=full',
    '-E',
    ...denylist.map(pattern => `--grep=${pattern}`)
  ]
  if (options.ignoreCase) {
    args.push('-i')
  }
  const log = spawnSync('git', args).stdout.toString()
  return parseLog(log)
}

function parseLog(log: string): CommitInfo[] {
  const logEntries = log.split('\ncommit ').filter(x => !!x)

  return logEntries.map(entry => extractInfo(entry))
}

function extractInfo(commit: string): CommitInfo {
  const [hash, , , ...message] = commit.split('\n')
  return {
    hash: (hash ?? '').split(' ')[1],
    message: message.join('\n')
  }
}

function gitGrepLog(fs: FileSystem, options: GitGrepLogOptions): Result {
  options.denylist = options.denylist || options.blacklist

  const commits = grepLog(fs, options)

  const targets = commits.map(commit => {
    const message = [
      `The commit message for commit ${commit.hash?.substr(
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
