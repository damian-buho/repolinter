// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import Result from '../lib/result.js'

/**
 * Removes a file or a list of files.
 *
 * @param {FileSystem} fs A filesystem object configured with filter paths and target directories
 * @param {object} options The rule configuration
 * @param {string[]} targets The files to modify (will be overridden by options if present)
 * @param {boolean} dryRun If true, repolinter will report suggested fixes, but will make no disk modifications.
 * @returns {Promise<Result>} The fix result
 * @ignore
 */
async function fileRemove(fs, options, targets, dryRun = false) {
  if (options.globsAll && options.globsAll.length) {
    targets = await fs.findAllFiles(options.globsAll, !!options.nocase)
  }
  if (targets.length === 0) {
    return new Result('Found no files to remove', [], false)
  }
  if (!dryRun) {
    await Promise.all(targets.map(async t => fs.removeFile(t)))
  }
  const removeTargets = targets.map(t => {
    return { passed: true, path: t, message: 'Remove file' }
  })
  return new Result('', removeTargets, true)
}

export default fileRemove
