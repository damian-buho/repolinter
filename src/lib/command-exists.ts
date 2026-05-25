// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import commandExistsLib from 'command-exists'

async function commandExists(
  command: string | string[]
): Promise<string | undefined> {
  const commands = Array.isArray(command) ? command : [command]
  for (const cmd of commands) {
    try {
      await commandExistsLib(cmd)
      return cmd
    } catch {
      // command not found, try next
    }
  }
  return undefined
}

export { commandExists }
