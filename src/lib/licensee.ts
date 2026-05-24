// Copyright 2018 TODO Group. All rights reserved.
// Licensed under the Apache License, Version 2.0.

import { commandExists } from './command_exists.js'
import { spawnSync } from 'node:child_process'

interface LicenseeJson {
  licenses: Array<{ spdx_id: string }>
}

class Licensee {
  async identifyLicense(targetDir: string): Promise<string[]> {
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
    const json: LicenseeJson = JSON.parse(licenseeOutput.toString())
    return json.licenses.map(license => license.spdx_id)
  }
}

export default new Licensee()
