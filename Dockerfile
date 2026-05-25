# syntax=docker/dockerfile:1
# Repolinter — Multistage Dockerfile
#
# Build:
#   docker build -t repolinter .
#
# Multiarch (amd64 + arm64):
#   docker buildx build --platform linux/amd64,linux/arm64 -t repolinter .
#
# Run against current directory:
#   docker run --rm -t -v ${PWD}:/src -w /src repolinter
#
# Run against a remote GitHub repository:
#   docker run --rm -t repolinter --git https://github.com/username/repo.git

# ---------------------------------------------------------------------------
# Stage 1: node-build — compile TypeScript, produce dist/ + production modules
# ---------------------------------------------------------------------------
FROM node:24-trixie-slim@sha256:05c08ce4291e9a58f59456a7985176defb12cdd42271f35ff81a3e167ea61d4c AS node-build

WORKDIR /build

COPY --parents  docker/build-node.sh                  \
                fixes/                                \
                lib/github_markup_check_and_render    \
                package*.json                         \
                rules/                                \
                rulesets/                             \
                src/                                  \
                tsconfig.json                         \
                /build/

RUN ./docker/build-node.sh

# ---------------------------------------------------------------------------
# Stage 2: ruby-build — install licensee, linguist, github-markup + deps
# ---------------------------------------------------------------------------
FROM ruby:3.4.9-slim-trixie@sha256:a842f35cdf2fe24a7523182127c3ce6a4848e77fb50b3a57ec09faa59c96491e AS ruby-build

WORKDIR /build

COPY --parents  Gemfile*                \
                docker/build-ruby.sh    \
                /build/

RUN ./docker/build-ruby.sh

# ---------------------------------------------------------------------------
# Stage 3: python-build — install docutils for github-markup .rst rendering
# ---------------------------------------------------------------------------
FROM python:3.14.5-slim-trixie@sha256:c845af9399020c7e562969a13689e929074a10fd057acd1b1fad06a2fb068e97 AS python-build

COPY docker/build-python.sh ./

RUN ./build-python.sh

# ---------------------------------------------------------------------------
# Stage 4: node-runtime — final image
# ---------------------------------------------------------------------------
FROM node:24-trixie-slim@sha256:05c08ce4291e9a58f59456a7985176defb12cdd42271f35ff81a3e167ea61d4c

# -- Ruby from ruby-build --
COPY --from=ruby-build /usr/local/bin/ruby*        /usr/local/bin/
COPY --from=ruby-build /usr/local/lib/libruby*     /usr/local/lib/
COPY --from=ruby-build /usr/local/lib/ruby/        /usr/local/lib/ruby/
COPY --from=ruby-build /usr/local/bundle/          /usr/local/bundle/

# -- Python from python-build --
COPY --from=python-build /usr/local/bin/python3.14  /usr/local/bin/
COPY --from=python-build /usr/local/lib/libpython*  /usr/local/lib/
COPY --from=python-build /usr/local/lib/python3.14/ /usr/local/lib/python3.14/

# -- Node app from node-build --
WORKDIR /app

COPY --from=node-build /build/dist/         dist/
COPY --from=node-build /build/node_modules/ node_modules/

COPY docker/build-runtime.sh ./

RUN ./build-runtime.sh && rm build-runtime.sh

USER node

ENV PATH="/usr/local/bundle/bin:${PATH}"
ENV GEM_HOME="/usr/local/bundle"
ENV GEM_PATH="/usr/local/bundle:/usr/local/lib/ruby/gems/3.4.0"

ENTRYPOINT ["node", "/app/dist/cli.js"]
