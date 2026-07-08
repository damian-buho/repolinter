// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
//
// SPDX-License-Identifier: Apache-2.0

declare module 'find-config' {
  export function object(
    name: string,
    options?: { dir?: string }
  ): { path: string } | undefined
  export function read(
    name: string,
    options?: { dir?: string }
  ): string | undefined
  export default function (
    name: string,
    options?: { dir?: string; cwd?: string }
  ): string | null
}

declare module 'gitlog' {
  interface GitlogOptions {
    repo: string
    number?: number
    fields?: string[]
    execOptions?: Record<string, unknown>
  }
  interface GitlogCommit {
    hash: string
    subject: string
    body: string
    authorName: string
    authorDate: string
  }
  function gitlog(options: GitlogOptions): GitlogCommit[]
  export default gitlog
}

declare module 'mock-http-server' {
  export default class MockHttpServer {
    constructor(options?: Record<string, unknown>)
    start(callback: () => void): void
    stop(callback: () => void): void
    url(): string
  }
}
