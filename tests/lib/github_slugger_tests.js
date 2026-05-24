// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect } from 'chai'
import { slug } from '../../lib/github_slugger.js'

describe('lib', () => {
  describe('github_slugger', () => {
    it('slugs a heading', () => {
      expect(slug('# this is a header')).to.equal('-this-is-a-header')
    })

    it('strips uppercase and formatting', () => {
      expect(slug('# `this is A heaD"er')).to.equal('-this-is-a-header')
    })

    it('removes common emojis', () => {
      expect(slug('❗❌⚠️✅ℹ️ heading')).to.equal('-heading')
    })

    it('fixed test issue', () => {
      expect(slug('✅ `myrule`')).to.equal('-myrule')
    })
  })
})
