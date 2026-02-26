#!/bin/bash

# Deploy Narrative Liquidity Pool (NLP) Contract
# Innovation Cycle #46 - Programmable Story Economy
# Author: Voidborne Team

set -e

echo "🌊 Deploying Narrative Liquidity Pool (NLP)..."
echo ""

# Check if we're on the right network
read -p "Deploy to (local/testnet/mainnet)? " NETWORK

case $NETWORK in
  local)
    RPC_URL="http://localhost:8545"
    USDC_ADDRESS="0x5FbDB2315678afecb367f032d93F642f64180aa3" # MockUSDC (deploy first)
    TREASURY_ADDRESS="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" # Anvil default
    echo "📍 Deploying to LOCAL (Anvil)..."
    ;;
  testnet)
    RPC_URL="https://sepolia.base.org"
    USDC_ADDRESS="0x036CbD53842c5426634e7929541eC2318f3dCF7e" # Base Sepolia USDC
    read -p "Treasury address: " TREASURY_ADDRESS
    echo "📍 Deploying to TESTNET (Base Sepolia)..."
    ;;
  mainnet)
    RPC_URL="https://mainnet.base.org"
    USDC_ADDRESS="0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" # Base Mainnet USDC
    read -p "Treasury address: " TREASURY_ADDRESS
    echo "📍 Deploying to MAINNET (Base)..."
    echo "⚠️  WARNING: This will cost real gas! Proceed with caution."
    read -p "Type 'DEPLOY' to confirm: " CONFIRM
    if [ "$CONFIRM" != "DEPLOY" ]; then
      echo "❌ Deployment cancelled."
      exit 1
    fi
    ;;
  *)
    echo "❌ Invalid network selection"
    exit 1
    ;;
esac

echo ""
echo "Configuration:"
echo "  RPC URL: $RPC_URL"
echo "  USDC Address: $USDC_ADDRESS"
echo "  Treasury Address: $TREASURY_ADDRESS"
echo ""

# Read deployer private key
if [ -z "$DEPLOYER_PRIVATE_KEY" ]; then
  read -sp "Deployer private key: " DEPLOYER_PRIVATE_KEY
  echo ""
fi

# Navigate to POC directory
cd "$(dirname "$0")/../poc/narrative-liquidity-pool"

echo "🔨 Compiling contract..."
forge build

echo ""
echo "🚀 Deploying NarrativeLiquidityPool..."

# Deploy contract
DEPLOYMENT=$(forge create NarrativeLiquidityPool \
  --constructor-args "$USDC_ADDRESS" "$TREASURY_ADDRESS" \
  --rpc-url "$RPC_URL" \
  --private-key "$DEPLOYER_PRIVATE_KEY" \
  --json)

# Extract contract address
CONTRACT_ADDRESS=$(echo $DEPLOYMENT | jq -r '.deployedTo')

if [ -z "$CONTRACT_ADDRESS" ] || [ "$CONTRACT_ADDRESS" = "null" ]; then
  echo "❌ Deployment failed!"
  exit 1
fi

echo ""
echo "✅ NarrativeLiquidityPool deployed!"
echo ""
echo "📋 Contract Address: $CONTRACT_ADDRESS"
echo ""

# Save deployment info
DEPLOY_INFO_FILE="../../memory/nlp-deployment-$(date +%Y%m%d-%H%M%S).json"
cat > "$DEPLOY_INFO_FILE" <<EOF
{
  "network": "$NETWORK",
  "rpcUrl": "$RPC_URL",
  "contractAddress": "$CONTRACT_ADDRESS",
  "usdcAddress": "$USDC_ADDRESS",
  "treasuryAddress": "$TREASURY_ADDRESS",
  "deployedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "deployer": "$(cast wallet address --private-key "$DEPLOYER_PRIVATE_KEY")"
}
EOF

echo "💾 Deployment info saved to: $DEPLOY_INFO_FILE"
echo ""

# Update .env file
ENV_FILE="../../apps/web/.env"
if [ -f "$ENV_FILE" ]; then
  # Backup existing .env
  cp "$ENV_FILE" "${ENV_FILE}.backup"
  
  # Add or update NLP contract address
  if grep -q "NEXT_PUBLIC_NLP_CONTRACT_ADDRESS=" "$ENV_FILE"; then
    # Update existing
    sed -i '' "s|NEXT_PUBLIC_NLP_CONTRACT_ADDRESS=.*|NEXT_PUBLIC_NLP_CONTRACT_ADDRESS=$CONTRACT_ADDRESS|g" "$ENV_FILE"
  else
    # Add new
    echo "NEXT_PUBLIC_NLP_CONTRACT_ADDRESS=$CONTRACT_ADDRESS" >> "$ENV_FILE"
  fi
  
  echo "✅ Updated $ENV_FILE with contract address"
  echo ""
fi

# Verify contract (testnet/mainnet only)
if [ "$NETWORK" != "local" ]; then
  echo "🔍 Verifying contract on Basescan..."
  
  forge verify-contract \
    "$CONTRACT_ADDRESS" \
    NarrativeLiquidityPool \
    --constructor-args $(cast abi-encode "constructor(address,address)" "$USDC_ADDRESS" "$TREASURY_ADDRESS") \
    --rpc-url "$RPC_URL" \
    --etherscan-api-key "$BASESCAN_API_KEY" || echo "⚠️  Verification failed (may need manual verification)"
  
  echo ""
fi

# Next steps
echo "🎉 Deployment complete!"
echo ""
echo "Next steps:"
echo "  1. Update frontend: Contract address is in .env"
echo "  2. Test on frontend: npm run dev"
if [ "$NETWORK" = "local" ]; then
  echo "  3. Set betting deadline: cast send $CONTRACT_ADDRESS 'setBettingDeadline(uint256,uint256)' 15 \$(date -d '+24 hours' +%s) --rpc-url $RPC_URL --private-key $DEPLOYER_PRIVATE_KEY"
else
  echo "  3. Set betting deadline via owner wallet"
  echo "  4. Add initial liquidity (bootstrap pools)"
  echo "  5. Announce on Discord/Twitter"
fi
echo ""
echo "📖 View on Basescan: https://$([ "$NETWORK" = "mainnet" ] && echo "basescan.org" || echo "sepolia.basescan.org")/address/$CONTRACT_ADDRESS"
echo ""
