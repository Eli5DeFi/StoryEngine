#!/bin/bash

# Setup deployer wallet for NarrativeForge testnet deployment
set -e

echo "🔐 Setting up deployer wallet..."

# Use Bankr to create/get wallet
if command -v bankr &> /dev/null; then
    echo "📱 Checking Bankr wallet..."
    # This would ideally use Bankr CLI to get wallet info
    # For now, we'll use a secure method to generate a wallet
fi

# Generate new wallet using OpenSSL (secure random)
echo "🔑 Generating deployment wallet..."

# Option 1: Use existing Bankr wallet (recommended)
echo ""
echo "Option 1: Use Bankr to manage wallet (RECOMMENDED)"
echo "  - Run: bankr wallet create --name narrativeforge-deployer"
echo "  - Export private key and add to .env"
echo ""
echo "Option 2: Generate new wallet"
echo "  - Use: cast wallet new"
echo "  - Save private key securely"
echo ""
echo "⚠️  SECURITY: Never commit .env file!"
echo "⚠️  Add .env to .gitignore (already done)"

