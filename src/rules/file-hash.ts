// SPDX-FileCopyrightText: 2017 TODO Group
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
//
// SPDX-License-Identifier: Apache-2.0

import type FileSystem from '../lib/file-system.js'
import Result from '../lib/result.js'
import crypto from 'node:crypto'

interface FileHashOptions {
  globsAny?: string[]
  files?: string[]
  nocase?: boolean
  algorithm?: string
  hash: string
  'succeed-on-non-existent'?: boolean
}

async function fileHash(
  fs: FileSystem,
  options: FileHashOptions
): Promise<Result> {
  const fileList = options.globsAny ?? options.files ?? []
  const file = await fs.findFirstFile(fileList, options.nocase)

  if (file === undefined) {
    return new Result(
      'Did not find file matching the specified patterns',
      fileList.map(f => {
        return { passed: false, pattern: f }
      }),
      !!options['succeed-on-non-existent']
    )
  }

  const algorithm = options.algorithm ?? 'sha256'
  const digester = crypto.createHash(algorithm)

  const contents = (await fs.getFileContents(file)) ?? ''
  digester.update(contents)
  const hashResult = digester.digest('hex')

  const passed = hashResult === options.hash
  const message = passed ? 'Matches hash' : "Doesn't match hash"

  return new Result('', [{ path: file, passed, message }], passed)
}

export default fileHash
