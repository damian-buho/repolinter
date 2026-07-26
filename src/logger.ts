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

// Pretty output exists for humans reading a terminal, so a TTY is the signal.
// LOG_PRETTY overrides it in both directions for pipelines that want otherwise.
function shouldPrettyPrint(isTTY: boolean): boolean {
  const preference = process.env['LOG_PRETTY']
  if (preference === 'true' || preference === '1') return true
  if (preference === 'false' || preference === '0') return false
  if (preference)
    process.stderr.write(
      `Invalid LOG_PRETTY="${preference}", falling back to TTY detection (isTTY=${isTTY})\n`
    )
  return isTTY
}

function createLogger(level: LogLevel): pino.Logger {
  const isTTY = process.stderr.isTTY === true

  if (!shouldPrettyPrint(isTTY)) return pino({ level }, process.stderr)

  // pino resolves the transport target by `require` at runtime, so a pruned or
  // partial install must degrade to structured logs rather than kill the CLI.
  // The destination stream argument is ignored once `transport` is set; the
  // transport's own `destination: 2` is what keeps logs off stdout.
  try {
    return pino({
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
    })
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    process.stderr.write(
      `Pretty logging unavailable (${reason}), using structured logs at level=${level}\n`
    )
    return pino({ level }, process.stderr)
  }
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
