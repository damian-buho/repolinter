// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
//
// SPDX-License-Identifier: Apache-2.0

declare module 'command-exists' {
  export function sync(command: string): string | undefined
  export default function (command: string): Promise<string>
}

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

declare module 'matched' {
  interface MatchedOptions {
    cwd?: string
    ignore?: string | string[]
    nocase?: boolean
    nodir?: boolean
    symlinks?: Record<string, boolean>
  }
  export function sync(
    globs: string | string[],
    options?: MatchedOptions
  ): string[]
  export function promise(
    globs: string | string[],
    options?: MatchedOptions
  ): Promise<string[]>
  export default function (
    globs: string | string[],
    options?: MatchedOptions
  ): Promise<string[]>
}

declare module 'chai-each' {
  import type { ChaiPlugin } from 'chai'
  const chaiEach: ChaiPlugin
  export default chaiEach
}

declare module 'chai-string' {
  import type { ChaiPlugin } from 'chai'
  const chaiString: ChaiPlugin & { default: ChaiPlugin }
  export default chaiString
}

declare module 'chai-as-promised' {
  import type { ChaiPlugin } from 'chai'
  const chaiAsPromised: ChaiPlugin & { default: ChaiPlugin }
  export default chaiAsPromised
}

declare module 'mock-http-server' {
  export default class MockHttpServer {
    constructor(options?: Record<string, unknown>)
    start(callback: () => void): void
    stop(callback: () => void): void
    url(): string
  }
}
