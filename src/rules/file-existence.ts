// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import type FileSystem from '../lib/file-system.js'
import Result from '../lib/result.js'

interface FileExistenceOptions {
  globsAny?: string[]
  files?: string[]
  directories?: string[]
  dirs?: boolean
  nocase?: boolean
  'fail-message'?: string
}

async function fileExistence(
  fs: FileSystem,
  options: FileExistenceOptions
): Promise<Result> {
  const fileList =
    options.globsAny ?? options.files ?? options.directories ?? []
  const file = options.dirs
    ? await fs.findFirst(fileList, options.nocase)
    : await fs.findFirstFile(fileList, options.nocase)

  const passed = !!file

  return passed
    ? new Result(
        '',
        [{ passed: true, path: file, message: 'Found file' }],
        true
      )
    : new Result(
        `${
          options['fail-message'] === undefined
            ? ''
            : options['fail-message'] + '. '
        }Did not find a file matching the specified patterns`,
        fileList.map(f => {
          return { passed: false, pattern: f }
        }),
        false
      )
}

export default fileExistence
