// Copyright 2018 TODO Group. All rights reserved.
// Licensed under the Apache License, Version 2.0.

import { commandExists } from './command_exists.js'
import { spawnSync } from 'child_process'

class Licensee {
  /**
   * Returns the license found for the project.
   *
   * Throws 'Licensee not installed' error if command line of 'licensee' is not available.
   *
   * @param {string} targetDir The directory to run licensee on
   * @returns {Promise<string[]>} License identifiers
   * @ignore
   */
  async identifyLicense(targetDir) {
    const command = await commandExists(['licensee', 'licensee.bat'])
    if (command === null) {
      throw new Error('Licensee not installed')
    }
    const licenseeOutput = spawnSync(command, [
      'detect',
      '--json',
      targetDir
    ]).stdout
    if (licenseeOutput == null) {
      throw new Error('Error executing licensee')
    }
    const json = licenseeOutput.toString()
    return JSON.parse(json).licenses.map(function (license) {
      return license.spdx_id
    })
  }
}

export default new Licensee()
