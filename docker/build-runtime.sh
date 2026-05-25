#!/usr/bin/env bash
set -euo pipefail

echo "=== repolinter runtime setup ==="

echo "[runtime] Installing runtime dependencies..."
apt-get update
apt-get install -y --no-install-recommends \
    ca-certificates \
    git \
    libcurl4t64 \
    libicu76 \
    libssl3 \
    libyaml-0-2 \
    zlib1g
rm -rf /var/lib/apt/lists/*

echo "[runtime] Updating shared library cache..."
ldconfig

echo "[runtime] Creating python symlinks..."
ln -sf python3.14 /usr/local/bin/python3
ln -sf python3.14 /usr/local/bin/python

echo "[runtime] Configuring git safe directory..."
su node -c 'git config --global --add safe.directory "*"'

echo "[runtime] Setting permissions..."
chown -R node:node /app

echo "[runtime] Setup complete."
