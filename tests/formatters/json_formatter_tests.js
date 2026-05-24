// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect } from 'chai'
import jsonFormatter from '../../formatters/json_formatter.js'
import FormatResult from '../../lib/formatresult.js'
import RuleInfo from '../../lib/ruleinfo.js'
import Result from '../../lib/result.js'

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
        '{"passed":true,"errored":false,"results":[{"ruleInfo":{"name":"myrule","level":"error","where":[],"ruleType":"file-existence","ruleConfig":{}},"status":"PASSED","lintResult":{"message":"Did it!","targets":[],"passed":true}},{"ruleInfo":{"name":"myrule","level":"error","where":[],"ruleType":"file-existence","ruleConfig":{}},"runMessage":"whoops","status":"IGNORED"}],"targets":{"language":{"message":"No language?","targets":[],"passed":false}},"params":{"targetDir":".","filterPaths":[],"ruleset":{}}}'

      const successResult = jsonFormatter.formatOutput(result, false)
      expect(successResult).to.equal(expected)
    })
  })
})
