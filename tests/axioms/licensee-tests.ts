// SPDX-FileCopyrightText: 2017 TODO Group
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
//
// SPDX-License-Identifier: Apache-2.0

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import licenseeAxiom from '../../src/axioms/licensee.js'
import type FileSystem from '../../src/lib/file-system.js'

const __dirname: string = path.dirname(fileURLToPath(import.meta.url))

describe(
  'licensee',
  () => {
    it('runs licensee', async () => {
      const mockFs = {
        targetDirectory: path.resolve(__dirname, '../../')
      } as unknown as FileSystem
      const result = await licenseeAxiom(mockFs)

      assert.strictEqual(result.passed, true)
      assert.strictEqual(result.targets.length, 1)
      assert.strictEqual(result.targets[0].path, 'Apache-2.0')
    })

    it('returns nothing if no licenses are found', async () => {
      const mockFs = {
        targetDirectory: path.resolve(__dirname)
      } as unknown as FileSystem
      const result = await licenseeAxiom(mockFs)

      assert.strictEqual(result.passed, true)
      assert.strictEqual(result.targets.length, 0)
    })
  },
  { timeout: 30_000 }
)
