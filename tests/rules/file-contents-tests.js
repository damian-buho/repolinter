// SPDX-FileCopyrightText: 2017 TODO Group
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
//
// SPDX-License-Identifier: Apache-2.0

import fs from 'node:fs'
import path from 'node:path'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import FileSystem from '../../dist/lib/file-system.js'
import fileContents from '../../dist/rules/file-contents.js'
import { withTestDirectory } from '../lib/git-fixture.js'

describe('rule', () => {
  describe('files_contents', () => {
    it('returns passes if requested file contents exists', async () => {
      /** @type {any} */
      const mockfs = {
        findAllFiles: () => ['README.md'],
        getFileContents: () => 'foo',
        targetDir: '.'
      }

      const ruleopts = {
        globsAll: ['README*'],
        content: 'foo'
      }

      const actual = await fileContents(mockfs, ruleopts)
      assert.strictEqual(actual.passed, true)
      assert.strictEqual(actual.targets.length, 1)
      assert.deepStrictEqual(actual.targets[0], {
        passed: true,
        path: 'README.md',
        message: 'Contains foo'
      })
    })

    it('returns passes and display context if requested file contents exists', async () => {
      /** @type {any} */
      const mockfs = {
        findAllFiles: () => ['README.md'],
        getFileContents: () => 'foo get test',
        targetDir: '.'
      }

      const ruleopts = {
        globsAll: ['README*'],
        content: 'get',
        'display-result-context': true,
        'context-char-length': 2
      }

      const actual = await fileContents(mockfs, ruleopts)
      assert.strictEqual(actual.passed, true)
      assert.strictEqual(actual.targets.length, 1)
      assert.deepStrictEqual(actual.targets[0], {
        passed: true,
        path: 'README.md',
        message: "Contains 'get' on line 1, context: \n\t|o get t"
      })
    })

    it('returns failure and display context if requested file contents exists', async () => {
      /** @type {any} */
      const mockfs = {
        findAllFiles: () => ['README.md'],
        getFileContents: () => 'foo get test',
        targetDir: '.'
      }

      const ruleopts = {
        globsAll: ['README*'],
        content: 'get',
        'display-result-context': true,
        'context-char-length': 2
      }

      const actual = await fileContents(mockfs, ruleopts, true)
      assert.strictEqual(actual.passed, false)
      assert.strictEqual(actual.targets.length, 1)
      assert.deepStrictEqual(actual.targets[0], {
        passed: false,
        path: 'README.md',
        message: "Contains 'get' on line 1, context: \n\t|o get t"
      })
    })

    it('returns passes if requested file contents exists with human-readable contents', async () => {
      /** @type {any} */
      const mockfs = {
        findAllFiles: () => ['README.md'],
        getFileContents: () => 'foo',
        targetDir: '.'
      }
      const ruleopts = {
        globsAll: ['README*'],
        content: '[abcdef][oO0][^q]',
        'human-readable-content': 'actually foo'
      }

      const actual = await fileContents(mockfs, ruleopts)
      assert.strictEqual(actual.passed, true)
      assert.strictEqual(actual.targets.length, 1)
      assert.deepStrictEqual(actual.targets[0], {
        passed: true,
        path: 'README.md',
        message: 'Contains actually foo'
      })
      assert.ok(
        actual.targets[0].message.includes(ruleopts['human-readable-content'])
      )
    })

    it('returns fails if requested file contents does not exist', async () => {
      /** @type {any} */
      const mockfs = {
        findAllFiles: () => ['README.md'],
        getFileContents: () => 'foo',
        targetDir: '.'
      }

      const ruleopts = {
        globsAll: ['README*'],
        content: 'bar'
      }

      const actual = await fileContents(mockfs, ruleopts)

      assert.strictEqual(actual.passed, false)
      assert.strictEqual(actual.targets.length, 1)
      assert.deepStrictEqual(actual.targets[0], {
        passed: false,
        path: 'README.md',
        message: "Doesn't contain bar"
      })
      assert.ok(actual.targets[0].message.includes(ruleopts.content))
    })

    it('returns the pattern if requested file does not exist', async () => {
      /** @type {any} */
      const mockfs = {
        findAllFiles: () => [],
        getFileContents() {},
        targetDir: '.'
      }
      const ruleopts = {
        globsAll: ['README.md'],
        content: 'foo'
      }

      const actual = await fileContents(mockfs, ruleopts)
      assert.strictEqual(actual.passed, true)
      assert.strictEqual(actual.targets.length, 1)
      assert.strictEqual(actual.targets[0].passed, true)
      assert.strictEqual(actual.targets[0].pattern, ruleopts.globsAll[0])
    })

    it('returns failure if file does not exist with failure flag', async () => {
      /** @type {any} */
      const mockfs = {
        findAllFiles: () => [],
        getFileContents() {},
        targetDir: '.'
      }
      const ruleopts = {
        globsAll: ['README.md', 'READMOI.md'],
        content: 'foo',
        'fail-on-non-existent': true
      }

      const actual = await fileContents(mockfs, ruleopts)

      assert.strictEqual(actual.passed, false)
    })

    describe('broken symlink handling', () => {
      it('should handle broken symlinks', async () => {
        await withTestDirectory(async testDirectory => {
          const brokenSymlink = path.join(
            testDirectory,
            'broken_symlink_for_test'
          )
          fs.symlinkSync('nonexistantfile', brokenSymlink)
          const stat = fs.lstatSync(brokenSymlink)
          assert.strictEqual(stat.isSymbolicLink(), true)
          const fsInstance = new FileSystem(testDirectory)

          const rule = {
            globsAll: [brokenSymlink],
            lineCount: 1,
            patterns: ['something']
          }
          const actual = await fileContents(fsInstance, rule)
          assert.strictEqual(actual.passed, true)
        })
      })
    })
  })
})
