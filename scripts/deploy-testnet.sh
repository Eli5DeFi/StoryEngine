#!/bin/bash
# Deploy to Base Sepolia Testnet

set -e

echo "🚀 Deploying to Base Sepolia Testnet"
echo "======================================"
echo ""

# Check required environment variables
if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ ERROR: PRIVATE_KEY not set"
    echo "   export PRIVATE_KEY='0x...'"
    exit 1
fi

echo "✅ Private key set"
echo "📍 Deployer address: $(cast wallet address $PRIVATE_KEY)"
echo ""

# Check balance
echo "💰 Checking ETH balance..."
BALANCE=$(cast balance $(cast wallet address $PRIVATE_KEY) --rpc-url base_sepolia)
echo "   Balance: $BALANCE wei"

if [ "$BALANCE" == "0" ]; then
    echo "❌ ERROR: No ETH balance"
    echo "   Get testnet ETH from: https://faucet.base.org/"
    exit 1
fi

echo "✅ Sufficient balance"
echo ""

# Deploy
echo "🔨 Deploying contracts..."
cd packages/contracts

forge script script/DeployTestnet.s.sol \
    --rpc-url base_sepolia \
    --broadcast \
    --verify \
    -vvvv

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "  1. Copy the contract addresses from above"
echo "  2. Add to .env:"
echo "     NEXT_PUBLIC_FORGE_TOKEN_ADDRESS=0x..."
echo "     NEXT_PUBLIC_BETTING_POOL_ADDRESS=0x..."
echo "  3. Test the app: cd apps/web && pnpm dev"
echo ""
