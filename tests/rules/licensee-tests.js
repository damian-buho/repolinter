// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect } from 'chai'
import FileSystem from '../../dist/lib/file_system.js'
import commandExists from 'command-exists'
import licenseDetectable from '../../dist/rules/license-detectable-by-licensee.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

describe('rule', () => {
  describe('licensee', () => {
    const licenseeInstalled = commandExists.sync('licensee')
    const targetDirectory = `${__dirname}/licensee_test_files`

    if (licenseeInstalled) {
      it('rule fails if no license is detectable', async () => {
        const testFs = new FileSystem(`${targetDirectory}/no-license`)

        const actual = await licenseDetectable(testFs)
        expect(actual.passed).to.equal(false)
        expect(actual.message).to.equal(
          'Licensee did not identify a license for project'
        )
      })

      it('rule passes if license is detectable, but unknown', async () => {
        const testFs = new FileSystem(`${targetDirectory}/unknown-license`)

        const actual = await licenseDetectable(testFs)
        expect(actual.passed).to.equal(true)
        expect(actual.message).to.equal(
          'Licensee identified the license for project: NOASSERTION'
        )
      })

      it('rule passes if license is detectable and recognized', async () => {
        const testFs = new FileSystem(`${targetDirectory}/0bsd`)

        const actual = await licenseDetectable(testFs)
        expect(actual.passed).to.equal(true)
        expect(actual.message).to.equal(
          'Licensee identified the license for project: 0BSD'
        )
      })
    } else {
      it.skip('tests license-detectable-by-licensee functionality', () => {})
    }
  })
})
