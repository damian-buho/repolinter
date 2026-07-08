// SPDX-FileCopyrightText: 2017 TODO Group.
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
// SPDX-License-Identifier: Apache-2.0

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

async function commandExists(
  command: string | string[]
): Promise<string | undefined> {
  const commands = Array.isArray(command) ? command : [command]
  for (const command_ of commands) {
    try {
      await execFileAsync('which', [command_])
      return command_
    } catch {
      // command not found, try next
    }
  }
  return undefined
}

export { commandExists }
