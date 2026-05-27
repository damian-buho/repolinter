<!--
SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
SPDX-License-Identifier: Apache-2.0
-->

# CHANGELOG

- - -

## 2.0.0 - 2026-05-26
#### Tests
- bind mock-http-server to ephemeral port to fix macOS CI - (b5d122d) - Damián Búho
#### Refactoring
- <span style="background-color: #d73a49; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold; font-size: 0.85em;">BREAKING</span> replace Ruby gems (linguist, licensee, github-markup) with pure JS - (ff80eb6) - Damián Búho
#### Miscellaneous Chores
- (**branding**) add small logo - (18287d4) - Damián Búho
- (**branding**) drop the old logos - (3f25024) - Damián Búho
- (**docs**) add new logo + shields - (f1abfdb) - Damián Búho
- (**version**) 2.0.0 - (efd79c1) - Damián Búho

- - -

## 1.1.1 - 2026-05-26
#### Bug Fixes
- (**security**) block prototype pollution in deepMerge; quote shell paths in CLI tests - (b211dee) - Damián Búho
- (**security**) anchor shouldRuleRun regex to prevent polynomial ReDoS - (c0d4c7e) - Damián Búho
#### Tests
- (**git**) drop network + host-history from CLI and axiom tests - (0d86d87) - Damián Búho
- (**git**) use hermetic fixture repos instead of host history - (de3ec26) - Damián Búho
#### Miscellaneous Chores
- (**lefthook**) auto-stage prettier fixes + scope to staged files - (114f551) - Damián Búho
- (**version**) 1.1.1 - (e97f8cc) - Damián Búho
#### Style
- apply prettier reformat to fixture helper + cli test - (a832517) - Damián Búho

- - -

## 1.1.0 - 2026-05-26
#### Features
- (**gh-actions**) ship in-tree composite action and dogfood in CI - (1253927) - Damián Búho
- (**gh-actions**) manual dispatch for release workflow - (56242aa) - Damián Búho
- (**release**) push floating major/minor tags - (7293a2a) - Damián Búho
#### Bug Fixes
- (**action**) drop github context from input default - (b5b5b39) - Damián Búho
#### Documentation
- (**action**) add MARKETPLACE.md and disambiguate action name - (12af0f4) - Damián Búho
#### Continuous Integration
- revamp workflows into pipeline, release, documentation - (f6c4836) - Damián Búho
#### Miscellaneous Chores
- (**docs**) link to github pages - (f7c9ec3) - Damián Búho
- (**gh-actions**) bump actions to Node 24 compatible majors - (dcdf05e) - Damián Búho
- (**version**) 1.1.0 - (b38781d) - Damián Búho

- - -

## 1.0.4 - 2026-05-25
#### Bug Fixes
- (**gh-actions**) split workflows - (fe57fad) - Damián Búho
#### Miscellaneous Chores
- (**version**) 1.0.4 - (3b2cb78) - Damián Búho

- - -

## 1.0.3 - 2026-05-25
#### Bug Fixes
- (**gh-actions**) bump releaser - (a7eeb26) - Damián Búho
#### Miscellaneous Chores
- (**version**) 1.0.3 - (1d2c60a) - Damián Búho

- - -

## 1.0.2 - 2026-05-25
#### Bug Fixes
- (**gh-actions**) no v in version - (2075a7d) - Damián Búho
#### Miscellaneous Chores
- (**version**) 1.0.2 - (7f9cec9) - Damián Búho

- - -

## 1.0.1 - 2026-05-25
#### Bug Fixes
- (**git-helper**) drop phantom empty entry from gitAllCommits - (7b0cb0a) - Damián Búho
#### Tests
- (**git-helper**) make gitAllCommits test self-contained - (2217a07) - Damián Búho
#### Continuous Integration
- fetch full history and opt JS actions into Node 24 - (75f600d) - Damián Búho
- remove NPM_TOKEN — npm trusted publishing via OIDC is configured - (27b158b) - Damián Búho
- replace semantic-release with raw publish steps - (1943eaa) - Damián Búho
- add build step before tests - (1214ff1) - Damián Búho
- configure npm trusted publishing via OIDC - (eccab48) - Damián Búho
#### Miscellaneous Chores
- (**cocogitto**) init - (1420d59) - Damián Búho
- (**version**) 1.0.1 - (b8e36b1) - Damián Búho
- add publishConfig and prepublishOnly for npm publish - (e9829b6) - Damián Búho
- adapt .github to fork - (d0d95fb) - Damián Búho


