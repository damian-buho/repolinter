// SPDX-FileCopyrightText: 2017 TODO Group
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
//
// SPDX-License-Identifier: Apache-2.0

import nock from 'nock'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fileModify from '../../src/fixes/file-modify.js'

describe('fixes', () => {
  describe('file-modify', () => {
    it('appends text to a file', async () => {
      const options = {
        files: ['myfile'],
        text: 'this is text'
      }
      let mockContents = ''
      /**
      @type {any}
      */
      const mockFs = {
        findAllFiles: () => ['myfile'],
        getFileContents: () => 'the file contents',
        setFileContents(file: string, contents: string) {
          mockContents = contents
        }
      }

      const result = await fileModify(mockFs, options, [], false)

      assert.strictEqual(result.passed, true)
      assert.strictEqual(result.targets.length, 1)
      assert.strictEqual(result.targets[0].path, 'myfile')
      assert.strictEqual(result.targets[0].passed, true)
      assert.strictEqual(mockContents, 'the file contentsthis is text')
    })

    it('prepends text to a file', async () => {
      const options = {
        files: ['myfile'],
        text: 'this is text',
        write_mode: 'prepend'
      }
      let mockContents = ''
      /**
      @type {any}
      */
      const mockFs = {
        findAllFiles: () => ['myfile'],
        getFileContents: () => 'the file contents',
        setFileContents(file: string, contents: string) {
          mockContents = contents
        }
      }

      const result = await fileModify(mockFs, options, [], false)

      assert.strictEqual(result.passed, true)
      assert.strictEqual(result.targets.length, 1)
      assert.strictEqual(result.targets[0].path, 'myfile')
      assert.strictEqual(result.targets[0].passed, true)
      assert.strictEqual(mockContents, 'this is textthe file contents')
    })

    it('does nothing if dryRun is enabled', async () => {
      const options = {
        files: ['myfile'],
        text: 'this is text'
      }
      let mockContents
      /**
      @type {any}
      */
      const mockFs = {
        findAllFiles: () => ['myfile'],
        getFileContents: () => 'the file contents',
        setFileContents(file: string, contents: string) {
          mockContents = contents
        }
      }

      const result = await fileModify(mockFs, options, [], true)

      assert.strictEqual(result.passed, true)
      assert.strictEqual(result.targets.length, 1)
      assert.strictEqual(result.targets[0].path, 'myfile')
      assert.strictEqual(result.targets[0].passed, true)
      assert.strictEqual(mockContents, undefined)
    })

    it('targets a file specified by the rule', async () => {
      const options = {
        text: 'this is text'
      }
      let mockContents = ''
      /**
      @type {any}
      */
      const mockFs = {
        findAllFiles: () => ['myfile'],
        getFileContents: () => 'the file contents',
        setFileContents(file: string, contents: string) {
          mockContents = contents
        }
      }

      const result = await fileModify(mockFs, options, ['myfile'], false)

      assert.strictEqual(result.passed, true)
      assert.strictEqual(result.targets.length, 1)
      assert.strictEqual(result.targets[0].path, 'myfile')
      assert.strictEqual(result.targets[0].passed, true)
      assert.strictEqual(mockContents, 'the file contentsthis is text')
    })

    it('fails if no files are specified', async () => {
      const options = {
        text: 'this is text'
      }
      /**
      @type {any}
      */
      const mockFs = {}

      const result = await fileModify(mockFs, options, [], false)

      assert.strictEqual(result.passed, false)
      assert.strictEqual(result.targets.length, 0)
    })

    it('skips extensions correctly', async () => {
      const options = {
        text: 'this is text',
        'skip-paths-matching': { extensions: ['exe'] }
      }
      let mockFile
      /**
      @type {any}
      */
      const mockFs = {
        findAllFiles: () => ['myfile.exe', 'otherfile'],
        getFileContents: () => 'the file contents',
        setFileContents(f: string) {
          mockFile = f
        }
      }

      const result = await fileModify(mockFs, options, ['myfile.exe'], false)

      assert.strictEqual(result.passed, true)
      assert.strictEqual(result.targets.length, 1)
      assert.strictEqual(result.targets[0].path, 'otherfile')
      assert.strictEqual(result.targets[0].passed, true)
      assert.strictEqual(mockFile, 'otherfile')
    })

    it('skips path patterns correctly', async () => {
      const options = {
        text: 'this is text',
        'skip-paths-matching': { patterns: ['exe'] }
      }
      let mockFile
      /**
      @type {any}
      */
      const mockFs = {
        findAllFiles: () => ['myfile.exe', 'otherfile'],
        getFileContents: () => 'the file contents',
        setFileContents(f: string) {
          mockFile = f
        }
      }

      const result = await fileModify(mockFs, options, ['myfile.exe'], false)

      assert.strictEqual(result.passed, true)
      assert.strictEqual(result.targets.length, 1)
      assert.strictEqual(result.targets[0].path, 'otherfile')
      assert.strictEqual(result.targets[0].passed, true)
      assert.strictEqual(mockFile, 'otherfile')
    })

    it('pulls text from a file', async () => {
      const options = {
        files: ['myfile'],
        text: { file: 'sourcefile' }
      }
      let mockContents
      /**
      @type {any}
      */
      const mockFs = {
        findFirstFile: () => 'sourcefile',
        findAllFiles: () => ['myfile'],
        getFileContents: (file: string) =>
          file === 'myfile' ? 'the file contents' : 'this is text',
        setFileContents(file: string, contents: string) {
          mockContents = contents
        }
      }

      const result = await fileModify(mockFs, options, [], false)

      assert.strictEqual(result.passed, true)
      assert.strictEqual(result.targets.length, 1)
      assert.strictEqual(result.targets[0].path, 'myfile')
      assert.strictEqual(result.targets[0].passed, true)
      assert.strictEqual(mockContents, 'the file contentsthis is text')
    })

    it('pulls text from a URL', async () => {
      const options = {
        files: ['myfile'],
        text: { url: 'https://example.com' }
      }
      let mockContents
      /**
      @type {any}
      */
      const mockFs = {
        findAllFiles: () => ['myfile'],
        getFileContents: () => 'the file contents',
        setFileContents(f: string, c: string) {
          mockContents = c
        }
      }
      const scope = nock('https://example.com')
        .get('/')
        .reply(200, 'this is text')

      const result = await fileModify(mockFs, options, [], false)

      assert.strictEqual(result.passed, true)
      assert.strictEqual(result.targets.length, 1)
      assert.strictEqual(result.targets[0].path, 'myfile')
      assert.strictEqual(result.targets[0].passed, true)
      assert.strictEqual(mockContents, 'the file contentsthis is text')

      scope.done()
    })

    it('adds newlines correctly', async () => {
      const options = {
        files: ['myfile'],
        text: 'this is text',
        newlines: { begin: 3, end: 4 }
      }
      let mockContents = ''
      /**
      @type {any}
      */
      const mockFs = {
        findAllFiles: () => ['myfile'],
        getFileContents: () => 'the file contents',
        setFileContents(file: string, contents: string) {
          mockContents = contents
        }
      }

      const result = await fileModify(mockFs, options, [], false)

      assert.strictEqual(result.passed, true)
      assert.strictEqual(
        mockContents,
        'the file contents\n\n\nthis is text\n\n\n\n'
      )
    })
  })
})
