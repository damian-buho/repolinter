// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
//
// SPDX-License-Identifier: Apache-2.0

import pino from 'pino'

export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace'

function resolveLevel(): LogLevel {
  const environmentLevel = process.env['LOG_LEVEL']
  if (environmentLevel && !isValidLogLevel(environmentLevel)) {
    process.stderr.write(
      `Invalid LOG_LEVEL="${environmentLevel}", falling back to info\n`
    )
    return 'info'
  }
  if (environmentLevel && isValidLogLevel(environmentLevel))
    return environmentLevel
  return 'info'
}

function isValidLogLevel(value: string): value is LogLevel {
  return ['fatal', 'error', 'warn', 'info', 'debug', 'trace'].includes(value)
}

function createLogger(level: LogLevel): pino.Logger {
  const isTTY = process.stderr.isTTY === true
  const shouldPrettyPrint = isTTY || process.env['NODE_ENV'] !== 'production'

  if (shouldPrettyPrint) {
    return pino(
      {
        level,
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: isTTY,
            translateTime: 'SYS:HH:MM:ss',
            ignore: 'pid,hostname',
            destination: 2
          }
        }
      },
      process.stderr
    )
  }

  return pino({ level }, process.stderr)
}

const logger = createLogger(resolveLevel())

export { logger }

export function setLogLevel(level: LogLevel): void {
  logger.level = level
}

export function getLogger(): pino.Logger {
  return logger
}

export default logger
