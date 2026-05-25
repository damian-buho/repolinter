// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import Result from '../lib/result.js'
import type FileSystem from '../lib/file-system.js'

interface FileRemoveOptions {
  globsAll?: string[]
  nocase?: boolean
}

async function fileRemove(
  fs: FileSystem,
  options: FileRemoveOptions,
  targets: string[],
  dryRun: boolean = false
): Promise<Result> {
  let resolvedTargets = targets
  if (options.globsAll && options.globsAll.length > 0) {
    resolvedTargets = await fs.findAllFiles(options.globsAll, !!options.nocase)
  }
  if (resolvedTargets.length === 0) {
    return new Result('Found no files to remove', [], false)
  }
  if (!dryRun) {
    await Promise.all(resolvedTargets.map(async t => fs.removeFile(t)))
  }
  const removeTargets = resolvedTargets.map(t => ({
    passed: true,
    path: t,
    message: 'Remove file'
  }))
  return new Result('', removeTargets, true)
}

export default fileRemove
