// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

const whitespace = /\s/g
const specials =
  /[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,./:;<=>?@[\]^`{|}~']/g
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
