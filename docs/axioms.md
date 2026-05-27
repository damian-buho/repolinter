<!--
SPDX-FileCopyrightText: 2017 TODO Group
SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>

SPDX-License-Identifier: Apache-2.0
-->

# Axioms

Below is a complete list of axioms that Repolinter can check.

## Contents

- [Contents](#contents)
- [Reference](#reference)
  - [contributor-count](#contributor-count)
  - [licensee](#licensee)
  - [linguist](#linguist)
  - [packagers](#packagers)

## Reference

### contributor-count

This axiom uses [gitlog](https://github.com/domharrington/node-gitlog#readme) to count the number of contributors to the current Git repository. Contributors are counted based on unique occurrences of an author name in the Git log. This axiom is a numerical axiom, meaning numerical comparisons can be used.

An example of using this axiom:

```JavaScript
{
  "axioms": {
    "contributor-count": "contributors"
  },
  "rules": {
    "my-rule": {
      "where": ["contributors>6", "contributors<200"],
      // ...
    }
  }
}
```

### licensee

This axiom detects the license used in the current repository by matching the project's `LICENSE` file against the canonical [SPDX license templates](https://spdx.org/licenses/) using a Sørensen–Dice bigram similarity score (default threshold 0.9; tune with `REPOLINTER_LICENSE_THRESHOLD`). No external runtime is required; the detector ships as a pure-JS dependency.
This axiom will return a list of [license identifiers](https://spdx.org/licenses/) associated with the current repository.

An example of using this axiom:

```JavaScript
{
  "axioms": {
    "licensee": "license"
  },
  "rules": {
    "my-rule": {
      "where": ["license=Apache-2.0"],
      // ...
    }
  }
}
```

### linguist

This axiom detects programming languages in the current repository using [linguist-js](https://github.com/Nixinova/Linguist), a pure-JS port of GitHub's [linguist](https://github.com/github/linguist) that consumes the same upstream `languages.yml` data. No external runtime is required. This axiom will return a lowercase list of programming languages from [this list of supported languages](https://github.com/github/linguist/blob/master/lib/linguist/languages.yml).

An example of using this axiom:

```JavaScript
{
  "axioms": {
    "linguist":" language"
  },
  "rules": {
    "my-rule": {
      "where": ["language=javascript"],
      // ...
    }
  }
}
```

### packagers

This axiom detects the projects packaging system by looking for project metadata files such as the [package.json](https://docs.npmjs.com/files/package.json). The list of detectable packaging systems can be found in the [axiom source](../src/axioms/packagers.ts).
