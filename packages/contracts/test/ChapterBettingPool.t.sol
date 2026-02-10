// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/ChapterBettingPool.sol";
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

contract ChapterBettingPoolTest is Test {
    ChapterBettingPool public pool;
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
        // Deploy mock USDC
        usdc = new MockUSDC();

        // Mint USDC to test users
        usdc.mint(alice, 10_000 * 10 ** 6);
        usdc.mint(bob, 10_000 * 10 ** 6);
        usdc.mint(charlie, 10_000 * 10 ** 6);

        // Setup branch hashes
        branchHashes = new string[](BRANCH_COUNT);
        branchHashes[0] = "QmBranchA123";
        branchHashes[1] = "QmBranchB456";
        branchHashes[2] = "QmBranchC789";

        // Deploy pool
        pool = new ChapterBettingPool(
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

    function testInitialState() public view {
        assertEq(pool.storyId(), STORY_ID);
        assertEq(pool.chapterId(), CHAPTER_ID);
        assertEq(pool.branchCount(), BRANCH_COUNT);
        assertEq(uint256(pool.state()), uint256(ChapterBettingPool.PoolState.OPEN));
        assertEq(pool.totalPoolAmount(), 0);
    }

    function testPlaceBet() public {
        uint256 betAmount = 100 * 10 ** 6; // 100 USDC

        vm.startPrank(alice);
        usdc.approve(address(pool), betAmount);
        pool.placeBet(0, betAmount, false);
        vm.stopPrank();

        assertEq(pool.totalPoolAmount(), betAmount);
        
        ChapterBettingPool.Bet[] memory aliceBets = pool.getUserBets(alice);
        assertEq(aliceBets.length, 1);
        assertEq(aliceBets[0].amount, betAmount);
        assertEq(aliceBets[0].branchIndex, 0);
    }

    function testMultipleBets() public {
        uint256 aliceBet = 100 * 10 ** 6;
        uint256 bobBet = 200 * 10 ** 6;
        uint256 charlieBet = 150 * 10 ** 6;

        // Alice bets on branch 0
        vm.startPrank(alice);
        usdc.approve(address(pool), aliceBet);
        pool.placeBet(0, aliceBet, false);
        vm.stopPrank();

        // Bob bets on branch 1
        vm.startPrank(bob);
        usdc.approve(address(pool), bobBet);
        pool.placeBet(1, bobBet, false);
        vm.stopPrank();

        // Charlie bets on branch 0 (same as Alice)
        vm.startPrank(charlie);
        usdc.approve(address(pool), charlieBet);
        pool.placeBet(0, charlieBet, false);
        vm.stopPrank();

        assertEq(pool.totalPoolAmount(), aliceBet + bobBet + charlieBet);
    }

    function testGetOdds() public {
        uint256 betA = 100 * 10 ** 6;
        uint256 betB = 200 * 10 ** 6;
        uint256 betC = 100 * 10 ** 6;

        vm.startPrank(alice);
        usdc.approve(address(pool), betA);
        pool.placeBet(0, betA, false);
        vm.stopPrank();

        vm.startPrank(bob);
        usdc.approve(address(pool), betB);
        pool.placeBet(1, betB, false);
        vm.stopPrank();

        vm.startPrank(charlie);
        usdc.approve(address(pool), betC);
        pool.placeBet(2, betC, false);
        vm.stopPrank();

        // Total pool = 400 USDC
        // Branch 0: 100 USDC (25%)
        // Branch 1: 200 USDC (50%)
        // Branch 2: 100 USDC (25%)

        assertEq(pool.getBranchOdds(0), 2500); // 25%
        assertEq(pool.getBranchOdds(1), 5000); // 50%
        assertEq(pool.getBranchOdds(2), 2500); // 25%
    }

    function testLockAndSettle() public {
        uint256 aliceBet = 100 * 10 ** 6;
        uint256 bobBet = 200 * 10 ** 6;

        // Place bets
        vm.startPrank(alice);
        usdc.approve(address(pool), aliceBet);
        pool.placeBet(0, aliceBet, false);
        vm.stopPrank();

        vm.startPrank(bob);
        usdc.approve(address(pool), bobBet);
        pool.placeBet(1, bobBet, false);
        vm.stopPrank();

        // Warp to after deadline
        vm.warp(block.timestamp + BETTING_DURATION + 1);

        // Lock pool
        pool.lockPool();
        assertEq(uint256(pool.state()), uint256(ChapterBettingPool.PoolState.LOCKED));

        // Settle pool (branch 0 wins)
        pool.settlePool(0);
        assertEq(uint256(pool.state()), uint256(ChapterBettingPool.PoolState.SETTLED));
        assertEq(pool.winningBranch(), 0);
    }

    function testClaimReward() public {
        uint256 aliceBet = 100 * 10 ** 6;
        uint256 bobBet = 200 * 10 ** 6;
        uint256 charlieBet = 100 * 10 ** 6;

        // Alice and Charlie bet on branch 0
        vm.startPrank(alice);
        usdc.approve(address(pool), aliceBet);
        pool.placeBet(0, aliceBet, false);
        vm.stopPrank();

        vm.startPrank(charlie);
        usdc.approve(address(pool), charlieBet);
        pool.placeBet(0, charlieBet, false);
        vm.stopPrank();

        // Bob bets on branch 1 (will lose)
        vm.startPrank(bob);
        usdc.approve(address(pool), bobBet);
        pool.placeBet(1, bobBet, false);
        vm.stopPrank();

        // Total pool: 400 USDC
        // Branch 0: 200 USDC (Alice 100, Charlie 100)
        // Branch 1: 200 USDC (Bob)

        // Lock and settle (branch 0 wins)
        vm.warp(block.timestamp + BETTING_DURATION + 1);
        pool.lockPool();
        pool.settlePool(0);

        // Check pending rewards
        uint256 alicePending = pool.getPendingReward(alice);
        uint256 charliePending = pool.getPendingReward(charlie);
        uint256 bobPending = pool.getPendingReward(bob);

        // Winner pool = 400 * 0.85 = 340 USDC
        // Alice gets: (100 / 200) * 340 = 170 USDC
        // Charlie gets: (100 / 200) * 340 = 170 USDC
        // Bob gets: 0 USDC

        assertEq(alicePending, 170 * 10 ** 6);
        assertEq(charliePending, 170 * 10 ** 6);
        assertEq(bobPending, 0);

        // Claim rewards
        uint256 aliceBalanceBefore = usdc.balanceOf(alice);
        vm.prank(alice);
        pool.claimReward();
        uint256 aliceBalanceAfter = usdc.balanceOf(alice);

        assertEq(aliceBalanceAfter - aliceBalanceBefore, 170 * 10 ** 6);
    }

    function testCannotBetAfterDeadline() public {
        vm.warp(block.timestamp + BETTING_DURATION + 1);

        vm.startPrank(alice);
        usdc.approve(address(pool), MIN_BET);
        
        vm.expectRevert("Betting closed");
        pool.placeBet(0, MIN_BET, false);
        vm.stopPrank();
    }

    function testCannotBetBelowMin() public {
        uint256 tooSmall = MIN_BET - 1;

        vm.startPrank(alice);
        usdc.approve(address(pool), tooSmall);
        
        vm.expectRevert("Bet out of range");
        pool.placeBet(0, tooSmall, false);
        vm.stopPrank();
    }

    function testCannotBetAboveMax() public {
        uint256 tooLarge = MAX_BET + 1;

        vm.startPrank(alice);
        usdc.approve(address(pool), tooLarge);
        
        vm.expectRevert("Bet out of range");
        pool.placeBet(0, tooLarge, false);
        vm.stopPrank();
    }

    function testCancelPool() public {
        uint256 aliceBet = 100 * 10 ** 6;

        vm.startPrank(alice);
        usdc.approve(address(pool), aliceBet);
        pool.placeBet(0, aliceBet, false);
        vm.stopPrank();

        uint256 aliceBalanceBefore = usdc.balanceOf(alice);
        
        // Cancel pool (emergency)
        pool.cancelPool();

        uint256 aliceBalanceAfter = usdc.balanceOf(alice);
        
        // Alice should get full refund
        assertEq(aliceBalanceAfter, aliceBalanceBefore + aliceBet);
        assertEq(uint256(pool.state()), uint256(ChapterBettingPool.PoolState.CANCELLED));
    }
}
