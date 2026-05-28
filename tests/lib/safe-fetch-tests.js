// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
// SPDX-License-Identifier: Apache-2.0

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import * as SafeFetch from '../../dist/lib/safe-fetch.js'

describe('lib', () => {
  describe('safe-fetch', () => {
    it('rejects non-http(s) schemes before any network activity', async () => {
      await assert.rejects(
        () => SafeFetch.safeFetch('file:///etc/passwd'),
        /non-http\(s\)/
      )
      await assert.rejects(
        () => SafeFetch.safeFetch('ftp://example.com/'),
        /non-http\(s\)/
      )
    })

    it('rejects literal loopback', async () => {
      await assert.rejects(() => SafeFetch.safeFetch('http://127.0.0.1:1/'))
    })

    it('rejects cloud metadata link-local (169.254.169.254)', async () => {
      await assert.rejects(() =>
        SafeFetch.safeFetch('http://169.254.169.254/latest/meta-data/')
      )
    })

    it('rejects RFC1918 literal', async () => {
      await assert.rejects(() => SafeFetch.safeFetch('http://10.0.0.1/'))
    })

    it('rejects IPv6 loopback', async () => {
      await assert.rejects(() => SafeFetch.safeFetch('http://[::1]/'))
    })

    it('rejects IPv4-mapped IPv6 form', async () => {
      await assert.rejects(() =>
        SafeFetch.safeFetch('http://[::ffff:127.0.0.1]/')
      )
    })

    it('honors REPOLINTER_ALLOW_PRIVATE_FETCH escape hatch', async () => {
      const previous = process.env.REPOLINTER_ALLOW_PRIVATE_FETCH
      process.env.REPOLINTER_ALLOW_PRIVATE_FETCH = '1'
      try {
        // With the gate off, the BlockList no longer rejects 127.0.0.1;
        // we should see a connection-layer error instead (port 1 is unused).
        await assert.rejects(
          () => SafeFetch.safeFetch('http://127.0.0.1:1/'),
          error => /ECONNREFUSED|fetch failed/i.test(String(error))
        )
      } finally {
        if (previous === undefined)
          delete process.env.REPOLINTER_ALLOW_PRIVATE_FETCH
        else process.env.REPOLINTER_ALLOW_PRIVATE_FETCH = previous
      }
    })
  })
})
