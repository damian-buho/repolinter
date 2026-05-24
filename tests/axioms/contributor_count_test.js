// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect } from 'chai'
import path from 'path'
import FileSystem from '../../dist/lib/file_system.js'
import axioms from '../../dist/axioms/axioms.js'

const contributors = axioms['contributor-count']

describe('contributors axiom', () => {
  it('repolinter contributor count greater than zero', async () => {
    const fs = new FileSystem(path.resolve('.'))
    const contributorCount = await contributors(fs)
    expect(contributorCount.passed).to.equal(true)
    expect(contributorCount.targets).to.have.length(1)
    expect(parseInt(contributorCount.targets[0].path)).to.be.greaterThan(0)
  })
})
