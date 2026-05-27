// Copyright 2022 TODO Group. All rights reserved.
// SPDX-FileCopyrightText: 2017 TODO Group
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
//
// SPDX-License-Identifier: Apache-2.0

import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import nock from 'nock'

describe('rule', () => {
  describe('Best Practices Badge', () => {
    let BestpracticesBadgePresent

    before(async () => {
      const bestPracticesModule =
        await import('../../dist/rules/best-practices-badge-present.js')
      BestpracticesBadgePresent = bestPracticesModule.default
    })

    it('fails if readme is missing', async () => {
      const mockfs = {
        findAllFiles: () => [],
        getFileContents: () => {},
        targetDir: '.'
      }

      const actual = await BestpracticesBadgePresent(mockfs)
      assert.strictEqual(actual.passed, false)
      assert.ok(actual.message.includes('not find'))
    })

    it('fails if readme does not contain the Best Practices Badge', async () => {
      const mockfs = {
        findAllFiles: () => ['README'],
        getFileContents: () => '...',
        targetDir: '.'
      }

      const actual = await BestpracticesBadgePresent(mockfs)
      assert.strictEqual(actual.passed, false)
      assert.strictEqual(actual.targets.length, 1)
      assert.strictEqual(
        actual.targets[0].message,
        "Doesn't contain Best Practices Badge"
      )
    })

    it('passes if readme contains the Best Practices badge (URL with locale)', async () => {
      const mockfs = {
        findAllFiles: () => ['README'],
        getFileContents: () =>
          '[badge](https://bestpractices.coreinfrastructure.org/en/projects/100)',
        targetDir: '.'
      }

      const actual = await BestpracticesBadgePresent(mockfs)
      assert.strictEqual(actual.passed, true)
    })

    it('passes if readme contains the Best Practices Badge (URL without locale)', async () => {
      const mockfs = {
        findAllFiles: () => ['README'],
        getFileContents: () =>
          '[badge](https://bestpractices.coreinfrastructure.org/projects/100)',
        targetDir: '.'
      }

      const actual = await BestpracticesBadgePresent(mockfs)
      assert.strictEqual(actual.passed, true)
    })

    it('fails if readme contains the Best Practices Badge has invalid URL', async () => {
      const mockfs = {
        findAllFiles: () => ['README'],
        getFileContents: () =>
          'https://bestpractices.coreinfrastructure.org/en/projects/wrong',
        targetDir: '.'
      }

      const actual = await BestpracticesBadgePresent(mockfs)
      assert.strictEqual(actual.passed, false)
    })
    describe('minPercentage', () => {
      const mockfs = {
        findAllFiles: () => ['README'],
        getFileContents: () =>
          '[badge](https://bestpractices.coreinfrastructure.org/projects/100)',
        targetDir: '.'
      }

      it('passes when minPercentage is not set', async () => {
        const actual = await BestpracticesBadgePresent(mockfs, {
          minPercentage: undefined
        })
        assert.strictEqual(actual.passed, true)
      })

      it('passes when minPercentage is set to 0', async () => {
        const actual = await BestpracticesBadgePresent(mockfs, {
          minPercentage: 0
        })
        assert.strictEqual(actual.passed, true)
      })

      it('fails when minPercentage is > than percentage returned by API', async () => {
        const scope = nock('https://bestpractices.coreinfrastructure.org')
          .get('/projects/100.json')
          .reply(200, { tiered_percentage: 99 })

        const actual = await BestpracticesBadgePresent(mockfs, {
          minPercentage: 100
        })
        assert.strictEqual(actual.passed, false)
        scope.done()
      })

      it('fails when minPercentage is set but API does not return 200', async () => {
        const scope = nock('https://bestpractices.coreinfrastructure.org')
          .get('/projects/100.json')
          .reply(404)

        const actual = await BestpracticesBadgePresent(mockfs, {
          minPercentage: 100
        })
        assert.strictEqual(actual.passed, false)
        scope.done()
      })

      it('passes when minPercentage is <= than percentage returned by API', async () => {
        const scope = nock('https://bestpractices.coreinfrastructure.org')
          .get('/projects/100.json')
          .reply(200, { tiered_percentage: 100 })

        const actual = await BestpracticesBadgePresent(mockfs, {
          minPercentage: 100
        })
        assert.strictEqual(actual.passed, true)
        scope.done()
      })
    })
  })
})
