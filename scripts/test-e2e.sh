#!/usr/bin/env bash
# End-to-end test: convert every HTML slide in test/ to a single PPTX and
# verify the output is structurally valid (zip with the expected number of
# slideN.xml entries).
#
# Usage: scripts/test-e2e.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TEST_DIR="$REPO_ROOT/test"
OUTPUT="$TEST_DIR/output.pptx"

cd "$SCRIPT_DIR"

if [ ! -d node_modules ]; then
  echo "==> Installing dependencies"
  if [ -f package-lock.json ]; then
    npm ci
  else
    npm install
  fi
fi

mapfile -t SLIDES < <(ls "$TEST_DIR"/*.html | sort)
if [ "${#SLIDES[@]}" -eq 0 ]; then
  echo "ERROR: No HTML test slides found in $TEST_DIR" >&2
  exit 1
fi
EXPECTED_SLIDES="${#SLIDES[@]}"

echo "==> Converting $EXPECTED_SLIDES slide(s)"
rm -f "$OUTPUT"
node html-to-pptx.js --output "$OUTPUT" "${SLIDES[@]}"

echo
echo "==> Verifying $OUTPUT"

if [ ! -f "$OUTPUT" ]; then
  echo "FAIL: output.pptx was not created" >&2
  exit 1
fi

SIZE=$(wc -c < "$OUTPUT")
if [ "$SIZE" -lt 10000 ]; then
  echo "FAIL: output.pptx is suspiciously small ($SIZE bytes)" >&2
  exit 1
fi
echo "  ✓ file exists ($SIZE bytes)"

# PPTX files are zip archives. The Office Open XML spec puts each slide at
# ppt/slides/slideN.xml, so counting those entries tells us conversion ran
# end-to-end for every input slide.
if ! command -v unzip >/dev/null 2>&1; then
  echo "  ⚠ unzip not available, skipping structural check"
  exit 0
fi

if ! unzip -t "$OUTPUT" >/dev/null 2>&1; then
  echo "FAIL: output.pptx is not a valid zip archive" >&2
  exit 1
fi
echo "  ✓ valid zip archive"

SLIDE_COUNT=$(unzip -l "$OUTPUT" | grep -E 'ppt/slides/slide[0-9]+\.xml$' | wc -l)
if [ "$SLIDE_COUNT" -ne "$EXPECTED_SLIDES" ]; then
  echo "FAIL: expected $EXPECTED_SLIDES slide(s) in PPTX, found $SLIDE_COUNT" >&2
  exit 1
fi
echo "  ✓ contains $SLIDE_COUNT slide(s)"

# Confirm at least one slide carries the screenshot background.
MEDIA_COUNT=$(unzip -l "$OUTPUT" | grep -E 'ppt/media/' | wc -l)
if [ "$MEDIA_COUNT" -lt 1 ]; then
  echo "FAIL: no embedded media found in PPTX (background screenshots missing)" >&2
  exit 1
fi
echo "  ✓ embeds $MEDIA_COUNT media file(s)"

echo
echo "✓ End-to-end test passed"
