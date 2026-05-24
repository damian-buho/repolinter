// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import Ajv from 'ajv'
import findFile from 'find-config'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import YAML from 'yaml'

import Rules from '../rules/rules.js'
import RuleInfo from './ruleinfo.js'
import Fixes from '../fixes/fixes.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function deepMerge(target, ...sources) {
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

/**
 * Determine if provided string is an absolute URL.  That is, if it is
 * parseable and has a 'host' URL component.
 *
 * @param {string} url string to test
 * @returns {boolean} true if the string is an absolute URL
 */
function isAbsoluteURL(url) {
  try {
    const u = new URL(url)
    if (u.host !== '') {
      return true
    }
  } catch (e) {}
  return false
}

/**
 * Find a repolinter config file in the specified directory. This looks for
 * files named repolint or repolinter with a file extension of .json, .yaml, or
 * .yml in the specified directory or the nearest ancestor directory.  If no
 * file is found, the default configuration that ships with repolinter is
 * returned.
 *
 * @param {string} [directory] directory to search for config files in
 * @returns {string} absolute path of configuration file
 */
function findConfig(directory) {
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

/**
 * Load a ruleset config from the specified location.
 *
 * @param {string} configLocation A URL or local file containing a repolinter config file
 * @param {array} [processed] List of config files already processed, used to prevent loops
 * @returns {Object} The loaded repolinter json config
 * @throws Will throw an error if unable to parse config or if config is invalid
 */
async function loadConfig(configLocation, processed = []) {
  if (!configLocation) {
    throw new Error('must specify config location')
  }

  let configData = null
  if (isAbsoluteURL(configLocation)) {
    const res = await fetch(configLocation)
    if (!res.ok) {
      throw new Error(
        `Failed to fetch config from ${configLocation} with status code ${res.status}`
      )
    }
    configData = await res.text()
  } else {
    configData = await fs.promises.readFile(configLocation, 'utf-8')
  }

  let ruleset
  try {
    ruleset = JSON.parse(configData)
  } catch (je) {
    try {
      ruleset = YAML.parse(configData)
    } catch (ye) {
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

    let parent
    if (isAbsoluteURL(ruleset.extends) || isBase64(ruleset.extends)) {
      parent = ruleset.extends
    } else if (isAbsoluteURL(configLocation)) {
      parent = new URL(ruleset.extends, configLocation)
    } else {
      parent = path.resolve(path.dirname(configLocation), ruleset.extends)
    }
    if (!processed.includes(parent)) {
      let parentRuleset
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

/**
 * Validate a repolint configuration against a known JSON schema
 *
 * @memberof repolinter
 * @param {Object} config The configuration to validate
 * @returns {Promise<Object>}
 * A object representing or not the config validation succeeded (passed)
 * or an error message if not (error)
 */
async function validateConfig(config) {
  const ajvProps = new Ajv({ strict: false })
  const parsedRuleSchemas = Promise.all(
    Object.keys(Rules).map(rs =>
      fs.promises
        .readFile(
          path.resolve(__dirname, '../rules', `${rs}-config.json`),
          'utf8'
        )
        .then(JSON.parse)
    )
  )
  const parsedFixSchemas = Promise.all(
    Object.keys(Fixes).map(f =>
      fs.promises
        .readFile(
          path.resolve(__dirname, '../fixes', `${f}-config.json`),
          'utf8'
        )
        .then(JSON.parse)
    )
  )
  const allSchemas = (
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
      error: `Configuration validation failed with errors: \n${validator.errors
        .map(
          e =>
            `\tconfiguration${e.instancePath} ${e.message}\n\nIt's likely the rulesetPath or rulesetUrl isn't configured correctly.`
        )
        .join('\n')}`
    }
  } else {
    return { passed: true }
  }
}

/**
 * Parse a JSON object config (with repolinter.json structure) and return a list
 * of RuleInfo objects which will then be used to determine how to run the linter.
 *
 * @memberof repolinter
 * @param {Object} config The repolinter.json config
 * @returns {RuleInfo[]} The parsed rule data
 */
function parseConfig(config) {
  if (config.version === 2) {
    return Object.entries(config.rules).map(
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
  return Object.entries(config.rules)
    .map(([where, rules]) => {
      return Object.entries(rules).map(([rulename, configray]) => {
        const [name, type] = rulename.split(':')
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

/**
 * Decodes a base64 encoded string into a config
 *
 * @param {string} encodedRuleSet A base64 encoded string that needs decoding
 * @param {array} [processed] List of config files already processed, used to prevent loops
 * @returns {Object} The loaded repolinter json config
 * @throws Will throw an error if unable to parse config or if config is invalid
 */
async function decodeConfig(encodedRuleSet, processed = []) {
  const configData = Buffer.from(encodedRuleSet, 'base64').toString()

  let ruleset
  try {
    ruleset = JSON.parse(configData)
  } catch (je) {
    try {
      ruleset = YAML.parse(configData)
    } catch (ye) {
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

    let parent
    let parentRuleset
    if (isAbsoluteURL(ruleset.extends)) {
      parent = ruleset.extends
    } else if (isBase64(ruleset.extends)) {
      parentRuleset = await decodeConfig(ruleset.extends, processed)
    }
    if (!processed.includes(parent)) {
      if (!isBase64(ruleset.extends)) {
        parentRuleset = await loadConfig(parent, processed)
      }
      ruleset = deepMerge({}, parentRuleset, ruleset)
    }
  }

  return ruleset
}

function isBase64(str) {
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
