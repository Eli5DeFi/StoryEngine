#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

clear
echo -e "${CYAN}"
cat << "EOF"
██╗   ██╗ ██████╗ ██╗██████╗ ██████╗  ██████╗ ██████╗ ███╗   ██╗███████╗
██║   ██║██╔═══██╗██║██╔══██╗██╔══██╗██╔═══██╗██╔══██╗████╗  ██║██╔════╝
██║   ██║██║   ██║██║██║  ██║██████╔╝██║   ██║██████╔╝██╔██╗ ██║█████╗  
╚██╗ ██╔╝██║   ██║██║██║  ██║██╔══██╗██║   ██║██╔══██╗██║╚██╗██║██╔══╝  
 ╚████╔╝ ╚██████╔╝██║██████╔╝██████╔╝╚██████╔╝██║  ██║██║ ╚████║███████╗
  ╚═══╝   ╚═════╝ ╚═╝╚═════╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝
EOF
echo -e "${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Production Setup Wizard${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if running from project root
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Run this script from project root${NC}"
    exit 1
fi

echo -e "${YELLOW}This wizard will help you:${NC}"
echo "  1. Set up production database (Railway/Supabase/Neon)"
echo "  2. Deploy contracts to Base mainnet"
echo "  3. Verify contracts on Basescan"
echo "  4. Deploy frontend to Vercel"
echo "  5. Launch \$FORGE token"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Step 1: Production Database${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "Choose your database provider:"
echo "  1) Railway  ($5/mo, easiest)"
echo "  2) Supabase (Free tier, 500MB)"
echo "  3) Neon     (Free tier, 0.5GB)"
echo "  4) Skip     (Already set up)"
echo ""
read -p "Enter choice (1-4): " db_choice

if [ "$db_choice" != "4" ]; then
    echo ""
    echo "Setup instructions for your chosen provider:"
    echo ""
    
    case $db_choice in
        1)
            echo -e "${CYAN}Railway Setup:${NC}"
            echo "  1. Visit: https://railway.app"
            echo "  2. Sign up with GitHub"
            echo "  3. Click 'New Project' → 'Provision PostgreSQL'"
            echo "  4. Copy DATABASE_URL from Variables tab"
            ;;
        2)
            echo -e "${CYAN}Supabase Setup:${NC}"
            echo "  1. Visit: https://supabase.com"
            echo "  2. Sign up with GitHub"
            echo "  3. Create new project (choose region)"
            echo "  4. Go to Project Settings → Database"
            echo "  5. Copy Connection string (use Pooler mode)"
            ;;
        3)
            echo -e "${CYAN}Neon Setup:${NC}"
            echo "  1. Visit: https://neon.tech"
            echo "  2. Sign up with GitHub"
            echo "  3. Create new project"
            echo "  4. Copy connection string from dashboard"
            ;;
    esac
    
    echo ""
    read -p "Paste your DATABASE_URL: " db_url
    
    if [ -z "$db_url" ]; then
        echo -e "${RED}Error: DATABASE_URL cannot be empty${NC}"
        exit 1
    fi
    
    # Create .env.production
    echo "DATABASE_URL=\"$db_url\"" > .env.production
    echo "NODE_ENV=production" >> .env.production
    echo -e "${GREEN}✓ Database URL saved to .env.production${NC}"
    
    # Run migrations
    echo ""
    echo "Running database migrations..."
    cd packages/database
    export DATABASE_URL="$db_url"
    pnpm prisma migrate deploy
    pnpm prisma db seed
    cd ../..
    echo -e "${GREEN}✓ Database migrated and seeded${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Step 2: Contract Verification${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "Do you want to verify contracts on Basescan?"
echo "(Makes source code public and enables Read/Write tabs)"
echo ""
read -p "Verify contracts? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Get your Basescan API key:"
    echo "  1. Visit: https://basescan.org/myapikey"
    echo "  2. Sign in / Create account"
    echo "  3. Create new API key"
    echo ""
    read -p "Paste your Basescan API key: " basescan_key
    
    if [ ! -z "$basescan_key" ]; then
        echo "BASESCAN_API_KEY=\"$basescan_key\"" >> packages/contracts/.env
        echo ""
        echo "Verifying contracts..."
        ./scripts/verify-contracts.sh
        echo -e "${GREEN}✓ Contracts verified${NC}"
    else
        echo -e "${YELLOW}⚠ Skipped verification${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Skipped verification${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Step 3: Deploy to Vercel${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "Deploy frontend to Vercel?"
read -p "Deploy? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if ! command -v vercel &> /dev/null; then
        echo "Installing Vercel CLI..."
        npm i -g vercel
    fi
    
    echo ""
    echo "Deploying to Vercel..."
    cd apps/web
    vercel --prod
    cd ../..
    echo -e "${GREEN}✓ Deployed to Vercel${NC}"
else
    echo -e "${YELLOW}⚠ Skipped Vercel deployment${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Step 4: Launch \$FORGE Token${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "Launch \$FORGE token for self-sustaining revenue?"
echo "(Trading fees fund AI compute)"
read -p "Launch token? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    read -p "Paste your Bankr API key: " bankr_key
    
    if [ ! -z "$bankr_key" ]; then
        echo "BANKR_API_KEY=\"$bankr_key\"" >> .env.production
        echo ""
        echo "Launching token..."
        ./scripts/launch-forge-token.sh
        echo -e "${GREEN}✓ Token launched${NC}"
    else
        echo -e "${YELLOW}⚠ Skipped token launch${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Skipped token launch${NC}"
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Setup Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${CYAN}Your Voidborne installation is ready.${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Test on staging environment"
echo "  2. Deploy contracts to Base mainnet"
echo "  3. Update contract addresses in production"
echo "  4. Announce launch 🚀"
echo ""
echo -e "${YELLOW}Need help? Check:${NC}"
echo "  - DEPLOYMENT.md"
echo "  - E2E_TESTING_GUIDE.md"
echo "  - PRODUCTION_DB_SETUP.md"
echo ""
