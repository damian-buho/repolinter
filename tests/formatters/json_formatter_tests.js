// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect } from 'chai'
import jsonFormatter from '../../dist/formatters/json_formatter.js'
import FormatResult from '../../dist/lib/formatresult.js'
import RuleInfo from '../../dist/lib/ruleinfo.js'
import Result from '../../dist/lib/result.js'

describe('formatters', () => {
  describe('json_formatter', () => {
    // TODO: Fix this test after fixing the formatter
    it('returns a json string with the correct info', () => {
      /** @type {import('../..').LintResult} */
      const result = {
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
          targetDir: '.',
          filterPaths: [],
          ruleset: {}
        }
      }
      const expected =
        '{"passed":true,"errored":false,"results":[{"status":"PASSED","ruleInfo":{"name":"myrule","level":"error","where":[],"ruleType":"file-existence","ruleConfig":{}},"lintResult":{"targets":[],"passed":true,"message":"Did it!"}},{"status":"IGNORED","ruleInfo":{"name":"myrule","level":"error","where":[],"ruleType":"file-existence","ruleConfig":{}},"runMessage":"whoops"}],"targets":{"language":{"targets":[],"passed":false,"message":"No language?"}},"params":{"targetDir":".","filterPaths":[],"ruleset":{}}}'

      const successResult = jsonFormatter.formatOutput(result, false)
      expect(successResult).to.equal(expected)
    })
  })
})
