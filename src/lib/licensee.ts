// SPDX-FileCopyrightText: 2017 TODO Group.
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
// SPDX-License-Identifier: Apache-2.0

import { identifyLicense } from './license-detector.js'

class Licensee {
  async identifyLicense(targetDirectory: string): Promise<string[]> {
    return identifyLicense(targetDirectory)
  }
}

export default new Licensee()
