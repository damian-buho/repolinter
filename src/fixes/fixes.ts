// SPDX-FileCopyrightText: 2017 TODO Group.
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
// SPDX-License-Identifier: Apache-2.0

import fileCreate from './file-create.js'
import fileModify from './file-modify.js'
import fileRemove from './file-remove.js'
import type FileSystem from '../lib/file-system.js'
import type Result from '../lib/result.js'

type FixFunction = (
  fs: FileSystem,
  options: unknown,
  targets: string[],
  dryRun: boolean
) => Promise<Result>

const fixes: Record<string, FixFunction> = {
  'file-create': fileCreate as unknown as FixFunction,
  'file-modify': fileModify as unknown as FixFunction,
  'file-remove': fileRemove as unknown as FixFunction
}

export default fixes
