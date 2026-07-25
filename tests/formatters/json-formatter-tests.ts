// SPDX-FileCopyrightText: 2017 TODO Group
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
//
// SPDX-License-Identifier: Apache-2.0

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import jsonFormatter from '../../src/formatters/json-formatter.js'
import FormatResult from '../../src/lib/formatresult.js'
import RuleInfo from '../../src/lib/ruleinfo.js'
import Result from '../../src/lib/result.js'
import type { LintResult } from '../../src/index.js'

describe('formatters', () => {
  describe('json_formatter', () => {
    it('returns a json string with the correct info', () => {
      const result: LintResult = {
        passed: true,
        errored: false,
        results: [
          FormatResult.CreateLintOnly(
            new RuleInfo('myrule', 'error', [], 'file-existence', {}),
            new Result('Did it!', [], true)
          ),
          FormatResult.CreateIgnored(
            new RuleInfo('myrule', 'error', [], 'file-existence', {}),
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
        }
      }
      const expected: string =
        '{"passed":true,"errored":false,"results":[{"status":"PASSED","ruleInfo":{"name":"myrule","level":"error","where":[],"ruleType":"file-existence","ruleConfig":{}},"lintResult":{"targets":[],"passed":true,"message":"Did it!"}},{"status":"IGNORED","ruleInfo":{"name":"myrule","level":"error","where":[],"ruleType":"file-existence","ruleConfig":{}},"runMessage":"whoops"}],"targets":{"language":{"targets":[],"passed":false,"message":"No language?"}},"params":{"targetDirectory":".","filterPaths":[],"ruleset":{}}}'

      const successResult: string = jsonFormatter.formatOutput(result, false)
      assert.strictEqual(successResult, expected)
    })
  })
})
