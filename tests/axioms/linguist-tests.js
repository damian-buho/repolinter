// SPDX-FileCopyrightText: 2017 TODO Group
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
//
// SPDX-License-Identifier: Apache-2.0

import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import linguistAxiom from '../../dist/axioms/linguist.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '../../')

describe(
  'linguist',
  () => {
    it(
      'runs linguist',
      { skip: !fs.existsSync(path.join(projectRoot, '.git')) },
      async () => {
        const mockFs = { targetDirectory: projectRoot }
        const result = await linguistAxiom(mockFs)

        assert.strictEqual(result.passed, true)
        assert.ok(result.targets.length > 0)
        assert.ok(result.targets.map(t => t.path).includes('javascript'))
      }
    )
  },
  { timeout: 30_000 }
)
