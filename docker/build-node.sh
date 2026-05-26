#!/usr/bin/env bash
set -euo pipefail

echo "=== repolinter node-build ==="

echo "[node] Installing npm dependencies..."
npm ci

echo "[node] Building TypeScript..."
npm run build

echo "[node] Pruning dev dependencies..."
npm prune --omit=dev

echo "[node] Build complete."
