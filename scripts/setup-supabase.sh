#!/bin/bash

# Voidborne Supabase Setup Script
# This script helps configure Supabase database connection

set -e

echo "🚀 Voidborne Supabase Setup"
echo "=============================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: Run this script from the project root"
  echo "   cd /path/to/StoryEngine && ./scripts/setup-supabase.sh"
  exit 1
fi

echo "📝 Step 1: Create Supabase Project"
echo ""
echo "1. Go to: https://supabase.com"
echo "2. Sign in with GitHub"
echo "3. Create new project (name: voidborne)"
echo "4. Wait for database provisioning (~2 minutes)"
echo ""
read -p "Press Enter when project is ready..."

echo ""
echo "📝 Step 2: Get Connection String"
echo ""
echo "1. Go to: Project Settings (gear icon) → Database"
echo "2. Find: 'Connection string' section"
echo "3. Select: 'Connection pooling' → 'Transaction mode'"
echo "4. Copy the connection string"
echo ""
echo "Format should look like:"
echo "postgresql://postgres.xxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
echo ""
read -p "Paste your Supabase connection string: " DATABASE_URL

# Validate connection string
if [[ ! $DATABASE_URL =~ ^postgresql:// ]]; then
  echo "❌ Error: Invalid connection string (should start with postgresql://)"
  exit 1
fi

# Add pgbouncer parameter if not present
if [[ ! $DATABASE_URL =~ pgbouncer=true ]]; then
  if [[ $DATABASE_URL =~ \? ]]; then
    DATABASE_URL="${DATABASE_URL}&pgbouncer=true"
  else
    DATABASE_URL="${DATABASE_URL}?pgbouncer=true"
  fi
  echo "✅ Added pgbouncer=true parameter"
fi

echo ""
echo "📝 Step 3: Configure Environment"
echo ""

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
  echo "Creating .env file..."
  cp .env.example .env
  echo "✅ Created .env from .env.example"
else
  echo "⚠️  .env already exists, will update DATABASE_URL"
fi

# Update DATABASE_URL in .env
if grep -q "^DATABASE_URL=" .env; then
  # Replace existing DATABASE_URL
  sed -i.bak "s|^DATABASE_URL=.*|DATABASE_URL=\"$DATABASE_URL\"|" .env
  rm .env.bak
  echo "✅ Updated DATABASE_URL in .env"
else
  # Add DATABASE_URL if not present
  echo "" >> .env
  echo "DATABASE_URL=\"$DATABASE_URL\"" >> .env
  echo "✅ Added DATABASE_URL to .env"
fi

echo ""
echo "📝 Step 4: Install Dependencies"
echo ""

if ! command -v pnpm &> /dev/null; then
  echo "❌ Error: pnpm not found"
  echo "   Install: npm install -g pnpm"
  exit 1
fi

echo "Installing packages..."
pnpm install --silent

echo ""
echo "📝 Step 5: Run Database Migrations"
echo ""

cd packages/database

echo "Generating Prisma client..."
pnpm prisma generate

echo "Running migrations..."
pnpm prisma migrate deploy

echo "Seeding database with Voidborne story..."
pnpm prisma db seed

cd ../..

echo ""
echo "✅ Supabase Setup Complete!"
echo "=============================="
echo ""
echo "📊 Verify in Supabase Dashboard:"
echo "   - Go to Table Editor"
echo "   - Check 'Story' table → should see Voidborne story"
echo "   - Check 'Chapter' table → should see Chapter 1: Succession"
echo ""
echo "🧪 Test Local API:"
echo "   cd apps/web"
echo "   pnpm dev"
echo "   # In another terminal:"
echo "   curl http://localhost:3000/api/stories"
echo ""
echo "🚀 Deploy to Vercel:"
echo "   1. vercel --prod"
echo "   2. Add DATABASE_URL env var in Vercel dashboard"
echo "   3. Redeploy"
echo ""
echo "📖 Full guide: See SUPABASE_SETUP.md"
echo ""
