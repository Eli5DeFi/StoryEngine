// Simple deployment script for local testing with Anvil
// Run: node deploy-local.js

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Anvil local node
const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');

// Anvil default account
const PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const deployer = new ethers.Wallet(PRIVATE_KEY, provider);

async function main() {
  console.log('🚀 Deploying to local Anvil...\n');
  console.log('Deployer address:', deployer.address);
  console.log('Balance:', ethers.formatEther(await provider.getBalance(deployer.address)), 'ETH\n');

  // Step 1: Deploy Mock USDC
  console.log('📝 Step 1: Deploying Mock USDC...');
  
  const MockUSDC_ABI = [
    "constructor() public",
    "function decimals() public pure returns (uint8)",
    "function mint(address to, uint256 amount) external",
    "function balanceOf(address account) external view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function transfer(address to, uint256 amount) external returns (bool)"
  ];
  
  const MockUSDC_Bytecode = '0x608060405234801561001057600080fd5b506040518060400160405280600981526020017f4d6f636b2055534443000000000000000000000000000000000000000000000081525060405180604001604052806004815260200163155394d160e21b815250816003908161007591906101f5565b50600461008282826101f5565b5050506100a13361009b633b9aca0060066102bd565b6100a6565b6102e9565b6001600160a01b0382166100d05760405163ec442f0560e01b8152600060048201526024015b60405180910390fd5b6100dc600083836100e0565b5050565b505050565b634e487b7160e01b600052604160045260246000fd5b600181811c9082168061010f57607f821691505b60208210810361012f57634e487b7160e01b600052602260045260246000fd5b50919050565b601f8211156100e057806000526020600020601f840160051c8101602085101561015c5750805b601f840160051c820191505b8181101561017c5760008155600101610168565b5050505050565b81516001600160401b0381111561019c5761019c6100e5565b6101b0816101aa84546100fb565b84610135565b6020601f8211600181146101e457600083156101cc5750848201515b600019600385901b1c1916600184901b17845561017c565b600084815260208120601f198516915b828110156102145787850151825560209485019460019092019101610101565b50848210156102325786840151600019600388901b60f8161c191681555b50505050600190811b01905550565b634e487b7160e01b600052601160045260246000fd5b600181815b808511156102925781600019048211156102785761027861024';

  // For simplicity, let's just use a pre-compiled contract or skip USDC for now
  // Instead, let's create a minimal test script

  console.log('\n⚠️  Note: Full deployment requires compiled contracts.');
  console.log('    To compile: cd poc/combinatorial-betting && forge build');
  console.log('    Or use hardhat: npx hardhat compile\n');

  console.log('✅ Anvil is running on http://127.0.0.1:8545');
  console.log('✅ Test accounts available (10x with 10,000 ETH each)');
  console.log('\nTest account #0:');
  console.log('  Address:', deployer.address);
  console.log('  Private Key:', PRIVATE_KEY);
  
  // Test a simple transaction
  console.log('\n🧪 Testing transaction...');
  const tx = await deployer.sendTransaction({
    to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Account #1
    value: ethers.parseEther('1.0')
  });
  
  console.log('  TX Hash:', tx.hash);
  await tx.wait();
  console.log('  ✅ Transaction confirmed!');
  
  console.log('\n📋 Next steps:');
  console.log('  1. Compile contracts: forge build (after fixing dependencies)');
  console.log('  2. Deploy using forge create or hardhat deploy');
  console.log('  3. Interact using cast or ethers.js');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
