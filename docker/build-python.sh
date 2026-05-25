#!/usr/bin/env bash
set -euo pipefail

echo "=== repolinter python-build ==="

echo "[python] Installing docutils..."
pip install --no-cache-dir --break-system-packages docutils

echo "[python] Build complete."
