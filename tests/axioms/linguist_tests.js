// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import path from 'path'
import { fileURLToPath } from 'url'
import commandExists from 'command-exists'
import { expect } from 'chai'
import linguistAxiom from '../../axioms/linguist.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

describe('linguist', function () {
  this.timeout(30000)
  const linguistInstalled = commandExists.sync('github-linguist')

  if (!linguistInstalled) {
    it.skip('tests linguist functionality', () => {})
  } else {
    it('runs linguist', async () => {
      const mockFs = { targetDir: path.resolve(__dirname, '../../') }
      const res = await linguistAxiom(mockFs)

      expect(res.passed).to.equal(true)
      expect(res.targets).to.have.length.greaterThan(0)
      expect(res.targets.map(t => t.path)).to.contain('javascript')
    })
  }
})
