// Copyright 2017 TODO Group. All rights reserved.
// Licensed under the Apache License, Version 2.0.

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import http from 'node:http'
import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import FileSystem from '../../dist/lib/file_system.js'
import commandExists from 'command-exists'
import fileNoBrokenLinks from '../../dist/rules/file-no-broken-links.js'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function createMockServer(responses) {
  const server = http.createServer((request, res) => {
    const key = `${request.method} ${request.url}`
    const handler = responses[key]
    if (handler) {
      if (handler.error) {
        res.destroy()
        return
      }
      res.writeHead(handler.status || 200)
      res.end(handler.body || '')
    } else {
      res.writeHead(404)
      res.end('not found')
    }
  })
  return server
}

function serverUrl(server) {
  const addr = server.address()
  return `http://127.0.0.1:${addr.port}`
}

describe(
  'rule',
  () => {
    describe('files_no_broken_links', () => {
      const gitHubMarkupInstalled = commandExists.sync('github-markup')
      const targetDirectory = `${__dirname}/markup_test_files`
      const testFs = new FileSystem(targetDirectory)

      if (gitHubMarkupInstalled) {
        it('returns true if no links are present in markdown', async () => {
          const ruleopts = {
            globsAll: ['no_link.md']
          }

          const actual = await fileNoBrokenLinks(testFs, ruleopts)

          assert.strictEqual(actual.passed, true)
          assert.strictEqual(actual.targets.length, 1)
          assert.deepStrictEqual(actual.targets[0], {
            passed: true,
            path: 'no_link.md'
          })
        })

        it('returns true if a valid link is present in a markdown file', async () => {
          const server = createMockServer({
            'HEAD /something/somethingelse': { status: 200 }
          })
          await new Promise(r => server.listen(0, r))
          const url = serverUrl(server)

          const temporaryFile = path.join(
            targetDirectory,
            '_test_valid_link.md'
          )
          fs.writeFileSync(
            temporaryFile,
            `[myurl](${url}/something/somethingelse)`
          )

          try {
            const actual = await fileNoBrokenLinks(testFs, {
              globsAll: ['_test_valid_link.md']
            })

            assert.strictEqual(actual.passed, true)
            assert.strictEqual(actual.targets.length, 1)
            assert.strictEqual(actual.targets[0].passed, true)
          } finally {
            fs.unlinkSync(temporaryFile)
            await new Promise(r => server.close(r))
          }
        })

        it('returns false if an invalid link is present in a markdown file', async () => {
          const server = createMockServer({
            'HEAD /something/somethingelse': { status: 200 }
          })
          await new Promise(r => server.listen(0, r))
          const url = serverUrl(server)

          const temporaryFile = path.join(
            targetDirectory,
            '_test_invalid_link.md'
          )
          fs.writeFileSync(
            temporaryFile,
            `[myurl](${url}/something/somethingelse_nonexistent)`
          )

          try {
            const actual = await fileNoBrokenLinks(testFs, {
              globsAll: ['_test_invalid_link.md']
            })

            assert.strictEqual(actual.passed, false)
            assert.strictEqual(actual.targets.length, 1)
            assert.strictEqual(actual.targets[0].passed, false)
          } finally {
            fs.unlinkSync(temporaryFile)
            await new Promise(r => server.close(r))
          }
        })

        it('returns false if a private link is present in a markdown file', async () => {
          const server = createMockServer({
            'HEAD /something/somethingelse': { status: 404 }
          })
          await new Promise(r => server.listen(0, r))
          const url = serverUrl(server)

          const temporaryFile = path.join(
            targetDirectory,
            '_test_private_link.md'
          )
          fs.writeFileSync(
            temporaryFile,
            `[myurl](${url}/something/somethingelse)`
          )

          try {
            const actual = await fileNoBrokenLinks(testFs, {
              globsAll: ['_test_private_link.md']
            })

            assert.strictEqual(actual.passed, false)
            assert.strictEqual(actual.targets.length, 1)
            assert.strictEqual(actual.targets[0].passed, false)
          } finally {
            fs.unlinkSync(temporaryFile)
            await new Promise(r => server.close(r))
          }
        })

        it('ignores section links in markdown', async () => {
          const ruleopts = {
            globsAll: ['section_link.md']
          }

          const actual = await fileNoBrokenLinks(testFs, ruleopts)

          assert.strictEqual(actual.passed, true)
          assert.strictEqual(actual.targets.length, 1)
          assert.deepStrictEqual(actual.targets[0], {
            passed: true,
            path: 'section_link.md'
          })
        })

        it('ignores section links in rst', async () => {
          const ruleopts = {
            globsAll: ['section_link.rst']
          }

          const actual = await fileNoBrokenLinks(testFs, ruleopts)

          assert.strictEqual(actual.passed, true)
          assert.strictEqual(actual.targets.length, 1)
          assert.deepStrictEqual(actual.targets[0], {
            passed: true,
            path: 'section_link.rst'
          })
        })

        it('returns true with a relative link to a file in markdown', async () => {
          const ruleopts = {
            globsAll: ['relative_link.md']
          }

          const actual = await fileNoBrokenLinks(testFs, ruleopts)

          assert.strictEqual(actual.passed, true)
          assert.strictEqual(actual.targets.length, 1)
          assert.deepStrictEqual(actual.targets[0], {
            passed: true,
            path: 'relative_link.md'
          })
        })

        it('returns true with a relative link to a file in markdown with a section link', async () => {
          const ruleopts = {
            globsAll: ['relative_link_with_section.md']
          }

          const actual = await fileNoBrokenLinks(testFs, ruleopts)

          assert.strictEqual(actual.passed, true)
          assert.strictEqual(actual.targets.length, 1)
          assert.deepStrictEqual(actual.targets[0], {
            passed: true,
            path: 'relative_link_with_section.md'
          })
        })

        it('returns true with link to a file outside a subdirectory markdown', async () => {
          const ruleopts = {
            globsAll: ['subdirectory/nested_relative_link.md']
          }

          const actual = await fileNoBrokenLinks(testFs, ruleopts)

          assert.strictEqual(actual.passed, true)
          assert.strictEqual(actual.targets.length, 1)
          assert.deepStrictEqual(actual.targets[0], {
            passed: true,
            path: 'subdirectory/nested_relative_link.md'
          })
        })

        it('returns false with an invalid link to a file outside a subdirectory markdown', async () => {
          const ruleopts = {
            globsAll: ['subdirectory/invalid_nested_relative_link.md']
          }

          const actual = await fileNoBrokenLinks(testFs, ruleopts)

          assert.strictEqual(actual.passed, false)
          assert.strictEqual(actual.targets.length, 1)
          assert.strictEqual(actual.targets[0].passed, false)
        })

        it('returns false with a relative link to a file in markdown outside the working directory', async () => {
          const ruleopts = {
            globsAll: ['relative_link_outside_dir.md']
          }

          const actual = await fileNoBrokenLinks(testFs, ruleopts)

          assert.strictEqual(actual.passed, false)
          assert.strictEqual(actual.targets.length, 1)
          assert.strictEqual(actual.targets[0].passed, false)
        })

        it('returns true with a relative link to a file in markdown outside the working directory and pass-external-relative-links', async () => {
          const ruleopts = {
            globsAll: ['relative_link_outside_dir.md'],
            'pass-external-relative-links': true
          }

          const actual = await fileNoBrokenLinks(testFs, ruleopts)

          assert.strictEqual(actual.passed, true)
          assert.strictEqual(actual.targets.length, 1)
          assert.deepStrictEqual(actual.targets[0], {
            passed: true,
            path: 'relative_link_outside_dir.md'
          })
        })

        it("returns false with a relative link to a file that doesn't exist in markdown", async () => {
          const ruleopts = {
            globsAll: ['invalid_relative_link.md']
          }

          const actual = await fileNoBrokenLinks(testFs, ruleopts)

          assert.strictEqual(actual.passed, false)
          assert.strictEqual(actual.targets.length, 1)
          assert.strictEqual(actual.targets[0].passed, false)
        })

        it('returns false with a absolute path in markdown', async () => {
          const ruleopts = {
            globsAll: ['absolute_link.md']
          }

          const actual = await fileNoBrokenLinks(testFs, ruleopts)

          assert.strictEqual(actual.passed, false)
          assert.strictEqual(actual.targets.length, 1)
          assert.strictEqual(actual.targets[0].passed, false)
        })

        it('checks multiple links in markdown', async () => {
          const server = createMockServer({
            'HEAD /something/somethingelse': { status: 200 },
            'HEAD /something': { status: 200 }
          })
          await new Promise(r => server.listen(0, r))
          const url = serverUrl(server)

          const temporaryFile = path.join(
            targetDirectory,
            '_test_multiple_links.md'
          )
          fs.writeFileSync(
            temporaryFile,
            `[myurl](${url}/something/somethingelse)\n[myother](${url}/something)`
          )

          try {
            const actual = await fileNoBrokenLinks(testFs, {
              globsAll: ['_test_multiple_links.md']
            })

            assert.strictEqual(actual.passed, true)
            assert.strictEqual(actual.targets.length, 1)
            assert.strictEqual(actual.targets[0].passed, true)
          } finally {
            fs.unlinkSync(temporaryFile)
            await new Promise(r => server.close(r))
          }
        })

        it('checks multiple files', async () => {
          const server = createMockServer({
            'HEAD /something/somethingelse': { status: 200 }
          })
          await new Promise(r => server.listen(0, r))
          const url = serverUrl(server)

          const temporaryMd = path.join(targetDirectory, '_test_multi_file.md')
          const temporaryRst = path.join(
            targetDirectory,
            '_test_multi_file.rst'
          )
          fs.writeFileSync(
            temporaryMd,
            `[myurl](${url}/something/somethingelse)`
          )
          fs.writeFileSync(
            temporaryRst,
            '`My URL <' + url + '/something/somethingelse>`_'
          )

          try {
            const actual = await fileNoBrokenLinks(testFs, {
              globsAll: ['_test_multi_file.md', '_test_multi_file.rst']
            })

            assert.strictEqual(actual.passed, true)
            assert.strictEqual(actual.targets.length, 2)
            assert.strictEqual(actual.targets[0].passed, true)
            assert.strictEqual(actual.targets[1].passed, true)
          } finally {
            fs.unlinkSync(temporaryMd)
            fs.unlinkSync(temporaryRst)
            await new Promise(r => server.close(r))
          }
        })

        it('fails if no files are found', async () => {
          const ruleopts = {
            globsAll: ['notafile']
          }

          const actual = await fileNoBrokenLinks(testFs, ruleopts)

          assert.strictEqual(actual.passed, false)
          assert.strictEqual(actual.targets.length, 1)
          assert.deepStrictEqual(actual.targets[0], {
            passed: false,
            pattern: 'notafile'
          })
        })

        it('succeeds if no files are found and succeed-on-non-existent is true', async () => {
          const ruleopts = {
            globsAll: ['notafile'],
            'succeed-on-non-existent': true
          }

          const actual = await fileNoBrokenLinks(testFs, ruleopts)

          assert.strictEqual(actual.passed, true)
          assert.strictEqual(actual.targets.length, 1)
          assert.deepStrictEqual(actual.targets[0], {
            passed: false,
            pattern: 'notafile'
          })
        })
      } else {
        it.skip('tests file_no_broken_links functionality', () => {})
      }
    })
  },
  { timeout: 30_000 }
)
