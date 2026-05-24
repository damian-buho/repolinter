// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { spawnSync } from 'child_process'
import Result from '../lib/result.js'

function grepLog(fileSystem, options) {
  const args = [
    '-C',
    fileSystem.targetDir,
    'log',
    '--all',
    '--format=full',
    '-E',
    ...options.denylist.map(pattern => `--grep=${pattern}`)
  ]
  if (options.ignoreCase) {
    args.push('-i')
  }
  const log = spawnSync('git', args).stdout.toString()
  return parseLog(log)
}

function parseLog(log) {
  const logEntries = log.split('\ncommit ').filter(x => !!x)

  return logEntries.map(entry => extractInfo(entry))
}

function extractInfo(commit) {
  const [hash, , , ...message] = commit.split('\n')
  return {
    hash: hash.split(' ')[1],
    message: message.join('\n')
  }
}

function gitGrepLog(fs, options) {
  options.denylist = options.denylist || options.blacklist

  const commits = grepLog(fs, options)

  const targets = commits.map(commit => {
    const message = [
      `The commit message for commit ${commit.hash.substr(
        0,
        7
      )} contains denylisted words.\n`,
      `\tDenylist: ${options.denylist.join(', ')}`
    ].join('\n')

    return {
      passed: false,
      message,
      path: commit
    }
  })

  if (targets.length === 0) {
    const message = `No denylisted words found in any commit messages.\n\tDenylist: ${options.denylist.join(
      ', '
    )}`
    return new Result(message, [], true)
  }

  return new Result('', targets, false)
}

export default gitGrepLog
