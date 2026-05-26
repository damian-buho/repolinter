// Copyright 2017 TODO Group. All rights reserved.
// Licensed under the Apache License, Version 2.0.

import linguist from '../lib/linguist.js'
import Result from '../lib/result.js'
import type FileSystem from '../lib/file-system.js'

export default async function linguistAxiom(
  fileSystem: FileSystem
): Promise<Result> {
  const languages: string[] = []
  try {
    const jsonObject = await linguist.identifyLanguages(
      fileSystem.targetDirectory
    )
    for (const language in jsonObject) {
      languages.push(language.toLowerCase())
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return new Result(message, [], false)
  }
  return new Result(
    '',
    languages.map(l => ({
      passed: true,
      path: l
    })),
    true
  )
}
