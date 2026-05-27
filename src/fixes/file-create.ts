// SPDX-FileCopyrightText: 2017 TODO Group.
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
// SPDX-License-Identifier: Apache-2.0

import Result from '../lib/result.js'
import type FileSystem from '../lib/file-system.js'

interface FileCreateOptions {
  file: string
  replace?: boolean
  text?: string | { url?: string; file?: string; nocase?: boolean }
}

async function fileCreate(
  fs: FileSystem,
  options: FileCreateOptions,
  targets: string[],
  dryRun: boolean = false
): Promise<Result> {
  const exists =
    targets.length > 0 || (await fs.relativeFileExists(options.file))
  if (!options.replace && exists) {
    if (targets.length > 0) {
      return new Result(
        '',
        targets.map(t => ({
          passed: false,
          path: t,
          message: `${t} already exists (options.replace is set to false)`
        })),
        false
      )
    }
    return new Result(
      '',
      [
        {
          message: `${options.file} already exists (options.replace is set to false)`,
          passed: false,
          path: options.file
        }
      ],
      false
    )
  }

  let content: string | undefined
  if (typeof options.text === 'string') {
    content = options.text
  } else if (typeof options.text === 'object') {
    if (options.text.url) {
      const request = await fetch(options.text.url)
      if (!request.ok) {
        return new Result(
          `Could not fetch from ${options.text.url}, received status code ${request.status}`,
          [],
          false
        )
      }
      content = await request.text()
    } else if (options.text.file) {
      const file = await fs.findFirstFile(
        [options.text.file],
        options.text.nocase === true
      )
      if (!file) {
        return new Result(
          `Could not find file matching pattern ${options.text.file} for file-create.`,
          [],
          false
        )
      }
      content = await fs.getFileContents(file)
    }
  }
  if (!content) {
    return new Result(
      'Text was not specified for file-create! Did you configure the ruleset correctly?',
      [],
      false
    )
  }

  const shouldRemove = options.replace && targets.length > 0
  if (!dryRun) {
    if (shouldRemove) {
      await Promise.all(targets.map(t => fs.removeFile(t)))
    }
    await fs.setFileContents(options.file, content)
  }

  const what =
    typeof options.text === 'object'
      ? `text from ${options.text.file || options.text.url}`
      : `contents "${content}"`

  const removeTargets = shouldRemove
    ? targets
        .filter(t => t !== options.file)
        .map(t => ({
          passed: true,
          path: t,
          message: 'Remove file'
        }))
    : []
  return new Result(
    '',
    [
      { message: `Create file with ${what}`, passed: true, path: options.file },
      ...removeTargets
    ],
    true
  )
}

export default fileCreate
