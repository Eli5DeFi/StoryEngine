// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../CombinatorialPool_v2.sol";

contract DeployScript is Script {
    function run() external {
        // Load environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address treasury = vm.envAddress("TREASURY_ADDRESS");
        address opsWallet = vm.envAddress("OPS_WALLET_ADDRESS");
        address usdcAddress = vm.envAddress("USDC_ADDRESS");

        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        // Deploy CombinatorialBettingPool
        CombinatorialBettingPool pool = new CombinatorialBettingPool(
            usdcAddress,
            treasury,
            opsWallet
        );

        console.log("===========================================");
        console.log("CombinatorialBettingPool deployed to:");
        console.log(address(pool));
        console.log("===========================================");
        console.log("Constructor params:");
        console.log("- USDC:", usdcAddress);
        console.log("- Treasury:", treasury);
        console.log("- Ops Wallet:", opsWallet);
        console.log("===========================================");

        vm.stopBroadcast();

        // Verify configuration
        require(pool.treasury() == treasury, "Treasury mismatch");
        require(pool.operationalWallet() == opsWallet, "Ops wallet mismatch");
        require(address(pool.bettingToken()) == usdcAddress, "USDC mismatch");

        console.log("Deployment verified successfully!");
    }
}
