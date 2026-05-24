// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import type { LintResult } from '../index.js'

class JsonFormatter {
  static formatOutput(output: LintResult, _dryRun: boolean): string {
    return JSON.stringify(output)
  }
}

export default JsonFormatter
