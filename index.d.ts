// Copyright 2026 Damián Búho
//
// SPDX-License-Identifier: Apache-2.0

declare class FileSystem {
  targetDir: string
  filterPaths: string[]

  static fileExists (file: string): Promise<boolean>
  relativeFileExists (file: string): Promise<boolean>
  getFilterFiles (): string[]
  getFilterDirectories (): string[]
  findFirst (
    globs: string | string[],
    nocase?: boolean
  ): Promise<undefined | string>
  findFirstFile (
    globs: string | string[],
    nocase?: boolean
  ): Promise<undefined | string>
  findAllFiles (
    globs: string | string[],
    nocase?: boolean
  ): Promise<undefined | string[]>
  glob (globs: string | string[], options: Record<string, unknown>): Promise<string[]>
  findAll (
    globs: string | string[],
    nocase?: boolean
  ): Promise<undefined | string[]>
  isBinaryFile (relativeFile: string): Promise<boolean>
  shouldInclude (path: string): boolean
  getFileContents (relativeFile: string): Promise<string | undefined>
  setFileContents (relativeFile: string, contents: string): Promise<void>
  getFileLines (relativeFile: string, lineCount: number): Promise<string>
}

declare class Result {
  message?: string
  targets: Array<{
    path?: string
    pattern?: string
    passed: boolean
    message?: string
  }>
  passed: boolean
}

declare class RuleInfo {
  name: string
  level: 'off' | 'error' | 'warning'
  where: string[]
  ruleType: string
  ruleConfig: Record<string, unknown>
  fixType?: string
  fixConfig?: Record<string, unknown>
  policyInfo?: string
  policyUrl?: string
}

declare class FormatResult {
  status: string
  runMessage?: string
  lintResult?: Result
  fixResult?: Result
  ruleInfo: RuleInfo
}

declare class LintResult {
  params: {
    targetDir: string
    filterPaths: string[]
    rulesetPath?: string
    ruleset: Record<string, unknown>
  }
  passed: boolean
  errored: boolean
  errMsg?: string
  results: FormatResult[]
  targets: { [key: string]: Result }
  formatOptions?: Record<string, unknown>
}

declare interface Formatter {
  formatOutput(output: LintResult, dryRun: boolean): string
}

export declare function lint (
  targetDirectory: string,
  filterPaths?: string[],
  ruleset?: Record<string, unknown> | string,
  dryRun?: boolean
): Promise<LintResult>
export declare function runRuleset (
  ruleset: RuleInfo[],
  targets: boolean | { [key: string]: Result },
  dryRun: boolean
): Promise<FormatResult[]>
export declare function determineTargets (
  axiomconfig: Record<string, string>,
  fs: FileSystem
): Promise<{ [key: string]: Result }>
export declare function validateConfig (
  config: Record<string, unknown>
): Promise<{ passed: boolean; error?: string }>
export declare function parseConfig (config: Record<string, unknown>): RuleInfo[]
export declare function shouldRuleRun (
  validTargets: string[],
  ruleAxioms: string[]
): string[]

export declare const defaultFormatter: Formatter
export declare const jsonFormatter: Formatter
export declare const markdownFormatter: Formatter
export declare const resultFormatter: Formatter
