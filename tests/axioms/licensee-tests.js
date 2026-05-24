// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import commandExists from 'command-exists'
import { expect } from 'chai'
import licenseeAxiom from '../../dist/axioms/licensee.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

describe('licensee', function () {
  const licenseeInstalled = commandExists.sync('licensee')
  this.timeout(30_000)

  if (licenseeInstalled) {
    it('runs licensee', async () => {
      const mockFs = { targetDir: path.resolve(__dirname, '../../') }
      const result = await licenseeAxiom(mockFs)

      expect(result.passed).to.equal(true)
      expect(result.targets).to.have.length(1)
      expect(result.targets[0].path).to.equal('Apache-2.0')
    })

    it('returns nothing if no licenses are found', async () => {
      const mockFs = { targetDir: path.resolve(__dirname) }
      const result = await licenseeAxiom(mockFs)

      expect(result.passed).to.equal(true)
      expect(result.targets).to.have.length(0)
    })
  } else {
    it.skip('tests licensee functionality', () => {})
  }
})
