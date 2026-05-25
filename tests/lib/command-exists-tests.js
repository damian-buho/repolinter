// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { commandExists } from '../../dist/lib/command_exists.js'

describe('lib', () => {
  describe('command_exists', () => {
    it('should detect a command exists', async () => {
      const result = await commandExists('ssh')
      assert.strictEqual(result, 'ssh')
    })

    it("should detect a command doesn't exists", async () => {
      const result = await commandExists('notacommand')
      assert.strictEqual(result, null)
    })

    it('should detect one of the commands exist', async () => {
      const result = await commandExists(['notacommand', 'ssh'])
      assert.strictEqual(result, 'ssh')
    })

    it('should detect none of the commands exist', async () => {
      const result = await commandExists(['notacommand', 'alsonotacommand'])
      assert.strictEqual(result, null)
    })

    it('should detect the first command exists', async () => {
      const result = await commandExists(['ssh', 'ln'])
      assert.strictEqual(result, 'ssh')
    })
  })
})
