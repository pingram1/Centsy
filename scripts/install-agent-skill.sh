#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <owner/repo@skill> [skill-name...]" >&2
  echo "Example: $0 stripe/ai@stripe-best-practices" >&2
  echo "Catalog: https://github.com/VoltAgent/awesome-agent-skills" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="$ROOT/.cursor/skills"
TMP_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

cd "$TMP_DIR"
npx skills add "$1" -a cursor -y --copy "${@:2}"

if [[ -d "$TMP_DIR/.agents/skills" ]]; then
  for skill_dir in "$TMP_DIR/.agents/skills"/*/; do
    name="$(basename "$skill_dir")"
    mkdir -p "$DEST/$name"
    cp -R "$skill_dir/." "$DEST/$name/"
    echo "Installed $name -> .cursor/skills/$name/"
  done
else
  echo "No skills found under .agents/skills after install." >&2
  exit 1
fi
