// SPDX-FileCopyrightText: 2017 TODO Group
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
//
// SPDX-License-Identifier: Apache-2.0

import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import FileSystem from '../../dist/lib/file-system.js'
import axioms from '../../dist/axioms/axioms.js'
import { mktempRepo, commitEmptyAs, rmRepo } from '../lib/git-fixture.js'

const contributors = axioms['contributor-count']

describe('contributors axiom', () => {
  // Fixture: three commits across two distinct authors. The third commit
  // re-uses an existing author so we also exercise the deduplication branch
  // in the axiom's mapping pipeline.
  let tmpdir

  before(() => {
    tmpdir = mktempRepo()
    commitEmptyAs(tmpdir, 'first commit by alice', 'Alice')
    commitEmptyAs(tmpdir, 'first commit by bob', 'Bob')
    commitEmptyAs(tmpdir, 'second commit by alice', 'Alice')
  })

  after(() => rmRepo(tmpdir))

  it('counts distinct authors across all commits', async () => {
    const fileSystem = new FileSystem(tmpdir)
    const result = await contributors(fileSystem)

    assert.strictEqual(result.passed, true)
    assert.strictEqual(result.targets.length, 1)
    assert.strictEqual(result.targets[0].passed, true)
    // Alice + Bob; the second Alice commit must not double-count.
    assert.strictEqual(Number.parseInt(result.targets[0].path, 10), 2)
  })
})
