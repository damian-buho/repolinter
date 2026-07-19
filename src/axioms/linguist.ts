// SPDX-FileCopyrightText: 2017 TODO Group.
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
// SPDX-License-Identifier: Apache-2.0

import linguist from '../lib/linguist.js'
import Result from '../lib/result.js'
import type FileSystem from '../lib/file-system.js'
import { logger } from '../logger.js'

export default async function linguistAxiom(
  fileSystem: FileSystem
): Promise<Result> {
  const languages: string[] = []
  try {
    logger.debug(
      { targetDirectory: fileSystem.targetDirectory },
      'Running linguist language detection'
    )
    const jsonObject = await linguist.identifyLanguages(
      fileSystem.targetDirectory
    )
    for (const language in jsonObject) {
      languages.push(language.toLowerCase())
    }
    logger.debug(
      { languageCount: languages.length, languages },
      'Linguist detection completed'
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.warn(
      { targetDirectory: fileSystem.targetDirectory, error: message },
      'Linguist axiom failed'
    )
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
