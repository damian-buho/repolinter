// Copyright 2018 TODO Group. All rights reserved.
// Licensed under the Apache License, Version 2.0.

import Result from '../lib/result.js'
import type FileSystem from '../lib/file-system.js'

export default async function packagersAxiom(
  fileSystem: FileSystem
): Promise<Result> {
  const packageManagerPatterns: Record<string, string> = {
    'pom.xml': 'maven',
    'project.xml': 'maven1',
    'package.json': 'npm',
    'setup.py': 'pypi',
    '*.nuspec': 'nuget',
    '*.podspec': 'cocoapod',
    'Cargo.toml': 'cargo',
    '*.gemspec': 'rubygem',
    DESCRIPTION: 'cran',
    'Makefile.PL': 'cpan',
    'Build.PL': 'cpan',
    'package.xml': 'pear',
    'ivy.xml': 'ivy',
    'build.gradle': 'gradle'
  }

  const allPackagers = await Promise.all(
    Object.entries(packageManagerPatterns).map(async ([pattern, packager]) => {
      const found = await fileSystem.findFirst(pattern)
      return found ? packager : undefined
    })
  )
  const packagers = allPackagers.filter((p): p is string => p !== undefined)
  return new Result(
    '',
    packagers.map(p => ({
      passed: true,
      path: p
    })),
    true
  )
}
