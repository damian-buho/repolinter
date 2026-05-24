// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { spawnSync } from 'child_process'

const GitHelper = {
  gitAllCommits(targetDir) {
    const args = ['-C', targetDir, 'rev-list', '--all']
    return spawnSync('git', args).stdout.toString().split('\n')
  }
}

export default GitHelper
export const gitAllCommits = GitHelper.gitAllCommits
