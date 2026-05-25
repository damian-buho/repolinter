// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import realFs from 'node:fs'
import FileSystem from '../../dist/lib/file-system.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

describe(
  'lib',
  () => {
    describe('file_system', () => {
      describe('fileExists', () => {
        it('should return pass if the file exists', async () => {
          const index = 'text_file_for_test.txt'
          assert.strictEqual(
            await FileSystem.fileExists(path.resolve(__dirname, index)),
            true
          )
        })

        it('should return pass if the directory exists', async () => {
          const directory = '../lib'
          assert.strictEqual(
            await FileSystem.fileExists(path.resolve(__dirname, directory)),
            true
          )
        })

        it('should return fail if the file does not exist', async () => {
          const file = 'notAFile'
          assert.strictEqual(
            await FileSystem.fileExists(path.resolve(__dirname, file)),
            false
          )
        })
      })

      describe('relativeFileExists', () => {
        const fs = new FileSystem(__dirname)

        it('should return pass if the file exists', async () => {
          const index = 'text_file_for_test.txt'
          assert.strictEqual(
            await fs.relativeFileExists(path.resolve(__dirname, index)),
            true
          )
        })

        it('should return pass if the directory exists', async () => {
          const directory = '../lib'
          assert.strictEqual(
            await fs.relativeFileExists(path.resolve(__dirname, directory)),
            true
          )
        })

        it('should return fail if the file does not exist', async () => {
          const file = 'notAFile'
          assert.strictEqual(
            await fs.relativeFileExists(path.resolve(__dirname, file)),
            false
          )
        })
      })

      describe('findFirstFile', () => {
        it('should return the first element of findAllFiles', async () => {
          const includedDirectories = ['lib/', 'rules/']
          const fs = new FileSystem(
            path.resolve('./tests'),
            includedDirectories
          )
          const files = await fs.findAllFiles('**/*', false)
          const file = await fs.findFirstFile('**/*', false)
          assert.ok(files.length > 0)
          assert.ok(files.includes(file))
        })
      })

      describe('findFirst', () => {
        it('should return the first element of findAll', async () => {
          const includedDirectories = ['lib/', 'rules/']
          const fs = new FileSystem(
            path.resolve('./tests'),
            includedDirectories
          )
          const files = await fs.findAll('**/*', false)
          const file = await fs.findFirst('**/*', false)
          assert.ok(files.length > 0)
          assert.ok(files.includes(file))
        })
      })

      describe('findAllFiles', () => {
        it('should ignore symlinks for ** globs', async () => {
          const symlink = './tests/lib/symlink_for_test'
          const stats = realFs.lstatSync(symlink)
          assert.strictEqual(stats.isSymbolicLink(), true)
          const fs = new FileSystem(path.resolve('./tests'))
          const files = await fs.findAllFiles('**/lib/symlink_for_test', false)
          assert.strictEqual(files.length, 0)
        })
      })

      describe('findAll', () => {
        it('should honor filtered directories', async () => {
          const includedDirectories = ['lib/', 'rules/']
          const includedRegex = /(lib|rules)\/\S+.js/
          const excludedRegex = /(formatters|package)\/\S+.js/
          const fs = new FileSystem(
            path.resolve('./tests'),
            includedDirectories
          )

          const files = await fs.findAll('**/*.js', false)

          var foundIncluded = files.every(file => {
            return file.search(includedRegex) !== -1
          })

          var ignoredExcluded = files.every(file => {
            return file.search(excludedRegex) === -1
          })
          assert.strictEqual(foundIncluded, true)
          assert.strictEqual(ignoredExcluded, true)
        })

        it('should honor filtered files', async () => {
          const includedFiles = [
            'dist/index.js',
            path.join('bin', 'repolinter.bat')
          ]
          const fs = new FileSystem(path.resolve('.'), includedFiles)

          const filesRaw = await fs.findAll('**/*', false)
          const files = filesRaw.map(file => {
            return path.relative(path.resolve('.'), file)
          })
          assert.deepStrictEqual(
            [...files].toSorted(),
            [...includedFiles].toSorted()
          )
        })

        it('should honor nocase true', async () => {
          const includedFiles = ['dist/index.js']
          const fs = new FileSystem(path.resolve('.'), includedFiles)

          const filesRaw = await fs.findAll('**/iNdEx.Js', true)
          const files = filesRaw.map(file => {
            return path.relative(path.resolve('.'), file)
          })
          assert.deepStrictEqual(
            [...files].toSorted(),
            [...includedFiles].toSorted()
          )
        })

        it('should honor nocase false', async () => {
          const includedFiles = ['dist/index.js']
          const fs = new FileSystem(path.resolve('.'), includedFiles)

          const filesRaw = await fs.findAll('**/iNdEx.Js', false)
          const files = filesRaw.map(file => {
            return path.relative(path.resolve('.'), file)
          })
          assert.deepStrictEqual(files, [])
        })

        it('should not honor nocase by default', async () => {
          const includedFiles = ['dist/index.js']
          const fs = new FileSystem(path.resolve('.'), includedFiles)

          const filesRaw = await fs.findAll('**/iNdEx.Js')
          const files = filesRaw.map(file => {
            return path.relative(path.resolve('.'), file)
          })
          assert.deepStrictEqual(files, [])
        })
      })

      describe('isBinaryFile', () => {
        const fs = new FileSystem(__dirname)

        it('should return true for a non-text file', async () => {
          const actual = await fs.isBinaryFile('image_for_test.png')
          assert.strictEqual(actual, true)
        })

        it('should return false for a text file', async () => {
          const actual = await fs.isBinaryFile('file-system-tests.js')
          assert.strictEqual(actual, false)
        })
      })

      describe('getFileContents', () => {
        const fs = new FileSystem(__dirname)

        it('should return undefined if the file does not exist', async () => {
          const actual = await fs.getFileContents('notAFile')
          assert.strictEqual(actual, undefined)
        })

        it('should return the contents of a file', async () => {
          const raw = await fs.getFileContents('text_file_for_test.txt')
          const actual = raw.replaceAll('\r', '')
          assert.strictEqual(
            actual,
            'The contents of this file\nwill be monitored for quality assurance purposes\n'
          )
        })
      })

      describe('setFileContents', async () => {
        const fs = new FileSystem(__dirname)
        const filePath = path.resolve(__dirname, 'text_file_for_test.txt')
        let contents

        before(async () => {
          contents = await realFs.promises.readFile(filePath, 'utf8')
        })

        it('should return undefined if the file does not exist', async () => {
          const actual = await fs.getFileContents('notAFile')
          assert.strictEqual(actual, undefined)
        })

        it('should change the contents of a file', async () => {
          const expected = 'somefilecontents\nmorecontents\n'
          await fs.setFileContents('text_file_for_test.txt', expected)
          const fileContents = await realFs.promises.readFile(filePath, 'utf8')
          const realFileContents = fileContents.replaceAll('\r', '')
          assert.strictEqual(realFileContents, expected)
        })

        after(async () => {
          await realFs.promises.writeFile(filePath, contents)
        })
      })

      describe('getFileLines', () => {})
    })
  },
  { timeout: 10_000 }
)
