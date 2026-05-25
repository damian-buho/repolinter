// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { spawnSync } from 'node:child_process'
import { commandExists } from './command_exists.js'

class Linguist {
  async identifyLanguages(
    targetDir: string
  ): Promise<Record<string, string[]>> {
    const command = await commandExists([
      'github-linguist',
      'linguist',
      'github-linguist.bat',
      'linguist.bat'
    ])
    if (command === undefined) {
      throw new Error('Linguist not installed')
    }
    const output = spawnSync(command, [targetDir, '--json']).stdout
    if (output !== null) {
      return JSON.parse(output.toString())
    } else {
      throw new Error('Execution of linguist failed!')
    }
  }
}

export default new Linguist()
