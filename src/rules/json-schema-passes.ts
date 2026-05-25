// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import type FileSystem from '../lib/file-system.js'
import Result from '../lib/result.js'
import { Ajv } from 'ajv'

interface JsonSchemaError {
  instancePath: string
  message?: string
}

interface JsonSchemaPassesOptions {
  glob: string
  nocase?: boolean
  schema: Record<string, unknown>
  'succeed-on-non-existent'?: boolean
  'human-readable-message'?: string
}

async function jsonSchemaPasses(
  fs: FileSystem,
  options: JsonSchemaPassesOptions
): Promise<Result> {
  const fileName = options.glob
  const file = await fs.findFirstFile(options.glob, options.nocase)

  if (file === undefined) {
    return new Result(
      'Did not find file matching the specified patterns',
      [{ passed: false, pattern: fileName }],
      !!options['succeed-on-non-existent']
    )
  }
  let fileContents = await fs.getFileContents(file)
  if (fileContents === undefined) {
    fileContents = ''
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(fileContents)
  } catch (error) {
    return new Result(
      '',
      [
        {
          path: file,
          pattern: fileName,
          passed: false,
          message: `Failed to parse JSON with error ${(error as Error).toString()}`
        }
      ],
      false
    )
  }
  const validator = new Ajv({ strict: false }).compile(options.schema)
  if (validator.errors) {
    throw new Error(
      `Failed to parse JSON schema with errors ${validator.errors
        .map(
          (error: JsonSchemaError) =>
            `root${error.instancePath} ${error.message}`
        )
        .join(', ')}`
    )
  }
  const result = !!validator(parsed)
  let message: string
  if (options['human-readable-message']) {
    message = result
      ? `${options['human-readable-message']} found in file`
      : `${options['human-readable-message']} not found in file`
  } else {
    message = result
      ? 'JSON validation passed'
      : `JSON validation failed with errors: ${(validator.errors ?? [])
          .map(
            (error: JsonSchemaError) =>
              `root${error.instancePath} ${error.message}`
          )
          .join(', ')}`
  }
  return new Result(
    '',
    [{ path: file, pattern: fileName, passed: result, message }],
    result
  )
}

export default jsonSchemaPasses
