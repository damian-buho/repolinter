// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
//
// SPDX-License-Identifier: Apache-2.0

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { withMockedEndpoints, type MockedEndpoint } from '../lib/mock-fetch.js'
import githubIssueCreate from '../../src/fixes/github-issue-create.js'

const ORIGIN = 'https://api.github.com'
const LABELS_PATH = '/repos/o/r/labels'
const ISSUES_PATH = '/repos/o/r/issues'

function issuesListPath(labels: string[]): string {
  const query = new URLSearchParams({
    direction: 'desc',
    labels: labels.join(','),
    sort: 'created',
    state: 'all'
  }).toString()
  return `${ISSUES_PATH}?${query}`
}

function labelChecked(label: string, status = 200): MockedEndpoint {
  return {
    method: 'GET',
    path: `${LABELS_PATH}/${encodeURIComponent(label)}`,
    status,
    body: status === 200 ? { name: label } : { message: 'Not Found' }
  }
}

async function withEnvironment(
  variables: { targetRepository?: string; token?: string },
  action: () => Promise<void>
): Promise<void> {
  const previousRepository = process.env['TARGET_REPO']
  const previousToken = process.env['GITHUB_TOKEN']
  if (variables.targetRepository === undefined) {
    delete process.env['TARGET_REPO']
  } else {
    process.env['TARGET_REPO'] = variables.targetRepository
  }
  if (variables.token === undefined) {
    delete process.env['GITHUB_TOKEN']
  } else {
    process.env['GITHUB_TOKEN'] = variables.token
  }
  try {
    await action()
  } finally {
    if (previousRepository === undefined) {
      delete process.env['TARGET_REPO']
    } else {
      process.env['TARGET_REPO'] = previousRepository
    }
    if (previousToken === undefined) {
      delete process.env['GITHUB_TOKEN']
    } else {
      process.env['GITHUB_TOKEN'] = previousToken
    }
  }
}

describe('fixes', () => {
  describe('github-issue-create', () => {
    it('fails when TARGET_REPO or GITHUB_TOKEN are missing', async () => {
      /**
      @type {any}
      */
      const mockFs = {}
      await withEnvironment(
        { targetRepository: undefined, token: undefined },
        async () => {
          const result = await withMockedEndpoints(
            ORIGIN,
            [],
            async () =>
              await githubIssueCreate(
                mockFs,
                {
                  issueBody: 'body',
                  issueLabels: ['l1'],
                  issueTitle: 'title'
                },
                [],
                false
              )
          )
          assert.strictEqual(result.passed, false)
          assert.ok(result.message?.includes('TARGET_REPO'))
        }
      )
    })

    it('makes no network calls with dryRun enabled', async () => {
      /**
      @type {any}
      */
      const mockFs = {}
      await withEnvironment(
        { targetRepository: undefined, token: undefined },
        async () => {
          const result = await withMockedEndpoints(
            ORIGIN,
            [],
            async () =>
              await githubIssueCreate(
                mockFs,
                {
                  issueBody: 'body',
                  issueLabels: ['l1'],
                  issueTitle: 'title'
                },
                [],
                true
              )
          )
          assert.strictEqual(result.passed, true)
          assert.ok(result.message?.includes('dry run'))
        }
      )
    })

    it('creates labels and an issue when none exist', async () => {
      /**
      @type {any}
      */
      const mockFs = {}
      await withEnvironment(
        { targetRepository: 'o/r', token: 'secret' },
        async () => {
          const result = await withMockedEndpoints(
            ORIGIN,
            [
              labelChecked('l1'),
              labelChecked('l2'),
              labelChecked('CC: Bypass', 404),
              {
                method: 'POST',
                path: LABELS_PATH,
                status: 201,
                body: { name: 'CC: Bypass' }
              },
              {
                method: 'GET',
                path: issuesListPath(['l1', 'l2']),
                status: 200,
                body: []
              },
              {
                method: 'POST',
                path: ISSUES_PATH,
                status: 201,
                body: { number: 7 }
              }
            ],
            async () =>
              await githubIssueCreate(
                mockFs,
                {
                  issueBody: 'body',
                  issueLabels: ['l1', 'l2'],
                  issueTitle: 'title',
                  uniqueRuleId: 'rule-1'
                },
                [],
                false
              )
          )
          assert.strictEqual(result.passed, true)
          assert.ok(result.message?.includes('#7'))
        }
      )
    })

    it('does not create an issue when an open one already tracks the rule', async () => {
      /**
      @type {any}
      */
      const mockFs = {}
      await withEnvironment(
        { targetRepository: 'o/r', token: 'secret' },
        async () => {
          const result = await withMockedEndpoints(
            ORIGIN,
            [
              labelChecked('l1'),
              labelChecked('CC: Bypass'),
              {
                method: 'GET',
                path: issuesListPath(['l1']),
                status: 200,
                body: [
                  {
                    body: 'body\nUnique rule set ID: rule-1',
                    labels: [{ name: 'l1' }],
                    number: 3,
                    state: 'open'
                  }
                ]
              }
            ],
            async () =>
              await githubIssueCreate(
                mockFs,
                {
                  issueBody: 'body',
                  issueLabels: ['l1'],
                  issueTitle: 'title',
                  uniqueRuleId: 'rule-1'
                },
                [],
                false
              )
          )
          assert.strictEqual(result.passed, true)
          assert.ok(result.message?.includes('already tracks'))
        }
      )
    })

    it('skips issues carrying the bypass label', async () => {
      /**
      @type {any}
      */
      const mockFs = {}
      await withEnvironment(
        { targetRepository: 'o/r', token: 'secret' },
        async () => {
          const result = await withMockedEndpoints(
            ORIGIN,
            [
              labelChecked('l1'),
              labelChecked('CC: Bypass'),
              {
                method: 'GET',
                path: issuesListPath(['l1']),
                status: 200,
                body: [
                  {
                    body: 'body\nUnique rule set ID: rule-1',
                    labels: [{ name: 'l1' }, { name: 'CC: Bypass' }],
                    number: 4,
                    state: 'open'
                  }
                ]
              }
            ],
            async () =>
              await githubIssueCreate(
                mockFs,
                {
                  issueBody: 'body',
                  issueLabels: ['l1'],
                  issueTitle: 'title',
                  uniqueRuleId: 'rule-1'
                },
                [],
                false
              )
          )
          assert.strictEqual(result.passed, true)
          assert.ok(result.message?.includes('bypass'))
        }
      )
    })

    it('re-opens and comments on a regressed closed issue', async () => {
      /**
      @type {any}
      */
      const mockFs = {}
      await withEnvironment(
        { targetRepository: 'o/r', token: 'secret' },
        async () => {
          const result = await withMockedEndpoints(
            ORIGIN,
            [
              labelChecked('l1'),
              labelChecked('CC: Bypass'),
              {
                method: 'GET',
                path: issuesListPath(['l1']),
                status: 200,
                body: [
                  {
                    body: 'body\nUnique rule set ID: rule-1',
                    labels: [{ name: 'l1' }],
                    number: 5,
                    state: 'closed'
                  }
                ]
              },
              {
                method: 'PATCH',
                path: `${ISSUES_PATH}/5`,
                status: 200,
                body: { number: 5, state: 'open' }
              },
              {
                method: 'POST',
                path: `${ISSUES_PATH}/5/comments`,
                status: 201,
                body: {}
              }
            ],
            async () =>
              await githubIssueCreate(
                mockFs,
                {
                  commentBody: 'regressed',
                  issueBody: 'body',
                  issueLabels: ['l1'],
                  issueTitle: 'title',
                  uniqueRuleId: 'rule-1'
                },
                [],
                false
              )
          )
          assert.strictEqual(result.passed, true)
          assert.ok(result.message?.includes('re-opened'))
        }
      )
    })

    it('fails when the API answers with an error', async () => {
      /**
      @type {any}
      */
      const mockFs = {}
      await withEnvironment(
        { targetRepository: 'o/r', token: 'secret' },
        async () => {
          const result = await withMockedEndpoints(
            ORIGIN,
            [
              labelChecked('l1'),
              labelChecked('CC: Bypass'),
              {
                method: 'GET',
                path: issuesListPath(['l1']),
                status: 200,
                body: []
              },
              {
                method: 'POST',
                path: ISSUES_PATH,
                status: 422,
                body: { message: 'Validation Failed' }
              }
            ],
            async () =>
              await githubIssueCreate(
                mockFs,
                {
                  issueBody: 'body',
                  issueLabels: ['l1'],
                  issueTitle: 'title',
                  uniqueRuleId: 'rule-1'
                },
                [],
                false
              )
          )
          assert.strictEqual(result.passed, false)
        }
      )
    })
  })
})
