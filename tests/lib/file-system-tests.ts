// SPDX-FileCopyrightText: 2017 TODO Group
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
//
// SPDX-License-Identifier: Apache-2.0

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import realFs from 'node:fs'
import FileSystem from '../../src/lib/file-system.js'
import { withTestDirectory } from './git-fixture.js'

const __dirname: string = path.dirname(fileURLToPath(import.meta.url))
const sortCompare = (a: string, b: string): number => a.localeCompare(b)

describe(
  'lib',
  () => {
    describe('file_system', () => {
      describe('fileExists', () => {
        it('should return pass if the file exists', async () => {
          const index: string = 'text_file_for_test.txt'
          assert.strictEqual(
            await FileSystem.fileExists(path.resolve(__dirname, index)),
            true
          )
        })

        it('should return pass if the directory exists', async () => {
          const directory: string = '../lib'
          assert.strictEqual(
            await FileSystem.fileExists(path.resolve(__dirname, directory)),
            true
          )
        })

        it('should return fail if the file does not exist', async () => {
          const file: string = 'notAFile'
          assert.strictEqual(
            await FileSystem.fileExists(path.resolve(__dirname, file)),
            false
          )
        })
      })

      describe('relativeFileExists', () => {
        const fs = new FileSystem(__dirname)

        it('should return pass if the file exists', async () => {
          const index: string = 'text_file_for_test.txt'
          assert.strictEqual(
            await fs.relativeFileExists(path.resolve(__dirname, index)),
            true
          )
        })

        it('should return pass if the directory exists', async () => {
          const directory: string = '../lib'
          assert.strictEqual(
            await fs.relativeFileExists(path.resolve(__dirname, directory)),
            true
          )
        })

        it('should return fail if the file does not exist', async () => {
          const file: string = 'notAFile'
          assert.strictEqual(
            await fs.relativeFileExists(path.resolve(__dirname, file)),
            false
          )
        })
      })

      describe('findFirstFile', () => {
        it('should return the first element of findAllFiles', async () => {
          const includedDirectories: string[] = ['lib/', 'rules/']
          const fs = new FileSystem(
            path.resolve('./tests'),
            includedDirectories
          )
          const files: string[] = await fs.findAllFiles('**/*', false)
          const file: string = await fs.findFirstFile('**/*', false)
          assert.ok(files.length > 0)
          assert.ok(files.includes(file))
        })
      })

      describe('findFirst', () => {
        it('should return the first element of findAll', async () => {
          const includedDirectories: string[] = ['lib/', 'rules/']
          const fs = new FileSystem(
            path.resolve('./tests'),
            includedDirectories
          )
          const files: string[] = await fs.findAll('**/*', false)
          const file: string = await fs.findFirst('**/*', false)
          assert.ok(files.length > 0)
          assert.ok(files.includes(file))
        })
      })

      describe('findAllFiles', () => {
        describe('symlink handling', () => {
          it('should ignore symlinks for ** globs', async () => {
            await withTestDirectory(async (testDirectory: string) => {
              const symlink: string = path.join(
                testDirectory,
                'symlink_for_test'
              )
              realFs.symlinkSync('file-system-tests.js', symlink)
              const stats = realFs.lstatSync(symlink)
              assert.strictEqual(stats.isSymbolicLink(), true)
              const fs = new FileSystem(testDirectory)
              const files: string[] = await fs.findAllFiles('**/*', false)
              assert.strictEqual(files.length, 0)
            })
          })
        })
      })

      describe('findAll', () => {
        it('should honor filtered directories', async () => {
          const includedDirectories: string[] = ['lib/', 'rules/']
          const includedRegex = /(lib|rules)\/\S+.js/
          const excludedRegex = /(formatters|package)\/\S+.js/
          const fs = new FileSystem(
            path.resolve('./tests'),
            includedDirectories
          )

          const files: string[] = await fs.findAll('**/*.js', false)

          const areAllIncluded: boolean = files.every((file: string) => {
            return includedRegex.test(file)
          })

          const areNoneExcluded: boolean = files.every((file: string) => {
            return !excludedRegex.test(file)
          })
          assert.strictEqual(areAllIncluded, true)
          assert.strictEqual(areNoneExcluded, true)
        })

        it('should honor filtered files', async () => {
          const includedFiles: string[] = [
            'dist/index.js',
            path.join('bin', 'repolinter.bat')
          ]
          const fs = new FileSystem(path.resolve('.'), includedFiles)

          const filesRaw: string[] = await fs.findAll('**/*', false)
          const files: string[] = filesRaw.map((file: string) => {
            return path.relative(path.resolve('.'), file)
          })
          assert.deepStrictEqual(
            [...files].toSorted(sortCompare),
            [...includedFiles].toSorted(sortCompare)
          )
        })

        it('should honor nocase true', async () => {
          const includedFiles: string[] = ['dist/index.js']
          const fs = new FileSystem(path.resolve('.'), includedFiles)

          const filesRaw: string[] = await fs.findAll('**/iNdEx.Js', true)
          const files: string[] = filesRaw.map((file: string) => {
            return path.relative(path.resolve('.'), file)
          })
          assert.deepStrictEqual(
            [...files].toSorted(sortCompare),
            [...includedFiles].toSorted(sortCompare)
          )
        })

        it('should honor nocase false', async () => {
          const includedFiles: string[] = ['dist/index.js']
          const fs = new FileSystem(path.resolve('.'), includedFiles)

          const filesRaw: string[] = await fs.findAll('**/iNdEx.Js', false)
          const files: string[] = filesRaw.map((file: string) => {
            return path.relative(path.resolve('.'), file)
          })
          assert.deepStrictEqual(files, [])
        })

        it('should not honor nocase by default', async () => {
          const includedFiles: string[] = ['dist/index.js']
          const fs = new FileSystem(path.resolve('.'), includedFiles)

          const filesRaw: string[] = await fs.findAll('**/iNdEx.Js')
          const files: string[] = filesRaw.map((file: string) => {
            return path.relative(path.resolve('.'), file)
          })
          assert.deepStrictEqual(files, [])
        })
      })

      describe('isBinaryFile', () => {
        const fs = new FileSystem(__dirname)

        it('should return true for a non-text file', async () => {
          const isBinary: boolean = await fs.isBinaryFile('image_for_test.png')
          assert.strictEqual(isBinary, true)
        })

        it('should return false for a text file', async () => {
          const isBinary: boolean = await fs.isBinaryFile(
            'file-system-tests.ts'
          )
          assert.strictEqual(isBinary, false)
        })
      })

      describe('getFileContents', () => {
        const fs = new FileSystem(__dirname)

        it('should return undefined if the file does not exist', async () => {
          const actual = await fs.getFileContents('notAFile')
          assert.strictEqual(actual, undefined)
        })

        it('should return the contents of a file', async () => {
          const raw: string = await fs.getFileContents('text_file_for_test.txt')
          const actual: string = raw.replaceAll('\r', '')
          assert.strictEqual(
            actual,
            'The contents of this file\nwill be monitored for quality assurance purposes\n'
          )
        })
      })

      describe('setFileContents', async () => {
        it('should return undefined if the file does not exist', async () => {
          await withTestDirectory(async (testDirectory: string) => {
            const fs = new FileSystem(testDirectory)
            const actual = await fs.getFileContents('notAFile')
            assert.strictEqual(actual, undefined)
          })
        })

        it('should change the contents of a file', async () => {
          await withTestDirectory(async (testDirectory: string) => {
            const source: string = path.resolve(
              __dirname,
              'text_file_for_test.txt'
            )
            const destination: string = path.join(
              testDirectory,
              'text_file_for_test.txt'
            )
            realFs.copyFileSync(source, destination)
            const fs = new FileSystem(testDirectory)
            const expected: string = 'somefilecontents\nmorecontents\n'
            await fs.setFileContents('text_file_for_test.txt', expected)
            const fileContents: string = await realFs.promises.readFile(
              destination,
              'utf8'
            )
            const realFileContents: string = fileContents.replaceAll('\r', '')
            assert.strictEqual(realFileContents, expected)
          })
        })
      })

      describe('getFileLines', () => {})

      describe('resolveContained', () => {
        const fsInstance = new FileSystem(__dirname)

        it('should resolve a relative path within targetDirectory', () => {
          const resolved: string = fsInstance.resolveContained(
            'text_file_for_test.txt'
          )
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
