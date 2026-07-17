// SPDX-FileCopyrightText: 2017 TODO Group.
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
// SPDX-License-Identifier: Apache-2.0

import { createRequire } from 'node:module'
import path from 'node:path'
import { existsSync, statSync } from 'node:fs'
import { cp, mkdir, rm, writeFile } from 'node:fs/promises'

const require = createRequire(import.meta.url)

class Linguist {
  private async ensureBinaryExtensionsFixture(): Promise<void> {
    const linguistPackagePath = require.resolve('linguist-js/package.json')
    const linguistPackageDirectory = path.dirname(linguistPackagePath)
    const fixtureDirectory = path.join(
      linguistPackageDirectory,
      'node_modules',
      'binary-extensions'
    )
    const indexPath = path.join(fixtureDirectory, 'index.js')

    if (existsSync(indexPath) && statSync(indexPath).size > 0) {
      return
    }

    const hoistedBinaryExtensionsDirectory = path.join(
      linguistPackageDirectory,
      '..',
      'binary-extensions'
    )

    if (existsSync(hoistedBinaryExtensionsDirectory)) {
      if (existsSync(fixtureDirectory)) {
        await rm(fixtureDirectory, { recursive: true })
      }
      await cp(hoistedBinaryExtensionsDirectory, fixtureDirectory, {
        recursive: true
      })
      return
    }

    const fallbackContent = '[]'
    if (existsSync(fixtureDirectory)) {
      await rm(fixtureDirectory, { recursive: true })
    }
    await mkdir(fixtureDirectory, { recursive: true })
    await writeFile(
      path.join(fixtureDirectory, 'package.json'),
      JSON.stringify({ name: 'binary-extensions', type: 'module' }),
      'utf8'
    )
    await writeFile(
      path.join(fixtureDirectory, 'index.js'),
      `export default ${fallbackContent};`,
      'utf8'
    )
    await writeFile(
      path.join(fixtureDirectory, 'binary-extensions.json'),
      fallbackContent,
      'utf8'
    )
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
