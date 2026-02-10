#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  NarrativeForge - Contract Verification${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Navigate to contracts directory
cd "$(dirname "$0")/../packages/contracts"

# Load environment variables
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found${NC}"
    echo "Please create .env with BASESCAN_API_KEY"
    exit 1
fi

source .env

if [ -z "$BASESCAN_API_KEY" ]; then
    echo -e "${RED}Error: BASESCAN_API_KEY not set in .env${NC}"
    echo "Get your API key from: https://basescan.org/myapikey"
    exit 1
fi

# Contract addresses (from deployment)
MOCK_USDC="0xe0761EFa93aB7dfc4d0042476C5dEA9b7B83E132"
BETTING_POOL="0xD4C57AC117670C8e1a8eDed3c05421d404488123"
DEPLOYER="0xEFc063544506823DD291e04E873ca40E0CF0Eb6B"

echo -e "${GREEN}Verifying contracts on Base Sepolia...${NC}"
echo ""

# Verify Mock USDC
echo -e "${BLUE}1. Verifying Mock USDC at ${MOCK_USDC}${NC}"
forge verify-contract \
    --chain-id 84532 \
    --num-of-optimizations 200 \
    --compiler-version "v0.8.23+commit.f704f362" \
    --constructor-args $(cast abi-encode "constructor()") \
    --etherscan-api-key "$BASESCAN_API_KEY" \
    "$MOCK_USDC" \
    src/MockUSDC.sol:MockUSDC \
    || echo -e "${RED}Mock USDC verification failed (may already be verified)${NC}"

echo ""

# Verify ChapterBettingPool
echo -e "${BLUE}2. Verifying ChapterBettingPool at ${BETTING_POOL}${NC}"

# Constructor arguments for ChapterBettingPool
# (address _usdcToken, uint256 _minBet, uint256 _maxBet)
CONSTRUCTOR_ARGS=$(cast abi-encode "constructor(address,uint256,uint256)" \
    "$MOCK_USDC" \
    "10000000" \
    "10000000000")

forge verify-contract \
    --chain-id 84532 \
    --num-of-optimizations 200 \
    --compiler-version "v0.8.23+commit.f704f362" \
    --constructor-args "$CONSTRUCTOR_ARGS" \
    --etherscan-api-key "$BASESCAN_API_KEY" \
    "$BETTING_POOL" \
    src/ChapterBettingPool.sol:ChapterBettingPool \
    || echo -e "${RED}ChapterBettingPool verification failed (may already be verified)${NC}"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Verification Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}View verified contracts:${NC}"
echo -e "  Mock USDC:        https://sepolia.basescan.org/address/${MOCK_USDC}#code"
echo -e "  ChapterBettingPool: https://sepolia.basescan.org/address/${BETTING_POOL}#code"
echo ""
echo -e "${GREEN}✓ You can now interact with contracts on Basescan UI${NC}"
echo -e "${GREEN}✓ Source code is publicly visible${NC}"
echo -e "${GREEN}✓ Read/Write functions available${NC}"
echo ""
