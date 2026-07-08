# Copyright 2026 Damián Búho
#
# SPDX-License-Identifier: Apache-2.0

set quiet

[private]
default:
    @just --choose || just --list

build:
    pnpm build

build-docker:
    docker buildx build -t repolinter:dev --load .

test:
    env -u GIT_DIR -u GIT_INDEX_FILE -u GIT_WORK_TREE -u GIT_OBJECT_DIRECTORY -u GIT_ALTERNATE_OBJECT_DIRECTORIES -u GIT_COMMON_DIR node --test 'tests/**/*.js'

test-verbose:
    env -u GIT_DIR -u GIT_INDEX_FILE -u GIT_WORK_TREE -u GIT_OBJECT_DIRECTORY -u GIT_ALTERNATE_OBJECT_DIRECTORIES -u GIT_COMMON_DIR node --test --test-reporter spec 'tests/**/*.js'

coverage:
    npm run test:coverage

lint:
    pnpm lint
    reuse lint --lines

fix:
    pnpm fix

format:
    pnpm format

audit:
    npm run audit

format-check:
    pnpm format:check

stryker:
    mkdir --parents reports
    REPOLINTER_LINK_TIMEOUT_MS=2000 REPOLINTER_GIT_TIMEOUT_MS=5000 pnpm dlx stryker run --concurrency $(( ${NUMPROCS:-$(nproc)} / 8 )) 2>&1 | tee reports/stryker.log

pipeline: format lint build test build-docker

publish:
    pnpm publish
