// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import nodeFs from 'node:fs'
import nodePath from 'node:path'
import nodeOs from 'node:os'
import { check, LinkState, type LinkResult } from 'linkinator'
import GitHubMarkup from '../lib/github-markup.js'
import type FileSystem from '../lib/file-system.js'
import Result from '../lib/result.js'

interface FileNoBrokenLinksOptions {
  globsAll: string[]
  nocase?: boolean
  'succeed-on-non-existent'?: boolean
  'pass-external-relative-links'?: boolean
}

const MD_LINK_RE = /\[[^\]]*\]\(([^)]+)\)/g
const RST_LINK_RE = /`[^`]+<([^>]+)>`_/g
const MARKDOWN_EXTS = new Set(['.md', '.markdown', '.mdown', '.mkd', '.mkdn'])

async function checkFile(
  fileSystem: FileSystem,
  file: string,
  options: FileNoBrokenLinksOptions
): Promise<{ passed: boolean; path: string; message: string }> {
  const extension = nodePath.extname(file).toLowerCase()
  if (MARKDOWN_EXTS.has(extension)) {
    return checkMarkdownFile(fileSystem, file, options)
  }

  const rendered = await GitHubMarkup.renderMarkup(
    nodePath.posix.resolve(fileSystem.targetDirectory, file)
  )
  if (rendered === undefined) {
    return {
      passed: true,
      path: file,
      message: 'Ignored due to unknown file format.'
    }
  }

  return checkRenderedHtml(fileSystem, file, rendered, options)
}

async function checkMarkdownFile(
  fileSystem: FileSystem,
  file: string,
  options: FileNoBrokenLinksOptions
): Promise<{ passed: boolean; path: string; message: string }> {
  const result = await check({
    path: file,
    serverRoot: fileSystem.targetDirectory,
    markdown: true,
    recurse: false,
    timeout: 10_000
  })

  return processResults(result.links, file, fileSystem, options)
}

async function checkRenderedHtml(
  fileSystem: FileSystem,
  file: string,
  html: string,
  options: FileNoBrokenLinksOptions
): Promise<{ passed: boolean; path: string; message: string }> {
  const temporaryDirectory = await nodeFs.promises.mkdtemp(
    nodePath.join(nodeOs.tmpdir(), 'repolinter-')
  )
  const baseName = nodePath.basename(file, nodePath.extname(file)) + '.html'
  const temporaryFile = nodePath.join(temporaryDirectory, baseName)
  await nodeFs.promises.writeFile(temporaryFile, html)

  try {
    const result = await check({
      path: temporaryFile,
      serverRoot: temporaryDirectory,
      recurse: false,
      timeout: 10_000
    })

    return processResults(result.links, file, fileSystem, options)
  } finally {
    await nodeFs.promises.rm(temporaryDirectory, {
      recursive: true,
      force: true
    })
  }
}

async function processResults(
  links: LinkResult[],
  file: string,
  fileSystem: FileSystem,
  options: FileNoBrokenLinksOptions
): Promise<{ passed: boolean; path: string; message: string }> {
  const brokenLinks = links.filter(
    l => l.state === LinkState.BROKEN && l.parent != undefined
  )

  if (options['pass-external-relative-links'] && brokenLinks.length > 0) {
    const externalTargets = await extractExternalLinkTargets(fileSystem, file)
    const filtered = brokenLinks.filter(l => !externalTargets.has(l.url))
    return buildResult(filtered, file)
  }

  return buildResult(brokenLinks, file)
}

async function extractExternalLinkTargets(
  fileSystem: FileSystem,
  file: string
): Promise<Set<string>> {
  const content = await fileSystem.getFileContents(file)
  if (!content) return new Set()

  const targets = new Set<string>()
  const linkRe = file.endsWith('.rst') ? RST_LINK_RE : MD_LINK_RE
  for (const match of content.matchAll(linkRe)) {
    const target = match[1]
    if (!target || !target.startsWith('../')) continue
    const resolved = nodePath.posix.normalize(
      nodePath.posix.join(nodePath.posix.dirname(file), target)
    )
    if (resolved.startsWith('..')) {
      targets.add(nodePath.posix.basename(target))
    }
  }
  return targets
}

function buildResult(
  brokenLinks: LinkResult[],
  file: string
): { passed: boolean; path: string; message: string } {
  if (brokenLinks.length === 0) {
    return { passed: true, path: file, message: 'All links are valid' }
  }

  const messages = brokenLinks.map(l => {
    const status = l.status
      ? `status code ${l.status}`
      : l.failureDetails?.[0] instanceof Error
        ? l.failureDetails[0].message
        : 'unknown error'
    return `\`${l.url}\` (${status})`
  })

  return {
    passed: false,
    path: file,
    message: messages.join(', ')
  }
}

async function fileNoBrokenLinks(
  fileSystem: FileSystem,
  options: FileNoBrokenLinksOptions
): Promise<Result> {
  const files = await fileSystem.findAllFiles(
    options.globsAll,
    !!options.nocase
  )

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
    files.map(f => checkFile(fileSystem, f, options))
  )

  const passed = results.every(r => r.passed)
  return new Result(passed ? '' : 'Found broken links', results, passed)
}

export default fileNoBrokenLinks
