// SPDX-FileCopyrightText: 2017 TODO Group.
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
// SPDX-License-Identifier: Apache-2.0

import type { LintResult } from '../index.js'

const JsonFormatter = {
  formatOutput(output: LintResult, _dryRun: boolean): string {
    return JSON.stringify(output)
  }
}

export default JsonFormatter
