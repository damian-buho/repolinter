// SPDX-FileCopyrightText: 2017 TODO Group
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
//
// SPDX-License-Identifier: Apache-2.0

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { commandExists } from '../../src/lib/command-exists.js'

describe('lib', () => {
  describe('command_exists', () => {
    it('should detect a command exists', async () => {
      const result: string | undefined = await commandExists('ssh')
      assert.strictEqual(result, 'ssh')
    })

    it("should detect a command doesn't exists", async () => {
      const result: string | undefined = await commandExists('notacommand')
      assert.strictEqual(result, undefined)
    })

    it('should detect one of the commands exist', async () => {
      const result: string | undefined = await commandExists([
        'notacommand',
        'ssh'
      ])
      assert.strictEqual(result, 'ssh')
    })

    it('should detect none of the commands exist', async () => {
      const result: string | undefined = await commandExists([
        'notacommand',
        'alsonotacommand'
      ])
      assert.strictEqual(result, undefined)
    })

    it('should detect the first command exists', async () => {
      const result: string | undefined = await commandExists(['ssh', 'ln'])
      assert.strictEqual(result, 'ssh')
    })
  })
})
