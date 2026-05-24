// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect } from 'chai'
import { commandExists } from '../../dist/lib/command_exists.js'

describe('lib', () => {
  describe('command_exists', function () {
    it('should detect a command exists', async () => {
      const result = await commandExists('ssh')
      expect(result).to.equal('ssh')
    })

    it("should detect a command doesn't exists", async () => {
      const result = await commandExists('notacommand')
      // eslint-disable-next-line unicorn/no-null
      expect(result).to.equal(null)
    })

    it('should detect one of the commands exist', async () => {
      const result = await commandExists(['notacommand', 'ssh'])
      expect(result).to.equal('ssh')
    })

    it('should detect none of the commands exist', async () => {
      const result = await commandExists(['notacommand', 'alsonotacommand'])
      // eslint-disable-next-line unicorn/no-null
      expect(result).to.equal(null)
    })

    it('should detect the first command exists', async () => {
      const result = await commandExists(['ssh', 'ln'])
      expect(result).to.equal('ssh')
    })
  })
})
