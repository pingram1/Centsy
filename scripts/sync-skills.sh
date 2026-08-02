#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DESIGN_SRC="$ROOT/.cursor/skills-sources/awesome-design-skills/skills"
DESIGN_DEST="$ROOT/.cursor/skills"

echo "Updating skill source submodules..."
git -C "$ROOT" submodule update --init --remote --merge \
  .cursor/skills-sources/awesome-design-skills \
  .cursor/skills-sources/awesome-agent-skills \
  .cursor/skills-sources/pentesting-everything

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

echo "Syncing pentesting-everything skill from m14r41/PentestingEverything..."
PENTEST_SRC="$ROOT/.cursor/skills-sources/pentesting-everything/.agents/skills/pentesting-everything"
PENTEST_DEST="$DESIGN_DEST/pentesting-everything"
mkdir -p "$PENTEST_DEST"
cp "$PENTEST_SRC/SKILL.md" "$PENTEST_DEST/SKILL.md"
cp "$PENTEST_SRC/REPOSITORY_MAP.md" "$PENTEST_DEST/REPOSITORY_MAP.md"
cp "$PENTEST_SRC/OUTPUT_TEMPLATES.md" "$PENTEST_DEST/OUTPUT_TEMPLATES.md"

echo "Synced $installed design skills to .cursor/skills/"
echo "Synced pentesting-everything skill (knowledge base: .cursor/skills-sources/pentesting-everything/)"
echo "Agent skill catalog: .cursor/skills-sources/awesome-agent-skills/README.md"
echo "Install catalog skills with: ./scripts/install-agent-skill.sh <owner/repo@skill>"
