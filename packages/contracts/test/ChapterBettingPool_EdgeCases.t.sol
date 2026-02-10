// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Test.sol";
import "../src/ChapterBettingPool_v2.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Mock USDC for testing
contract MockUSDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {
        _mint(msg.sender, 1_000_000 * 10 ** 6); // 1M USDC
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }
}

/// @title Edge Case Tests for ChapterBettingPoolV2
/// @notice Tests critical bugs and edge cases
contract ChapterBettingPoolEdgeCasesTest is Test {
    ChapterBettingPoolV2 public pool;
    MockUSDC public usdc;

    address public owner = address(this);
    address public treasury = address(0x1);
    address public ops = address(0x2);
    address public alice = address(0x3);
    address public bob = address(0x4);
    address public charlie = address(0x5);

    uint256 public constant STORY_ID = 1;
    uint256 public constant CHAPTER_ID = 1;
    uint8 public constant BRANCH_COUNT = 3;
    uint256 public constant BETTING_DURATION = 1 days;
    uint256 public constant MIN_BET = 10 * 10 ** 6; // 10 USDC
    uint256 public constant MAX_BET = 1000 * 10 ** 6; // 1000 USDC

    string[] public branchHashes;

    function setUp() public {
        usdc = new MockUSDC();
        usdc.mint(alice, 10_000 * 10 ** 6);
        usdc.mint(bob, 10_000 * 10 ** 6);
        usdc.mint(charlie, 10_000 * 10 ** 6);

        branchHashes = new string[](BRANCH_COUNT);
        branchHashes[0] = "QmBranchA123";
        branchHashes[1] = "QmBranchB456";
        branchHashes[2] = "QmBranchC789";

        pool = new ChapterBettingPoolV2(
            STORY_ID,
            CHAPTER_ID,
            address(usdc),
            treasury,
            ops,
            BRANCH_COUNT,
            BETTING_DURATION,
            MIN_BET,
            MAX_BET,
            branchHashes
        );
    }

    // ============ CRITICAL BUG TESTS ============

    /// @notice Test settling with zero bets on winning branch (CRITICAL BUG)
    function testCannotSettleWithZeroWinnerBets() public {
        // Alice and Bob bet on branches 0 and 1
        vm.startPrank(alice);
        usdc.approve(address(pool), 100 * 10 ** 6);
        pool.placeBet(0, 100 * 10 ** 6, false);
        vm.stopPrank();

        vm.startPrank(bob);
        usdc.approve(address(pool), 200 * 10 ** 6);
        pool.placeBet(1, 200 * 10 ** 6, false);
        vm.stopPrank();

        // No one bet on branch 2
        vm.warp(block.timestamp + BETTING_DURATION + 1);
        pool.lockPool();

        // Try to settle with branch 2 as winner (zero bets)
        vm.expectRevert("No bets on winner");
        pool.settlePool(2);
    }

    /// @notice Test that v2 contract properly prevents division by zero
    function testV2FixesDivisionByZero() public {
        vm.startPrank(alice);
        usdc.approve(address(pool), 100 * 10 ** 6);
        pool.placeBet(0, 100 * 10 ** 6, false);
        vm.stopPrank();

        vm.warp(block.timestamp + BETTING_DURATION + 1);
        pool.lockPool();

        // This should revert instead of dividing by zero
        vm.expectRevert("No bets on winner");
        pool.settlePool(1); // Branch 1 has zero bets
    }

    // ============ ACCESS CONTROL TESTS ============

    /// @notice Only owner can lock pool
    function testOnlyOwnerCanLock() public {
        vm.warp(block.timestamp + BETTING_DURATION + 1);
        
        vm.prank(alice);
        vm.expectRevert();
        pool.lockPool();
    }

    /// @notice Only owner can settle pool
    function testOnlyOwnerCanSettle() public {
        vm.startPrank(alice);
        usdc.approve(address(pool), 100 * 10 ** 6);
        pool.placeBet(0, 100 * 10 ** 6, false);
        vm.stopPrank();

        vm.warp(block.timestamp + BETTING_DURATION + 1);
        pool.lockPool();

        vm.prank(bob);
        vm.expectRevert();
        pool.settlePool(0);
    }

    /// @notice Only owner can cancel pool
    function testOnlyOwnerCanCancel() public {
        vm.prank(charlie);
        vm.expectRevert();
        pool.cancelPool();
    }

    /// @notice Cannot cancel after lock (prevents rug pulls)
    function testCannotCancelAfterLock() public {
        vm.startPrank(alice);
        usdc.approve(address(pool), 100 * 10 ** 6);
        pool.placeBet(0, 100 * 10 ** 6, false);
        vm.stopPrank();

        vm.warp(block.timestamp + BETTING_DURATION + 1);
        pool.lockPool();

        // V2: Cannot cancel after lock
        vm.expectRevert("Can only cancel before lock");
        pool.cancelPool();
    }

    // ============ SETTLEMENT EDGE CASES ============

    /// @notice Cannot settle with invalid branch index
    function testCannotSettleInvalidBranch() public {
        vm.startPrank(alice);
        usdc.approve(address(pool), 100 * 10 ** 6);
        pool.placeBet(0, 100 * 10 ** 6, false);
        vm.stopPrank();

        vm.warp(block.timestamp + BETTING_DURATION + 1);
        pool.lockPool();

        vm.expectRevert("Invalid branch");
        pool.settlePool(99); // Out of bounds
    }

    /// @notice Cannot claim before settlement
    function testCannotClaimBeforeSettlement() public {
        vm.startPrank(alice);
        usdc.approve(address(pool), 100 * 10 ** 6);
        pool.placeBet(0, 100 * 10 ** 6, false);
        vm.stopPrank();

        vm.warp(block.timestamp + BETTING_DURATION + 1);
        pool.lockPool();

        // Try to claim before settle
        vm.prank(alice);
        vm.expectRevert("Not settled");
        pool.claimReward();
    }

    /// @notice Cannot claim twice
    function testCannotClaimTwice() public {
        vm.startPrank(alice);
        usdc.approve(address(pool), 100 * 10 ** 6);
        pool.placeBet(0, 100 * 10 ** 6, false);
        vm.stopPrank();

        vm.warp(block.timestamp + BETTING_DURATION + 1);
        pool.lockPool();
        pool.settlePool(0);

        // First claim succeeds
        vm.prank(alice);
        pool.claimReward();

        // Second claim fails
        vm.prank(alice);
        vm.expectRevert("No rewards");
        pool.claimReward();
    }

    /// @notice Losers get no rewards
    function testLosersGetNoRewards() public {
        vm.startPrank(alice);
        usdc.approve(address(pool), 100 * 10 ** 6);
        pool.placeBet(0, 100 * 10 ** 6, false);
        vm.stopPrank();

        vm.startPrank(bob);
        usdc.approve(address(pool), 200 * 10 ** 6);
        pool.placeBet(1, 200 * 10 ** 6, false);
        vm.stopPrank();

        vm.warp(block.timestamp + BETTING_DURATION + 1);
        pool.lockPool();
        pool.settlePool(0); // Alice wins

        // Bob (loser) tries to claim
        vm.prank(bob);
        vm.expectRevert("No rewards");
        pool.claimReward();
    }

    // ============ FEE CALCULATION TESTS ============

    /// @notice Fee split is exact (no dust left)
    function testFeeSplitExact() public {
        uint256 totalBet = 1000 * 10 ** 6; // 1000 USDC

        vm.startPrank(alice);
        usdc.approve(address(pool), totalBet);
        pool.placeBet(0, totalBet, false);
        vm.stopPrank();

        vm.warp(block.timestamp + BETTING_DURATION + 1);
        pool.lockPool();
        pool.settlePool(0);

        // Calculate expected amounts
        uint256 treasuryExpected = (totalBet * 1250) / 10000; // 12.5% = 125 USDC
        uint256 opsExpected = (totalBet * 250) / 10000; // 2.5% = 25 USDC
        uint256 winnerExpected = totalBet - treasuryExpected - opsExpected; // 85% = 850 USDC

        // Check balances
        assertEq(usdc.balanceOf(treasury), treasuryExpected);
        assertEq(usdc.balanceOf(ops), opsExpected);

        // Winner should get exact remaining amount
        vm.prank(alice);
        pool.claimReward();
        assertEq(usdc.balanceOf(alice), 10_000 * 10 ** 6 - totalBet + winnerExpected);

        // No dust left in contract
        assertEq(usdc.balanceOf(address(pool)), 0);
    }

    /// @notice Fee math works with odd amounts
    function testFeeSplitOddAmount() public {
        uint256 totalBet = 999 * 10 ** 6; // Odd amount

        vm.startPrank(alice);
        usdc.approve(address(pool), totalBet);
        pool.placeBet(0, totalBet, false);
        vm.stopPrank();

        vm.warp(block.timestamp + BETTING_DURATION + 1);
        pool.lockPool();
        pool.settlePool(0);

        uint256 contractBalanceBefore = usdc.balanceOf(address(pool));

        vm.prank(alice);
        pool.claimReward();

        // All funds distributed (no dust)
        assertEq(usdc.balanceOf(address(pool)), 0);
    }

    // ============ GAS OPTIMIZATION TESTS ============

    /// @notice Test gas usage is optimized (caching works)
    function testGasOptimizationCaching() public {
        // Place multiple bets from same user
        vm.startPrank(alice);
        usdc.approve(address(pool), 500 * 10 ** 6);
        pool.placeBet(0, 100 * 10 ** 6, false);
        pool.placeBet(0, 200 * 10 ** 6, false);
        pool.placeBet(0, 200 * 10 ** 6, false);
        vm.stopPrank();

        vm.warp(block.timestamp + BETTING_DURATION + 1);
        pool.lockPool();
        pool.settlePool(0);

        // Measure gas for claim (should be optimized)
        uint256 gasBefore = gasleft();
        vm.prank(alice);
        pool.claimReward();
        uint256 gasUsed = gasBefore - gasleft();

        // Gas should be reasonable (< 100k for 3 bets)
        assertLt(gasUsed, 100_000);
    }

    // ============ CONSTRUCTOR VALIDATION TESTS ============

    /// @notice Cannot deploy with invalid token address
    function testCannotDeployWithInvalidToken() public {
        vm.expectRevert("Invalid token");
        new ChapterBettingPoolV2(
            STORY_ID,
            CHAPTER_ID,
            address(0), // Invalid token
            treasury,
            ops,
            BRANCH_COUNT,
            BETTING_DURATION,
            MIN_BET,
            MAX_BET,
            branchHashes
        );
    }

    /// @notice Cannot deploy with minBet > maxBet
    function testCannotDeployWithInvalidBetRange() public {
        vm.expectRevert("Invalid bet range");
        new ChapterBettingPoolV2(
            STORY_ID,
            CHAPTER_ID,
            address(usdc),
            treasury,
            ops,
            BRANCH_COUNT,
            BETTING_DURATION,
            1000 * 10 ** 6, // min = 1000
            100 * 10 ** 6,  // max = 100 (min > max)
            branchHashes
        );
    }

    /// @notice Cannot deploy with zero duration
    function testCannotDeployWithZeroDuration() public {
        vm.expectRevert("Invalid duration");
        new ChapterBettingPoolV2(
            STORY_ID,
            CHAPTER_ID,
            address(usdc),
            treasury,
            ops,
            BRANCH_COUNT,
            0, // Zero duration
            MIN_BET,
            MAX_BET,
            branchHashes
        );
    }

    /// @notice Cannot deploy with duration > 30 days
    function testCannotDeployWithLongDuration() public {
        vm.expectRevert("Invalid duration");
        new ChapterBettingPoolV2(
            STORY_ID,
            CHAPTER_ID,
            address(usdc),
            treasury,
            ops,
            BRANCH_COUNT,
            31 days, // Too long
            MIN_BET,
            MAX_BET,
            branchHashes
        );
    }
}
