// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import Result from '../lib/result.js'

function getContent(options) {
  return options['human-readable-content'] !== undefined
    ? options['human-readable-content']
    : options.content
}

function getContext(matchedLine, regexMatch, contextLength) {
  const matchStart = regexMatch.index
  const contextStart =
    matchStart - contextLength > 0 ? matchStart - contextLength : 0
  const contextEnd = Math.min(
    regexMatch.index + regexMatch[0].length + contextLength,
    matchedLine.length
  )
  return matchedLine.substring(contextStart, contextEnd)
}

/**
 * Check if a list of files contains a regular expression.
 *
 * @param {FileSystem} fs A filesystem object configured with filter paths and target directories
 * @param {object} options The rule configuration
 * @param {boolean} not Whether or not to invert the result (not contents instead of contents)
 * @returns {Promise<Result>} The lint rule result
 * @ignore
 */
async function fileContents(fs, options, not = false) {
  const fileList = options.globsAll || options.files
  const files = await fs.findAllFiles(fileList, !!options.nocase)
  const regexFlags = options.flags || ''

  if (files.length === 0) {
    return new Result(
      'Did not find file matching the specified patterns',
      fileList.map(f => {
        return { passed: !options['fail-on-non-existent'], pattern: f }
      }),
      !options['fail-on-non-existent']
    )
  }

  const regex = new RegExp(options.content, regexFlags)
  let results

  if (!options['display-result-context']) {
    results = await Promise.all(
      files.map(async file => {
        const fileContents = await fs.getFileContents(file)
        if (!fileContents) return null

        const passed = fileContents.search(regex) >= 0
        const message = `${
          passed ? 'Contains' : "Doesn't contain"
        } ${getContent(options)}`

        return {
          passed: not ? !passed : passed,
          path: file,
          message
        }
      })
    )
  } else {
    results = (
      await Promise.all(
        files.map(async file => {
          const fileContents = await fs.getFileContents(file)
          if (!fileContents) return null

          const optionContextCharLength = options['context-char-length'] || 50
          const split = fileContents.split(regex)
          const regexHasMatch = split.length > 1
          if (!regexHasMatch) {
            return {
              passed: not ? !regexHasMatch : regexHasMatch,
              path: file,
              contextLines: [],
              message: `Doesn't contain '${getContent(options)}'`
            }
          }

          const fileLines = fileContents.split('\n')
          const contextLines = split
            .map(fileChunk => {
              if (fileChunk !== undefined) return fileChunk.split('\n').length
              return 1
            })
            .reduce((previous, current, index, array) => {
              if (previous.length === 0) {
                previous.push(current)
              } else if (current === 1 || index === array.length - 1) {
              } else {
                previous.push(current - 1 + previous.at(-1))
              }
              return previous
            }, [])
            .reduce((previous, current) => {
              const matchedLine = fileLines[current - 1]
              if (regexFlags.includes('m')) {
                let currentMatch = regex.exec(matchedLine)

                if (currentMatch === null) {
                  previous.push({
                    line: current,
                    context:
                      '-- This is a multi-line regex match so we only displaying line number --'
                  })
                  return previous
                }
                regex.lastIndex = 0
                while ((currentMatch = regex.exec(matchedLine)) !== null) {
                  previous.push({
                    line: current,
                    context: getContext(
                      matchedLine,
                      currentMatch,
                      optionContextCharLength
                    )
                  })
                  if (regex.lastIndex === 0) break
                }
                return previous
              }

              if (!regexFlags.includes('g')) {
                const currentMatch = regex.exec(matchedLine)
                if (currentMatch != null) {
                  previous.push({
                    line: current,
                    context: getContext(
                      matchedLine,
                      currentMatch,
                      optionContextCharLength
                    )
                  })
                  return previous
                }
                console.trace('Error trace:')
                throw new Error(
                  'Please open an issue on https://github.com/todogroup/repolinter'
                )
              }

              let currentMatch
              while ((currentMatch = regex.exec(matchedLine)) !== null) {
                previous.push({
                  line: current,
                  context: getContext(
                    matchedLine,
                    currentMatch,
                    optionContextCharLength
                  )
                })
              }
              return previous
            }, [])

          return {
            passed: not ? !regexHasMatch : regexHasMatch,
            path: file,
            contextLines,
            message: `Contains '${getContent(options)}'`
          }
        })
      )
    )
      .filter(result => result && (not ? !result.passed : result.passed))
      .reduce((previous, current) => {
        current.contextLines.forEach(lineContext => {
          previous.push({
            passed: current.passed,
            path: current.path,
            message: `${current.message} on line ${lineContext.line}, context: \n\t|${lineContext.context}`
          })
        })
        return previous
      }, [])
  }

  const filteredResults = results.filter(r => r !== null)
  const passed = !filteredResults.find(r => !r.passed)
  return new Result('', filteredResults, passed)
}

export default fileContents
