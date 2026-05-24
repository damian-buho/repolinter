// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import path from 'path'
import { fileURLToPath } from 'url'
import { lint as markdownlint } from 'markdownlint/promise'
import { expect } from 'chai'
import toc from 'markdown-toc'
import { slug as slugger } from '../../dist/lib/github_slugger.js'
import FormatResult from '../../dist/lib/formatresult.js'
import RuleInfo from '../../dist/lib/ruleinfo.js'
import Result from '../../dist/lib/result.js'
import * as repolinter from '../../dist/index.js'
import formatter from '../../dist/formatters/markdown_formatter.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '../..')

describe('formatters', () => {
  describe('markdown_formatter', () => {
    /** @type {import('../..').LintResult} */
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

    const lintOpts = {
      config: {
        default: true,
        'no-inline-html': false,
        'line-length': false
      }
    }

    it('generates valid markdown with sample output', async () => {
      const actual = formatter.formatOutput(result, false)
      const opts = Object.assign(lintOpts, { strings: { test: actual } })

      const res = await markdownlint(opts)
      expect(res.test).to.have.length(0)
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

      for (let i = 0, len = expected.length; i < len; i++) {
        expect(filteredSections[i].lvl).to.equal(expected[i].lvl)
        expect(filteredSections[i].slug).to.contain(expected[i].slug)
      }
    })

    it('contains the disclaimer', () => {
      const output = formatter.formatOutput(result, false)

      expect(output).to.contain(result.formatOptions.disclaimer)
    })

    it('generates valid markdown when running against itself', async function () {
      this.timeout(30000)

      const lintres = await repolinter.lint(path.resolve(projectRoot))

      const actual = formatter.formatOutput(lintres, false)
      const opts = Object.assign(lintOpts, { strings: { test: actual } })

      const res = await markdownlint(opts)

      expect(res.test).to.deep.equal([])
    })

    it('does not contain the string "undefined"', async function () {
      this.timeout(30000)

      const lintres = await repolinter.lint(path.resolve(projectRoot))

      const actual = formatter.formatOutput(lintres, false)

      expect(actual).to.not.contain('undefined')
    })
  })
})
