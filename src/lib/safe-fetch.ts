// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
// SPDX-License-Identifier: Apache-2.0

import { BlockList } from 'node:net'
import { Agent } from 'undici'

// Defense-in-depth wrapper around fetch: ruleset-supplied URLs cannot reach
// loopback, link-local, RFC1918, or non-http(s) targets. The block check
// runs at TCP connect time inside undici, so it is immune to DNS rebinding
// and applies to every redirect hop, not just the original URL.
// Opt-out via env for users who deliberately fetch internal rulesets.

function buildBlockList(): BlockList {
  const bl = new BlockList()
  // IPv4
  bl.addSubnet('0.0.0.0', 8, 'ipv4')
  bl.addSubnet('10.0.0.0', 8, 'ipv4')
  bl.addSubnet('100.64.0.0', 10, 'ipv4')
  bl.addSubnet('127.0.0.0', 8, 'ipv4')
  bl.addSubnet('169.254.0.0', 16, 'ipv4')
  bl.addSubnet('172.16.0.0', 12, 'ipv4')
  bl.addSubnet('192.0.0.0', 24, 'ipv4')
  bl.addSubnet('192.168.0.0', 16, 'ipv4')
  bl.addSubnet('198.18.0.0', 15, 'ipv4')
  bl.addSubnet('224.0.0.0', 4, 'ipv4')
  bl.addSubnet('240.0.0.0', 4, 'ipv4')
  // IPv6
  bl.addAddress('::1', 'ipv6')
  bl.addAddress('::', 'ipv6')
  bl.addSubnet('fc00::', 7, 'ipv6')
  bl.addSubnet('fe80::', 10, 'ipv6')
  bl.addSubnet('::ffff:0:0', 96, 'ipv6')
  return bl
}

const blockList = buildBlockList()

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
