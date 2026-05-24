// Copyright 2017 TODO Group. All rights reserved.
// Licensed under the Apache License, Version 2.0.

module.exports = {
  licensee: require('./licensee'),
  linguist: require('./linguist'),
  packagers: require('./packagers'),
  get 'contributor-count'() {
    return async fs => (await import('./contributor-count.mjs')).default(fs)
  }
}
