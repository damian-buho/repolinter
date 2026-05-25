# https://just.systems

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

fix:
    npm run fix

generate-docs:
    npm run generate-docs

pipeline: fix lint test build

publish:
    npm publish
