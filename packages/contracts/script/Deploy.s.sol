// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../src/ChapterBettingPool.sol";

/**
 * @title DeployScript
 * @notice Deployment script for NarrativeForge contracts
 * 
 * Usage:
 *   forge script script/Deploy.s.sol:DeployScript --rpc-url base_sepolia --broadcast --verify
 */
contract DeployScript is Script {
    // Deployment addresses will be logged
    ChapterBettingPool public bettingPool;

    function run() external {
        // Get deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Get $FORGE token address (must be set before deployment)
        address forgeToken = vm.envAddress("FORGE_TOKEN_ADDRESS");
        
        console.log("Deploying with account:", vm.addr(deployerPrivateKey));
        console.log("FORGE token address:", forgeToken);
        
        vm.startBroadcast(deployerPrivateKey);

        // Deploy ChapterBettingPool
        bettingPool = new ChapterBettingPool(forgeToken);
        
        console.log("ChapterBettingPool deployed to:", address(bettingPool));

        vm.stopBroadcast();

        // Log deployment info
        console.log("\n=== Deployment Summary ===");
        console.log("Network:", block.chainid);
        console.log("ChapterBettingPool:", address(bettingPool));
        console.log("FORGE Token:", forgeToken);
        console.log("\nAdd these to .env:");
        console.log("NEXT_PUBLIC_BETTING_POOL_ADDRESS=%s", address(bettingPool));
    }
}
