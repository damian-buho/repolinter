// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import blc from 'broken-link-checker'
const { HtmlChecker } = blc
import path from 'path'
import { URL } from 'url'
import GitHubMarkup from '../lib/github_markup.js'
import type FileSystem from '../lib/file_system.js'
import Result from '../lib/result.js'

interface FileNoBrokenLinksOptions {
  globsAll: string[]
  nocase?: boolean
  'succeed-on-non-existent'?: boolean
  'pass-external-relative-links'?: boolean
  excludedKeywords?: string[]
}

interface BrokenLink {
  broken: boolean
  brokenReason?: string
  url: { original: string; resolved?: string }
  base: { resolved: string }
  http: { response?: { status: number } }
}

async function fileNoBrokenLinks(
  fs: FileSystem,
  options: FileNoBrokenLinksOptions
): Promise<Result> {
  const files = await fs.findAllFiles(options.globsAll, !!options.nocase)

  if (files.length === 0) {
    return new Result(
      'Did not find file matching the specified patterns',
      options.globsAll.map(f => {
        return { passed: false, pattern: f }
      }),
      !!options['succeed-on-non-existent']
    )
  }

  const results = await Promise.all(
    files.map(async f => {
      const absMdPath = path.posix.resolve(fs.targetDir, f)
      const rendered = await GitHubMarkup.renderMarkup(absMdPath)
      if (rendered === null) {
        return {
          passed: true,
          path: f,
          message: 'Ignored due to unknown file format.'
        }
      }

      const linkRes = await new Promise<BrokenLink[]>((resolve, reject) => {
        const linkBuf: BrokenLink[] = []
        const htmlChecker = new HtmlChecker(
          {
            ...options,
            excludedKeywords: ['#*']
          },
          {
            link: (res: BrokenLink) => linkBuf.push(res),
            complete: () => resolve(linkBuf)
          }
        )

        const didScan = htmlChecker.scan(
          rendered,
          new URL(`file://${path.posix.join(fs.targetDir, f)}`)
        )
        if (!didScan)
          reject(Error('Failed to scan HTML with broken link checker'))
      })

      const brokenLinks = linkRes.filter(link => link.broken)
      const { failing, invalid } = brokenLinks.reduce(
        (res, linkResult) => {
          linkResult.brokenReason === 'BLC_INVALID'
            ? res.invalid.push(linkResult)
            : res.failing.push(linkResult)
          return res
        },
        { failing: [] as BrokenLink[], invalid: [] as BrokenLink[] }
      )
      const failingMessages = failing.map(
        ({ brokenReason, url: { original }, http: { response } }) =>
          `\`${original}\` (${
            brokenReason?.includes('HTTP')
              ? `status code ${response?.status}`
              : `unknown error ${brokenReason}`
          })`
      )
      const failingInvalidMessagesWithNulls = await Promise.all(
        invalid.map(async b => {
          const originalURL = b.url.original
          const baseURL = b.base.resolved
          let url: URL
          try {
            url = new URL(originalURL, baseURL)
            if (url.protocol !== 'file:' || !url.pathname)
              return `\`${originalURL}\` (invalid URL)`
          } catch {
            return `\`${originalURL}\` (invalid path)`
          }
          if (path.posix.isAbsolute(originalURL))
            return `\`${originalURL}\` (invalid path)`
          const targetDir = path.posix.resolve(fs.targetDir)
          const filePath = path.posix.join('/', url.host, url.pathname)
          const absPath = path.posix.resolve(targetDir, filePath)
          const relPath = path.posix.relative(targetDir, absPath)
          if (relPath.startsWith('..')) {
            if (options['pass-external-relative-links']) return null
            else return `\`${originalURL}\` (relative link outside project)`
          }
          if (!(await fs.relativeFileExists(relPath)))
            return `\`${originalURL}\` (file does not exist)`
          return null
        })
      )
      const failingInvalidMessages = failingInvalidMessagesWithNulls.filter(
        (m): m is string => m !== null
      )
      const allMessages = failingInvalidMessages.concat(failingMessages)
      return {
        passed: allMessages.length === 0,
        path: f,
        message:
          allMessages.length === 0
            ? 'All links are valid'
            : allMessages.join(', ')
      }
    })
  )
  const passed = results.every(({ passed }) => passed)
  return new Result(passed ? '' : 'Found broken links', results, passed)
}

export default fileNoBrokenLinks
