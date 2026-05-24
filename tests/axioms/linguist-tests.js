// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import commandExists from 'command-exists'
import { expect } from 'chai'
import linguistAxiom from '../../dist/axioms/linguist.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

describe('linguist', function () {
  this.timeout(30_000)
  const linguistInstalled = commandExists.sync('github-linguist')

  if (linguistInstalled) {
    it('runs linguist', async () => {
      const mockFs = { targetDir: path.resolve(__dirname, '../../') }
      const result = await linguistAxiom(mockFs)

      expect(result.passed).to.equal(true)
      expect(result.targets).to.have.length.greaterThan(0)
      expect(result.targets.map(t => t.path)).to.contain('javascript')
    })
  } else {
    it.skip('tests linguist functionality', () => {})
  }
})
