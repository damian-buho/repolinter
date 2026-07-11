#!/usr/bin/env node
// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'
import { parseArgs } from 'node:util'
import { simpleGit } from 'simple-git'
import * as repolinter from './index.js'
import type { Formatter } from './index.js'

const KEBAB_MAP: Record<string, string> = {
  '--ruleset-file': '--rulesetFile',
  '--ruleset-url': '--rulesetUrl',
  '--ruleset-encoded': '--rulesetEncoded'
}

function normalizeArgv(argv: string[]): string[] {
  return argv.map(argument => KEBAB_MAP[argument] ?? argument)
}

function printHelp(): void {
  console.log(`repolinter - linter for open source repositories

Usage:
  repolinter lint [directory] [options]

Options:
  -d, --dryRun               Prevent modifications to disk, generate suggested changes report
  -a, --allowPaths <paths>   Limit to specified directories (repeatable)
  -r, --rulesetFile <path>   Alternate ruleset file (mutually exclusive with other ruleset options)
  -u, --rulesetUrl <url>     Alternate ruleset URL (mutually exclusive with other ruleset options)
  -c, --rulesetEncoded <b64> Base64-encoded ruleset (mutually exclusive with other ruleset options)
  -g, --git                  Clone a git repository before linting
  -f, --format <type>        Output format: "json", "markdown", "pr-comment", or "console" (default: "console")
  -h, --help                 Show this help message`)
}

const git = simpleGit()

try {
  const { values, positionals } = parseArgs({
    args: normalizeArgv(process.argv.slice(2)),
    options: {
      dryRun: { type: 'boolean', short: 'd', default: false },
      allowPaths: { type: 'string', short: 'a', multiple: true, default: [] },
      rulesetFile: { type: 'string', short: 'r' },
      rulesetUrl: { type: 'string', short: 'u' },
      rulesetEncoded: { type: 'string', short: 'c' },
      git: { type: 'boolean', short: 'g', default: false },
      format: { type: 'string', short: 'f', default: 'console' },
      help: { type: 'boolean', short: 'h', default: false }
    },
    strict: true,
    allowPositionals: true
  })

  if (values.help) {
    printHelp()
  } else {
    const command = positionals[0]
    if (command && command !== 'lint') {
      console.error(`Unknown command: ${command}`)
      process.exitCode = 1
    } else if (
      values.rulesetFile &&
      (values.rulesetUrl || values.rulesetEncoded)
    ) {
      console.error(
        'Error: --rulesetFile is mutually exclusive with --rulesetUrl and --rulesetEncoded'
      )
      process.exitCode = 1
    } else if (values.rulesetEncoded && values.rulesetUrl) {
      console.error(
        'Error: --rulesetEncoded is mutually exclusive with --rulesetUrl'
      )
      process.exitCode = 1
    } else {
      const directory =
        command === 'lint' ? (positionals[1] ?? './') : (positionals[0] ?? './')

      await runLint(directory, values)
    }
  }
} catch (error: unknown) {
  if (error instanceof Error && error.message.startsWith('Unknown option')) {
    console.error(error.message)
    process.exitCode = 1
  } else {
    throw error
  }
}

async function runLint(
  directory: string,
  values: {
    git?: boolean
    dryRun?: boolean
    allowPaths?: string[]
    rulesetFile?: string
    rulesetUrl?: string
    rulesetEncoded?: string
    format?: string
  }
): Promise<void> {
  let temporaryDirectory: string | undefined
  if (values.git) {
    temporaryDirectory = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), 'repolinter-')
    )
    const result = await git.clone(directory, temporaryDirectory)
    if (result) {
      console.error(result)
      process.exitCode = 1
      try {
        await fs.promises.rm(temporaryDirectory, {
          recursive: true,
          force: true
        })
      } catch {}
      return
    }
  }
  const output = await repolinter.lint(
    temporaryDirectory ?? path.resolve(process.cwd(), directory),
    values.allowPaths ?? [],
    values.rulesetUrl || values.rulesetFile || values.rulesetEncoded,
    values.dryRun ?? false
  )
  let formatter: Formatter
  if (values.format && values.format.toLowerCase() === 'json') {
    formatter = repolinter.jsonFormatter
  } else if (values.format && values.format.toLowerCase() === 'markdown') {
    formatter = repolinter.markdownFormatter
  } else if (values.format && values.format.toLowerCase() === 'pr-comment') {
    formatter = repolinter.prCommentFormatter
  } else {
    formatter = repolinter.defaultFormatter
  }
  const formattedOutput = formatter.formatOutput(output, values.dryRun ?? false)
  console.log(formattedOutput)
  process.exitCode = output.passed ? 0 : 1
  if (temporaryDirectory) {
    try {
      await fs.promises.rm(temporaryDirectory, {
        recursive: true,
        force: true
      })
    } catch {}
  }
}
