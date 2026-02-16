#!/bin/bash
# Fix API routes to properly handle dynamic rendering

# Routes that need force-dynamic export
routes=(
  "src/app/api/betting/platform-stats/route.ts"
  "src/app/api/leaderboards/route.ts"
  "src/app/api/share/og-image/route.ts"
  "src/app/api/analytics/stats/route.ts"
  "src/app/api/notifications/preferences/route.ts"
)

for route in "${routes[@]}"; do
  if [ -f "$route" ]; then
    echo "Fixing $route..."
    
    # Check if already has dynamic export
    if ! grep -q "export const dynamic" "$route"; then
      # Add dynamic export after imports
      sed -i '' '/^import/! {/^$/! {/^export const dynamic/! {1i\
export const dynamic = '\''force-dynamic'\''\
export const runtime = '\''nodejs'\''\

      }; }; }' "$route"
    fi
    
    # Remove console.logs in production
    sed -i '' 's/console\.error(/if (process.env.NODE_ENV !== '\''production'\'') console.error(/g' "$route"
    sed -i '' 's/console\.log(/if (process.env.NODE_ENV !== '\''production'\'') console.log(/g' "$route"
  fi
done

echo "API routes fixed!"
