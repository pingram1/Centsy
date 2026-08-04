#!/bin/bash
set -euo pipefail
SRC="/Users/pierrei/Desktop/StartRightTutoring/Centsy/Centsy"
TMP="/tmp/centsy-github-backup"

# Kill prior attempt if still hanging
pkill -f "rsync.*Centsy/Centsy" 2>/dev/null || true
rm -rf "$TMP"

echo "==> Cloning fresh repo to $TMP (outside iCloud)"
git clone --depth 1 https://github.com/pingram1/Centsy.git "$TMP"

echo "==> Copying restored first-party source (skipping node_modules/.next/.env.local)"
# Prefer ditto/cp for smaller trees; use rsync with --inplace
rsync -a \
  --exclude '.git' \
  --exclude '.git.icloud-broken' \
  --exclude 'node_modules' \
  --exclude 'mobile/node_modules' \
  --exclude '.next' \
  --exclude '.expo' \
  --exclude 'mobile/.expo' \
  --exclude '.agents' \
  --exclude '.DS_Store' \
  --exclude '.env.local' \
  --exclude 'mobile/.env' \
  --exclude '.cursor/skills-sources' \
  "$SRC/" "$TMP/"

cd "$TMP"

# Ignore local-only / broken paths
if ! grep -q '^\.agents/' .gitignore 2>/dev/null; then
  printf '\n.agents/\n.git.icloud-broken/\nmobile/.claude/\n' >> .gitignore
fi

echo "==> Removing empty files that break git add"
python3 - <<'PY'
import os
removed=0
for root, dirs, files in os.walk('.'):
    parts = set(root.split(os.sep))
    if '.git' in parts or 'node_modules' in parts:
        continue
    for name in files:
        path = os.path.join(root, name)
        try:
            if os.path.getsize(path) == 0:
                os.remove(path)
                removed += 1
                print('removed', path)
        except OSError as e:
            print('skip', path, e)
print('removed_count', removed)
PY

# Regenerate package-lock if truncated/missing
if [[ ! -s package-lock.json ]]; then
  echo "==> Regenerating root package-lock.json"
  npm install --package-lock-only --ignore-scripts
fi
if [[ -f mobile/package.json && ! -s mobile/package-lock.json ]]; then
  echo "==> Regenerating mobile package-lock.json"
  (cd mobile && npm install --package-lock-only --ignore-scripts)
fi

echo "==> Staging"
git add -A
echo "staged_files $(git status --porcelain | wc -l | tr -d ' ')"
git diff --cached --stat | tail -40

if git diff --cached --quiet; then
  echo "Nothing to commit"
  exit 0
fi

echo "==> Committing"
git commit -m "$(cat <<'EOF'
Backup restored Centsy app after iCloud file eviction.

Preserve the live Next.js API, Expo mobile app, Prisma schema, and shared package on GitHub so local iCloud Optimize Mac Storage wipeouts cannot destroy the only copy.
EOF
)"

echo "==> Pushing to origin/main"
git push origin HEAD:main

echo "==> Done"
git log -1 --oneline
git status -sb
