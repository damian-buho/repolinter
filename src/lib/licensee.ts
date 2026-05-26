// Copyright 2018 TODO Group. All rights reserved.
// Licensed under the Apache License, Version 2.0.

import { identifyLicense } from './license-detector.js'

class Licensee {
  async identifyLicense(targetDirectory: string): Promise<string[]> {
    return identifyLicense(targetDirectory)
  }
}

export default new Licensee()
