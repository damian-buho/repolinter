#!/usr/bin/env bash

# SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
#
# SPDX-License-Identifier: Apache-2.0

set -euo pipefail

echo "=== repolinter runtime setup ==="

echo "[runtime] Installing runtime dependencies..."
apt-get update
apt-get install -y --no-install-recommends \
    ca-certificates \
    git
rm -rf /var/lib/apt/lists/*

echo "[runtime] Configuring git safe directory..."
su node -c 'git config --global --add safe.directory "*"'

echo "[runtime] Setting permissions..."
chown -R node:node /app

echo "[runtime] Setup complete."
