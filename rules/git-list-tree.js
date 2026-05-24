// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { spawnSync } from 'child_process'
import Result from '../lib/result.js'
import GitHelper from '../lib/git_helper.js'

function gitFilesAtCommit(targetDir, commit) {
  const args = ['-C', targetDir, 'ls-tree', '-r', '--name-only', commit]
  return spawnSync('git', args).stdout.toString().split('\n')
}

function listFiles(fileSystem, options) {
  const files = []

  const pattern = new RegExp(
    '(' + options.denylist.join('|') + ')',
    options.ignoreCase ? 'i' : ''
  )
  const commits = GitHelper.gitAllCommits(fileSystem.targetDir)
  commits.forEach(commit => {
    const includedFiles = gitFilesAtCommit(fileSystem.targetDir, commit)
      .filter(file => file.match(pattern))
      .filter(file => fileSystem.shouldInclude(file))
    includedFiles.forEach(path => {
      const existingFile = files.find(f => f.path === path)
      if (existingFile) {
        existingFile.commits.push(commit)
      } else {
        files.push({ path: path, commits: [commit] })
      }
    })
  })

  return files
}

function gitListTree(fs, options) {
  options.denylist = options.denylist || options.blacklist

  const files = listFiles(fs, options)

  const targets = files.map(file => {
    const [firstCommit, ...rest] = file.commits
    const restMessage =
      rest.length > 0 ? `, and ${rest.length} more commits` : ''

    const message = [
      `denylisted path (${file.path}) found in commit ${firstCommit.substr(
        0,
        7
      )}${restMessage}.`,
      `\tdenylist: ${options.denylist.join(', ')}`
    ].join('\n')

    return {
      passed: false,
      path: file.path,
      message
    }
  })

  if (targets.length === 0) {
    const message = `No denylisted paths found in any commits.\n\tdenylist: ${options.denylist.join(
      ', '
    )}`
    return new Result(message, [], true)
  }

  return new Result('', targets, false)
}

export default gitListTree
