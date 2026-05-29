// SPDX-FileCopyrightText: 2017 TODO Group.
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
// SPDX-License-Identifier: Apache-2.0

import { spawnSync } from 'node:child_process'

// What: bound every git subprocess so a garbled/mutated invocation can't block forever
// (e.g. git waiting on stdin or an index lock). Overridable so mutation testing can fail
// fast; the default keeps production safe on large repositories.
export const GIT_TIMEOUT_MS =
  Number(process.env.REPOLINTER_GIT_TIMEOUT_MS) || 30_000

interface GitHelper {
  gitAllCommits(targetDirectory: string): string[]
}

const GitHelper: GitHelper = {
  gitAllCommits(targetDirectory: string): string[] {
    const arguments_ = ['-C', targetDirectory, 'rev-list', '--all']
    const result = spawnSync('git', arguments_, { timeout: GIT_TIMEOUT_MS })
    // git output ends in '\n'; trim before split so we don't return a phantom '' entry
    const stdout = (result.stdout?.toString() ?? '').trimEnd()
    return stdout === '' ? [] : stdout.split('\n')
  }
}

export default GitHelper
export const gitAllCommits = GitHelper.gitAllCommits
