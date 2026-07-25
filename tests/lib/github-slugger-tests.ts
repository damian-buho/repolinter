// SPDX-FileCopyrightText: 2017 TODO Group
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
//
// SPDX-License-Identifier: Apache-2.0

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { slug } from '../../src/lib/github-slugger.js'

describe('lib', () => {
  describe('github_slugger', () => {
    it('slugs a heading', () => {
      assert.strictEqual(slug('# this is a header'), '-this-is-a-header')
    })

    it('strips uppercase and formatting', () => {
      assert.strictEqual(slug('# `this is A heaD"er'), '-this-is-a-header')
    })

    it('removes common emojis', () => {
      assert.strictEqual(slug('❗❌⚠️✅ℹ️ heading'), '-heading')
    })

    it('fixed test issue', () => {
      assert.strictEqual(slug('✅ `myrule`'), '-myrule')
    })
  })
})
