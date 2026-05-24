declare module 'broken-link-checker' {
  import { EventEmitter } from 'events'

  interface BrokenLink {
    broken: boolean
    brokenReason?: string
    url: { original: string; resolved?: string }
    base: { resolved: string }
    http: { response?: { status: number } }
  }

  interface HtmlCheckerOptions {
    excludedKeywords?: string[]
  }

  interface HtmlCheckerHandlers {
    link: (result: BrokenLink) => void
    complete: () => void
  }

  export class HtmlChecker extends EventEmitter {
    constructor(options: HtmlCheckerOptions, handlers: HtmlCheckerHandlers)
    scan(html: string, htmlBaseUrl: string | URL): boolean
    pause(): void
    resume(): void
  }
  export class UrlChecker extends EventEmitter {
    enqueue(url: string, baseUrl: string): void
    pause(): void
    resume(): void
  }

  const blc: {
    HtmlChecker: typeof HtmlChecker
    UrlChecker: typeof UrlChecker
  }
  export default blc
}

declare module 'command-exists' {
  export function sync(command: string): string | undefined
  export default function (command: string): Promise<string>
}

declare module 'find-config' {
  export function obj(
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
  import type { Server } from 'http'
  export default class MockHttpServer {
    constructor(options?: Record<string, unknown>)
    start(callback: () => void): void
    stop(callback: () => void): void
    url(): string
  }
}
