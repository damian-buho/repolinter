// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
// SPDX-License-Identifier: Apache-2.0

import { BlockList } from 'node:net'
import { Agent } from 'undici'

// Defense-in-depth wrapper around fetch: ruleset-supplied URLs cannot reach
// loopback, link-local, RFC1918, or non-http(s) targets. The block check
// runs at TCP connect time inside undici, so it is immune to DNS rebinding
// and applies to every redirect hop, not just the original URL.
// Opt-out via env for users who deliberately fetch internal rulesets.

const blockList = new BlockList()
// IPv4
blockList.addSubnet('0.0.0.0', 8, 'ipv4') // "this network"
blockList.addSubnet('10.0.0.0', 8, 'ipv4') // RFC1918
blockList.addSubnet('100.64.0.0', 10, 'ipv4') // CGNAT
blockList.addSubnet('127.0.0.0', 8, 'ipv4') // loopback
blockList.addSubnet('169.254.0.0', 16, 'ipv4') // link-local (cloud metadata)
blockList.addSubnet('172.16.0.0', 12, 'ipv4') // RFC1918
blockList.addSubnet('192.0.0.0', 24, 'ipv4') // IETF protocol assignments
blockList.addSubnet('192.168.0.0', 16, 'ipv4') // RFC1918
blockList.addSubnet('198.18.0.0', 15, 'ipv4') // benchmark range
blockList.addSubnet('224.0.0.0', 4, 'ipv4') // multicast
blockList.addSubnet('240.0.0.0', 4, 'ipv4') // reserved
// IPv6
blockList.addAddress('::1', 'ipv6') // loopback
blockList.addAddress('::', 'ipv6') // unspecified
blockList.addSubnet('fc00::', 7, 'ipv6') // ULA
blockList.addSubnet('fe80::', 10, 'ipv6') // link-local
blockList.addSubnet('::ffff:0:0', 96, 'ipv6') // IPv4-mapped IPv6 (reject the form entirely)

const blockingDispatcher = new Agent({ connect: { blockList } })

interface FetchInitWithDispatcher extends RequestInit {
  dispatcher?: Agent
}

async function safeFetch(
  target: string,
  init: RequestInit = {}
): Promise<Response> {
  const url = new URL(target)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`refusing non-http(s) URL: ${url.protocol}`)
  }
  const dispatcher =
    process.env['REPOLINTER_ALLOW_PRIVATE_FETCH'] === '1'
      ? undefined
      : blockingDispatcher
  const fetchInit: FetchInitWithDispatcher = { ...init, dispatcher }
  return fetch(target, fetchInit as RequestInit)
}

export { safeFetch }
