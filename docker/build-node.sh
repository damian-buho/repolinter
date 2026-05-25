#!/usr/bin/env bash
set -euo pipefail

echo "=== repolinter node-build ==="

echo "[node] Installing npm dependencies..."
npm ci

echo "[node] Building TypeScript..."
npm run build

echo "[node] Copying github_markup_check_and_render to dist/lib/..."
cp lib/github_markup_check_and_render dist/lib/github_markup_check_and_render
chmod +x dist/lib/github_markup_check_and_render

echo "[node] Pruning dev dependencies..."
npm prune --omit=dev

echo "[node] Build complete."
