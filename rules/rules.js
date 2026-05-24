// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

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

export default {
  'apache-notice': apacheNotice,
  'best-practices-badge-present': bestPracticesBadgePresent,
  'directory-existence': directoryExistence,
  'file-contents': fileContents,
  'file-existence': fileExistence,
  'file-hash': fileHash,
  'file-hashes-not-exist': fileHashesNotExist,
  'file-no-broken-links': fileNoBrokenLinks,
  'file-not-contents': fileNotContents,
  'file-not-exists': fileNotExists,
  'file-starts-with': fileStartsWith,
  'file-type-exclusion': fileTypeExclusion,
  'git-grep-commits': gitGrepCommits,
  'git-grep-log': gitGrepLog,
  'git-list-tree': gitListTree,
  'git-working-tree': gitWorkingTree,
  'large-file': largeFile,
  'license-detectable-by-licensee': licenseDetectableByLicensee,
  'json-schema-passes': jsonSchemaPasses
}
