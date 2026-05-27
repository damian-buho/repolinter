// SPDX-FileCopyrightText: 2017 TODO Group.
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
// SPDX-License-Identifier: Apache-2.0

import { createRequire } from 'node:module'
import path from 'node:path'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

const require = createRequire(import.meta.url)

class Linguist {
  private async ensureBinaryExtensionsFixture(): Promise<void> {
    const linguistPackagePath = require.resolve('linguist-js/package.json')
    const linguistPackageDirectory = path.dirname(linguistPackagePath)
    const fixturePath = path.join(
      linguistPackageDirectory,
      'node_modules',
      'binary-extensions',
      'binary-extensions.json'
    )

    if (existsSync(fixturePath)) {
      return
    }

    const hoistedBinaryExtensionsPath = path.join(
      linguistPackageDirectory,
      '..',
      'binary-extensions',
      'binary-extensions.json'
    )
    const fallbackContent = '[]'

    const extensionsContent = existsSync(hoistedBinaryExtensionsPath)
      ? await readFile(hoistedBinaryExtensionsPath, 'utf8')
      : fallbackContent

    await mkdir(path.dirname(fixturePath), { recursive: true })
    await writeFile(fixturePath, extensionsContent, 'utf8')
  }

  async identifyLanguages(
    targetDirectory: string
  ): Promise<Record<string, unknown>> {
    await this.ensureBinaryExtensionsFixture()
    const { default: analyse } = await import('linguist-js')
    const result = await analyse.analyseFolders([targetDirectory])
    return result.languages.results
  }
}

export default new Linguist()
