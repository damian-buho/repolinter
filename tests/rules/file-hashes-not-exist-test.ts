// Copyright 2022 TODO Group. All rights reserved.
// SPDX-FileCopyrightText: 2017 TODO Group
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
//
// SPDX-License-Identifier: Apache-2.0

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import filesNotHash from '../../src/rules/file-hashes-not-exist.js'

describe('rule', () => {
  describe('files_not_hash', () => {
    it('returns pass if requested files not matches the hashes', async () => {
      /**
      @type {any}
      */
      const mockfs = {
        findAllFiles: (): string[] => ['README.md'],
        getFileContents: (): string => 'foo',
        targetDir: '.'
      }

      const ruleopts = {
        globsAll: ['README.md'],
        hashes: ['notAValidHash']
      }

      const actual = await filesNotHash(mockfs, ruleopts)
      assert.strictEqual(actual.passed, true)
    })

    it('returns failure if requested files matches the hash', async () => {
      /**
      @type {any}
      */
      const mockfs = {
        findAllFiles: (): string[] => ['README.md'],
        getFileContents: (): string => 'foo',
        targetDir: '.'
      }

      const ruleopts = {
        globsAll: ['README.md'],
        hashes: [
          '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae'
        ]
      }

      const actual = await filesNotHash(mockfs, ruleopts)
      assert.strictEqual(actual.passed, false)
      assert.strictEqual(actual.targets.length, 1)
      assert.deepStrictEqual(actual.targets[0], {
        passed: false,
        path: 'README.md',
        message: 'Match hash'
      })
    })

    it('returns failed if requested file contents exists different algorithm', async () => {
      /**
      @type {any}
      */
      const mockfs = {
        findAllFiles: (): string[] => ['README.md'],
        getFileContents: (): string => 'foo',
        targetDir: '.'
      }

      const ruleopts = {
        globsAll: ['README.md'],
        algorithm: 'sha512',
        hashes: [
          'f7fbba6e0636f890e56fbbf3283e524c6fa3204ae298382d624741d0dc6638326e282c41be5e4254d8820772c5518a2c5a8c0c7f7eda19594a7eb539453e1ed7'
        ]
      }

      const actual = await filesNotHash(mockfs, ruleopts)
      assert.strictEqual(actual.passed, false)
      assert.strictEqual(actual.targets.length, 1)
      assert.deepStrictEqual(actual.targets[0], {
        passed: false,
        path: 'README.md',
        message: 'Match hash'
      })
    })

    it('returns success if requested file does not exist', async () => {
      /**
      @type {any}
      */
      const mockfs = {
        findAllFiles: (): string[] => [],
        getFileContents(): void {},
        targetDir: '.'
      }

      const ruleopts = {
        globsAll: ['README.md'],
        content: 'foo'
      }

      const actual = await filesNotHash(mockfs, ruleopts)
      assert.strictEqual(actual.passed, true)
    })
  })
})
