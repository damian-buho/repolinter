// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import type FileSystem from '../lib/file_system.js'
import Result from '../lib/result.js'

interface FileContentsOptions {
  globsAll?: string[]
  files?: string[]
  content: string
  'human-readable-content'?: string
  flags?: string
  nocase?: boolean
  'fail-on-non-existent'?: boolean
  'display-result-context'?: boolean
  'context-char-length'?: number
}

interface ContextLine {
  line: number
  context: string
}

interface ContextResult {
  passed: boolean
  path: string
  contextLines: ContextLine[]
  message: string
}

function getContent(options: FileContentsOptions): string {
  return options['human-readable-content'] !== undefined
    ? options['human-readable-content']
    : options.content
}

function getContext(
  matchedLine: string,
  regexMatch: RegExpExecArray,
  contextLength: number
): string {
  const matchStart = regexMatch.index
  const contextStart =
    matchStart - contextLength > 0 ? matchStart - contextLength : 0
  const contextEnd = Math.min(
    regexMatch.index + regexMatch[0].length + contextLength,
    matchedLine.length
  )
  return matchedLine.substring(contextStart, contextEnd)
}

async function fileContents(
  fs: FileSystem,
  options: FileContentsOptions,
  not = false
): Promise<Result> {
  const fileList = options.globsAll ?? options.files ?? []
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
  let results: Array<{ passed: boolean; path: string; message: string } | null>

  if (!options['display-result-context']) {
    results = await Promise.all(
      files.map(async file => {
        const contents = await fs.getFileContents(file)
        if (!contents) return null

        const passed = contents.search(regex) >= 0
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
          const contents = await fs.getFileContents(file)
          if (!contents) return null

          const optionContextCharLength = options['context-char-length'] || 50
          const split = contents.split(regex)
          const regexHasMatch = split.length > 1
          if (!regexHasMatch) {
            return {
              passed: not ? !regexHasMatch : regexHasMatch,
              path: file,
              contextLines: [],
              message: `Doesn't contain '${getContent(options)}'`
            }
          }

          const fileLines = contents.split('\n')
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
                previous.push(current - 1 + previous.at(-1)!)
              }
              return previous
            }, [] as number[])
            .reduce((previous, current) => {
              const matchedLine = fileLines[current - 1]!
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

              let currentMatch: RegExpExecArray | null
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
            }, [] as ContextLine[])

          return {
            passed: not ? !regexHasMatch : regexHasMatch,
            path: file,
            contextLines,
            message: `Contains '${getContent(options)}'`
          }
        })
      )
    )
      .filter(
        (result): result is ContextResult & { passed: boolean } =>
          result !== null && (not ? !result.passed : result.passed)
      )
      .reduce(
        (previous, current) => {
          current.contextLines.forEach(lineContext => {
            previous.push({
              passed: current.passed,
              path: current.path,
              message: `${current.message} on line ${lineContext.line}, context: \n\t|${lineContext.context}`
            })
          })
          return previous
        },
        [] as Array<{ passed: boolean; path: string; message: string }>
      )
  }

  const filteredResults = results.filter(
    (r): r is { passed: boolean; path: string; message: string } => r !== null
  )
  const passed = !filteredResults.find(r => !r.passed)
  return new Result('', filteredResults, passed)
}

export default fileContents
