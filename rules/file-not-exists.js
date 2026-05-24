// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import Result from '../lib/result.js'

/**
 * Check if a file is not present in the repository. Fails on the first file
 * matching the glob pattern, succeeds if no file matching any of the patterns
 * is found.
 *
 * @param {FileSystem} fs A filesystem object configured with filter paths and target directories
 * @param {object} options The rule configuration
 * @returns {Promise<Result>} The lint rule result
 * @ignore
 */
async function fileNotExistence(fs, options) {
  const fileList = options.globsAll
  const file = options.dirs
    ? await fs.findAll(fileList, options.nocase)
    : await fs.findAllFiles(fileList, options.nocase)

  return file.length !== 0
    ? new Result(
        'Found files',
        file.map(f => {
          return { passed: false, path: f }
        }),
        false
      )
    : new Result(
        `${
          options['pass-message'] !== undefined
            ? options['pass-message'] + '. '
            : ''
        }Did not find a file matching the specified patterns`,
        fileList.map(f => {
          return { pattern: f, passed: true }
        }),
        true
      )
}

export default fileNotExistence
