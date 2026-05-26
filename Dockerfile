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
                package*.json                         \
                rules/                                \
                rulesets/                             \
                src/                                  \
                tsconfig.json                         \
                /build/

RUN ./docker/build-node.sh

# ---------------------------------------------------------------------------
# Stage 2: node-runtime — final image
# ---------------------------------------------------------------------------
FROM node:24-trixie-slim@sha256:05c08ce4291e9a58f59456a7985176defb12cdd42271f35ff81a3e167ea61d4c

# -- Node app from node-build --
WORKDIR /app

COPY --from=node-build /build/dist/         dist/
COPY --from=node-build /build/node_modules/ node_modules/

COPY docker/build-runtime.sh ./

RUN ./build-runtime.sh && rm build-runtime.sh

USER node

ENTRYPOINT ["node", "/app/dist/cli.js"]
