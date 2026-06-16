// SPDX-FileCopyrightText: 2017 TODO Group.
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
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
  isDryRun: boolean = false
): Promise<Result> {
  const resolvedTargets = options.globsAll?.length
    ? await fs.findAllFiles(options.globsAll, !!options.nocase)
    : targets
  if (resolvedTargets.length === 0) {
    return new Result('Found no files to remove', [], false)
  }
  if (!isDryRun) {
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
