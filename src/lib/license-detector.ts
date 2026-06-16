// SPDX-FileCopyrightText: 2017 TODO Group.
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
// SPDX-License-Identifier: Apache-2.0

import path from 'node:path'
import fs from 'node:fs/promises'
import { createRequire } from 'node:module'

const localRequire = createRequire(import.meta.url)
const spdxFull = localRequire('spdx-license-list/spdx-full.json') as Record<
  string,
  { licenseText?: string } | undefined
>

// Filenames Ruby `licensee` recognises as the project license, root-only.
const LICENSE_FILENAMES = [
  'LICENSE',
  'LICENSE.md',
  'LICENSE.txt',
  'COPYING',
  'COPYING.md',
  'COPYING.txt'
]

const DEFAULT_THRESHOLD = 0.9

// Ruby licensee strips copyright headers, square/angle template placeholders,
// trims punctuation, lowercases, and collapses whitespace before comparing.
function normalize(text: string): string {
  return text
    .replaceAll(/copyright\s*(\(c\)|©)?\s*[^\n]*/gi, ' ')
    .replaceAll(/\[[^\]\n]+\]/g, ' ')
    .replaceAll(/<[^>\n]+>/g, ' ')
    .toLowerCase()
    .replaceAll(/[^a-z0-9\s]/g, ' ')
    .replaceAll(/\s+/g, ' ')
    .trim()
}

function bigrams(text: string): Map<string, number> {
  const tokens = text.split(' ')
  const grams = new Map<string, number>()
  for (let index = 0; index < tokens.length - 1; index++) {
    const key = `${tokens[index]} ${tokens[index + 1]}`
    grams.set(key, (grams.get(key) ?? 0) + 1)
  }
  return grams
}

// Sørensen–Dice on bigram multisets — the same metric Ruby `licensee` uses.
function diceCoefficient(
  candidate: Map<string, number>,
  template: Map<string, number>
): number {
  let candidateSize = 0
  let templateSize = 0
  for (const count of candidate.values()) candidateSize += count
  for (const count of template.values()) templateSize += count
  if (candidateSize === 0 || templateSize === 0) return 0
  let intersection = 0
  for (const [gram, candidateCount] of candidate) {
    const templateCount = template.get(gram)
    if (templateCount !== undefined) {
      intersection += Math.min(candidateCount, templateCount)
    }
  }
  return (2 * intersection) / (candidateSize + templateSize)
}

interface Template {
  id: string
  bigrams: Map<string, number>
}

// Templates are immutable; build once at module load so per-lint cost is just
// candidate normalization plus a linear scan of cached bigram maps.
function buildTemplates(): Template[] {
  const templates: Template[] = []
  for (const [id, info] of Object.entries(spdxFull)) {
    if (!info?.licenseText) continue
    const normalized = normalize(info.licenseText)
    if (!normalized) continue
    templates.push({ id, bigrams: bigrams(normalized) })
  }
  return templates
}

const TEMPLATES = buildTemplates()

async function findLicenseFile(
  targetDirectory: string
): Promise<string | undefined> {
  let entries: string[]
  try {
    entries = await fs.readdir(targetDirectory)
  } catch {
    return undefined
  }
  const lowered = new Map(entries.map(name => [name.toLowerCase(), name]))
  for (const candidate of LICENSE_FILENAMES) {
    const actual = lowered.get(candidate.toLowerCase())
    if (!actual) continue
    const fullPath = path.join(targetDirectory, actual)
    try {
      const stat = await fs.stat(fullPath)
      if (stat.isFile()) return fullPath
    } catch {
      // unreadable entries are skipped — same as missing
    }
  }
  return undefined
}

function thresholdFromEnvironment(): number {
  const raw = process.env.REPOLINTER_LICENSE_THRESHOLD
  if (!raw) return DEFAULT_THRESHOLD
  const parsed = Number(raw)
  if (Number.isNaN(parsed) || parsed <= 0 || parsed > 1) {
    return DEFAULT_THRESHOLD
  }
  return parsed
}

// Contract matches the Ruby `licensee detect --json` consumer:
//   - no LICENSE file        → []
//   - LICENSE, no match      → ['NOASSERTION']
//   - LICENSE, match >= thr  → ['<SPDX_ID>']
export async function identifyLicense(
  targetDirectory: string
): Promise<string[]> {
  const licenseFile = await findLicenseFile(targetDirectory)
  if (!licenseFile) return []

  let raw: string
  try {
    raw = await fs.readFile(licenseFile, 'utf8')
  } catch {
    return []
  }

  const normalized = normalize(raw)
  if (!normalized) return ['NOASSERTION']

  const candidate = bigrams(normalized)
  const threshold = thresholdFromEnvironment()

  let bestId: string | undefined
  let bestScore = 0
  for (const template of TEMPLATES) {
    const score = diceCoefficient(candidate, template.bigrams)
    if (score > bestScore) {
      bestScore = score
      bestId = template.id
    }
  }

  if (bestId && bestScore >= threshold) return [bestId]
  return ['NOASSERTION']
}
