// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect } from 'chai'
import GitHubMarkup from '../../dist/lib/github_markup.js'
import commandExists from 'command-exists'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

describe('lib', () => {
  describe('github_markup', function () {
    const gitHubMarkupInstalled = commandExists.sync('github-markup')
    this.timeout(30_000)

    if (gitHubMarkupInstalled) {
      it('should render a markdown file', async () => {
        const result = await GitHubMarkup.renderMarkup(
          `${__dirname}/MarkdownForTest.md`
        )
        expect(result).to.contain('Some text')
      })

      it('should render an rst file', async () => {
        const result = await GitHubMarkup.renderMarkup(
          `${__dirname}/rst_for_test.rst`
        )
        expect(result).to.contain(
          'https://opensource.newrelic.com/oss-category/#community-plus'
        )
      })

      it('should fail to render a non-markup file', async () => {
        const result = await GitHubMarkup.renderMarkup(
          `${__dirname}/image_for_test.png`
        )
        expect(result).to.equal(undefined)
      })

      it("should fail to render a file that doesn't exist", async () => {
        const result = await GitHubMarkup.renderMarkup(
          `${__dirname}/not_a_file`
        )
        expect(result).to.equal(undefined)
      })
    } else {
      it.skip('tests github markup functionality', () => {})
    }
  })
})
