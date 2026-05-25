// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import GitHubMarkup from '../../dist/lib/github-markup.js'
import commandExists from 'command-exists'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

describe('lib', () => {
  describe(
    'github_markup',
    () => {
      const gitHubMarkupInstalled = commandExists.sync('github-markup')

      if (gitHubMarkupInstalled) {
        it('should render a markdown file', async () => {
          const result = await GitHubMarkup.renderMarkup(
            `${__dirname}/MarkdownForTest.md`
          )
          assert.ok(result.includes('Some text'))
        })

        it('should render an rst file', async () => {
          const result = await GitHubMarkup.renderMarkup(
            `${__dirname}/rst_for_test.rst`
          )
          assert.ok(
            result.includes(
              'https://opensource.newrelic.com/oss-category/#community-plus'
            )
          )
        })

        it('should fail to render a non-markup file', async () => {
          const result = await GitHubMarkup.renderMarkup(
            `${__dirname}/image_for_test.png`
          )
          assert.strictEqual(result, undefined)
        })

        it("should fail to render a file that doesn't exist", async () => {
          const result = await GitHubMarkup.renderMarkup(
            `${__dirname}/not_a_file`
          )
          assert.strictEqual(result, undefined)
        })
      } else {
        it.skip('tests github markup functionality', () => {})
      }
    },
    { timeout: 30_000 }
  )
})
