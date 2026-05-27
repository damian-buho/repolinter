// SPDX-FileCopyrightText: 2017 TODO Group
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
//
// SPDX-License-Identifier: Apache-2.0

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { lint as markdownlint } from 'markdownlint/promise'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import toc from 'markdown-toc'
import { slug as slugger } from '../../dist/lib/github-slugger.js'
import FormatResult from '../../dist/lib/formatresult.js'
import RuleInfo from '../../dist/lib/ruleinfo.js'
import Result from '../../dist/lib/result.js'
import * as repolinter from '../../dist/index.js'
import formatter from '../../dist/formatters/markdown-formatter.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '../..')

describe('formatters', () => {
  describe('markdown_formatter', () => {
    const result = {
      passed: true,
      errored: false,
      errMsg: 'this is an error message',
      results: [
        FormatResult.CreateLintOnly(
          new RuleInfo('myrule', 'error', [], 'file-existence', {}),
          new Result('Did it!', [], true)
        ),
        FormatResult.CreateIgnored(
          new RuleInfo('myrule-other-rule', 'error', [], 'file-existence', {}),
          'whoops'
        )
      ],
      targets: {
        language: new Result('No language?', [], false)
      },
      params: {
        targetDir: '.',
        filterPaths: [],
        ruleset: {}
      },
      formatOptions: {
        disclaimer: 'This is a disclaimer.'
      }
    }

    const lintOptions = {
      config: {
        default: true,
        'no-inline-html': false,
        'line-length': false
      }
    }

    it('generates valid markdown with sample output', async () => {
      const actual = formatter.formatOutput(result, false)
      const options = Object.assign(lintOptions, { strings: { test: actual } })

      const lintResult = await markdownlint(options)
      assert.strictEqual(lintResult.test.length, 0)
    })

    it('generates the correct sections with sample output', () => {
      const output = formatter.formatOutput(result, false)
      const sections = toc(output, {
        slugify: slugger,
        firsth1: true
      }).json
      const filteredSections = sections.filter(s => s.lvl !== 1)

      const expected = [
        { slug: 'passed', lvl: 2 },
        { slug: '-myrule', lvl: 3 },
        { slug: 'ignored', lvl: 2 },
        { slug: 'myrule-other-rule', lvl: 3 }
      ]

      for (let index = 0, length = expected.length; index < length; index++) {
        assert.strictEqual(filteredSections[index].lvl, expected[index].lvl)
        assert.ok(filteredSections[index].slug.includes(expected[index].slug))
      }
    })

    it('contains the disclaimer', () => {
      const output = formatter.formatOutput(result, false)

      assert.ok(output.includes(result.formatOptions.disclaimer))
    })

    it(
      'generates valid markdown when running against itself',
      async () => {
        const lintres = await repolinter.lint(path.resolve(projectRoot))

        const actual = formatter.formatOutput(lintres, false)
        const options = Object.assign(lintOptions, {
          strings: { test: actual }
        })

        const result = await markdownlint(options)

        assert.deepStrictEqual(result.test, [])
      },
      { timeout: 30_000 }
    )

    it(
      'does not contain the string "undefined"',
      async () => {
        const lintres = await repolinter.lint(path.resolve(projectRoot))

        const actual = formatter.formatOutput(lintres, false)

        assert.ok(!actual.includes('undefined'))
      },
      { timeout: 30_000 }
    )
  })
})
