#!/bin/bash
# Setup script for Voidborne Lore Integration - Phase 1
# Creates directory structure and starter files

set -e

echo "🦾 Setting up Voidborne Lore Integration - Phase 1"
echo ""

# Navigate to project root
cd "$(dirname "$0")/.."

# Create directory structure
echo "📁 Creating directory structure..."

mkdir -p apps/web/src/content/lore/artes
mkdir -p apps/web/src/app/lore/houses/\[houseId\]
mkdir -p apps/web/src/app/lore/protocols/\[protocolId\]
mkdir -p apps/web/src/app/lore/characters/\[characterId\]
mkdir -p apps/web/src/app/lore/setting
mkdir -p apps/web/src/components/lore

echo "✅ Directories created"
echo ""

# Create placeholder files
echo "📝 Creating placeholder files..."

# Content files
touch apps/web/src/content/lore/index.ts
touch apps/web/src/content/lore/houses.ts
touch apps/web/src/content/lore/protocols.ts
touch apps/web/src/content/lore/protagonists.ts
touch apps/web/src/content/lore/setting.ts

# Arte files (14 protocols)
touch apps/web/src/content/lore/artes/geodesist.ts
touch apps/web/src/content/lore/artes/tensor.ts
touch apps/web/src/content/lore/artes/fracturer.ts
# ... (will create others as needed)

# Page files
touch apps/web/src/app/lore/page.tsx
touch apps/web/src/app/lore/houses/page.tsx
touch apps/web/src/app/lore/houses/\[houseId\]/page.tsx
touch apps/web/src/app/lore/protocols/page.tsx
touch apps/web/src/app/lore/protocols/\[protocolId\]/page.tsx
touch apps/web/src/app/lore/characters/page.tsx
touch apps/web/src/app/lore/characters/\[characterId\]/page.tsx
touch apps/web/src/app/lore/setting/page.tsx

# Component files
touch apps/web/src/components/lore/HouseCard.tsx
touch apps/web/src/components/lore/HouseDetail.tsx
touch apps/web/src/components/lore/ProtocolCard.tsx
touch apps/web/src/components/lore/ProtocolDetail.tsx
touch apps/web/src/components/lore/CharacterProfile.tsx
touch apps/web/src/components/lore/LoreNavigation.tsx
touch apps/web/src/components/lore/LoreTabs.tsx

echo "✅ Placeholder files created"
echo ""

echo "🎉 Phase 1 structure ready!"
echo ""
echo "Next steps:"
echo "1. Populate content files with Voidborne lore data"
echo "2. Build UI components for lore display"
echo "3. Create page components"
echo "4. Add navigation to main app"
echo ""
echo "See VOIDBORNE_INTEGRATION_PLAN.md for details"
