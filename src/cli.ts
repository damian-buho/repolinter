#!/usr/bin/env node
// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { simpleGit } from 'simple-git'
import * as repolinter from './index.js'
import type { Formatter } from './index.js'

const git = simpleGit()

yargs(hideBin(process.argv))
  .command(
    ['lint [directory]', '*'],
    'run repolinter on the specified directory, outputting results to STDOUT.',
    yargs => {
      yargs
        .positional('directory', {
          describe: 'The target directory to lint',
          default: './',
          type: 'string'
        })
        .option('dryRun', {
          alias: 'd',
          describe:
            'Prevents repolinter from making any modifications to disk, instead generating a report of suggested modifications.',
          default: false,
          type: 'boolean'
        })
        .option('allowPaths', {
          alias: 'a',
          describe:
            'Limits repolinter to the specified list of directories (directories must still be contained in the target directory).',
          default: [],
          type: 'array'
        })
        .option('rulesetFile', {
          alias: 'r',
          describe:
            'Specify an alternate file location for repolinter configuration to use. This option is mutually exclusive from all other "ruleset*" options. If no "ruleset*" option provided, repolinter will use default repolinter.json/repolinter.yaml at the root of the project.',
          type: 'string'
        })
        .option('rulesetUrl', {
          alias: 'u',
          describe:
            'Specify an alternate URL location for repolinter configuration to use. This option is mutually exclusive from all other "ruleset*" options. If no "ruleset*" option provided, repolinter will use default repolinter.json/repolinter.yaml at the root of the project.',
          type: 'string'
        })
        .option('rulesetEncoded', {
          alias: 'c',
          describe:
            'Specify a base64 encoded ruleset that repolinter will decode and use instead. This option is mutually exclusive from all other "ruleset*" options. If no "ruleset*" option provided, repolinter will use default repolinter.json/repolinter.yaml at the root of the project',
          type: 'string'
        })
        .option('git', {
          alias: 'g',
          describe:
            'Lint a git repository instead of a directory. The URL specified in the directory parameter will be cloned into a temporary directory in order for repolinter to process it.',
          default: false,
          type: 'boolean'
        })
        .option('format', {
          alias: 'f',
          describe:
            'Specify the formatter to use for the output ("json", "markdown", or "console")',
          default: 'console',
          type: 'string'
        })
        .conflicts('rulesetFile', ['rulesetUrl', 'rulesetEncoded'])
        .conflicts('rulesetEncoded', 'rulesetUrl')
    },
    async argv => {
      let temporaryDirectory: string | undefined
      if (argv.git) {
        temporaryDirectory = await fs.promises.mkdtemp(
          path.join(os.tmpdir(), 'repolinter-')
        )
        const result = await git.clone(
          argv.directory as string,
          temporaryDirectory
        )
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
        temporaryDirectory ??
          path.resolve(process.cwd(), argv.directory as string),
        argv.allowPaths as string[],
        argv.rulesetUrl || argv.rulesetFile || argv.rulesetEncoded,
        argv.dryRun as boolean
      )
      let formatter: Formatter
      if (argv.format && (argv.format as string).toLowerCase() === 'json') {
        formatter = repolinter.jsonFormatter
      } else if (
        argv.format &&
        (argv.format as string).toLowerCase() === 'markdown'
      ) {
        formatter = repolinter.markdownFormatter
      } else {
        formatter = repolinter.defaultFormatter
      }
      const formattedOutput = formatter.formatOutput(
        output,
        argv.dryRun as boolean
      )
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
  )
  .demandCommand()
  .help()
  .strict()
  .parse()
