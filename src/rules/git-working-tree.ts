// SPDX-FileCopyrightText: 2017 TODO Group
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
//
// SPDX-License-Identifier: Apache-2.0

import { spawnSync } from 'node:child_process'
import type FileSystem from '../lib/file-system.js'
import Result from '../lib/result.js'
import { GIT_TIMEOUT_MS } from '../lib/git-helper.js'

interface GitWorkingTreeOptions {
  allowSubDir?: boolean
}

function gitWorkingTree(
  fs: FileSystem,
  options: GitWorkingTreeOptions
): Result {
  const arguments_ = ['-C', fs.targetDirectory, 'rev-parse', '--show-prefix']
  const gitResult = spawnSync('git', arguments_, { timeout: GIT_TIMEOUT_MS })
  const result = new Result('', [], true)
  if (gitResult.status === 0) {
    const prefix = gitResult.stdout.toString().trim()
    if (!prefix) {
      result.message =
        'The directory is managed with Git, and it is the root directory.'
      return result
    }

    if (options.allowSubDir) {
      result.message = 'The sub-directory is managed with Git.'
      return result
    }
    result.message =
      'The sub-directory is managed with Git, but need to check the root directory.'
    result.passed = false
    return result
  }
  result.message = 'The directory is not managed with Git.'
  result.passed = false
  return result
}

export default gitWorkingTree
