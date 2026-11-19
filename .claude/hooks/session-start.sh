#!/usr/bin/env bash
# Loads project memory into every Claude Code session and flags stale docs.
cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}" || exit 0
echo "=== Mark's App: project memory (read before working; update before finishing, see CLAUDE.md §4) ==="
cat memory/MEMORY.md 2>/dev/null
echo
cat memory/current-state.md 2>/dev/null
echo
if command -v node >/dev/null 2>&1; then node scripts/check-freshness.mjs 2>/dev/null; fi
exit 0
