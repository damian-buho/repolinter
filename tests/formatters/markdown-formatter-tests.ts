// SPDX-FileCopyrightText: 2017 TODO Group
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
//
// SPDX-License-Identifier: Apache-2.0

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { lint as markdownlint } from 'markdownlint/promise'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { slug as slugger } from '../../src/lib/github-slugger.js'

interface Heading {
  lvl: number
  slug: string
}

function extractHeadings(markdown: string): Heading[] {
  return markdown
    .split('\n')
    .filter((line: string) => /^#{1,6}\s/.test(line))
    .map((line: string) => {
      const match = line.match(/^(#{1,6})\s+(.*)/)
      return { lvl: match![1]!.length, slug: slugger(match![2]!) }
    })
}
import FormatResult from '../../src/lib/formatresult.js'
import RuleInfo from '../../src/lib/ruleinfo.js'
import Result from '../../src/lib/result.js'
import * as repolinter from '../../src/index.js'
import type { LintResult } from '../../src/index.js'
import formatter from '../../src/formatters/markdown-formatter.js'

const __dirname: string = path.dirname(fileURLToPath(import.meta.url))
const projectRoot: string = path.resolve(__dirname, '../..')

describe('formatters', () => {
  describe('markdown_formatter', () => {
    const result: LintResult & { formatOptions: { disclaimer: string } } = {
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
        targetDirectory: '.',
        filterPaths: [],
        rulesetPath: undefined,
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
      const actual: string = formatter.formatOutput(result, false)
      const options = Object.assign(lintOptions, { strings: { test: actual } })

      const lintResult = await markdownlint(options)
      assert.strictEqual(lintResult.test.length, 0)
    })

    it('generates the correct sections with sample output', () => {
      const output: string = formatter.formatOutput(result, false)
      const sections: Heading[] = extractHeadings(output)
      const filteredSections: Heading[] = sections.filter(
        (s: Heading) => s.lvl !== 1
      )

      const expected: Heading[] = [
        { slug: 'passed', lvl: 2 },
        { slug: '-myrule', lvl: 3 },
        { slug: 'ignored', lvl: 2 },
        { slug: 'myrule-other-rule', lvl: 3 }
      ]

      for (const [index, element] of expected.entries()) {
        assert.strictEqual(filteredSections[index]!.lvl, element.lvl)
        assert.ok(filteredSections[index]!.slug.includes(element.slug))
      }
    })

    it('contains the disclaimer', () => {
      const output: string = formatter.formatOutput(result, false)

      assert.ok(output.includes(result.formatOptions.disclaimer))
    })

    it(
      'generates valid markdown when running against itself',
      async () => {
        const lintres: LintResult = await repolinter.lint(
          path.resolve(projectRoot)
        )

        const actual: string = formatter.formatOutput(lintres, false)
        const options = Object.assign(lintOptions, {
          strings: { test: actual }
        })

        const lintResult = await markdownlint(options)

        assert.deepStrictEqual(lintResult.test, [])
      },
      { timeout: 30_000 }
    )

    it(
      'does not contain the string "undefined"',
      async () => {
        const lintres: LintResult = await repolinter.lint(
          path.resolve(projectRoot)
        )

        const actual: string = formatter.formatOutput(lintres, false)

        assert.ok(!actual.includes('undefined'))
      },
      { timeout: 30_000 }
    )
  })
})
