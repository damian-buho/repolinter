<!--
SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>

SPDX-License-Identifier: Apache-2.0
-->

# Contributing to Repolinter (Damián Búho)

Thanks for your interest in Repolinter (Damián Búho)!
This document covers the basics of contributing — read it once, then dive in.

## Overview

Repolinter (Damián Búho) is a linter for open source repositories (fork of todogroup/repolinter).
See the project readme for the high-level architecture overview.

## Local setup

Clone the repository from <git@github.com:damian-buho/repolinter.git> and ensure your
development environment matches the requirements listed in the project’s metadata.
We use lefthook for managing git hooks

## Tests

Run `just test` to execute the registered test suite. Add new tests for any
behavioural change; format-only changes should not require new tests.

## Code style

Run `just format lint` before opening a PR. The project’s formatter
and linter configuration is the source of truth; if they disagree with this
document, they win.

## Submitting changes

1. Fork the repository and create a topic branch.
2. Make your changes — keep commits small and focused.
3. Use [Conventional Commits](https://www.conventionalcommits.org/) for the
 commit message.
4. Open a pull request against the default branch.

## Licensing

By contributing to Repolinter (Damián Búho), you agree that your contributions will
be licensed under the project’s Apache-2.0 license.

