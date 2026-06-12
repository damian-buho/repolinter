#!/usr/bin/env bash

# SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
#
# SPDX-License-Identifier: Apache-2.0

set -euo pipefail

echo "=== repolinter node-build ==="

echo "[node] Installing pnpm..."
npm install -g pnpm@11.6.0

echo "[node] Installing pnpm dependencies..."
pnpm install --frozen-lockfile --ignore-scripts
pnpm rebuild unrs-resolver

echo "[node] Building TypeScript..."
pnpm build

echo "[node] Pruning dev dependencies..."
pnpm prune --prod

echo "[node] Build complete."
