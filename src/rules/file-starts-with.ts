// SPDX-FileCopyrightText: 2017 TODO Group
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
//
// SPDX-License-Identifier: Apache-2.0

import type FileSystem from '../lib/file-system.js'
import Result from '../lib/result.js'

interface SkipPathsMatching {
  extensions?: string[]
  patterns?: string[]
  flags?: string
}

interface FileStartsWithOptions {
  globsAll?: string[]
  files?: string[]
  nocase?: boolean
  patterns: string[]
  flags?: string
  lineCount: number
  'skip-binary-files'?: boolean
  'skip-paths-matching'?: SkipPathsMatching
  'human-readable-pattern'?: string
  'succeed-on-non-existent'?: boolean
}

async function fileStartsWith(
  fs: FileSystem,
  options: FileStartsWithOptions
): Promise<Result> {
  const fileList = options.globsAll ?? options.files ?? []
  const files = await fs.findAllFiles(fileList, options.nocase)

  let filteredFiles = files
  if (options['skip-binary-files']) {
    filteredFiles = filteredFiles.filter(file => !fs.isBinaryFile(file))
  }

  if (options['skip-paths-matching']) {
    let regexes: RegExp[] = []
    const extensions = options['skip-paths-matching'].extensions
    if (extensions && extensions.length > 0) {
      const extensionJoined = extensions.join('|')
      regexes.push(new RegExp('.(' + extensionJoined + ')$', 'i'))
    }

    const patterns = options['skip-paths-matching'].patterns
    if (patterns && patterns.length > 0) {
      const filteredPatterns = patterns
        .filter(p => typeof p === 'string' && p !== '')
        .map(p => new RegExp(p, options['skip-paths-matching']!.flags))
      regexes = [...regexes, ...filteredPatterns]
    }
    filteredFiles = filteredFiles.filter(
      file => !regexes.some(regex => regex.test(file))
    )
  }

  const targetsUnfiltered = await Promise.all(
    filteredFiles.map(async file => {
      const lines = await fs.getFileLines(file, options.lineCount)
      if (!lines) {
        return
      }
      const misses = options.patterns.filter(pattern => {
        const regexp = new RegExp(pattern, options.flags)
        return !regexp.test(lines)
      })

      let message = `The first ${options.lineCount} lines`
      const passed = misses.length === 0
      message += passed
        ? ' contain all of the requested patterns.'
        : ` do not contain the pattern(s): ${
            options['human-readable-pattern'] || misses.join(', ')
          }`

      return {
        passed,
        path: file,
        message
      }
    })
  )
  const targets = targetsUnfiltered.filter(
    (t): t is { passed: boolean; path: string; message: string } =>
      t !== undefined
  )

  if (targets.length === 0) {
    return new Result(
      'Did not find file matching the specified patterns',
      fileList.map(f => {
        return { passed: false, pattern: f }
      }),
      !!options['succeed-on-non-existent']
    )
  }

  const passed = !targets.some(t => !t.passed)
  return new Result('', targets, passed)
}

export default fileStartsWith
