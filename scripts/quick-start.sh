#!/bin/bash
# Quick Start Script for NarrativeForge
# Gets you up and running in minutes

set -e

echo "🚀 NarrativeForge Quick Start"
echo "============================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and add:"
    echo "   1. DATABASE_URL (get from Railway/Supabase/Neon)"
    echo "   2. BANKR_API_KEY (get from https://bankr.bot/api)"
    echo ""
    echo "Press ENTER when ready to continue..."
    read -r
fi

# Check if DATABASE_URL is set
if ! grep -q "DATABASE_URL=\"postgresql://" .env; then
    echo "❌ DATABASE_URL not set in .env"
    echo "   Please add a valid PostgreSQL connection string"
    exit 1
fi

echo "📦 Installing dependencies..."
pnpm install

echo ""
echo "🗄️  Setting up database..."
./scripts/setup-database.sh

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start developing:"
echo "  cd apps/web"
echo "  pnpm dev"
echo ""
echo "Then visit: http://localhost:3000"
echo ""
echo "Sample story available at:"
echo "  http://localhost:3000/story/[storyId]"
echo "  (Get storyId from Prisma Studio: pnpm db:studio)"
echo ""
