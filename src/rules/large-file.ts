// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import nodefs from 'fs'
import type FileSystem from '../lib/file_system.js'
import Result from '../lib/result.js'
import path from 'path'

interface LargeFileOptions {
  globsAll?: string[]
  files?: string[]
  nocase?: boolean
  size: number
  'fail-on-non-existent'?: boolean
}

interface FileStat {
  passed: boolean
  path: string
  message: string
  size: number
}

async function largeFile(
  fs: FileSystem,
  options: LargeFileOptions,
  not = false
): Promise<Result> {
  const fileList = options.globsAll ?? options.files ?? []
  const files = await fs.findAllFiles(fileList, !!options.nocase)

  if (files.length === 0) {
    return new Result(
      'Did not find file matching the specified patterns',
      fileList.map(f => {
        return { passed: false, pattern: f }
      }),
      !options['fail-on-non-existent']
    )
  }

  const results: FileStat[] = (
    await Promise.all(
      files.map(async file => {
        const filePath = path.resolve(fs.targetDir, file)
        const stat = await nodefs.promises.stat(filePath)
        const passed = stat.size <= options.size
        const readerFriendlySize =
          stat.size > 1000 * 1000
            ? `${stat.size / 1000000} MB`
            : `${stat.size / 1000} KB`
        const message = `File size ${readerFriendlySize} bytes`

        return {
          passed: not ? !passed : passed,
          path: filePath,
          message,
          size: stat.size
        }
      })
    )
  )
    .filter(fileStat => {
      return !fileStat.passed
    })
    .sort((stat1, stat2) => {
      return stat2.size - stat1.size
    })

  const filteredResults = results.filter(r => r !== null)
  const passed = !filteredResults.find(r => !r.passed)
  if (filteredResults.length === 0 || passed) {
    return new Result(
      `No file larger than ${options.size} bytes found.`,
      filteredResults,
      passed
    )
  }
  return new Result('Large file(s) found:', filteredResults, passed)
}

export default largeFile
