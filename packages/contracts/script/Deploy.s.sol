// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../src/ChapterBettingPool.sol";

/**
 * @title DeployScript
 * @notice Production deployment script for Base mainnet
 * 
 * Uses real USDC: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
 */
contract DeployScript is Script {
    // Base mainnet USDC address
    address constant USDC_BASE_MAINNET = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        // Load configuration from environment
        address treasury = vm.envAddress("TREASURY_ADDRESS");
        address operationalWallet = vm.envAddress("OPERATIONAL_WALLET");
        uint256 storyId = vm.envUint("STORY_ID");
        uint256 chapterId = vm.envUint("CHAPTER_ID");
        
        console.log("Deploying to Base mainnet with account:", deployer);
        console.log("Chain ID:", block.chainid);
        require(block.chainid == 8453, "Must deploy to Base mainnet (chain 8453)");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Configuration
        uint8 branchCount = 3; // 3 branches per chapter
        uint256 bettingDuration = 7 days; // 1 week betting window
        uint256 minBet = 10 * 1e6; // $10 USDC
        uint256 maxBet = 10_000 * 1e6; // $10,000 USDC
        
        // Branch hashes (load from env or config file in production)
        string[] memory branchHashes = new string[](3);
        branchHashes[0] = vm.envString("BRANCH_0_HASH");
        branchHashes[1] = vm.envString("BRANCH_1_HASH");
        branchHashes[2] = vm.envString("BRANCH_2_HASH");
        
        ChapterBettingPool bettingPool = new ChapterBettingPool(
            storyId,
            chapterId,
            USDC_BASE_MAINNET,
            treasury,
            operationalWallet,
            branchCount,
            bettingDuration,
            minBet,
            maxBet,
            branchHashes
        );
        
        console.log("ChapterBettingPool deployed to:", address(bettingPool));

        vm.stopBroadcast();

        // Log deployment info
        console.log("\n=== PRODUCTION Deployment Summary ===");
        console.log("Network: Base mainnet (chain 8453)");
        console.log("USDC Address:", USDC_BASE_MAINNET);
        console.log("ChapterBettingPool:", address(bettingPool));
        console.log("Treasury:", treasury);
        console.log("Operational Wallet:", operationalWallet);
        console.log("\n=== Pool Configuration ===");
        console.log("Story ID:", storyId);
        console.log("Chapter ID:", chapterId);
        console.log("Branch Count:", branchCount);
        console.log("Min Bet:", minBet / 1e6, "USDC");
        console.log("Max Bet:", maxBet / 1e6, "USDC");
        console.log("Betting Duration:", bettingDuration / 1 days, "days");
        console.log("\nAdd these to .env:");
        console.log("NEXT_PUBLIC_USDC_ADDRESS=%s", USDC_BASE_MAINNET);
        console.log("NEXT_PUBLIC_BETTING_POOL_ADDRESS=%s", address(bettingPool));
        
        console.log("\nWARNING:  IMPORTANT: Verify contract on Basescan!");
        console.log("forge verify-contract %s ChapterBettingPool --chain-id 8453", address(bettingPool));
    }
}
