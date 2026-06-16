# SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
#
# SPDX-License-Identifier: Apache-2.0

# ---------------------------------------------------------------------------
# Stage 1: node-build — compile TypeScript, produce dist/ + production modules
# ---------------------------------------------------------------------------
FROM node:26-trixie-slim@sha256:1e738cb88890a15c71880323fbc35a739b7bbc703d72e8bfd1613128f8182f78 AS node-build

WORKDIR /build

COPY --parents  docker/build-node.sh      \
                fixes/                    \
                package.json              \
                pnpm-lock.yaml            \
                pnpm-workspace.yaml       \
                rules/                    \
                rulesets/                 \
                src/                      \
                tsconfig.json             \
                /build/

RUN ./docker/build-node.sh

# ---------------------------------------------------------------------------
# Stage 2: node-runtime — final image
# ---------------------------------------------------------------------------
FROM node:26-trixie-slim@sha256:1e738cb88890a15c71880323fbc35a739b7bbc703d72e8bfd1613128f8182f78

# -- Node app from node-build --
WORKDIR /app

COPY --from=node-build /build/dist/         dist/
COPY --from=node-build /build/node_modules/ node_modules/

COPY docker/build-runtime.sh ./

RUN ./build-runtime.sh && rm build-runtime.sh

USER node

ENTRYPOINT ["node", "/app/dist/cli.js"]
