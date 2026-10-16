// SPDX-FileCopyrightText: 2017 TODO Group.
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
// SPDX-License-Identifier: Apache-2.0

import Result from '../lib/result.js'
import type { ResultTarget } from '../lib/result.js'
import { safeFetch } from '../lib/safe-fetch.js'
import { logger } from '../logger.js'
import type FileSystem from '../lib/file-system.js'

interface GithubIssueCreateOptions {
  issueLabels: string[]
  bypassLabel?: string
  issueTitle: string
  issueBody: string
  commentBody?: string
  uniqueRuleId?: string
}

interface GithubContext {
  owner: string
  repository: string
  token: string
}

interface ListedIssue {
  number: number
  state: string
  ruleId: string | undefined
  labelNames: string[]
}

const GITHUB_API = 'https://api.github.com'
const RULE_ID_MARKER = 'Unique rule set ID: '
const DEFAULT_BYPASS_LABEL = 'CC: Bypass'
const MAX_ATTEMPTS = 3
const BASE_BACKOFF_MS = 500

function timeoutMs(): number {
  const parsed = Math.trunc(Number(process.env['REPOLINTER_GITHUB_TIMEOUT_MS']))
  return parsed > 0 ? parsed : 10_000
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function backoff(attempt: number): Promise<void> {
  return delay(BASE_BACKOFF_MS * 2 ** (attempt - 1) + Math.random() * 200)
}

async function readJson(response: {
  text(): Promise<string>
}): Promise<unknown> {
  const text = await response.text()
  if (!text) return undefined
  try {
    return JSON.parse(text) as unknown
  } catch {
    return undefined
  }
}

async function githubRequest(
  context: GithubContext,
  method: 'GET' | 'POST' | 'PATCH',
  path: string,
  payload?: Record<string, unknown>
): Promise<{ status: number; body: unknown }> {
  let attempt = 0
  for (;;) {
    attempt += 1
    try {
      const response = await safeFetch(`${GITHUB_API}${path}`, {
        method,
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${context.token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'repolinter',
          'X-GitHub-Api-Version': '2022-11-28'
        },
        body: payload === undefined ? undefined : JSON.stringify(payload),
        signal: AbortSignal.timeout(timeoutMs())
      })
      if (
        (response.status === 429 || response.status >= 500) &&
        attempt < MAX_ATTEMPTS
      ) {
        await backoff(attempt)
        continue
      }
      return { status: response.status, body: await readJson(response) }
    } catch (error) {
      if (attempt >= MAX_ATTEMPTS) throw error
      await backoff(attempt)
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function labelNamesOf(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const names: string[] = []
  for (const entry of value) {
    if (typeof entry === 'string') names.push(entry)
    else if (isRecord(entry) && typeof entry['name'] === 'string') {
      names.push(entry['name'])
    }
  }
  return names
}

function ruleIdOf(body: string): string | undefined {
  const marker = body.indexOf(RULE_ID_MARKER)
  return marker === -1
    ? undefined
    : body.slice(marker + RULE_ID_MARKER.length).trim()
}

function listedIssueOf(value: unknown): ListedIssue | undefined {
  if (!isRecord(value)) return undefined
  const number = value['number']
  const state = value['state']
  if (typeof number !== 'number' || typeof state !== 'string') {
    return undefined
  }
  const body = value['body']
  return {
    number,
    state,
    ruleId: typeof body === 'string' ? ruleIdOf(body) : undefined,
    labelNames: labelNamesOf(value['labels'])
  }
}

function repositoryPath(context: GithubContext, suffix: string): string {
  return `/repos/${context.owner}/${context.repository}${suffix}`
}

async function ensureLabels(
  context: GithubContext,
  labels: string[]
): Promise<void> {
  for (const label of labels) {
    const checked = await githubRequest(
      context,
      'GET',
      repositoryPath(context, `/labels/${encodeURIComponent(label)}`)
    )
    if (checked.status === 404) {
      const created = await githubRequest(
        context,
        'POST',
        repositoryPath(context, '/labels'),
        { name: label }
      )
      if (created.status !== 201) {
        throw new Error(
          `could not create label "${label}" (status ${created.status})`
        )
      }
    } else if (checked.status !== 200) {
      throw new Error(
        `could not check label "${label}" (status ${checked.status})`
      )
    }
  }
}

function issuesQuery(labels: string[]): string {
  return new URLSearchParams({
    direction: 'desc',
    labels: labels.join(','),
    sort: 'created',
    state: 'all'
  }).toString()
}

async function listIssues(
  context: GithubContext,
  labels: string[]
): Promise<ListedIssue[]> {
  const found = await githubRequest(
    context,
    'GET',
    repositoryPath(context, `/issues?${issuesQuery(labels)}`)
  )
  if (found.status !== 200) {
    throw new Error(`could not list issues (status ${found.status})`)
  }
  if (!Array.isArray(found.body)) {
    throw new TypeError('could not list issues (unexpected response shape)')
  }
  const issues: ListedIssue[] = []
  for (const entry of found.body) {
    const issue = listedIssueOf(entry)
    if (issue) issues.push(issue)
  }
  return issues
}

function bodyWithId(options: GithubIssueCreateOptions, ruleId: string): string {
  return `${options.issueBody}\n${RULE_ID_MARKER}${ruleId}`
}

async function createIssue(
  context: GithubContext,
  options: GithubIssueCreateOptions,
  ruleId: string,
  labels: string[]
): Promise<number> {
  const created = await githubRequest(
    context,
    'POST',
    repositoryPath(context, '/issues'),
    { body: bodyWithId(options, ruleId), labels, title: options.issueTitle }
  )
  if (created.status !== 201 || !isRecord(created.body)) {
    throw new Error(`could not create issue (status ${created.status})`)
  }
  const number = created.body['number']
  if (typeof number !== 'number') {
    throw new TypeError('could not create issue (response carries no number)')
  }
  return number
}

async function reopenIssue(
  context: GithubContext,
  options: GithubIssueCreateOptions,
  ruleId: string,
  labels: string[],
  issueNumber: number
): Promise<void> {
  const updated = await githubRequest(
    context,
    'PATCH',
    repositoryPath(context, `/issues/${issueNumber}`),
    {
      body: bodyWithId(options, ruleId),
      labels,
      state: 'open',
      title: options.issueTitle
    }
  )
  if (updated.status !== 200) {
    throw new Error(
      `could not re-open issue #${issueNumber} (status ${updated.status})`
    )
  }
  if (!options.commentBody) return
  const commented = await githubRequest(
    context,
    'POST',
    repositoryPath(context, `/issues/${issueNumber}/comments`),
    { body: options.commentBody }
  )
  if (commented.status !== 201) {
    throw new Error(
      `could not comment on issue #${issueNumber} (status ${commented.status})`
    )
  }
}

function resolveTarget(
  targetRepository: string | undefined,
  token: string | undefined
): GithubContext | undefined {
  const parts =
    typeof targetRepository === 'string' ? targetRepository.split('/') : []
  const [owner, repository] = parts
  return typeof owner === 'string' &&
    owner !== '' &&
    typeof repository === 'string' &&
    repository !== '' &&
    typeof token === 'string' &&
    token !== ''
    ? { owner, repository, token }
    : undefined
}

async function githubIssueCreate(
  _fs: FileSystem,
  options: GithubIssueCreateOptions,
  targets: string[],
  isDryRun = false
): Promise<Result> {
  if (isDryRun) {
    return new Result(
      `Would create Github issue "${options.issueTitle}" with labels ${options.issueLabels.join(', ')} (dry run, no issue created)`,
      [],
      true
    )
  }
  const ruleId = options.uniqueRuleId ?? options.issueTitle
  const bypassLabel = options.bypassLabel ?? DEFAULT_BYPASS_LABEL
  const context = resolveTarget(
    process.env['TARGET_REPO'],
    process.env['GITHUB_TOKEN']
  )
  if (!context) {
    return new Result(
      'Could not perform fix due to missing/invalid environment variables! Please set TARGET_REPO and GITHUB_TOKEN environment variables.',
      [],
      false
    )
  }
  try {
    logger.debug(
      { owner: context.owner, repo: context.repository, ruleId },
      'Running github-issue-create fix'
    )
    await ensureLabels(context, [...options.issueLabels, bypassLabel])
    const issues = await listIssues(context, options.issueLabels)
    const openMatch = issues.find(
      issue => issue.state === 'open' && issue.ruleId === ruleId
    )
    if (openMatch) {
      const skipped = openMatch.labelNames.includes(bypassLabel)
      const message = skipped
        ? `Rule fix skipped as Github issue #${openMatch.number} carries the bypass label "${bypassLabel}".`
        : `No Github issue created - issue #${openMatch.number} already tracks rule "${ruleId}".`
      return new Result(message, [], true)
    }
    const regressed = issues.find(
      issue => issue.state === 'closed' && issue.ruleId === ruleId
    )
    if (regressed) {
      if (regressed.labelNames.includes(bypassLabel)) {
        return new Result(
          `Rule fix skipped as Github issue #${regressed.number} carries the bypass label "${bypassLabel}".`,
          [],
          true
        )
      }
      await reopenIssue(
        context,
        options,
        ruleId,
        options.issueLabels,
        regressed.number
      )
      return new Result(
        `Github issue #${regressed.number} re-opened as there seems to be regression!`,
        [],
        true
      )
    }
    const created = await createIssue(
      context,
      options,
      ruleId,
      options.issueLabels
    )
    const fixTargets: ResultTarget[] = targets.map(path => ({
      passed: true,
      path
    }))
    return new Result(
      `No open or closed issues were found for rule "${ruleId}" - created new Github issue #${created}.`,
      fixTargets,
      true
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.warn(
      { owner: context.owner, repo: context.repository, error: message },
      'Github issue fix failed'
    )
    return new Result(`Github issue fix failed: ${message}`, [], false)
  }
}

export default githubIssueCreate
