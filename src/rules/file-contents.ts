// SPDX-FileCopyrightText: 2017 TODO Group
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
//
// SPDX-License-Identifier: Apache-2.0

import type FileSystem from '../lib/file-system.js'
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
  return options['human-readable-content'] === undefined
    ? options.content
    : options['human-readable-content']
}

function getContext(
  matchedLine: string,
  regexMatch: RegExpExecArray,
  contextLength: number
): string {
  const matchStart = regexMatch.index
  const contextStart = Math.max(matchStart - contextLength, 0)
  const contextEnd = Math.min(
    regexMatch.index + regexMatch[0].length + contextLength,
    matchedLine.length
  )
  return matchedLine.slice(contextStart, contextEnd)
}

function addMultilineContext(
  regex: RegExp,
  matchedLine: string,
  line: number,
  contextLength: number,
  contextLines: ContextLine[]
): void {
  let currentMatch = regex.exec(matchedLine)
  if (currentMatch === null) {
    contextLines.push({
      line,
      context:
        '-- This is a multi-line regex match so we only displaying line number --'
    })
    return
  }
  regex.lastIndex = 0
  while ((currentMatch = regex.exec(matchedLine)) !== null) {
    contextLines.push({
      line,
      context: getContext(matchedLine, currentMatch, contextLength)
    })
    if (regex.lastIndex === 0) break
  }
}

async function fileContents(
  fs: FileSystem,
  options: FileContentsOptions,
  isNot = false
): Promise<Result> {
  const fileList = options.globsAll ?? options.files ?? []
  const files = await fs.findAllFiles(fileList, !!options.nocase)

  if (files.length === 0) {
    return new Result(
      'Did not find file matching the specified patterns',
      fileList.map(f => {
        return { passed: !options['fail-on-non-existent'], pattern: f }
      }),
      !options['fail-on-non-existent']
    )
  }

  const regexFlags = options.flags || ''
  const regex = new RegExp(options.content, regexFlags)
  let results: Array<
    { passed: boolean; path: string; message: string } | undefined
  >

  if (options['display-result-context']) {
    const contextPromises = await Promise.all(
      files.map(async file => {
        const contents = await fs.getFileContents(file)
        if (!contents) return

        const optionContextCharLength = options['context-char-length'] || 50
        const split = contents.split(regex)
        const isRegexHasMatch = split.length > 1
        if (!isRegexHasMatch) {
          return {
            passed: isNot ? !isRegexHasMatch : isRegexHasMatch,
            path: file,
            contextLines: [],
            message: `Doesn't contain '${getContent(options)}'`
          }
        }

        const fileLines = contents.split('\n')
        const chunkLineCounts = split.map(fileChunk => {
          if (fileChunk !== undefined) return fileChunk.split('\n').length
          return 1
        })
        const lineNumbers: number[] = []
        for (const [index, current] of chunkLineCounts.entries()) {
          if (lineNumbers.length === 0) {
            lineNumbers.push(current)
          } else if (current === 1 || index === chunkLineCounts.length - 1) {
            // no-op: trailing chunk or single-line separator
          } else {
            lineNumbers.push(current - 1 + lineNumbers.at(-1)!)
          }
        }
        const contextLines: ContextLine[] = []
        for (const current of lineNumbers) {
          const matchedLine = fileLines[current - 1]!
          if (regexFlags.includes('m')) {
            addMultilineContext(
              regex,
              matchedLine,
              current,
              optionContextCharLength,
              contextLines
            )
            continue
          }

          if (!regexFlags.includes('g')) {
            const currentMatch = regex.exec(matchedLine)
            if (currentMatch != undefined) {
              contextLines.push({
                line: current,
                context: getContext(
                  matchedLine,
                  currentMatch,
                  optionContextCharLength
                )
              })
              continue
            }
            throw new Error(
              `Regex matched in split but not on line (regex: ${options.content}, flags: ${regexFlags})`
            )
          }

          let currentMatch: RegExpExecArray | null
          while ((currentMatch = regex.exec(matchedLine)) !== null) {
            contextLines.push({
              line: current,
              context: getContext(
                matchedLine,
                currentMatch,
                optionContextCharLength
              )
            })
          }
        }

        return {
          passed: isNot ? !isRegexHasMatch : isRegexHasMatch,
          path: file,
          contextLines,
          message: `Contains '${getContent(options)}'`
        }
      })
    )
    const contextFilterResults = contextPromises.filter(
      (result): result is ContextResult & { passed: boolean } =>
        result !== undefined && (isNot ? !result.passed : result.passed)
    )
    const contextResults: Array<{
      passed: boolean
      path: string
      message: string
    }> = []
    for (const current of contextFilterResults) {
      for (const lineContext of current.contextLines) {
        contextResults.push({
          passed: current.passed,
          path: current.path,
          message: `${current.message} on line ${lineContext.line}, context: \n\t|${lineContext.context}`
        })
      }
    }
    results = contextResults
  } else {
    results = await Promise.all(
      files.map(async file => {
        const contents = await fs.getFileContents(file)
        if (!contents) return

        const isPassed = regex.test(contents)
        const message = `${
          isPassed ? 'Contains' : "Doesn't contain"
        } ${getContent(options)}`

        return {
          passed: isNot ? !isPassed : isPassed,
          path: file,
          message
        }
      })
    )
  }

  const filteredResults = results.filter(
    (r): r is { passed: boolean; path: string; message: string } =>
      r !== undefined
  )
  const isPassed = filteredResults.every(r => r.passed)
  return new Result('', filteredResults, isPassed)
}

export default fileContents
