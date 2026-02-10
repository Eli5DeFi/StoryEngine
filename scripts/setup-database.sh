#!/bin/bash
# Database Setup Script for NarrativeForge
# This script sets up the database and seeds it with sample data

set -e  # Exit on error

echo "🗄️  NarrativeForge Database Setup"
echo "=================================="
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    echo ""
    echo "Please set DATABASE_URL in .env file or environment:"
    echo "  export DATABASE_URL='postgresql://user:password@host:5432/narrativeforge'"
    echo ""
    echo "Easy options:"
    echo "  1. Railway: https://railway.app/ (free tier)"
    echo "  2. Supabase: https://supabase.com/ (free tier)"
    echo "  3. Neon: https://neon.tech/ (free tier)"
    echo "  4. Local: brew install postgresql@15 && createdb narrativeforge"
    exit 1
fi

echo "✅ DATABASE_URL is set"
echo ""

# Navigate to database package
cd packages/database

echo "📦 Installing dependencies..."
pnpm install

echo ""
echo "🔨 Generating Prisma Client..."
pnpm db:generate

echo ""
echo "🚀 Pushing schema to database..."
pnpm db:push

echo ""
echo "🌱 Seeding database with sample data..."
pnpm db:seed

echo ""
echo "✅ Database setup complete!"
echo ""
echo "Next steps:"
echo "  1. Open Prisma Studio: pnpm db:studio"
echo "  2. Start the app: cd apps/web && pnpm dev"
echo "  3. Visit: http://localhost:3000"
echo ""
echo "Sample data created:"
echo "  - 2 users (alice_crypto, bob_trader)"
echo "  - 1 story: 'The Last Starforge'"
echo "  - 2 chapters (1 resolved, 1 with active betting)"
echo "  - 4 choices"
echo "  - 1 active betting pool"
echo ""
