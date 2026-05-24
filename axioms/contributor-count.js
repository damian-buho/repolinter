// Copyright 2017 TODO Group. All rights reserved.
// Licensed under the Apache License, Version 2.0.

import gitlog from 'gitlog'
import Result from '../lib/result.js'

export default async function (fileSystem) {
  const commits = await gitlog({
    repo: fileSystem.targetDir,
    all: true,
    number: 10000
  })
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
