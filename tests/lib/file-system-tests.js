// SPDX-FileCopyrightText: 2017 TODO Group
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
//
// SPDX-License-Identifier: Apache-2.0

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import realFs from 'node:fs'
import FileSystem from '../../dist/lib/file-system.js'
import { withTestDirectory } from './git-fixture.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sortCompare = (a, b) => a.localeCompare(b)

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
        describe('symlink handling', () => {
          it('should ignore symlinks for ** globs', async () => {
            await withTestDirectory(async testDirectory => {
              const symlink = path.join(testDirectory, 'symlink_for_test')
              realFs.symlinkSync('file-system-tests.js', symlink)
              const stats = realFs.lstatSync(symlink)
              assert.strictEqual(stats.isSymbolicLink(), true)
              const fs = new FileSystem(testDirectory)
              const files = await fs.findAllFiles('**/*', false)
              assert.strictEqual(files.length, 0)
            })
          })
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
            return includedRegex.test(file)
          })

          var ignoredExcluded = files.every(file => {
            return !excludedRegex.test(file)
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
            [...files].toSorted(sortCompare),
            [...includedFiles].toSorted(sortCompare)
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
            [...files].toSorted(sortCompare),
            [...includedFiles].toSorted(sortCompare)
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
        it('should return undefined if the file does not exist', async () => {
          await withTestDirectory(async testDirectory => {
            const fs = new FileSystem(testDirectory)
            const actual = await fs.getFileContents('notAFile')
            assert.strictEqual(actual, undefined)
          })
        })

        it('should change the contents of a file', async () => {
          await withTestDirectory(async testDirectory => {
            const source = path.resolve(__dirname, 'text_file_for_test.txt')
            const destination = path.join(
              testDirectory,
              'text_file_for_test.txt'
            )
            realFs.copyFileSync(source, destination)
            const fs = new FileSystem(testDirectory)
            const expected = 'somefilecontents\nmorecontents\n'
            await fs.setFileContents('text_file_for_test.txt', expected)
            const fileContents = await realFs.promises.readFile(
              destination,
              'utf8'
            )
            const realFileContents = fileContents.replaceAll('\r', '')
            assert.strictEqual(realFileContents, expected)
          })
        })
      })

      describe('getFileLines', () => {})

      describe('resolveContained', () => {
        const fsInstance = new FileSystem(__dirname)

        it('should resolve a relative path within targetDirectory', () => {
          const resolved = fsInstance.resolveContained('text_file_for_test.txt')
          assert.strictEqual(
            resolved,
            path.resolve(__dirname, 'text_file_for_test.txt')
          )
        })

        it('should throw on parent-directory traversal', () => {
          assert.throws(
            () => fsInstance.resolveContained('../../etc/passwd'),
            /resolves outside target directory/
          )
        })

        it('should throw on absolute path outside targetDirectory', () => {
          assert.throws(
            () => fsInstance.resolveContained('/etc/passwd'),
            /resolves outside target directory/
          )
        })

        it('getFileContents should reject on path traversal', async () => {
          await assert.rejects(
            () => fsInstance.getFileContents('../../package.json'),
            /resolves outside target directory/
          )
        })

        it('setFileContents should reject on path traversal', async () => {
          await assert.rejects(
            () => fsInstance.setFileContents('../../injected', 'evil'),
            /resolves outside target directory/
          )
        })

        it('removeFile should reject on path traversal', async () => {
          await assert.rejects(
            () => fsInstance.removeFile('../../package.json'),
            /resolves outside target directory/
          )
        })
      })
    })
  },
  { timeout: 10_000 }
)
