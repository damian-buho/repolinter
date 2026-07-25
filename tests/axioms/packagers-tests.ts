// SPDX-FileCopyrightText: 2017 TODO Group
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
//
// SPDX-License-Identifier: Apache-2.0

import path from 'node:path'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import packagers from '../../src/axioms/packagers.js'
import FileSystem from '../../src/lib/file-system.js'

describe('packagers', () => {
  it('repolinter is only npm', async () => {
    const fileSystem = new FileSystem(path.resolve('.'))

    const actual = await packagers(fileSystem)
    assert.strictEqual(actual.passed, true)
    assert.strictEqual(actual.targets.length, 1)
    assert.strictEqual(actual.targets[0].passed, true)
    assert.strictEqual(actual.targets[0].path, 'npm')
  })
})
