// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
//
// SPDX-License-Identifier: Apache-2.0

import { MockAgent, getGlobalDispatcher, setGlobalDispatcher } from 'undici'

// Runs action with one GET on origin+path answered by (status, body), then asserts it was consumed.
async function withMockedGet<T>(
  origin: string,
  path: string,
  status: number,
  body: string | object | undefined,
  action: () => Promise<T>
): Promise<T> {
  const original = getGlobalDispatcher()
  const agent = new MockAgent()
  agent.disableNetConnect()
  agent.get(origin).intercept({ path }).reply(status, body)
  setGlobalDispatcher(agent)
  process.env['REPOLINTER_ALLOW_PRIVATE_FETCH'] = '1'
  try {
    const result = await action()
    agent.assertNoPendingInterceptors()
    return result
  } finally {
    setGlobalDispatcher(original)
    delete process.env['REPOLINTER_ALLOW_PRIVATE_FETCH']
  }
}

export { withMockedGet }
