// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import Result from '../lib/result.js'
import fileContents from './file-contents.js'

/**
 * Check that a list of files does not contain regular expression(s).
 *
 * @param {FileSystem} fs A filesystem object configured with filter paths and target directories
 * @param {object} options The rule configuration
 * @returns {Promise<Result>} The lint rule result
 * @ignore
 */
async function fileNotContents(fs, options) {
  if (options.content && !options.contents) {
    return fileContents(fs, options, true)
  }

  const results = await Promise.all(
    options.contents.map(content => {
      const singleOption = { ...options }
      delete singleOption.contents
      singleOption.content = content
      return fileContents(fs, singleOption, true)
    })
  )

  const filteredResults = results.filter(r => r !== null)
  const passed = !filteredResults.find(r => !r.passed)
  const aggregatedTargets = filteredResults
    .reduce((previous, current) => {
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
