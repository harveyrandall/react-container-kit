#!/bin/bash
set -euo pipefail

CURRENT=$(node -p "require('./package.json').version")
LATEST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "none")

echo ""
echo "react-container-kit — release"
echo "══════════════════════════════"
echo ""
echo "  current version : $CURRENT"
echo "  latest tag      : $LATEST_TAG"
echo ""

if [ -n "${1:-}" ]; then
  NEW_VERSION="$1"
else
  printf "  new version: "
  read -r NEW_VERSION
fi

echo ""
echo "  releasing v$NEW_VERSION"
echo ""

# 1. Changelog
echo "→ Updating CHANGELOG.md"
yarn conventional-changelog -p angular -i CHANGELOG.md -s
echo ""

# 2. Version bump
echo "→ Bumping package.json to $NEW_VERSION"
sed -i '' "s/\"version\": \"$CURRENT\"/\"version\": \"$NEW_VERSION\"/" package.json
echo ""

# 3. Commit
echo "→ Staging and committing"
git add CHANGELOG.md package.json
git commit -S -m "chore(release): bump version to $NEW_VERSION"
echo ""

# 4. Tag
echo "→ Creating signed tag v$NEW_VERSION"
git tag -s "v$NEW_VERSION" -m "chore(release): v$NEW_VERSION"
echo ""

# 5. Publish
echo "  One-time password required (check your authenticator app)."
printf "  OTP: "
read -r OTP
echo ""
echo "→ Publishing to npm"
yarn npm publish --otp "$OTP"
echo ""

# 6. Push
echo "→ Pushing commits and tags"
git push --follow-tags
echo ""
echo "  v$NEW_VERSION released"
echo ""
