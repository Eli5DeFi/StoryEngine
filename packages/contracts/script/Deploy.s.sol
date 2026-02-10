// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/ChapterBettingPool.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address treasury = vm.envAddress("TREASURY_ADDRESS");
        address operationalWallet = vm.envAddress("OPERATIONAL_WALLET_ADDRESS");
        address usdcAddress = vm.envAddress("NEXT_PUBLIC_USDC_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        // Example deployment for Story 1, Chapter 1
        string[] memory branchHashes = new string[](3);
        branchHashes[0] = "QmExampleBranchA";
        branchHashes[1] = "QmExampleBranchB";
        branchHashes[2] = "QmExampleBranchC";

        ChapterBettingPool pool = new ChapterBettingPool(
            1, // storyId
            1, // chapterId
            usdcAddress, // USDC on Base
            treasury,
            operationalWallet,
            3, // 3 branches
            86400, // 24 hour betting window
            1 * 10 ** 6, // min 1 USDC
            1000 * 10 ** 6, // max 1000 USDC
            branchHashes
        );

        console.log("ChapterBettingPool deployed at:", address(pool));

        vm.stopBroadcast();
    }
}
