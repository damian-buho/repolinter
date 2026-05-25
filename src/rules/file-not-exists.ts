// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import type FileSystem from '../lib/file-system.js'
import Result from '../lib/result.js'

interface FileNotExistsOptions {
  globsAll: string[]
  dirs?: boolean
  nocase?: boolean
  'pass-message'?: string
}

async function fileNotExistence(
  fs: FileSystem,
  options: FileNotExistsOptions
): Promise<Result> {
  const fileList = options.globsAll
  const file = options.dirs
    ? await fs.findAll(fileList, options.nocase)
    : await fs.findAllFiles(fileList, options.nocase)

  return file.length > 0
    ? new Result(
        'Found files',
        file.map(f => {
          return { passed: false, path: f }
        }),
        false
      )
    : new Result(
        `${
          options['pass-message'] === undefined
            ? ''
            : options['pass-message'] + '. '
        }Did not find a file matching the specified patterns`,
        fileList.map(f => {
          return { pattern: f, passed: true }
        }),
        true
      )
}

export default fileNotExistence
