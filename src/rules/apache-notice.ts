// SPDX-FileCopyrightText: 2017 TODO Group.
// SPDX-FileCopyrightText: 2017 TODO Group
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
//
// SPDX-License-Identifier: Apache-2.0

import type FileSystem from '../lib/file-system.js'
import fileExistence from './file-existence.js'

export default function apacheNotice(
  fileSystem: FileSystem
): ReturnType<typeof fileExistence> {
  return fileExistence(fileSystem, {
    globsAny: ['NOTICE*'],
    'fail-message':
      'The NOTICE file is described in section 4.4 of the Apache License version 2.0. Its presence is not mandated by the license itself, but by ASF policy.'
  })
}
