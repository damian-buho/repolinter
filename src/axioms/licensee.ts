// Copyright 2017 TODO Group. All rights reserved.
// Licensed under the Apache License, Version 2.0.

import licensee from '../lib/licensee.js'
import Result from '../lib/result.js'
import type FileSystem from '../lib/file_system.js'

export default async function (
  fileSystem: FileSystem
): Promise<Result> {
  let licenses: string[] = []
  try {
    licenses = await licensee.identifyLicense(fileSystem.targetDir)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error)
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
