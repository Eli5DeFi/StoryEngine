// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../src/ChapterBettingPool.sol";

/**
 * @title DeployTestnetScript
 * @notice Testnet deployment with mock USDC token
 * 
 * For Base Sepolia testnet, we deploy a mock USDC token
 * For Base mainnet, use real USDC: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
 */
contract DeployTestnetScript is Script {
    ChapterBettingPool public bettingPool;
    MockUSDC public mockUsdc;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying to testnet with account:", deployer);
        console.log("Chain ID:", block.chainid);
        
        vm.startBroadcast(deployerPrivateKey);

        // Deploy mock USDC token (Base Sepolia doesn't have native USDC)
        mockUsdc = new MockUSDC();
        console.log("Mock USDC deployed to:", address(mockUsdc));
        
        // Mint initial supply to deployer for testing
        mockUsdc.mint(deployer, 1_000_000 * 1e6); // 1M USDC (6 decimals)
        console.log("Minted 1M USDC to deployer");
        
        // Example: Deploy a betting pool for Story #1, Chapter #1
        uint256 storyId = 1;
        uint256 chapterId = 1;
        address treasury = deployer; // Use deployer as treasury for testing
        address operationalWallet = deployer; // Use deployer as ops wallet
        uint8 branchCount = 3; // 3 branches
        uint256 bettingDuration = 7 days; // 1 week betting window
        uint256 minBet = 10 * 1e6; // $10 USDC
        uint256 maxBet = 10_000 * 1e6; // $10,000 USDC
        
        // Branch hashes (IPFS CIDs of branch content)
        string[] memory branchHashes = new string[](3);
        branchHashes[0] = "QmExampleBranch1Hash";
        branchHashes[1] = "QmExampleBranch2Hash";
        branchHashes[2] = "QmExampleBranch3Hash";
        
        bettingPool = new ChapterBettingPool(
            storyId,
            chapterId,
            address(mockUsdc), // USDC address
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
        console.log("\n=== Testnet Deployment Summary ===");
        console.log("Network:", block.chainid);
        console.log("Mock USDC:", address(mockUsdc));
        console.log("ChapterBettingPool:", address(bettingPool));
        console.log("Deployer USDC balance:", mockUsdc.balanceOf(deployer) / 1e6, "USDC");
        console.log("\n=== Pool Configuration ===");
        console.log("Story ID:", storyId);
        console.log("Chapter ID:", chapterId);
        console.log("Branch Count:", branchCount);
        console.log("Min Bet:", minBet / 1e6, "USDC");
        console.log("Max Bet:", maxBet / 1e6, "USDC");
        console.log("Betting Duration:", bettingDuration / 1 days, "days");
        console.log("\nAdd these to .env:");
        console.log("NEXT_PUBLIC_USDC_ADDRESS=%s", address(mockUsdc));
        console.log("NEXT_PUBLIC_BETTING_POOL_ADDRESS=%s", address(bettingPool));
    }
}

/**
 * @title MockUSDC
 * @notice Mock USDC token for testnet deployment (6 decimals like real USDC)
 */
contract MockUSDC {
    string public constant name = "USD Coin";
    string public constant symbol = "USDC";
    uint8 public constant decimals = 6; // Real USDC uses 6 decimals
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
        if (allowance[from][msg.sender] != type(uint256).max) {
            allowance[from][msg.sender] -= amount;
        }
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}
