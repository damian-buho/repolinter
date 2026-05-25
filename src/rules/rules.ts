// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import type FileSystem from '../lib/file-system.js'
import type Result from '../lib/result.js'
import apacheNotice from './apache-notice.js'
import bestPracticesBadgePresent from './best-practices-badge-present.js'
import directoryExistence from './directory-existence.js'
import fileContents from './file-contents.js'
import fileExistence from './file-existence.js'
import fileHash from './file-hash.js'
import fileHashesNotExist from './file-hashes-not-exist.js'
import fileNoBrokenLinks from './file-no-broken-links.js'
import fileNotContents from './file-not-contents.js'
import fileNotExists from './file-not-exists.js'
import fileStartsWith from './file-starts-with.js'
import fileTypeExclusion from './file-type-exclusion.js'
import gitGrepCommits from './git-grep-commits.js'
import gitGrepLog from './git-grep-log.js'
import gitListTree from './git-list-tree.js'
import gitWorkingTree from './git-working-tree.js'
import largeFile from './large-file.js'
import licenseDetectableByLicensee from './license-detectable-by-licensee.js'
import jsonSchemaPasses from './json-schema-passes.js'

type RuleFunction = (
  fs: FileSystem,
  options: unknown
) => Promise<Result> | Result

const rules: Record<string, RuleFunction> = {
  'apache-notice': apacheNotice as RuleFunction,
  'best-practices-badge-present': bestPracticesBadgePresent as RuleFunction,
  'directory-existence': directoryExistence as RuleFunction,
  'file-contents': fileContents as RuleFunction,
  'file-existence': fileExistence as RuleFunction,
  'file-hash': fileHash as RuleFunction,
  'file-hashes-not-exist': fileHashesNotExist as RuleFunction,
  'file-no-broken-links': fileNoBrokenLinks as RuleFunction,
  'file-not-contents': fileNotContents as RuleFunction,
  'file-not-exists': fileNotExists as RuleFunction,
  'file-starts-with': fileStartsWith as RuleFunction,
  'file-type-exclusion': fileTypeExclusion as RuleFunction,
  'git-grep-commits': gitGrepCommits as RuleFunction,
  'git-grep-log': gitGrepLog as RuleFunction,
  'git-list-tree': gitListTree as RuleFunction,
  'git-working-tree': gitWorkingTree as RuleFunction,
  'large-file': largeFile as RuleFunction,
  'license-detectable-by-licensee': licenseDetectableByLicensee as RuleFunction,
  'json-schema-passes': jsonSchemaPasses as RuleFunction
}

export default rules
