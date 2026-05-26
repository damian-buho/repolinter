// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import os from 'node:os'
import * as Config from '../../dist/lib/config.js'
import fs from 'node:fs'
import ServerMock from 'mock-http-server'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const serveDirectory = directory => ({
  method: 'GET',
  path: '*',
  reply: {
    status: 200,
    body: request =>
      fs.readFileSync(path.resolve(directory, request.pathname.slice(1)))
  }
})

describe(
  'lib',
  () => {
    describe('config', () => {
      describe('isAbsoluteURL', () => {
        it('should identify absolute URLs', async () => {
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
          const tmpdir = fs.mkdtempSync(
            path.join(os.tmpdir(), 'repolinter-test-')
          )
          fs.copyFileSync(
            path.join(__dirname, 'repolinter.yaml'),
            path.join(tmpdir, 'repolinter.yaml')
          )
          const origCwd = process.cwd()
          process.chdir(tmpdir)
          try {
            const localConfig = path.join(tmpdir, 'repolinter.yaml')
            assert.strictEqual(Config.findConfig(tmpdir), localConfig)
          } finally {
            process.chdir(origCwd)
            fs.rmSync(tmpdir, { recursive: true })
          }
        })
        it('should return default file when no config present', async () => {
          const tmpdir = fs.mkdtempSync(
            path.join(os.tmpdir(), 'repolinter-test-')
          )
          const origCwd = process.cwd()
          process.chdir(tmpdir)
          try {
            const defaultConfig = path.join(
              __dirname,
              '../../dist/rulesets/default.json'
            )
            assert.strictEqual(Config.findConfig(tmpdir), defaultConfig)
          } finally {
            process.chdir(origCwd)
            fs.rmSync(tmpdir, { recursive: true })
          }
        })
      })

      describe('loadConfig', async () => {
        const server = new ServerMock({ host: '127.0.0.1', port: 0 }, {})
        let port
        beforeEach(
          () =>
            new Promise(resolve =>
              server.start(() => {
                port = server.getHttpPort()
                resolve()
              })
            )
        )
        afterEach(() => new Promise(resolve => server.stop(resolve)))

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
          const tmpdir = fs.mkdtempSync(
            path.join(os.tmpdir(), 'repolinter-test-')
          )
          try {
            const overridePath = path.join(tmpdir, 'absolute-override.yaml')
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
      })

      describe('validateConfig', () => {})

      describe('parseConfig', () => {})
    })
  },
  { timeout: 10_000 }
)
