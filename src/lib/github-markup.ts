// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { commandExists } from './command-exists.js'
import { spawnSync } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

class GitHubMarkup {
  async renderMarkup(targetFile: string): Promise<string | undefined> {
    const command = await commandExists(['github-markup'])
    if (command === undefined) {
      throw new Error('GitHub markup not installed')
    }
    const gitHubMarkupResult = spawnSync(
      `${__dirname}/github_markup_check_and_render`,
      [targetFile]
    )
    if (gitHubMarkupResult.status !== 0 || !gitHubMarkupResult.stdout) {
      return undefined
    }
    return gitHubMarkupResult.stdout.toString()
  }
}

export default new GitHubMarkup()
