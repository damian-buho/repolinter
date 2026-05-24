// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect } from 'chai'
import fileRemove from '../../dist/fixes/file-remove.js'

describe('fixes', () => {
  describe('file-remove', () => {
    it('removes a file', async () => {
      const removePaths = []
      /** @type {any} */
      const mockFs = {
        removeFile(path) {
          removePaths.push(path)
        }
      }

      const result = await fileRemove(mockFs, {}, ['myfile'], false)
      expect(result.passed).to.equal(true)
      expect(result.targets).to.have.length(1)
      expect(result.targets[0].passed).to.equal(true)
      expect(result.targets[0].path).to.equal('myfile')
      expect(removePaths).to.deep.equal(['myfile'])
    })

    it('does nothing if dryRun is true', async () => {
      const removePaths = []
      /** @type {any} */
      const mockFs = {
        removeFile(path) {
          removePaths.push(path)
        }
      }

      const result = await fileRemove(mockFs, {}, ['myfile'], true)
      expect(result.passed).to.equal(true)
      expect(result.targets).to.have.length(1)
      expect(result.targets[0].passed).to.equal(true)
      expect(result.targets[0].path).to.equal('myfile')
      expect(removePaths).to.deep.equal([])
    })

    it('removes multiple files', async () => {
      const removePaths = []
      /** @type {any} */
      const mockFs = {
        removeFile(path) {
          removePaths.push(path)
        }
      }

      const result = await fileRemove(
        mockFs,
        {},
        ['myfile', 'otherfile'],
        false
      )
      expect(result.passed).to.equal(true)
      expect(result.targets).to.have.length(2)
      expect(result.targets[0].passed).to.equal(true)
      expect(result.targets[0].path).to.equal('myfile')
      expect(result.targets[1].passed).to.equal(true)
      expect(result.targets[1].path).to.equal('otherfile')
      expect(removePaths).to.deep.equal(['myfile', 'otherfile'])
    })

    it('uses the glob option', async () => {
      const removePaths = []
      /** @type {any} */
      const mockFs = {
        removeFile(path) {
          removePaths.push(path)
        },
        findAllFiles() {
          return ['myfile.txt']
        }
      }

      const result = await fileRemove(
        mockFs,
        { globsAll: ['myfile'] },
        [],
        false
      )
      expect(result.passed).to.equal(true)
      expect(result.targets).to.have.length(1)
      expect(result.targets[0].passed).to.equal(true)
      expect(result.targets[0].path).to.equal('myfile.txt')
      expect(removePaths).to.deep.equal(['myfile.txt'])
    })

    it('overrides targets with the glob option', async () => {
      const removePaths = []
      /** @type {any} */
      const mockFs = {
        removeFile(path) {
          removePaths.push(path)
        },
        findAllFiles() {
          return ['myfile.txt']
        }
      }

      const result = await fileRemove(
        mockFs,
        { globsAll: ['myfile'] },
        ['otherfile'],
        false
      )
      expect(result.passed).to.equal(true)
      expect(result.targets).to.have.length(1)
      expect(result.targets[0].passed).to.equal(true)
      expect(result.targets[0].path).to.equal('myfile.txt')
      expect(removePaths).to.deep.equal(['myfile.txt'])
    })

    it('returns failure if no files are found', async () => {
      /** @type {any} */
      const mockFs = {}

      const result = await fileRemove(mockFs, {}, [], false)
      expect(result.passed).to.equal(false)
      expect(result.targets).to.have.length(0)
    })
  })
})
