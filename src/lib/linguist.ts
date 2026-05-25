// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { spawnSync } from 'node:child_process'
import { commandExists } from './command-exists.js'

class Linguist {
  async identifyLanguages(
    targetDirectory: string
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
    const output = spawnSync(command, [targetDirectory, '--json']).stdout
    if (output === null) {
      throw new Error('Execution of linguist failed!')
    } else {
      return JSON.parse(output.toString())
    }
  }
}

export default new Linguist()
