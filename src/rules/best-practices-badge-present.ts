// SPDX-FileCopyrightText: 2017 TODO Group.
// SPDX-FileCopyrightText: 2017 TODO Group
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
//
// SPDX-License-Identifier: Apache-2.0

import type FileSystem from '../lib/file-system.js'
import Result from '../lib/result.js'
import fileContents from './file-contents.js'

interface BestPracticesBadgeOptions {
  minPercentage?: number
}

const bestPracticesRegExp = String.raw`https://bestpractices\.coreinfrastructure\.org(/\w+)?/projects/\d+`

export default async function bestPracticesBadgePresent(
  fileSystem: FileSystem,
  options: BestPracticesBadgeOptions = {}
): Promise<Result> {
  const readmeContainsBadge = await fileContents(fileSystem, {
    globsAll: ['README*'],
    content: bestPracticesRegExp,
    nocase: true,
    flags: 'i',
    'fail-on-non-existent': true,
    'human-readable-content': 'Best Practices Badge'
  })
  if (!readmeContainsBadge.passed || !options.minPercentage) {
    return readmeContainsBadge
  }
  const readmePath = readmeContainsBadge.targets[0]!.path!
  const targets = [{ path: readmePath, passed: false }]
  const readmeContents = await fileSystem.getFileContents(readmePath)
  const bestPracticesUrl = readmeContents!.match(
    new RegExp(bestPracticesRegExp, 'i')
  )![0]
  const bestPracticesResponse = await fetch(`${bestPracticesUrl}.json`)
  if (!bestPracticesResponse.ok) {
    return new Result('Invalid Best Practices Badge URL', targets, false)
  }
  const bestPracticesData = (await bestPracticesResponse.json()) as {
    tiered_percentage: number
  }
  const passed = bestPracticesData.tiered_percentage >= options.minPercentage
  const message = `Best Practices Badge ${
    passed ? 'reached' : 'did not reach'
  } minimum level`
  return new Result(message, targets, passed)
}
