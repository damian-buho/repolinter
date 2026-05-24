// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { spawnSync } from 'node:child_process'

interface GitHelper {
  gitAllCommits(targetDir: string): string[]
}

const GitHelper: GitHelper = {
  gitAllCommits(targetDir: string): string[] {
    const args = ['-C', targetDir, 'rev-list', '--all']
    const result = spawnSync('git', args)
    return (result.stdout?.toString() ?? '').split('\n')
  }
}

export default GitHelper
export const gitAllCommits = GitHelper.gitAllCommits
