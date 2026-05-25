// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import type FileSystem from '../lib/file-system.js'
import fileExistence from './file-existence.js'

export default function directoryExistence(
  fileSystem: FileSystem,
  options: Parameters<typeof fileExistence>[1]
): ReturnType<typeof fileExistence> {
  return fileExistence(fileSystem, { ...options, dirs: true })
}
