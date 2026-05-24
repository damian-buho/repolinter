# https://just.systems

set quiet

[private]
default:
    @just --choose || just --list

build:
    npm run build

test:
    npm test

coverage:
    npm run coverage

lint:
    npm run lint

fix:
    npm run fix

apidoc:
    npm run apidoc

pipeline: fix lint test build

publish:
    npm publish
