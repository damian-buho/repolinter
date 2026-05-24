// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import Result from '../lib/result.js'
import type FileSystem from '../lib/file_system.js'

interface SkipPathsMatching {
  extensions?: string[]
  patterns?: string[]
  flags?: string
}

interface FileModifyOptions {
  files?: string[]
  nocase?: boolean
  'skip-paths-matching'?: SkipPathsMatching
  text?: string | { url?: string; file?: string; nocase?: boolean }
  newlines?: { begin?: number; end?: number }
  write_mode?: string
}

async function fileModify(
  fs: FileSystem,
  options: FileModifyOptions,
  targets: string[],
  dryRun: boolean = false
): Promise<Result> {
  const realTargets: string[] = options.files || targets
  if (realTargets.length === 0) {
    return new Result(
      'No files to modify, did you configure this fix correctly?',
      [],
      false
    )
  }

  let files: string[] = await fs.findAllFiles(realTargets, options.nocase)

  if (options['skip-paths-matching']) {
    let regexes: RegExp[] = []
    const extensions = options['skip-paths-matching'].extensions
    if (extensions && extensions.length > 0) {
      const extJoined = extensions.join('|')
      regexes.push(new RegExp('.(' + extJoined + ')$', 'i'))
    }

    const patterns = options['skip-paths-matching'].patterns
    if (patterns && patterns.length > 0) {
      const filteredPatterns = patterns
        .filter((p): p is string => typeof p === 'string' && p !== '')
        .map(p => new RegExp(p, options['skip-paths-matching']!.flags))
      regexes = [...regexes, ...filteredPatterns]
    }
    files = files.filter(file => !regexes.some(regex => file.match(regex)))
  }

  let content: string | undefined
  if (typeof options.text === 'string') {
    content = options.text
  } else if (typeof options.text === 'object') {
    if (options.text.url) {
      const req = await fetch(options.text.url)
      if (!req.ok) {
        return new Result(
          `Could not fetch from ${options.text.url}, received status code ${req.status}`,
          [],
          false
        )
      }
      content = await req.text()
    } else if (options.text.file) {
      const file = await fs.findFirstFile(
        [options.text.file],
        options.text.nocase === true
      )
      if (!file) {
        return new Result(
          `Could not find file matching pattern ${options.text.file} for file-modify.`,
          [],
          false
        )
      }
      content = await fs.getFileContents(file)
    }
  }
  if (!content) {
    return new Result(
      'Text was not specified for file-modify! Did you configure the ruleset correctly?',
      [],
      false
    )
  }

  const resTargets = await Promise.all(
    files.map(
      async (
        file
      ): Promise<{
        message: string
        passed: boolean
        path: string
      }> => {
        if (!dryRun) {
          const startNewlines =
            options.newlines && options.newlines.begin
              ? Array.from({ length: options.newlines.begin }, () => '\n').join(
                  ''
                )
              : ''
          const endNewlines =
            options.newlines && options.newlines.end
              ? Array.from({ length: options.newlines.end }, () => '\n').join(
                  ''
                )
              : ''
          const fileContent = startNewlines + content! + endNewlines
          if (options.write_mode === 'prepend') {
            await fs.setFileContents(
              file,
              fileContent + (await fs.getFileContents(file))
            )
          } else {
            await fs.setFileContents(
              file,
              (await fs.getFileContents(file)) + fileContent
            )
          }
        }
        const message =
          typeof options.text === 'object'
            ? `${options.write_mode} text from ${
                options.text.file || options.text.url
              } to file`
            : `${options.write_mode} \`${JSON.stringify(content).slice(
                1,
                -1
              )}\` to file`
        return {
          message,
          passed: true,
          path: file
        }
      }
    )
  )

  return new Result('', resTargets, true)
}

export default fileModify
