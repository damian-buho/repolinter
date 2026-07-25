// SPDX-FileCopyrightText: 2017 TODO Group
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
//
// SPDX-License-Identifier: Apache-2.0

import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import os from 'node:os'
import * as Config from '../../src/lib/config.js'
import fs from 'node:fs'
import ServerMock from 'mock-http-server'

// Allow loopback fetches against the in-process mock-http-server.
process.env.REPOLINTER_ALLOW_PRIVATE_FETCH = '1'

const __dirname: string = path.dirname(fileURLToPath(import.meta.url))

const serveDirectory = (
  directory: string
): {
  method: string
  path: string
  reply: { status: number; body: (request: { pathname: string }) => Buffer }
} => ({
  method: 'GET',
  path: '*',
  reply: {
    status: 200,
    body: (request: { pathname: string }): Buffer =>
      fs.readFileSync(path.resolve(directory, request.pathname.slice(1)))
  }
})

describe(
  'lib',
  () => {
    describe('config', () => {
      describe('isAbsoluteURL', () => {
        it('should identify absolute URLs', async () => {
          // eslint-disable-next-line unicorn/prefer-https
          assert.strictEqual(Config.isAbsoluteURL('http://example.com/'), true)
          assert.strictEqual(Config.isAbsoluteURL('https://example.com/'), true)
          assert.strictEqual(Config.isAbsoluteURL('ftp://example.com/'), true)
        })

        it('should identify relative URLs', async () => {
          assert.strictEqual(Config.isAbsoluteURL('foo'), false)
          assert.strictEqual(Config.isAbsoluteURL('/foo'), false)
          assert.strictEqual(Config.isAbsoluteURL('file:/foo'), false)
          assert.strictEqual(Config.isAbsoluteURL('file:///foo'), false)
          assert.strictEqual(Config.isAbsoluteURL(String.raw`c:\foo`), false)
        })
      })

      describe('findConfig', () => {
        it('should find config file in directory', async () => {
          const tmpdir: string = fs.mkdtempSync(
            path.join(os.tmpdir(), 'repolinter-test-')
          )
          fs.copyFileSync(
            path.join(__dirname, 'repolinter.yaml'),
            path.join(tmpdir, 'repolinter.yaml')
          )
          const origCwd: string = process.cwd()
          process.chdir(tmpdir)
          try {
            const localConfig: string = path.join(tmpdir, 'repolinter.yaml')
            assert.strictEqual(Config.findConfig(tmpdir), localConfig)
          } finally {
            process.chdir(origCwd)
            fs.rmSync(tmpdir, { recursive: true })
          }
        })
        it('should return default file when no config present', async () => {
          const tmpdir: string = fs.mkdtempSync(
            path.join(os.tmpdir(), 'repolinter-test-')
          )
          const origCwd: string = process.cwd()
          process.chdir(tmpdir)
          try {
            const result: string = Config.findConfig(tmpdir)
            assert.ok(
              result.endsWith('rulesets/default.json'),
              `Expected path to end with rulesets/default.json, got: ${result}`
            )
          } finally {
            process.chdir(origCwd)
            fs.rmSync(tmpdir, { recursive: true })
          }
        })
      })

      describe('loadConfig', async () => {
        const server = new ServerMock({ host: '127.0.0.1', port: 0 }, {})
        let port: number
        beforeEach(
          (): Promise<void> =>
            new Promise<void>(resolve =>
              server.start(() => {
                port = server.getHttpPort()
                resolve()
              })
            )
        )
        afterEach(
          (): Promise<void> =>
            new Promise<void>(resolve => server.stop(resolve))
        )

        it('should load local config file', async () => {
          const actual = await Config.loadConfig(
            path.join(__dirname, 'default.json')
          )
          assert.ok(Object.hasOwn(actual.rules, 'test-file-exists'))
          assert.strictEqual(actual.rules['test-file-exists'].level, 'error')
        })

        it('should load URL config file', async () => {
          server.on(serveDirectory(__dirname))
          const actual = await Config.loadConfig(
            `http://127.0.0.1:${port}/default.json`
          )
          assert.ok(Object.hasOwn(actual.rules, 'test-file-exists'))
          assert.strictEqual(actual.rules['test-file-exists'].level, 'error')
        })

        it('should handle relative file extends', async () => {
          const actual = await Config.loadConfig(
            path.join(__dirname, 'repolinter.yaml')
          )
          assert.ok(Object.hasOwn(actual.rules, 'test-file-exists'))
          assert.strictEqual(actual.rules['test-file-exists'].level, 'error')
        })

        it('should handle relative URL extends', async () => {
          server.on(serveDirectory(__dirname))
          const actual = await Config.loadConfig(
            `http://127.0.0.1:${port}/repolinter.yaml`
          )
          assert.ok(Object.hasOwn(actual.rules, 'test-file-exists'))
          assert.strictEqual(actual.rules['test-file-exists'].level, 'error')
        })

        it('should handle absolute URL extends', async () => {
          server.on(serveDirectory(__dirname))
          const tmpdir: string = fs.mkdtempSync(
            path.join(os.tmpdir(), 'repolinter-test-')
          )
          try {
            const overridePath: string = path.join(
              tmpdir,
              'absolute-override.yaml'
            )
            fs.writeFileSync(
              overridePath,
              [
                '$schema: "../../rulesets/schema.json"',
                `extends: "http://127.0.0.1:${port}/default.json"`,
                'version: 2',
                'rules:',
                '  test-file-exists:',
                '    level: off',
                ''
              ].join('\n')
            )
            const actual = await Config.loadConfig(overridePath)
            assert.ok(Object.hasOwn(actual.rules, 'test-file-exists'))
            assert.strictEqual(actual.rules['test-file-exists'].level, 'off')
          } finally {
            fs.rmSync(tmpdir, { recursive: true })
          }
        })

        it('should handle encoded rulesets extends', async () => {
          server.on(serveDirectory(__dirname))
          const actual = await Config.loadConfig(
            path.join(__dirname, 'override-encoded.yaml')
          )
          assert.ok(Object.hasOwn(actual.rules, 'test-file-exists'))
          assert.strictEqual(actual.rules['test-file-exists'].level, 'off')
        })

        it('should detect loops in extended rulesets', async () => {
          const loopSelf = await Config.loadConfig(
            path.join(__dirname, 'loop-self.yaml')
          )
          assert.ok(Object.hasOwn(loopSelf.rules, 'test-file-exists'))
          assert.strictEqual(loopSelf.rules['test-file-exists'].level, 'error')

          const loopB = await Config.loadConfig(
            path.join(__dirname, 'loop-b.yaml')
          )
          assert.ok(Object.hasOwn(loopB.rules, 'test-file-exists'))
          assert.strictEqual(loopB.rules['test-file-exists'].level, 'off')
        })

        it('should throw error on non existant file', async () => {
          await assert.rejects(
            () => Config.loadConfig('/does-not-exist'),
            /ENOENT/
          )
        })

        it('should throw error on non existant URL', async () => {
          server.on(serveDirectory(__dirname))
          await assert.rejects(
            () => Config.loadConfig(`http://127.0.0.1:${port}/404`),
            /404/
          )
        })

        it('should reject a ruleset that does not parse to an object', async () => {
          const tmpdir = fs.mkdtempSync(
            path.join(os.tmpdir(), 'repolinter-test-')
          )
          try {
            const cases = [
              ['comments-only.yaml', '# nothing but a comment\n', /null/],
              ['scalar.yaml', '42\n', /42/],
              ['sequence.yaml', '- one\n- two\n', /array/]
            ]
            for (const [name, contents, expected] of cases) {
              const configPath = path.join(tmpdir, name)
              fs.writeFileSync(configPath, contents)
              await assert.rejects(
                () => Config.loadConfig(configPath),
                expected,
                `expected ${name} to be rejected`
              )
            }
          } finally {
            fs.rmSync(tmpdir, { recursive: true })
          }
        })

        it('should reject extends with parent-directory traversal', async () => {
          const tmpdir: string = fs.mkdtempSync(
            path.join(os.tmpdir(), 'repolinter-test-')
          )
          try {
            const configPath: string = path.join(tmpdir, 'traversal.yaml')
            fs.writeFileSync(
              configPath,
              [
                'version: 2',
                'extends: "../../etc/passwd"',
                'rules: {}',
                ''
              ].join('\n')
            )
            await assert.rejects(
              () => Config.loadConfig(configPath),
              /parent directories/
            )
          } finally {
            fs.rmSync(tmpdir, { recursive: true })
          }
        })

        it('should reject extends with an absolute path', async () => {
          const tmpdir: string = fs.mkdtempSync(
            path.join(os.tmpdir(), 'repolinter-test-')
          )
          try {
            const configPath: string = path.join(tmpdir, 'absolute.yaml')
            fs.writeFileSync(
              configPath,
              ['version: 2', 'extends: "/etc/passwd"', 'rules: {}', ''].join(
                '\n'
              )
            )
            await assert.rejects(
              () => Config.loadConfig(configPath),
              /parent directories/
            )
          } finally {
            fs.rmSync(tmpdir, { recursive: true })
          }
        })
      })

      describe('validateConfig', () => {})

      describe('parseConfig', () => {})
    })
  },
  { timeout: 10_000 }
)
