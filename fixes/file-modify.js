// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import Result from '../lib/result.js'

/**
 * Prepend or append text to a file
 *
 * @param {FileSystem} fs A filesystem object configured with filter paths and target directories
 * @param {object} options The rule configuration
 * @param {string[]} targets The files to modify (will be overridden by options if present)
 * @param {boolean} dryRun If true, repolinter will report suggested fixes, but will make no disk modifications.
 * @returns {Promise<Result>} The lint rule result
 * @ignore
 */
async function fileModify(fs, options, targets, dryRun = false) {
  const realTargets = options.files || targets
  if (realTargets.length === 0) {
    return new Result(
      'No files to modify, did you configure this fix correctly?',
      [],
      false
    )
  }

  let files = await fs.findAllFiles(realTargets, options.nocase)

  if (options['skip-paths-matching']) {
    let regexes = []
    const extensions = options['skip-paths-matching'].extensions
    if (extensions && extensions.length > 0) {
      const extJoined = extensions.join('|')
      regexes.push(new RegExp('.(' + extJoined + ')$', 'i'))
    }

    const patterns = options['skip-paths-matching'].patterns
    if (patterns && patterns.length > 0) {
      const filteredPatterns = patterns
        .filter(p => typeof p === 'string' && p !== '')
        .map(p => new RegExp(p, options['skip-paths-matching'].flags))
      regexes = [...regexes, ...filteredPatterns]
    }
    files = files.filter(file => !regexes.some(regex => file.match(regex)))
  }

  let content
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
    files.map(async file => {
      if (!dryRun) {
        const startNewlines =
          options.newlines && options.newlines.begin
            ? Array.from({ length: options.newlines.begin }, () => '\n').join(
                ''
              )
            : ''
        const endNewlines =
          options.newlines && options.newlines.end
            ? Array.from({ length: options.newlines.end }, () => '\n').join('')
            : ''
        const fileContent = startNewlines + content + endNewlines
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
    })
  )

  return new Result('', resTargets, true)
}

export default fileModify
