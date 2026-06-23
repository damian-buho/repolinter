// SPDX-FileCopyrightText: 2017 TODO Group.
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
// SPDX-License-Identifier: Apache-2.0

import { Ajv, type ErrorObject } from 'ajv'
import findFile from 'find-config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import YAML from 'yaml'

import Rules from '../rules/rules.js'
import RuleInfo from './ruleinfo.js'
import Fixes from '../fixes/fixes.js'
import { safeFetch } from './safe-fetch.js'

interface RuleEntry {
  level: 'off' | 'warning' | 'error'
  where?: string[]
  rule: { type: string; options?: Record<string, unknown> }
  fix?: { type?: string; options?: Record<string, unknown> }
  policyInfo?: string
  policyUrl?: string
}

export interface RulesetConfig {
  version?: number
  extends?: string
  axioms?: Record<string, string>
  rules?: Record<string, RuleEntry>
  formatOptions?: Record<string, unknown>
  [key: string]: unknown
}

type JsonObject = Record<string, unknown>

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function mergeObject(target: JsonObject, source: JsonObject): void {
  // What we are trying to do: copy each key from source into target, deep-merging
  // plain objects and overwriting everything else, while never touching prototype
  // pollution vectors (`__proto__`, `constructor`).
  for (const [key, sourceValue] of Object.entries(source)) {
    if (key === '__proto__' || key === 'constructor') continue

    const tgtValue = target[key]
    if (
      sourceValue &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      tgtValue &&
      typeof tgtValue === 'object' &&
      !Array.isArray(tgtValue)
    ) {
      deepMerge(tgtValue as JsonObject, sourceValue as JsonObject)
    } else {
      target[key] = sourceValue
    }
  }
}

function deepMerge(target: JsonObject, ...sources: JsonObject[]): JsonObject {
  for (const source of sources) {
    if (!source || typeof source !== 'object') continue
    mergeObject(target, source)
  }
  return target
}

function isAbsoluteURL(url: string): boolean {
  try {
    const u = new URL(url)
    if (u.host !== '') {
      return true
    }
  } catch {
    // not a valid URL
  }
  return false
}

function findConfig(directory?: string): string {
  return (
    findFile('repolint.json', { cwd: directory }) ||
    findFile('repolint.yaml', { cwd: directory }) ||
    findFile('repolint.yml', { cwd: directory }) ||
    findFile('repolinter.json', { cwd: directory }) ||
    findFile('repolinter.yaml', { cwd: directory }) ||
    findFile('repolinter.yml', { cwd: directory }) ||
    path.join(__dirname, '../rulesets/default.json')
  )
}

function parseRawRuleset(
  raw: string,
  locationDescription: string
): RulesetConfig {
  try {
    return JSON.parse(raw) as RulesetConfig
  } catch (error: unknown) {
    try {
      return YAML.parse(raw) as RulesetConfig
    } catch (error_: unknown) {
      throw new Error(
        `unable to parse ${locationDescription} as either JSON (error: ${error}) or YAML (error: ${error_})`,
        { cause: error_ }
      )
    }
  }
}

async function resolveExtension(
  ruleset: RulesetConfig,
  sourceLocation: string,
  processed: string[]
): Promise<RulesetConfig> {
  if (!ruleset.extends) return ruleset

  processed.push(sourceLocation)
  if (processed.length > 20) {
    throw new Error('exceeded maximum 20 ruleset extensions')
  }

  let parent: string
  if (isAbsoluteURL(ruleset.extends) || isBase64(ruleset.extends)) {
    parent = ruleset.extends
  } else if (isAbsoluteURL(sourceLocation)) {
    parent = new URL(ruleset.extends, sourceLocation).href
  } else {
    // Disallow absolute paths and parent-directory traversal in local extends
    // to prevent a repo-controlled config from reading arbitrary server files.
    const normalized = path.normalize(ruleset.extends)
    if (path.isAbsolute(normalized) || normalized.startsWith('..')) {
      throw new Error(
        `extends path '${ruleset.extends}' must be a relative path that does not traverse parent directories`
      )
    }
    parent = path.resolve(path.dirname(sourceLocation), ruleset.extends)
  }

  if (processed.includes(parent)) return ruleset

  const parentRuleset = isBase64(parent)
    ? await decodeConfig(parent, processed)
    : await loadConfig(parent, processed)
  return deepMerge(
    {},
    parentRuleset as JsonObject,
    ruleset as JsonObject
  ) as RulesetConfig
}

async function loadConfig(
  configLocation: string,
  processed: string[] = []
): Promise<RulesetConfig> {
  if (!configLocation) {
    throw new Error('must specify config location')
  }

  let configData: string
  if (isAbsoluteURL(configLocation)) {
    const response = await safeFetch(configLocation)
    if (!response.ok) {
      throw new Error(
        `Failed to fetch config from ${configLocation} with status code ${response.status}`
      )
    }
    configData = await response.text()
  } else {
    configData = await fs.promises.readFile(configLocation, 'utf8')
  }

  const ruleset = parseRawRuleset(configData, configLocation)
  return resolveExtension(ruleset, configLocation, processed)
}

async function validateConfig(
  config: RulesetConfig
): Promise<{ passed: boolean; error?: string }> {
  const ajvProperties = new Ajv({ strict: false })
  const loadSchemasFrom = async (
    registry: Record<string, unknown>,
    subdirectory: string
  ): Promise<JsonObject[]> => {
    const entries = await Promise.all(
      Object.keys(registry).map(async name => {
        const data = await fs.promises.readFile(
          path.resolve(__dirname, '..', subdirectory, `${name}-config.json`),
          'utf8'
        )
        return JSON.parse(data) as JsonObject
      })
    )
    return entries
  }

  const [fixSchemas, ruleSchemas] = await Promise.all([
    loadSchemasFrom(Fixes, 'fixes'),
    loadSchemasFrom(Rules, 'rules')
  ])
  for (const schema of [...fixSchemas, ...ruleSchemas]) {
    ajvProperties.addSchema(schema)
  }

  const mainSchema = JSON.parse(
    await fs.promises.readFile(
      path.resolve(__dirname, '../rulesets/schema.json'),
      'utf8'
    )
  ) as JsonObject
  const validate = ajvProperties.compile(mainSchema)

  if (validate(config)) {
    return { passed: true }
  }

  const errorMessages = (validate.errors ?? [])
    .map(
      (error: ErrorObject) =>
        `\tconfiguration${error.instancePath} ${error.message}\n\nIt's likely the rulesetPath or rulesetUrl isn't configured correctly.`
    )
    .join('\n')

  return {
    passed: false,
    error: `Configuration validation failed with errors: \n${errorMessages}`
  }
}

function parseConfig(config: RulesetConfig): RuleInfo[] {
  if (config.version === 2) {
    return Object.entries<RuleEntry>(config.rules ?? {}).map(
      ([name, config_]) =>
        new RuleInfo(
          name,
          config_.level,
          config_.where,
          config_.rule.type,
          config_.rule.options ?? {},
          config_.fix?.type,
          config_.fix?.options,
          config_.policyInfo,
          config_.policyUrl
        )
    )
  }
  const v1Rules = config.rules as unknown as Record<
    string,
    Record<string, unknown[]>
  >
  return Object.entries(v1Rules).flatMap(([where, rules]) => {
    return Object.entries(rules).map(([rulename, configray]) => {
      const [name = '', type] = rulename.split(':')
      return new RuleInfo(
        name,
        configray[0] as 'off' | 'warning' | 'error',
        where === 'all' ? [] : [where],
        type || name,
        (configray[1] as JsonObject | undefined) ?? {}
      )
    })
  })
}

async function decodeConfig(
  encodedRuleSet: string,
  processed: string[] = []
): Promise<RulesetConfig> {
  // eslint-disable-next-line unicorn/prefer-uint8array-base64
  const configData = Buffer.from(encodedRuleSet, 'base64').toString()
  const ruleset = parseRawRuleset(configData, 'ruleset')

  if (!ruleset.extends) return ruleset

  processed.push(encodedRuleSet)
  if (processed.length > 20) {
    throw new Error('exceeded maximum 20 ruleset extensions')
  }

  let parent: string | undefined
  if (isAbsoluteURL(ruleset.extends) || isBase64(ruleset.extends)) {
    parent = ruleset.extends
  }

  if (parent !== undefined && !processed.includes(parent)) {
    const parentRuleset = isBase64(parent)
      ? await decodeConfig(parent, processed)
      : await loadConfig(parent, processed)
    return deepMerge(
      {},
      parentRuleset as JsonObject,
      ruleset as JsonObject
    ) as RulesetConfig
  }

  return ruleset
}

function isBase64(string_: string): boolean {
  const base64regex =
    /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/
  return base64regex.test(string_)
}

export {
  findConfig,
  isAbsoluteURL,
  loadConfig,
  decodeConfig,
  validateConfig,
  parseConfig,
  isBase64
}
