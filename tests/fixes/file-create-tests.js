// SPDX-FileCopyrightText: 2017 TODO Group
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
//
// SPDX-License-Identifier: Apache-2.0

import nock from 'nock'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fileCreate from '../../dist/fixes/file-create.js'

describe('fixes', () => {
  describe('file-create', () => {
    it('creates a file', async () => {
      const options = {
        file: 'myfile',
        text: 'this is text'
      }
      let mockContents
      /** @type {any} */
      const mockFs = {
        relativeFileExists() {
          return false
        },
        setFileContents(file, contents) {
          mockContents = contents
        }
      }

      const result = await fileCreate(mockFs, options, [], false)

      assert.strictEqual(result.passed, true)
      assert.strictEqual(result.targets.length, 1)
      assert.strictEqual(result.targets[0].path, 'myfile')
      assert.strictEqual(result.targets[0].passed, true)
      assert.strictEqual(mockContents, 'this is text')
    })

    it('does nothing if dryRun is true', async () => {
      const options = {
        file: 'myfile',
        text: 'this is text'
      }
      let mockContents
      /** @type {any} */
      const mockFs = {
        relativeFileExists() {
          return false
        },
        setFileContents(file, contents) {
          mockContents = contents
        }
      }

      const result = await fileCreate(mockFs, options, [], true)

      assert.strictEqual(result.passed, true)
      assert.strictEqual(result.targets.length, 1)
      assert.strictEqual(result.targets[0].path, 'myfile')
      assert.strictEqual(result.targets[0].passed, true)
      assert.strictEqual(mockContents, undefined)
    })

    it('returns an error if the targets are supplied and replace is false', async () => {
      const options = {
        file: 'myfile',
        text: 'this is text'
      }
      let mockContents
      /** @type {any} */
      const mockFs = {
        relativeFileExists() {
          return false
        },
        setFileContents(file, contents) {
          mockContents = contents
        }
      }

      const result = await fileCreate(mockFs, options, ['somefile'], false)

      assert.strictEqual(result.passed, false)
      assert.strictEqual(mockContents, undefined)
    })

    it('returns an error if the file exists and replace is false', async () => {
      const options = {
        file: 'myfile',
        text: 'this is text'
      }
      let mockContents
      /** @type {any} */
      const mockFs = {
        relativeFileExists() {
          return true
        },
        setFileContents(file, contents) {
          mockContents = contents
        }
      }

      const result = await fileCreate(mockFs, options, [], false)

      assert.strictEqual(result.passed, false)
      assert.strictEqual(mockContents, undefined)
    })

    it('pulls text from a file', async () => {
      const options = {
        file: 'myfile',
        text: { file: 'sourcefile' }
      }
      let mockContents
      /** @type {any} */
      const mockFs = {
        findFirstFile() {
          return 'sourcefile'
        },
        getFileContents() {
          return 'this is text'
        },
        relativeFileExists() {
          return false
        },
        setFileContents(file, contents) {
          mockContents = contents
        }
      }

      const result = await fileCreate(mockFs, options, [], false)

      assert.strictEqual(result.passed, true)
      assert.strictEqual(result.targets.length, 1)
      assert.strictEqual(result.targets[0].path, 'myfile')
      assert.strictEqual(result.targets[0].passed, true)
      assert.strictEqual(mockContents, 'this is text')
    })

    it('pulls text from a URL', async () => {
      const options = {
        file: 'myfile',
        text: { url: 'https://example.com' }
      }
      let mockContents
      /** @type {any} */
      const mockFs = {
        relativeFileExists() {
          return false
        },
        setFileContents(file, contents) {
          mockContents = contents
        }
      }
      const scope = nock('https://example.com')
        .get('/')
        .reply(200, 'this is text')

      const result = await fileCreate(mockFs, options, [], false)

      assert.strictEqual(result.passed, true)
      assert.strictEqual(result.targets.length, 1)
      assert.strictEqual(result.targets[0].path, 'myfile')
      assert.strictEqual(result.targets[0].passed, true)
      assert.strictEqual(mockContents, 'this is text')

      scope.done()
    })

    it('removes old files if replace is true', async () => {
      const options = {
        file: 'myfile',
        text: 'this is text',
        replace: true
      }
      let mockContents
      let mockRemove
      /** @type {any} */
      const mockFs = {
        relativeFileExists() {
          return false
        },
        setFileContents(file, contents) {
          mockContents = contents
        },
        removeFile(file) {
          mockRemove = file
        }
      }

      const result = await fileCreate(mockFs, options, ['oldfile'], false)

      assert.strictEqual(result.passed, true)
      assert.strictEqual(result.targets.length, 2)
      assert.strictEqual(result.targets[0].path, 'myfile')
      assert.strictEqual(result.targets[0].passed, true)
      assert.strictEqual(result.targets[1].path, 'oldfile')
      assert.strictEqual(result.targets[1].passed, true)
      assert.strictEqual(mockContents, 'this is text')
      assert.strictEqual(mockRemove, 'oldfile')
    })
  })
})
