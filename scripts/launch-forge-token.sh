#!/bin/bash
# Launch $FORGE token using Bankr

set -e

echo "🪙 Launching $FORGE Token via Bankr"
echo "====================================="
echo ""

# Check if openclaw is installed
if ! command -v openclaw &> /dev/null; then
    echo "❌ ERROR: OpenClaw CLI not installed"
    echo "   Install from: https://openclaw.ai"
    exit 1
fi

echo "✅ OpenClaw CLI found"
echo ""

# Check if Bankr skill is installed
if ! openclaw skills list | grep -q "bankr"; then
    echo "❌ ERROR: Bankr skill not installed"
    echo "   Installing Bankr skill..."
    cd ~/.openclaw/skills && git clone https://github.com/BankrBot/openclaw-skills bankr
fi

echo "✅ Bankr skill installed"
echo ""

# Launch on testnet
echo "🚀 Launching $FORGE on Base Sepolia testnet..."
echo ""
echo "This will use the Bankr skill to:"
echo "  1. Deploy ERC-20 token contract"
echo "  2. Set up initial parameters"
echo "  3. Return the token address"
echo ""
echo "Please run this command in OpenClaw:"
echo ""
echo "  launch a token named NarrativeForge with symbol FORGE on base testnet with 1 billion supply"
echo ""
echo "After deployment, add the token address to .env:"
echo "  NEXT_PUBLIC_FORGE_TOKEN_ADDRESS=0x..."
echo ""
echo "Then add liquidity:"
echo ""
echo "  add liquidity for token 0x[TOKEN_ADDRESS] on base testnet with 0.5 ETH and 100000 FORGE"
echo ""
