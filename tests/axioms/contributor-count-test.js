// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import FileSystem from '../../dist/lib/file-system.js'
import axioms from '../../dist/axioms/axioms.js'

const contributors = axioms['contributor-count']

describe('contributors axiom', () => {
  it('repolinter contributor count greater than zero', async () => {
    const fs = new FileSystem(path.resolve('.'))
    const contributorCount = await contributors(fs)
    assert.strictEqual(contributorCount.passed, true)
    assert.strictEqual(contributorCount.targets.length, 1)
    assert.ok(Number.parseInt(contributorCount.targets[0].path) > 0)
  })
})
