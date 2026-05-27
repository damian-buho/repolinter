// SPDX-FileCopyrightText: 2017 TODO Group
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
//
// SPDX-License-Identifier: Apache-2.0

import type FileSystem from '../lib/file-system.js'
import Result from '../lib/result.js'
import crypto from 'node:crypto'

interface FileHashesNotExistOptions {
  globsAll?: string[]
  files?: string[]
  nocase?: boolean
  algorithm?: string
  hashes: string[]
}

async function fileHashesNotExist(
  fs: FileSystem,
  options: FileHashesNotExistOptions
): Promise<Result> {
  const fileList = options.globsAll ?? options.files ?? []
  const files = await fs.findAllFiles(fileList, !!options.nocase)

  if (files.length === 0) {
    return new Result(
      'Did not find any file matching the specified patterns',
      fileList.map(f => {
        return { passed: false, pattern: f }
      }),
      true
    )
  }

  const algorithm = options.algorithm || 'sha256'

  const resultsList = await Promise.all(
    options.hashes.map(async hash => {
      const allFileResults = await Promise.all(
        files.map(async file => {
          const digester = crypto.createHash(algorithm)
          const contents = (await fs.getFileContents(file)) ?? ''
          digester.update(contents)
          const fileHashResult = digester.digest('hex')
          const passed = fileHashResult !== hash
          const message = passed ? "Doesn't Matches hash" : 'Match hash'

          return {
            passed,
            path: file,
            message
          }
        })
      )
      return allFileResults.filter(result => !result.passed)
    })
  )

  const results: Array<{ passed: boolean; path: string; message: string }> = []
  for (const singleHashResults of resultsList) {
    for (const result of singleHashResults) {
      results.push(result)
    }
  }

  const passed = results.length === 0

  if (passed) {
    return new Result('No file matching hash found', results, passed)
  }
  return new Result('File matching has found', results, passed)
}

export default fileHashesNotExist
