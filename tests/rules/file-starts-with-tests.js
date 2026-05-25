// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import fs from 'node:fs'
import path from 'node:path'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import FileSystem from '../../dist/lib/file_system.js'
import fileStartsWith from '../../dist/rules/file-starts-with.js'

describe('rule', () => {
  describe('file-starts-with', () => {
    it('returns a passed result if requested file matches the patterns', async () => {
      const ruleopts = {
        globsAll: ['dist/rules/file-starts-with.js'],
        lineCount: 2,
        patterns: ['Copyright', 'License']
      }

      const actual = await fileStartsWith(new FileSystem(), ruleopts)

      assert.strictEqual(actual.passed, true)
      assert.strictEqual(actual.targets.length, 1)
      assert.strictEqual(actual.targets[0].passed, true)
      assert.strictEqual(actual.targets[0].path, ruleopts.globsAll[0])
    })

    it("returns a failure result if requested file doesn't match all the patterns", async () => {
      /** @type {any} */
      const mockfs = {
        findAllFiles() {
          return ['somefile.js']
        },
        getFileLines() {
          return 'some javascript code'
        },
        targetDir: '.'
      }

      const ruleopts = {
        globsAll: ['*.js'],
        lineCount: 5,
        patterns: ['javascript', 'Copyright', 'Rights']
      }

      const actual = await fileStartsWith(mockfs, ruleopts)

      assert.strictEqual(actual.passed, false)
      assert.strictEqual(actual.targets.length, 1)
      assert.strictEqual(actual.targets[0].path, 'somefile.js')
      assert.strictEqual(actual.targets[0].passed, false)
      assert.ok(actual.targets[0].message.includes('Copyright'))
      assert.ok(actual.targets[0].message.includes('Rights'))
      assert.ok(!actual.targets[0].message.includes('javascript'))
    })

    it('returns failure if skip binary files is enabled and only file is binary file', async () => {
      const ruleopts = {
        'skip-binary-files': true,
        globsAll: ['tests/rules/image_for_test.png'],
        lineCount: 5,
        patterns: ['javascript', 'Copyright', 'Rights']
      }

      const actual = await fileStartsWith(new FileSystem(), ruleopts)
      assert.strictEqual(actual.passed, false)
      assert.strictEqual(actual.targets.length, 1)
      assert.strictEqual(actual.targets[0].pattern, ruleopts.globsAll[0])
    })

    it('returns a single result when glob has no matches and has succeed-on-non-existent option', async () => {
      /** @type {any} */
      const mockfs = {
        findAllFiles() {
          return []
        },
        targetDir: '.'
      }

      const ruleopts = {
        globsAll: ['*'],
        lineCount: 1,
        patterns: ['something-unmatchable'],
        'succeed-on-non-existent': true
      }

      const actual = await fileStartsWith(mockfs, ruleopts)

      assert.strictEqual(actual.passed, true)
      assert.strictEqual(actual.targets.length, 1)
      assert.strictEqual(actual.targets[0].pattern, ruleopts.globsAll[0])
    })

    it('skips files with the `skip-paths-matching` option', async () => {
      /** @type {any} */
      const mockfs = {
        findAllFiles() {
          return ['Skip/paBle-path.js', 'afile.js', 'badextension.sVg']
        },
        getFileLines() {
          return 'some javascript code'
        },
        targetDir: '.'
      }

      const ruleopts = {
        globsAll: ['*'],
        lineCount: 1,
        patterns: ['some'],
        'skip-paths-matching': {
          extensions: ['bmp', 'svg'],
          patterns: ['skip/pable', 'another-pattern-to-skip'],
          flags: 'i'
        }
      }

      const actual = await fileStartsWith(mockfs, ruleopts)

      assert.strictEqual(actual.passed, true)
      assert.strictEqual(actual.targets.length, 1)
      assert.strictEqual(actual.targets[0].passed, true)
      assert.strictEqual(actual.targets[0].path, 'afile.js')
    })

    it("returns failure if the requested files don't exist", async () => {
      /** @type {any} */
      const mockfs = {
        findAllFiles() {
          return []
        },
        targetDir: '.'
      }

      const ruleopts = {
        globsAll: ['*'],
        lineCount: 1,
        patterns: ['something']
      }

      const actual = await fileStartsWith(mockfs, ruleopts)

      assert.strictEqual(actual.passed, false)
      assert.strictEqual(actual.targets.length, 1)
      assert.strictEqual(actual.targets[0].pattern, ruleopts.globsAll[0])
    })

    it('should handle broken symlinks', async () => {
      const brokenSymlink = './tests/rules/broken_symlink_for_test'
      const stat = fs.lstatSync(brokenSymlink)
      assert.strictEqual(stat.isSymbolicLink(), true)
      const fsInstance = new FileSystem(path.resolve('.'))

      const ruleopts = {
        globsAll: [brokenSymlink],
        lineCount: 1,
        patterns: ['something']
      }

      const actual = await fileStartsWith(fsInstance, ruleopts)
      assert.strictEqual(actual.passed, false)
      assert.strictEqual(actual.targets.length, 1)
      assert.strictEqual(actual.targets[0].pattern, ruleopts.globsAll[0])
    })
  })
})
