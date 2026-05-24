// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import Ajv from 'ajv'
import findFile from 'find-config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import YAML from 'yaml'

import Rules from '../rules/rules.js'
import RuleInfo from './ruleinfo.js'
import Fixes from '../fixes/fixes.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function deepMerge(
  target: Record<string, any>,
  ...sources: any[]
): Record<string, any> {
  for (const src of sources) {
    if (src && typeof src === 'object') {
      for (const key of Object.keys(src)) {
        if (
          src[key] &&
          typeof src[key] === 'object' &&
          !Array.isArray(src[key]) &&
          target[key] &&
          typeof target[key] === 'object' &&
          !Array.isArray(target[key])
        ) {
          deepMerge(target[key], src[key])
        } else {
          target[key] = src[key]
        }
      }
    }
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

async function loadConfig(
  configLocation: string,
  processed: string[] = []
): Promise<any> {
  if (!configLocation) {
    throw new Error('must specify config location')
  }

  let configData: string | null = null
  if (isAbsoluteURL(configLocation)) {
    const response = await fetch(configLocation)
    if (!response.ok) {
      throw new Error(
        `Failed to fetch config from ${configLocation} with status code ${response.status}`
      )
    }
    configData = await response.text()
  } else {
    configData = await fs.promises.readFile(configLocation, 'utf-8')
  }

  let ruleset: any
  try {
    ruleset = JSON.parse(configData)
  } catch (je: unknown) {
    try {
      ruleset = YAML.parse(configData)
    } catch (ye: unknown) {
      throw new Error(
        `unable to parse ${configLocation} as either JSON (error: ${je}) or YAML (error: ${ye})`
      )
    }
  }

  if (ruleset.extends) {
    processed.push(configLocation)
    if (processed.length > 20) {
      throw new Error('exceeded maximum 20 ruleset extensions')
    }

    let parent: string
    if (isAbsoluteURL(ruleset.extends) || isBase64(ruleset.extends)) {
      parent = ruleset.extends
    } else if (isAbsoluteURL(configLocation)) {
      parent = new URL(ruleset.extends, configLocation).toString()
    } else {
      parent = path.resolve(path.dirname(configLocation), ruleset.extends)
    }
    if (!processed.includes(parent)) {
      let parentRuleset: any
      if (isBase64(parent)) {
        parentRuleset = await decodeConfig(parent, processed)
      } else {
        parentRuleset = await loadConfig(parent, processed)
      }
      ruleset = deepMerge({}, parentRuleset, ruleset)
    }
  }

  return ruleset
}

async function validateConfig(
  config: any
): Promise<{ passed: boolean; error?: string }> {
  const ajvProps = new (Ajv as any)({ strict: false })
  const parsedRuleSchemas: Promise<any[]> = Promise.all(
    Object.keys(Rules).map(rs =>
      fs.promises
        .readFile(
          path.resolve(__dirname, '../rules', `${rs}-config.json`),
          'utf8'
        )
        .then(JSON.parse)
    )
  )
  const parsedFixSchemas: Promise<any[]> = Promise.all(
    Object.keys(Fixes).map(f =>
      fs.promises
        .readFile(
          path.resolve(__dirname, '../fixes', `${f}-config.json`),
          'utf8'
        )
        .then(JSON.parse)
    )
  )
  const allSchemas: any[] = (
    await Promise.all([parsedFixSchemas, parsedRuleSchemas])
  ).reduce((a, c) => a.concat(c), [])
  for (const schema of allSchemas) {
    ajvProps.addSchema(schema)
  }
  const validator = ajvProps.compile(
    JSON.parse(
      await fs.promises.readFile(
        path.resolve(__dirname, '../rulesets/schema.json'),
        'utf8'
      )
    )
  )

  if (!validator(config)) {
    return {
      passed: false,
      error: `Configuration validation failed with errors: \n${(
        validator.errors ?? []
      )
        .map(
          (e: any) =>
            `\tconfiguration${e.instancePath} ${e.message}\n\nIt's likely the rulesetPath or rulesetUrl isn't configured correctly.`
        )
        .join('\n')}`
    }
  } else {
    return { passed: true }
  }
}

function parseConfig(config: any): RuleInfo[] {
  if (config.version === 2) {
    return Object.entries<any>(config.rules).map(
      ([name, cfg]) =>
        new RuleInfo(
          name,
          cfg.level,
          cfg.where,
          cfg.rule.type,
          cfg.rule.options,
          cfg.fix && cfg.fix.type,
          cfg.fix && cfg.fix.options,
          cfg.policyInfo,
          cfg.policyUrl
        )
    )
  }
  return Object.entries<any>(config.rules)
    .map(([where, rules]) => {
      return Object.entries<any>(rules).map(([rulename, configray]) => {
        const [name = '', type] = rulename.split(':')
        return new RuleInfo(
          name,
          configray[0],
          where === 'all' ? [] : [where],
          type || name,
          configray[1] || {}
        )
      })
    })
    .reduce((a, c) => a.concat(c))
}

async function decodeConfig(
  encodedRuleSet: string,
  processed: string[] = []
): Promise<any> {
  const configData = Buffer.from(encodedRuleSet, 'base64').toString()

  let ruleset: any
  try {
    ruleset = JSON.parse(configData)
  } catch (je: unknown) {
    try {
      ruleset = YAML.parse(configData)
    } catch (ye: unknown) {
      throw new Error(
        `unable to parse ruleset as either JSON (error: ${je}) or YAML (error: ${ye})`
      )
    }
  }

  if (ruleset.extends) {
    processed.push(encodedRuleSet)
    if (processed.length > 20) {
      throw new Error('exceeded maximum 20 ruleset extensions')
    }

    let parent: string | undefined
    if (isAbsoluteURL(ruleset.extends) || isBase64(ruleset.extends)) {
      parent = ruleset.extends
    }

    if (parent !== undefined && !processed.includes(parent)) {
      let parentRuleset: any
      if (isBase64(parent)) {
        parentRuleset = await decodeConfig(parent, processed)
      } else {
        parentRuleset = await loadConfig(parent, processed)
      }
      ruleset = deepMerge({}, parentRuleset, ruleset)
    }
  }

  return ruleset
}

function isBase64(str: string): boolean {
  const base64regex =
    /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/
  return base64regex.test(str)
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
