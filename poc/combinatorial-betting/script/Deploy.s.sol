// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {Script, console} from "forge-std/Script.sol";
import {CombinatorialBettingPool} from "../src/CombinatorialPool_v2_FIXED.sol";

contract DeployPool is Script {
    function run() external {
        address usdc = 0x5FbDB2315678afecb367f032d93F642f64180aa3;
        address treasury = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
        address ops = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
        
        vm.startBroadcast();
        
        CombinatorialBettingPool pool = new CombinatorialBettingPool(
            usdc,
            treasury,
            ops
        );
        
        vm.stopBroadcast();
        
        console.log("CombinatorialBettingPool deployed to:", address(pool));
    }
}
