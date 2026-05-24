// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import fileExistence from './file-existence.js'

export default function (fileSystem, opts) {
  return fileExistence(fileSystem, { ...opts, dirs: true })
}
