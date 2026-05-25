// Copyright 2017 TODO Group. All rights reserved.
// Licensed under the Apache License, Version 2.0.

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import nock from 'nock'
import FileSystem from '../../dist/lib/file_system.js'
import commandExists from 'command-exists'
import fileNoBrokenLinks from '../../dist/rules/file-no-broken-links.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

describe('rule', () => {
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
        const scope = nock('http://www.example.com')
          .head('/something/somethingelse')
          .reply(200)

        const ruleopts = {
          globsAll: ['link.md']
        }

        const actual = await fileNoBrokenLinks(testFs, ruleopts)

        assert.strictEqual(actual.passed, true)
        assert.strictEqual(actual.targets.length, 1)
        assert.deepStrictEqual(actual.targets[0], {
          passed: true,
          path: 'link.md'
        })

        scope.done()
      })

      it('returns false if an invalid link is present in a markdown file', async () => {
        const scope = nock('http://www.example.com')
          .head('/something/somethingelse')
          .replyWithError('nxdomain or something')

        const ruleopts = {
          globsAll: ['link.md']
        }

        const actual = await fileNoBrokenLinks(testFs, ruleopts)

        assert.strictEqual(actual.passed, false)
        assert.strictEqual(actual.targets.length, 1)
        assert.deepStrictEqual(actual.targets[0], {
          passed: false,
          path: 'link.md'
        })

        scope.done()
      })

      it('returns false if a private link is present in a markdown file', async () => {
        const scope = nock('http://www.example.com')
          .head('/something/somethingelse')
          .reply(404)

        const ruleopts = {
          globsAll: ['link.md']
        }

        const actual = await fileNoBrokenLinks(testFs, ruleopts)

        assert.strictEqual(actual.passed, false)
        assert.strictEqual(actual.targets.length, 1)
        assert.deepStrictEqual(actual.targets[0], {
          passed: false,
          path: 'link.md'
        })

        scope.done()
      })

      it('returns true if an autolink is present in a markdown file', async () => {
        const scope = nock('http://www.example.com')
          .head('/something/somethingelse')
          .reply(200)

        const ruleopts = {
          globsAll: ['autolink.md']
        }

        const actual = await fileNoBrokenLinks(testFs, ruleopts)

        assert.strictEqual(actual.passed, true)
        assert.strictEqual(actual.targets.length, 1)
        assert.deepStrictEqual(actual.targets[0], {
          passed: true,
          path: 'autolink.md'
        })

        scope.done()
      })

      it('returns true if a valid link is present in an rst file', async () => {
        const scope = nock('http://www.example.com')
          .head('/something/somethingelse')
          .reply(200)

        const ruleopts = {
          globsAll: ['link.rst']
        }

        const actual = await fileNoBrokenLinks(testFs, ruleopts)

        assert.strictEqual(actual.passed, true)
        assert.strictEqual(actual.targets.length, 1)
        assert.deepStrictEqual(actual.targets[0], {
          passed: true,
          path: 'link.rst'
        })

        scope.done()
      })

      it('returns false if an invalid link is present in an rst file', async () => {
        const scope = nock('http://www.example.com')
          .head('/something/somethingelse')
          .replyWithError('nxdomain or something')

        const ruleopts = {
          globsAll: ['link.rst']
        }

        const actual = await fileNoBrokenLinks(testFs, ruleopts)

        assert.strictEqual(actual.passed, false)
        assert.strictEqual(actual.targets.length, 1)
        assert.deepStrictEqual(actual.targets[0], {
          passed: false,
          path: 'link.rst'
        })

        scope.done()
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
        assert.deepStrictEqual(actual.targets[0], {
          passed: false,
          path: 'subdirectory/invalid_nested_relative_link.md'
        })
      })

      it('returns false with a relative link to a file in markdown outside the working directory', async () => {
        const ruleopts = {
          globsAll: ['relative_link_outside_dir.md']
        }

        const actual = await fileNoBrokenLinks(testFs, ruleopts)

        assert.strictEqual(actual.passed, false)
        assert.strictEqual(actual.targets.length, 1)
        assert.deepStrictEqual(actual.targets[0], {
          passed: false,
          path: 'relative_link_outside_dir.md'
        })
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
        assert.deepStrictEqual(actual.targets[0], {
          passed: false,
          path: 'invalid_relative_link.md'
        })
      })

      it('returns false with a absolute path in markdown', async () => {
        const ruleopts = {
          globsAll: ['absolute_link.md']
        }

        const actual = await fileNoBrokenLinks(testFs, ruleopts)

        assert.strictEqual(actual.passed, false)
        assert.strictEqual(actual.targets.length, 1)
        assert.deepStrictEqual(actual.targets[0], {
          passed: false,
          path: 'absolute_link.md'
        })
      })

      it('checks multiple links in markdown', async () => {
        const scope = nock('http://www.example.com')
          .head('/something/somethingelse')
          .reply(200)
        const scope2 = nock('http://www.example.com')
          .head('/something')
          .reply(200)

        const ruleopts = {
          globsAll: ['multiple_links.md']
        }

        const actual = await fileNoBrokenLinks(testFs, ruleopts)

        assert.strictEqual(actual.passed, true)
        assert.strictEqual(actual.targets.length, 1)
        assert.deepStrictEqual(actual.targets[0], {
          passed: true,
          path: 'multiple_links.md'
        })

        scope.done()
        scope2.done()
      })

      it('checks multiple files', async () => {
        const scope = nock('http://www.example.com')
          .head('/something/somethingelse')
          .reply(200)
          .persist()

        const ruleopts = {
          globsAll: ['link.md', 'link.rst']
        }

        const actual = await fileNoBrokenLinks(testFs, ruleopts)

        assert.strictEqual(actual.passed, true)
        assert.strictEqual(actual.targets.length, 2)
        assert.deepStrictEqual(actual.targets[0], {
          passed: true,
          path: 'link.md'
        })
        assert.deepStrictEqual(actual.targets[1], {
          passed: true,
          path: 'link.rst'
        })

        scope.done()
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
}, { timeout: 30_000 })
