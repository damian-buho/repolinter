// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import commandExists from 'command-exists'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import linguistAxiom from '../../dist/axioms/linguist.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

describe(
  'linguist',
  () => {
    const linguistInstalled = commandExists.sync('github-linguist')

    if (linguistInstalled) {
      it('runs linguist', async () => {
        const mockFs = { targetDir: path.resolve(__dirname, '../../') }
        const result = await linguistAxiom(mockFs)

        assert.strictEqual(result.passed, true)
        assert.ok(result.targets.length > 0)
        assert.ok(result.targets.map(t => t.path).includes('javascript'))
      })
    } else {
      it.skip('tests linguist functionality', () => {})
    }
  },
  { timeout: 30_000 }
)
