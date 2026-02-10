// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../src/ChapterBettingPool.sol";

/**
 * @title DeployTestnetScript
 * @notice Testnet deployment with mock $FORGE token
 * 
 * This script deploys a mock ERC20 token for testing purposes
 * Use this for Base Sepolia testnet
 */
contract DeployTestnetScript is Script {
    ChapterBettingPool public bettingPool;
    MockForgeToken public forgeToken;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying to testnet with account:", deployer);
        
        vm.startBroadcast(deployerPrivateKey);

        // Deploy mock $FORGE token
        forgeToken = new MockForgeToken();
        console.log("Mock FORGE token deployed to:", address(forgeToken));
        
        // Mint initial supply to deployer
        forgeToken.mint(deployer, 1_000_000 * 1e18); // 1M FORGE for testing
        
        // Deploy ChapterBettingPool
        bettingPool = new ChapterBettingPool(address(forgeToken));
        console.log("ChapterBettingPool deployed to:", address(bettingPool));

        vm.stopBroadcast();

        // Log deployment info
        console.log("\n=== Testnet Deployment Summary ===");
        console.log("Network:", block.chainid);
        console.log("Mock FORGE Token:", address(forgeToken));
        console.log("ChapterBettingPool:", address(bettingPool));
        console.log("Deployer balance:", forgeToken.balanceOf(deployer) / 1e18, "FORGE");
        console.log("\nAdd these to .env:");
        console.log("NEXT_PUBLIC_FORGE_TOKEN_ADDRESS=%s", address(forgeToken));
        console.log("NEXT_PUBLIC_BETTING_POOL_ADDRESS=%s", address(bettingPool));
    }
}

/**
 * @title MockForgeToken
 * @notice Mock ERC20 token for testnet deployment
 */
contract MockForgeToken {
    string public constant name = "NarrativeForge";
    string public constant symbol = "FORGE";
    uint8 public constant decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function mint(address to, uint256 amount) external {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}
