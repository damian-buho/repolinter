// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { spawnSync } from 'node:child_process'

interface GitHelper {
  gitAllCommits(targetDirectory: string): string[]
}

const GitHelper: GitHelper = {
  gitAllCommits(targetDirectory: string): string[] {
    const arguments_ = ['-C', targetDirectory, 'rev-list', '--all']
    const result = spawnSync('git', arguments_)
    return (result.stdout?.toString() ?? '').split('\n')
  }
}

export default GitHelper
export const gitAllCommits = GitHelper.gitAllCommits
