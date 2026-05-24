// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { spawnSync } from 'child_process'
import { commandExists } from './command_exists.js'

class Linguist {
  /**
   * Returns the languages found in the project.
   * Associate Array of language String to Array of filenames that are written in that language
   *
   * Throws 'Linguist not installed' error if command line of 'linguist' is not available.
   *
   * @param {string} targetDir The directory to run linguist on
   * @returns {Promise<object>} The linguist output
   * @ignore
   */
  async identifyLanguages(targetDir) {
    const command = await commandExists([
      'github-linguist',
      'linguist',
      'github-linguist.bat',
      'linguist.bat'
    ])
    if (command === null) {
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
