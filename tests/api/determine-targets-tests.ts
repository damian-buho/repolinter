// SPDX-FileCopyrightText: 2017 TODO Group
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
//
// SPDX-License-Identifier: Apache-2.0

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import * as repolinter from '../../src/index.js'

describe('api', () => {
  describe('determineTargets', () => {
    it('returns a list of packagers for a directory', async () => {
      const mockconfig: Record<string, string> = {
        packagers: 'package'
      }
      const mockFs = {
        findFirst: (pattern: string): string | undefined =>
          pattern === 'package.json' ? 'package.json' : undefined
      }
      const actual = await repolinter.determineTargets(
        mockconfig,
        mockFs as never
      )
      assert.deepStrictEqual(structuredClone(actual), {
        package: { passed: true, targets: [{ passed: true, path: 'npm' }] }
      })
    })

    it('does nothing if no axioms are specified', async () => {
      const mockconfig: Record<string, string> = {}
      const mockFs = {}
      const actual = await repolinter.determineTargets(
        mockconfig,
        mockFs as never
      )
      assert.deepStrictEqual(actual, {})
    })

    it('returns a failing result if an invalid axiom is specified', async () => {
      const mockconfig: Record<string, string> = {
        notanaxiom: 'banana'
      }
      const mockFs = {}
      const actual = await repolinter.determineTargets(
        mockconfig,
        mockFs as never
      )
      assert.deepStrictEqual(structuredClone(actual), {
        banana: {
          passed: false,
          message: 'invalid axiom name notanaxiom',
          targets: []
        }
      })
    })
  })
})
