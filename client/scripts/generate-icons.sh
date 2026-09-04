#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../public"

magick favicon.svg -background "#f4f1ea" -resize 192x192 -strip PNG32:pwa-192.png
magick favicon.svg -background "#f4f1ea" -resize 512x512 -strip PNG32:pwa-512.png
magick icon-maskable.svg -background "#f4f1ea" -resize 512x512 -strip PNG32:pwa-512-maskable.png
magick favicon.svg -background "#f4f1ea" -resize 180x180 -strip PNG32:apple-touch-icon.png

echo "Generated PWA icons in client/public/"
