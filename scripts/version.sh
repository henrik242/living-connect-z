#!/bin/bash

# Auto-update app version to 1.0.<commit count>
COMMIT_COUNT=$(git rev-list --count HEAD)
VERSION="1.0.${COMMIT_COUNT}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

for f in "$ROOT_DIR/.homeycompose/app.json" "$ROOT_DIR/app.json"; do
  if [ -f "$f" ]; then
    sed -i '' "s/\"version\": \"1\.0\.[0-9]*\"/\"version\": \"${VERSION}\"/" "$f"
  fi
done

echo "Version set to ${VERSION}"
