// SPDX-FileCopyrightText: 2017 TODO Group
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
//
// SPDX-License-Identifier: Apache-2.0

import nodefs from 'node:fs'
import type FileSystem from '../lib/file-system.js'
import Result from '../lib/result.js'

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
  options: LargeFileOptions
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

  const allResults = await Promise.all(
    files.map(async file => {
      const filePath = fs.resolveContained(file)
      const stat = await nodefs.promises.stat(filePath)
      const isPassed = stat.size <= options.size
      const readerFriendlySize =
        stat.size > 1000 * 1000
          ? `${stat.size / 1_000_000} MB`
          : `${stat.size / 1000} KB`
      const message = `File size ${readerFriendlySize} bytes`

      return {
        passed: isPassed,
        path: filePath,
        message,
        size: stat.size
      }
    })
  )
  const results: FileStat[] = allResults
    .filter(fileStat => {
      return !fileStat.passed
    })
    .toSorted((stat1, stat2) => {
      return stat2.size - stat1.size
    })

  const isPassed = results.every(r => r.passed)
  if (results.length === 0 || isPassed) {
    return new Result(
      `No file larger than ${options.size} bytes found.`,
      results,
      isPassed
    )
  }
  return new Result('Large file(s) found:', results, isPassed)
}

export default largeFile
