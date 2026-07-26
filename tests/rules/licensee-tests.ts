// SPDX-FileCopyrightText: 2017 TODO Group
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
//
// SPDX-License-Identifier: Apache-2.0

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import FileSystem from '../../src/lib/file-system.js'
import licenseDetectable from '../../src/rules/license-detectable-by-licensee.js'

const __dirname: string = path.dirname(fileURLToPath(import.meta.url))

describe('rule', () => {
  describe('licensee', () => {
    const targetDirectory: string = `${__dirname}/licensee_test_files`

    it('rule fails if no license is detectable', async () => {
      const testFs = new FileSystem(`${targetDirectory}/no-license`)

      const actual = await licenseDetectable(testFs)
      assert.strictEqual(actual.passed, false)
      assert.strictEqual(
        actual.message,
        'Licensee did not identify a license for project'
      )
    })

    it('rule passes if license is detectable, but unknown', async () => {
      const testFs = new FileSystem(`${targetDirectory}/unknown-license`)

      const actual = await licenseDetectable(testFs)
      assert.strictEqual(actual.passed, true)
      assert.strictEqual(
        actual.message,
        'Licensee identified the license for project: NOASSERTION'
      )
    })

    it('rule passes if license is detectable and recognized', async () => {
      const testFs = new FileSystem(`${targetDirectory}/0bsd`)

      const actual = await licenseDetectable(testFs)
      assert.strictEqual(actual.passed, true)
      assert.strictEqual(
        actual.message,
        'Licensee identified the license for project: 0BSD'
      )
    })
  })
})
