// Copyright 2018 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import type FileSystem from '../lib/file_system.js'
import licensee from '../lib/licensee.js'
import Result from '../lib/result.js'

async function licenceDetect(fs: FileSystem): Promise<Result> {
  const result = new Result('', [], false)

  let licenses: string[] = []
  try {
    licenses = await licensee.identifyLicense(fs.targetDir)
  } catch (error) {
    result.message = (error as Error).message
    return result
  }

  result.passed = licenses.length > 0
  result.message = (() => {
    if (result.passed) {
      const identified = licenses[0]
      return `Licensee identified the license for project: ${identified}`
    } else {
      return 'Licensee did not identify a license for project'
    }
  })()

  return result
}

export default licenceDetect
