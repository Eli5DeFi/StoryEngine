#!/bin/bash
# Script to safely remove console.log statements while preserving console.error and console.warn

set -e

echo "🧹 Cleaning console.log statements from codebase..."

# Count before
BEFORE=$(grep -r "console\." apps/web/src --include="*.ts" --include="*.tsx" | wc -l | tr -d ' ')
echo "📊 Found $BEFORE console statements"

# Find and replace console.log with a safe no-op
find apps/web/src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e '/console\.log/d' \
  -e '/console\.debug/d' \
  -e '/console\.info/d' \
  -e '/console\.table/d' \
  -e '/console\.dir/d' \
  {} +

# Count after
AFTER=$(grep -r "console\." apps/web/src --include="*.ts" --include="*.tsx" | wc -l | tr -d ' ')
REMOVED=$((BEFORE - AFTER))

echo "✅ Removed $REMOVED console statements"
echo "📊 Remaining: $AFTER (error/warn preserved)"

# Show what's left
echo ""
echo "Remaining console statements (should be error/warn only):"
grep -r "console\." apps/web/src --include="*.ts" --include="*.tsx" | head -20 || echo "None found"
