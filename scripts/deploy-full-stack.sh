#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Voidborne - Full Stack Deployment${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check environment
if [ ! -f .env.production ]; then
    echo -e "${RED}Error: .env.production not found${NC}"
    echo "Create .env.production with:"
    echo "  DATABASE_URL=..."
    echo "  NEXT_PUBLIC_CHAIN_ID=8453"
    echo "  NEXT_PUBLIC_USDC_ADDRESS=..."
    echo "  NEXT_PUBLIC_BETTING_POOL_ADDRESS=..."
    exit 1
fi

# Load production environment
source .env.production

echo -e "${YELLOW}📋 Pre-flight Checklist${NC}"
echo ""

# Check database connection
echo -n "Database connection... "
if pnpm --filter @voidborne/database prisma db pull --force > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo "Fix: Check DATABASE_URL in .env.production"
    exit 1
fi

# Check if contracts are deployed
echo -n "Contracts deployed... "
if [ -z "$NEXT_PUBLIC_BETTING_POOL_ADDRESS" ]; then
    echo -e "${YELLOW}⚠${NC}"
    echo "Warning: NEXT_PUBLIC_BETTING_POOL_ADDRESS not set"
else
    echo -e "${GREEN}✓${NC}"
fi

# Check Vercel CLI
echo -n "Vercel CLI installed... "
if command -v vercel &> /dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⚠${NC}"
    echo "Install: npm i -g vercel"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Step 1: Database Migration${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd packages/database

echo "Running migrations..."
pnpm prisma migrate deploy

echo "Seeding database..."
pnpm prisma db seed

echo -e "${GREEN}✓ Database ready${NC}"
echo ""

cd ../..

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Step 2: Build Frontend${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd apps/web

echo "Installing dependencies..."
pnpm install

echo "Building production bundle..."
NODE_ENV=production pnpm build

echo -e "${GREEN}✓ Frontend built${NC}"
echo ""

cd ../..

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Step 3: Deploy to Vercel (Optional)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if command -v vercel &> /dev/null; then
    echo "Deploy to Vercel?"
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Deploying..."
        cd apps/web
        vercel --prod
        cd ../..
        echo -e "${GREEN}✓ Deployed to Vercel${NC}"
    else
        echo "Skipped Vercel deployment"
    fi
else
    echo -e "${YELLOW}Skipped: Vercel CLI not installed${NC}"
    echo "Install: npm i -g vercel"
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Test on staging: vercel --prod"
echo "  2. Deploy contracts to mainnet"
echo "  3. Update contract addresses in .env.production"
echo "  4. Redeploy frontend"
echo ""
