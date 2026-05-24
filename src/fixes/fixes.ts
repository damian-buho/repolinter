// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import fileCreate from './file-create.js'
import fileModify from './file-modify.js'
import fileRemove from './file-remove.js'
import type FileSystem from '../lib/file_system.js'
import type Result from '../lib/result.js'

type FixFunction = (
  fs: FileSystem,
  options: any,
  targets: string[],
  dryRun: boolean
) => Promise<Result>

const fixes: Record<string, FixFunction> = {
  'file-create': fileCreate,
  'file-modify': fileModify,
  'file-remove': fileRemove
}

export default fixes
