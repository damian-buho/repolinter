// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import nock from 'nock'
import { expect } from 'chai'
import fileModify from '../../dist/fixes/file-modify.js'

describe('fixes', () => {
  describe('file-modify', () => {
    it('appends text to a file', async () => {
      const options = {
        files: ['myfile'],
        text: 'this is text'
      }
      let mockContents = ''
      /** @type {any} */
      const mockFs = {
        findAllFiles() {
          return ['myfile']
        },
        getFileContents() {
          return 'the file contents'
        },
        setFileContents(file, contents) {
          mockContents = contents
        }
      }

      const result = await fileModify(mockFs, options, [], false)

      expect(result.passed).to.equal(true)
      expect(result.targets).to.have.length(1)
      expect(result.targets[0].path).to.equal('myfile')
      expect(result.targets[0].passed).to.equal(true)
      expect(mockContents).to.equal('the file contentsthis is text')
    })

    it('prepends text to a file', async () => {
      const options = {
        files: ['myfile'],
        text: 'this is text',
        write_mode: 'prepend'
      }
      let mockContents = ''
      /** @type {any} */
      const mockFs = {
        findAllFiles() {
          return ['myfile']
        },
        getFileContents() {
          return 'the file contents'
        },
        setFileContents(file, contents) {
          mockContents = contents
        }
      }

      const result = await fileModify(mockFs, options, [], false)

      expect(result.passed).to.equal(true)
      expect(result.targets).to.have.length(1)
      expect(result.targets[0].path).to.equal('myfile')
      expect(result.targets[0].passed).to.equal(true)
      expect(mockContents).to.equal('this is textthe file contents')
    })

    it('does nothing if dryRun is enabled', async () => {
      const options = {
        files: ['myfile'],
        text: 'this is text'
      }
      let mockContents
      /** @type {any} */
      const mockFs = {
        findAllFiles() {
          return ['myfile']
        },
        getFileContents() {
          return 'the file contents'
        },
        setFileContents(file, contents) {
          mockContents = contents
        }
      }

      const result = await fileModify(mockFs, options, [], true)

      expect(result.passed).to.equal(true)
      expect(result.targets).to.have.length(1)
      expect(result.targets[0].path).to.equal('myfile')
      expect(result.targets[0].passed).to.equal(true)
      expect(mockContents).to.equal(undefined)
    })

    it('targets a file specified by the rule', async () => {
      const options = {
        text: 'this is text'
      }
      let mockContents = ''
      /** @type {any} */
      const mockFs = {
        findAllFiles() {
          return ['myfile']
        },
        getFileContents() {
          return 'the file contents'
        },
        setFileContents(file, contents) {
          mockContents = contents
        }
      }

      const result = await fileModify(mockFs, options, ['myfile'], false)

      expect(result.passed).to.equal(true)
      expect(result.targets).to.have.length(1)
      expect(result.targets[0].path).to.equal('myfile')
      expect(result.targets[0].passed).to.equal(true)
      expect(mockContents).to.equal('the file contentsthis is text')
    })

    it('fails if no files are specified', async () => {
      const options = {
        text: 'this is text'
      }
      /** @type {any} */
      const mockFs = {}

      const result = await fileModify(mockFs, options, [], false)

      expect(result.passed).to.equal(false)
      expect(result.targets).to.have.length(0)
    })

    it('skips extensions correctly', async () => {
      const options = {
        text: 'this is text',
        'skip-paths-matching': { extensions: ['exe'] }
      }
      let mockFile
      /** @type {any} */
      const mockFs = {
        findAllFiles() {
          return ['myfile.exe', 'otherfile']
        },
        getFileContents() {
          return 'the file contents'
        },
        setFileContents(f) {
          mockFile = f
        }
      }

      const result = await fileModify(mockFs, options, ['myfile.exe'], false)

      expect(result.passed).to.equal(true)
      expect(result.targets).to.have.length(1)
      expect(result.targets[0].path).to.equal('otherfile')
      expect(result.targets[0].passed).to.equal(true)
      expect(mockFile).to.equal('otherfile')
    })

    it('skips path patterns correctly', async () => {
      const options = {
        text: 'this is text',
        'skip-paths-matching': { patterns: ['exe'] }
      }
      let mockFile
      /** @type {any} */
      const mockFs = {
        findAllFiles() {
          return ['myfile.exe', 'otherfile']
        },
        getFileContents() {
          return 'the file contents'
        },
        setFileContents(f) {
          mockFile = f
        }
      }

      const result = await fileModify(mockFs, options, ['myfile.exe'], false)

      expect(result.passed).to.equal(true)
      expect(result.targets).to.have.length(1)
      expect(result.targets[0].path).to.equal('otherfile')
      expect(result.targets[0].passed).to.equal(true)
      expect(mockFile).to.equal('otherfile')
    })

    it('pulls text from a file', async () => {
      const options = {
        files: ['myfile'],
        text: { file: 'sourcefile' }
      }
      let mockContents
      /** @type {any} */
      const mockFs = {
        findFirstFile() {
          return 'sourcefile'
        },
        findAllFiles() {
          return ['myfile']
        },
        getFileContents(file) {
          return file === 'myfile' ? 'the file contents' : 'this is text'
        },
        setFileContents(file, contents) {
          mockContents = contents
        }
      }

      const result = await fileModify(mockFs, options, [], false)

      expect(result.passed).to.equal(true)
      expect(result.targets).to.have.length(1)
      expect(result.targets[0].path).to.equal('myfile')
      expect(result.targets[0].passed).to.equal(true)
      expect(mockContents).to.equal('the file contentsthis is text')
    })

    it('pulls text from a URL', async () => {
      const options = {
        files: ['myfile'],
        text: { url: 'https://example.com' }
      }
      let mockContents
      /** @type {any} */
      const mockFs = {
        findAllFiles() {
          return ['myfile']
        },
        getFileContents() {
          return 'the file contents'
        },
        setFileContents(f, c) {
          mockContents = c
        }
      }
      const scope = nock('https://example.com')
        .get('/')
        .reply(200, 'this is text')

      const result = await fileModify(mockFs, options, [], false)

      expect(result.passed).to.equal(true)
      expect(result.targets).to.have.length(1)
      expect(result.targets[0].path).to.equal('myfile')
      expect(result.targets[0].passed).to.equal(true)
      expect(mockContents).to.equal('the file contentsthis is text')

      scope.done()
    })

    it('adds newlines correctly', async () => {
      const options = {
        files: ['myfile'],
        text: 'this is text',
        newlines: { begin: 3, end: 4 }
      }
      let mockContents = ''
      /** @type {any} */
      const mockFs = {
        findAllFiles() {
          return ['myfile']
        },
        getFileContents() {
          return 'the file contents'
        },
        setFileContents(file, contents) {
          mockContents = contents
        }
      }

      const result = await fileModify(mockFs, options, [], false)

      expect(result.passed).to.equal(true)
      expect(mockContents).to.equal(
        'the file contents\n\n\nthis is text\n\n\n\n'
      )
    })
  })
})
