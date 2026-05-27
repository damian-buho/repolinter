// SPDX-FileCopyrightText: 2017 TODO Group.
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
// SPDX-License-Identifier: Apache-2.0

import { spawnSync } from 'node:child_process'

interface GitHelper {
  gitAllCommits(targetDirectory: string): string[]
}

const GitHelper: GitHelper = {
  gitAllCommits(targetDirectory: string): string[] {
    const arguments_ = ['-C', targetDirectory, 'rev-list', '--all']
    const result = spawnSync('git', arguments_)
    // git output ends in '\n'; trim before split so we don't return a phantom '' entry
    const stdout = (result.stdout?.toString() ?? '').trimEnd()
    return stdout === '' ? [] : stdout.split('\n')
  }
}

export default GitHelper
export const gitAllCommits = GitHelper.gitAllCommits
