#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DESIGN_SRC="$ROOT/.cursor/skills-sources/awesome-design-skills/skills"
DESIGN_DEST="$ROOT/.cursor/skills"

echo "Updating skill source submodules..."
git -C "$ROOT" submodule update --init --remote --merge \
  .cursor/skills-sources/awesome-design-skills \
  .cursor/skills-sources/awesome-agent-skills

echo "Syncing design skills from bergside/awesome-design-skills..."
installed=0
for dir in "$DESIGN_SRC"/*/; do
  name="$(basename "$dir")"
  if [[ ! -f "$dir/SKILL.md" ]]; then
    continue
  fi
  mkdir -p "$DESIGN_DEST/$name"
  cp "$dir/SKILL.md" "$DESIGN_DEST/$name/SKILL.md"
  installed=$((installed + 1))
done

echo "Synced $installed design skills to .cursor/skills/"
echo "Agent skill catalog: .cursor/skills-sources/awesome-agent-skills/README.md"
echo "Install catalog skills with: ./scripts/install-agent-skill.sh <owner/repo@skill>"
