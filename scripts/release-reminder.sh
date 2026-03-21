#!/bin/bash
set -euo pipefail

CURRENT=$(node -p "require('./package.json').version")
LATEST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "none")

echo ""
echo "react-container-kit — release checklist"
echo "════════════════════════════════════════"
echo ""
echo "  package.json version : $CURRENT"
echo "  latest git tag       : $LATEST_TAG"
echo ""
echo "Steps"
echo "─────"
echo "  1. Bump version in package.json"
echo "  2. git add package.json"
echo "  3. git commit -S -m \"chore(release): bump version to <new>\""
echo "  4. git tag -s v<new> -m \"chore(release): v<new>\""
echo "  5. yarn npm publish --otp <6-digit-code>"
echo "  6. git push --follow-tags"
echo ""
echo "Publish command (fill in OTP from your authenticator app):"
echo ""
echo "  yarn npm publish --otp <code>"
echo ""
