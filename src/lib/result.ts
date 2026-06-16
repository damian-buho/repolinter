// SPDX-FileCopyrightText: 2017 TODO Group.
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
// SPDX-License-Identifier: Apache-2.0

export interface ResultTarget {
  path?: string
  pattern?: string
  passed: boolean
  message?: string
}

export default class Result {
  declare message?: string
  targets: ResultTarget[]
  passed: boolean

  constructor(
    message?: string,
    targets: ResultTarget[] = [],
    isPassed = false
  ) {
    if (message) this.message = message
    this.targets = targets
    this.passed = isPassed
  }
}
