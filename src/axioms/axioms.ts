// Copyright 2017 TODO Group. All rights reserved.
// Licensed under the Apache License, Version 2.0.

import licensee from './licensee.js'
import linguist from './linguist.js'
import packagers from './packagers.js'
import contributorCount from './contributor-count.js'
import type FileSystem from '../lib/file-system.js'
import type Result from '../lib/result.js'

type AxiomFunction = (fileSystem: FileSystem) => Promise<Result>

const axioms: Record<string, AxiomFunction> = {
  licensee,
  linguist,
  packagers,
  'contributor-count': contributorCount
}

export default axioms
