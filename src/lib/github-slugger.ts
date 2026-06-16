// SPDX-FileCopyrightText: 2017 TODO Group.
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
// SPDX-License-Identifier: Apache-2.0

const whitespace = /\s/g
const specials =
  /[\u{2000}-\u{206F}\u{2E00}-\u{2E7F}\\'!"#$%&()*+,./:;<=>?@[\]^`{|}~']/gu
// Stryker disable next-line Regex : RGI_Emoji is a string property; \P{RGI_Emoji} is invalid per ECMAScript spec
const emojiRegex = /\p{RGI_Emoji}/gv

function slug(string: unknown): string {
  if (typeof string !== 'string') return ''

  return string
    .toLowerCase()
    .trim()
    .replaceAll(specials, '')
    .replaceAll(emojiRegex, '')
    .replaceAll(whitespace, '-')
}

export { slug }
