// SPDX-FileCopyrightText: 2017 TODO Group
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
//
// SPDX-License-Identifier: Apache-2.0

import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import linguistAxiom from '../../src/axioms/linguist.js'
import type FileSystem from '../../src/lib/file-system.js'

const __dirname: string = path.dirname(fileURLToPath(import.meta.url))
const projectRoot: string = path.resolve(__dirname, '../../')

describe(
  'linguist',
  () => {
    it(
      'runs linguist',
      { skip: !fs.existsSync(path.join(projectRoot, '.git')) },
      async () => {
        const mockFs = { targetDirectory: projectRoot } as unknown as FileSystem
        const result = await linguistAxiom(mockFs)

        assert.strictEqual(result.passed, true)
        assert.ok(result.targets.length > 0)
        assert.ok(result.targets.map(t => t.path).includes('javascript'))
      }
    )
  },
  { timeout: 30_000 }
)
