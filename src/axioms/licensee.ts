// SPDX-FileCopyrightText: 2017 TODO Group.
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
// SPDX-License-Identifier: Apache-2.0

import licensee from '../lib/licensee.js'
import Result from '../lib/result.js'
import type FileSystem from '../lib/file-system.js'

export default async function licenseeAxiom(
  fileSystem: FileSystem
): Promise<Result> {
  let licenses: string[]
  try {
    licenses = await licensee.identifyLicense(fileSystem.targetDirectory)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return new Result(message, [], false)
  }
  return new Result(
    '',
    licenses.map(l => ({
      passed: true,
      path: l
    })),
    true
  )
}
