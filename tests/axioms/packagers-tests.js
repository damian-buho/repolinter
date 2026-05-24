// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import path from 'node:path'
import { expect } from 'chai'
import packagers from '../../dist/axioms/packagers.js'
import FileSystem from '../../dist/lib/file_system.js'

describe('packagers', () => {
  it('repolinter is only npm', async () => {
    const fileSystem = new FileSystem(path.resolve('.'))

    const actual = await packagers(fileSystem)
    expect(actual.passed).to.equal(true)
    expect(actual.targets).to.have.length(1)
    expect(actual.targets[0].passed).to.equal(true)
    expect(actual.targets[0].path).to.equal('npm')
  })
})
