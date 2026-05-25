#!/usr/bin/env bash
set -euo pipefail

echo "=== repolinter ruby-build ==="

echo "[ruby] Installing build dependencies..."
apt-get update
apt-get install -y --no-install-recommends \
    build-essential cmake git \
    libicu-dev libcurl4-openssl-dev libidn11-dev libssl-dev libyaml-dev \
    pkg-config

echo "[ruby] Installing Ruby gems..."
bundle install --jobs "$(nproc)" --retry 3

echo "[ruby] Cleaning up build dependencies..."
apt-get purge -y build-essential cmake pkg-config
apt-get autoremove -y
rm -rf /var/lib/apt/lists/* /tmp/*

echo "[ruby] Build complete."
