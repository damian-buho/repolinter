// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import type FileSystem from '../lib/file_system.js'
import Result from '../lib/result.js'
import fileContents from './file-contents.js'

interface FileNotContentsOptions {
  content?: string
  contents?: string[]
  globsAll?: string[]
  files?: string[]
  flags?: string
  nocase?: boolean
  'fail-on-non-existent'?: boolean
  'human-readable-content'?: string
  'display-result-context'?: boolean
  'context-char-length'?: number
}

async function fileNotContents(
  fs: FileSystem,
  options: FileNotContentsOptions
): Promise<Result> {
  if (options.content && !options.contents) {
    return fileContents(
      fs,
      {
        content: options.content,
        globsAll: options.globsAll,
        files: options.files,
        flags: options.flags,
        nocase: options.nocase,
        'fail-on-non-existent': options['fail-on-non-existent'],
        'human-readable-content': options['human-readable-content'],
        'display-result-context': options['display-result-context'],
        'context-char-length': options['context-char-length']
      },
      true
    )
  }

  const results = await Promise.all(
    (options.contents ?? []).map(content => {
      const singleOption: FileNotContentsOptions = { ...options }
      delete singleOption.contents
      singleOption.content = content
      return fileContents(
        fs,
        singleOption as Parameters<typeof fileContents>[1],
        true
      )
    })
  )

  const filteredResults = results.filter(r => r !== null)
  const passed = !filteredResults.find(r => !r.passed)
  const aggregatedTargets = filteredResults
    .reduce<
      Array<{
        passed: boolean
        path?: string
        pattern?: string
        message?: string
      }>
    >((previous, current) => {
      return previous.concat(current.targets)
    }, [])
    .filter(r => !r.passed)

  if (passed) {
    return new Result(
      'Did not find content matching specified patterns',
      aggregatedTargets,
      passed
    )
  }
  return new Result('', aggregatedTargets, passed)
}

export default fileNotContents
