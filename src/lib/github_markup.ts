// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { commandExists } from './command_exists.js'
import { spawnSync } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

class GitHubMarkup {
  async renderMarkup(targetFile: string): Promise<string | null> {
    const command = await commandExists(['github-markup'])
    if (command === null) {
      throw new Error('GitHub markup not installed')
    }
    const gitHubMarkupRes = spawnSync(
      `${__dirname}/github_markup_check_and_render`,
      [targetFile]
    )
    if (gitHubMarkupRes.status !== 0 || !gitHubMarkupRes.stdout) {
      return null
    }
    return gitHubMarkupRes.stdout.toString()
  }
}

export default new GitHubMarkup()
