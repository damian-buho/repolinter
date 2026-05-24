// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import type FileSystem from '../lib/file_system.js'
import fileExistence from './file-existence.js'

export default function directoryExistence(
  fileSystem: FileSystem,
  opts: Parameters<typeof fileExistence>[1]
): ReturnType<typeof fileExistence> {
  return fileExistence(fileSystem, { ...opts, dirs: true })
}
