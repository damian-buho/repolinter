// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import nock from 'nock'
import { expect } from 'chai'
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

      expect(result.passed).to.equal(true)
      expect(result.targets).to.have.length(1)
      expect(result.targets[0].path).to.equal('myfile')
      expect(result.targets[0].passed).to.equal(true)
      expect(mockContents).to.equal('this is text')
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

      expect(result.passed).to.equal(true)
      expect(result.targets).to.have.length(1)
      expect(result.targets[0].path).to.equal('myfile')
      expect(result.targets[0].passed).to.equal(true)
      expect(mockContents).to.equal(undefined)
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

      expect(result.passed).to.equal(false)
      expect(mockContents).to.equal(undefined)
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

      expect(result.passed).to.equal(false)
      expect(mockContents).to.equal(undefined)
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

      expect(result.passed).to.equal(true)
      expect(result.targets).to.have.length(1)
      expect(result.targets[0].path).to.equal('myfile')
      expect(result.targets[0].passed).to.equal(true)
      expect(mockContents).to.equal('this is text')
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

      expect(result.passed).to.equal(true)
      expect(result.targets).to.have.length(1)
      expect(result.targets[0].path).to.equal('myfile')
      expect(result.targets[0].passed).to.equal(true)
      expect(mockContents).to.equal('this is text')

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

      expect(result.passed).to.equal(true)
      expect(result.targets).to.have.length(2)
      expect(result.targets[0].path).to.equal('myfile')
      expect(result.targets[0].passed).to.equal(true)
      expect(result.targets[1].path).to.equal('oldfile')
      expect(result.targets[1].passed).to.equal(true)
      expect(mockContents).to.equal('this is text')
      expect(mockRemove).to.equal('oldfile')
    })
  })
})
