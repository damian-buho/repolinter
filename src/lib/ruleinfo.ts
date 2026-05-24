// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

export default class RuleInfo {
  name: string
  level: 'off' | 'error' | 'warning'
  where: string[]
  ruleType: string
  ruleConfig: any
  declare fixType?: string
  declare fixConfig?: any
  declare policyInfo?: string
  declare policyUrl?: string

  constructor(
    name: string,
    level: 'off' | 'error' | 'warning',
    where: string[] | undefined,
    ruleType: string,
    ruleConfig: any,
    fixType?: string,
    fixConfig?: any,
    policyInfo?: string,
    policyUrl?: string
  ) {
    this.name = name
    this.level = level
    this.where = where || []
    this.ruleType = ruleType
    this.ruleConfig = ruleConfig
    if (fixType) this.fixType = fixType
    if (fixConfig) this.fixConfig = fixConfig
    if (policyInfo) this.policyInfo = policyInfo
    if (policyUrl) this.policyUrl = policyUrl
  }
}
