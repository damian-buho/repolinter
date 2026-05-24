// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import type FileSystem from '../lib/file_system.js'
import Result from '../lib/result.js'

interface FileTypeExclusionOptions {
  type: string | string[]
}

async function fileTypeExclusion(
  fs: FileSystem,
  options: FileTypeExclusionOptions
): Promise<Result> {
  const files = await fs.findAll(options.type)

  const targets = files.map(file => {
    const message = 'Excluded file type exists'
    return { passed: false, path: file, message }
  })

  if (targets.length === 0) {
    const message = "Excluded file type doesn't exist"

    return new Result(
      message,
      [
        {
          passed: true,
          pattern:
            typeof options.type === 'string'
              ? options.type
              : options.type.join(', ')
        }
      ],
      true
    )
  }

  const passed = !targets.find(t => !t.passed)
  return new Result('', targets, passed)
}

export default fileTypeExclusion
