// SPDX-FileCopyrightText: 2017 TODO Group.
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
// SPDX-License-Identifier: Apache-2.0

import gitlog from 'gitlog'
import Result from '../lib/result.js'
import type FileSystem from '../lib/file-system.js'

export default async function contributorCount(
  fileSystem: FileSystem
): Promise<Result> {
  const gitlogOptions = {
    repo: fileSystem.targetDirectory,
    all: true,
    number: 10_000
  }
  const commits = await gitlog(gitlogOptions)
  if (!commits) {
    return new Result(
      'GitLog axiom failed to run, is this project a git repository?',
      [],
      false
    )
  }
  const contributors = commits
    .map(commit => commit.authorName.toLowerCase())
    .filter((value, index, self) => self.indexOf(value) === index)
  return new Result(
    '',
    [{ path: contributors.length.toString(), passed: true }],
    true
  )
}
