# Copyright 2026 Damián Búho
#
# SPDX-License-Identifier: Apache-2.0

set quiet

[private]
default:
    @just --choose || just --list

build:
    npm run build

build-docker:
    docker buildx build -t repolinter:dev --load .

test:
    node --test 'tests/**/*.js'

test-verbose:
    node --test --test-reporter spec 'tests/**/*.js'

coverage:
    node --test --experimental-test-coverage 'tests/**/*.js'

lint:
    npm run lint
    reuse lint --lines

fix:
    npm run fix

format:
    npm run format

format-check:
    npm run format:check

stryker:
    mkdir --parents reports
    REPOLINTER_LINK_TIMEOUT_MS=2000 REPOLINTER_GIT_TIMEOUT_MS=5000 npx stryker run --concurrency $(( ${NUMPROCS:-$(nproc)} / 8 )) 2>&1 | tee reports/stryker.log

pipeline: format lint test build build-docker

publish:
    npm publish
