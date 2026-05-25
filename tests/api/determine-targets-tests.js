// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import * as repolinter from '../../dist/index.js'

describe('api', () => {
  describe('determineTargets', () => {
    it('returns a list of packagers for a directory', async () => {
      const mockconfig = {
        packagers: 'package'
      }
      const mockFs = {
        findFirst(pattern) {
          return pattern === 'package.json' ? 'package.json' : undefined
        }
      }
      const actual = await repolinter.determineTargets(mockconfig, mockFs)
      assert.deepStrictEqual(JSON.parse(JSON.stringify(actual)), {
        package: { passed: true, targets: [{ passed: true, path: 'npm' }] }
      })
    })

    it('does nothing if no axioms are specified', async () => {
      const mockconfig = {}
      const mockFs = {}
      const actual = await repolinter.determineTargets(mockconfig, mockFs)
      assert.deepStrictEqual(actual, {})
    })

    it('returns a failing result if an invalid axiom is specified', async () => {
      const mockconfig = {
        notanaxiom: 'banana'
      }
      const mockFs = {}
      const actual = await repolinter.determineTargets(mockconfig, mockFs)
      assert.deepStrictEqual(JSON.parse(JSON.stringify(actual)), {
        banana: {
          passed: false,
          message: 'invalid axiom name notanaxiom',
          targets: []
        }
      })
    })
  })
})
