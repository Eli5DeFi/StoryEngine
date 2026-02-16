#!/bin/bash

# Voidborne Deployment Verification Script
# Tests critical routes and functionality after deployment

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOMAIN=${1:-"https://voidborne.vercel.app"}
TIMEOUT=10

echo "🔍 Verifying deployment at: $DOMAIN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Function to check HTTP status
check_route() {
    local route=$1
    local expected_status=${2:-200}
    local url="$DOMAIN$route"
    
    echo -n "Testing $route ... "
    
    status=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$url")
    
    if [ "$status" -eq "$expected_status" ]; then
        echo -e "${GREEN}✅ $status${NC}"
        return 0
    else
        echo -e "${RED}❌ $status (expected $expected_status)${NC}"
        return 1
    fi
}

# Function to check for specific content
check_content() {
    local route=$1
    local search_text=$2
    local url="$DOMAIN$route"
    
    echo -n "Checking content on $route ... "
    
    content=$(curl -s --max-time $TIMEOUT "$url")
    
    if echo "$content" | grep -q "$search_text"; then
        echo -e "${GREEN}✅ Found '$search_text'${NC}"
        return 0
    else
        echo -e "${RED}❌ Missing '$search_text'${NC}"
        return 1
    fi
}

# Track failures
FAILURES=0

echo ""
echo "📄 Testing Static Routes"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_route "/" || ((FAILURES++))
check_route "/about" || ((FAILURES++))
check_route "/faq" || ((FAILURES++))
check_route "/lore" || ((FAILURES++))
check_route "/lore/characters" || ((FAILURES++))
check_route "/lore/houses" || ((FAILURES++))
check_route "/lore/protocols" || ((FAILURES++))
check_route "/dashboard" || ((FAILURES++))
check_route "/leaderboards" || ((FAILURES++))
check_route "/my-bets" || ((FAILURES++))

echo ""
echo "🏛️ Testing Dynamic Routes"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_route "/lore/houses-dynamic" || ((FAILURES++))
check_route "/lore/houses-dynamic/valdris" || ((FAILURES++))
check_route "/lore/protocols-dynamic" || ((FAILURES++))
check_route "/lore/protocols-dynamic/geodesist" || ((FAILURES++))
check_route "/lore/characters/sera-valdris" || ((FAILURES++))
check_route "/story/1" || ((FAILURES++))

echo ""
echo "🔌 Testing API Routes"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_route "/api/lore/houses" || ((FAILURES++))
check_route "/api/lore/protocols" || ((FAILURES++))
check_route "/api/stories" || ((FAILURES++))

echo ""
echo "📝 Testing Content Integrity"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_content "/" "Voidborne" || ((FAILURES++))
check_content "/about" "About" || ((FAILURES++))
check_content "/faq" "FAQ" || ((FAILURES++))
check_content "/lore" "The Fracturing" || ((FAILURES++))

echo ""
echo "🔒 Testing Security Headers"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -n "Checking X-Content-Type-Options ... "
if curl -s -I --max-time $TIMEOUT "$DOMAIN/" | grep -q "x-content-type-options: nosniff"; then
    echo -e "${GREEN}✅ Present${NC}"
else
    echo -e "${YELLOW}⚠️  Missing${NC}"
    ((FAILURES++))
fi

echo -n "Checking X-Frame-Options ... "
if curl -s -I --max-time $TIMEOUT "$DOMAIN/" | grep -q "x-frame-options: DENY"; then
    echo -e "${GREEN}✅ Present${NC}"
else
    echo -e "${YELLOW}⚠️  Missing${NC}"
    ((FAILURES++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $FAILURES -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Deployment verified.${NC}"
    exit 0
else
    echo -e "${RED}❌ $FAILURES check(s) failed. Please investigate.${NC}"
    exit 1
fi
