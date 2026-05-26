// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import analyse from 'linguist-js'

class Linguist {
  async identifyLanguages(
    targetDirectory: string
  ): Promise<Record<string, unknown>> {
    const result = await analyse(targetDirectory)
    return result.languages.results
  }
}

export default new Linguist()
