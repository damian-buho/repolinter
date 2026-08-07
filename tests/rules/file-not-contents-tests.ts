// SPDX-FileCopyrightText: 2017 TODO Group
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
//
// SPDX-License-Identifier: Apache-2.0

import fs from 'node:fs'
import path from 'node:path'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import FileSystem from '../../src/lib/file-system.js'
import fileNotContents from '../../src/rules/file-not-contents.js'
import { withTestDirectory } from '../lib/git-fixture.js'

describe('rule', () => {
  describe('files_not_contents', () => {
    it('returns passes if requested file content do not exist', async () => {
      /**
      @type {any}
      */
      const mockfs = {
        findAllFiles: () => ['README.md'],
        getFileContents: () => 'foo',
        targetDir: '.'
      }

      const ruleopts = {
        globsAll: ['README*'],
        content: 'bar'
      }

      const actual = await fileNotContents(mockfs, ruleopts)
      assert.strictEqual(actual.passed, true)
      assert.strictEqual(actual.targets.length, 1)
      assert.deepStrictEqual(actual.targets[0], {
        passed: true,
        path: 'README.md',
        message: "Doesn't contain bar"
      })
      assert.ok(actual.targets[0].message?.includes(ruleopts.content))
    })

    it('returns fails if requested file content exists', async () => {
      /**
      @type {any}
      */
      const mockfs = {
        findAllFiles: () => ['README.md'],
        getFileContents: () => 'foo',
        targetDir: '.'
      }

      const ruleopts = {
        globsAll: ['README*'],
        content: 'foo'
      }

      const actual = await fileNotContents(mockfs, ruleopts)
      assert.strictEqual(actual.passed, false)
      assert.strictEqual(actual.targets.length, 1)
      assert.deepStrictEqual(actual.targets[0], {
        passed: false,
        path: 'README.md',
        message: 'Contains foo'
      })
      assert.ok(actual.targets[0].message?.includes(ruleopts.content))
    })

    it('returns success if success flag enabled but file does not exist', async () => {
      /**
      @type {any}
      */
      const mockfs = {
        findAllFiles: () => [],
        getFileContents() {},
        targetDir: '.'
      }

      const ruleopts = {
        globsAll: ['READMOI.md'],
        content: 'foo',
        'succeed-on-non-existent': true
      }

      const actual = await fileNotContents(mockfs, ruleopts)

      assert.strictEqual(actual.passed, true)
      assert.strictEqual(actual.targets.length, 1)
      assert.strictEqual(actual.targets[0].pattern, ruleopts.globsAll[0])
    })

    it('returns success if requested file does not exist', async () => {
      /**
      @type {any}
      */
      const mockfs = {
        findAllFiles: () => [],
        getFileContents() {},
        targetDir: '.'
      }

      const ruleopts = {
        globsAll: ['README.md'],
        content: 'foo'
      }

      const actual = await fileNotContents(mockfs, ruleopts)
      assert.strictEqual(actual.passed, true)
      assert.strictEqual(actual.targets.length, 1)
      assert.strictEqual(actual.targets[0].pattern, ruleopts.globsAll[0])
    })

    describe('broken symlink handling', () => {
      it('should handle broken symlinks', async () => {
        await withTestDirectory(async (testDirectory: string) => {
          const brokenSymlink = path.join(
            testDirectory,
            'broken_symlink_for_test'
          )
          fs.symlinkSync('nonexistantfile', brokenSymlink)
          const stat = fs.lstatSync(brokenSymlink)
          assert.strictEqual(stat.isSymbolicLink(), true)
          const fsInstance = new FileSystem(testDirectory)

          const ruleopts = {
            globsAll: [brokenSymlink],
            lineCount: 1,
            content: 'something'
          }
          const actual = await fileNotContents(fsInstance, ruleopts)
          assert.strictEqual(actual.passed, true)
        })
      })
    })

    it('returns passes if requested file contents do not exist', async () => {
      /**
      @type {any}
      */
      const mockfs = {
        findAllFiles: () => ['README.md'],
        getFileContents: () => 'foo',
        targetDir: '.'
      }

      const ruleopts = {
        globsAll: ['README*'],
        contents: ['bar', 'jax']
      }

      const actual = await fileNotContents(mockfs, ruleopts)
      assert.strictEqual(actual.passed, true)
      assert.strictEqual(actual.targets.length, 0)
      assert.strictEqual(
        actual.message,
        'Did not find content matching specified patterns'
      )
    })

    it('returns fails if requested file contents exists', async () => {
      /**
      @type {any}
      */
      const mockfs = {
        findAllFiles: () => ['README.md'],
        getFileContents: () => 'foobar',
        targetDir: '.'
      }

      const ruleopts = {
        globsAll: ['README*'],
        contents: ['foo', 'bar']
      }

      const actual = await fileNotContents(mockfs, ruleopts)
      assert.strictEqual(actual.passed, false)
      assert.strictEqual(actual.targets.length, 2)
      assert.deepStrictEqual(actual.targets[0], {
        passed: false,
        path: 'README.md',
        message: 'Contains foo'
      })
      assert.ok(actual.targets[0].message?.includes(ruleopts.contents[0]))
      assert.ok(actual.targets[1].message?.includes(ruleopts.contents[1]))
    })
  })
})
