// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Test.sol";
import "../CombinatorialPool_v2.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Mock USDC token
contract MockUSDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {
        _mint(msg.sender, 1000000 * 10**6); // 1M USDC
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract CombinatorialPoolTest is Test {
    CombinatorialBettingPool public pool;
    MockUSDC public usdc;

    address public owner = address(this);
    address public treasury = address(0x1);
    address public opsWallet = address(0x2);
    address public user1 = address(0x3);
    address public user2 = address(0x4);

    uint256 constant BETTING_DEADLINE_BUFFER = 1 hours;

    function setUp() public {
        // Deploy mock USDC
        usdc = new MockUSDC();

        // Deploy betting pool
        pool = new CombinatorialBettingPool(
            address(usdc),
            treasury,
            opsWallet
        );

        // Fund users
        usdc.mint(user1, 10000 * 10**6); // 10K USDC
        usdc.mint(user2, 10000 * 10**6); // 10K USDC

        // Approve pool to spend user funds
        vm.prank(user1);
        usdc.approve(address(pool), type(uint256).max);

        vm.prank(user2);
        usdc.approve(address(pool), type(uint256).max);
    }

    // ============ CHAPTER SCHEDULING TESTS ============

    function testScheduleChapter() public {
        uint256 generationTime = block.timestamp + 2 hours;
        uint256 expectedDeadline = generationTime - BETTING_DEADLINE_BUFFER;

        vm.expectEmit(true, false, false, true);
        emit CombinatorialBettingPool.ChapterScheduled(1, generationTime, expectedDeadline);

        pool.scheduleChapter(1, generationTime);

        (
            uint256 genTime,
            uint256 deadline,
            bool published,
            bool bettingOpen
        ) = pool.getChapterSchedule(1);

        assertEq(genTime, generationTime);
        assertEq(deadline, expectedDeadline);
        assertFalse(published);
        assertTrue(bettingOpen);
    }

    function testCannotScheduleChapterInPast() public {
        uint256 pastTime = block.timestamp - 1 hours;

        vm.expectRevert("Must be future time");
        pool.scheduleChapter(1, pastTime);
    }

    function testCannotScheduleWithInvalidDeadline() public {
        // Generation time is only 30 minutes away (deadline would be in past)
        uint256 tooSoonTime = block.timestamp + 30 minutes;

        vm.expectRevert("Deadline must be in future");
        pool.scheduleChapter(1, tooSoonTime);
    }

    // ============ OUTCOME CREATION TESTS ============

    function testCreateOutcome() public {
        // Schedule chapter first
        uint256 generationTime = block.timestamp + 2 hours;
        pool.scheduleChapter(1, generationTime);

        uint256 outcomeId = pool.createOutcome(
            CombinatorialBettingPool.OutcomeType.STORY_CHOICE,
            "Regent allies with Valdris",
            1, // chapterId
            1  // choiceId
        );

        assertEq(outcomeId, 1);

        (
            CombinatorialBettingPool.OutcomeType outcomeType,
            string memory description,
            uint256 chapterId,
            CombinatorialBettingPool.OutcomeStatus status,
            ,
            ,
            uint256 bettingDeadline
        ) = pool.getOutcome(outcomeId);

        assertEq(uint8(outcomeType), uint8(CombinatorialBettingPool.OutcomeType.STORY_CHOICE));
        assertEq(description, "Regent allies with Valdris");
        assertEq(chapterId, 1);
        assertEq(uint8(status), uint8(CombinatorialBettingPool.OutcomeStatus.PENDING));
        assertEq(bettingDeadline, generationTime - BETTING_DEADLINE_BUFFER);
    }

    function testCannotCreateOutcomeWithoutSchedule() public {
        vm.expectRevert("Chapter not scheduled");
        pool.createOutcome(
            CombinatorialBettingPool.OutcomeType.STORY_CHOICE,
            "Some outcome",
            99, // unscheduled chapter
            1
        );
    }

    // ============ BETTING DEADLINE TESTS ============

    function testPlaceBetBeforeDeadline() public {
        // Schedule chapter (generation in 2 hours, deadline in 1 hour)
        uint256 generationTime = block.timestamp + 2 hours;
        pool.scheduleChapter(1, generationTime);

        // Create outcomes
        uint256 outcome1 = pool.createOutcome(
            CombinatorialBettingPool.OutcomeType.STORY_CHOICE,
            "Choice A",
            1,
            1
        );

        uint256 outcome2 = pool.createOutcome(
            CombinatorialBettingPool.OutcomeType.STORY_CHOICE,
            "Choice B",
            1,
            2
        );

        // Place bet 30 minutes before deadline (should succeed)
        vm.warp(block.timestamp + 30 minutes);

        vm.prank(user1);
        uint256 betId = pool.placeCombiBet(
            arrayOf2(outcome1, outcome2),
            100 * 10**6, // 100 USDC
            CombinatorialBettingPool.BetType.PARLAY
        );

        assertEq(betId, 1);
    }

    function testCannotPlaceBetAfterDeadline() public {
        // Schedule chapter
        uint256 generationTime = block.timestamp + 2 hours;
        pool.scheduleChapter(1, generationTime);

        // Create outcomes
        uint256 outcome1 = pool.createOutcome(
            CombinatorialBettingPool.OutcomeType.STORY_CHOICE,
            "Choice A",
            1,
            1
        );

        uint256 outcome2 = pool.createOutcome(
            CombinatorialBettingPool.OutcomeType.STORY_CHOICE,
            "Choice B",
            1,
            2
        );

        // Advance time past deadline
        vm.warp(block.timestamp + 1 hours + 1 minutes);

        // Try to place bet (should fail)
        vm.prank(user1);
        vm.expectRevert(CombinatorialBettingPool.BettingClosed.selector);
        pool.placeCombiBet(
            arrayOf2(outcome1, outcome2),
            100 * 10**6,
            CombinatorialBettingPool.BetType.PARLAY
        );
    }

    function testBettingOpenStatus() public {
        uint256 generationTime = block.timestamp + 2 hours;
        pool.scheduleChapter(1, generationTime);

        // Before deadline: betting should be open
        assertTrue(pool.isBettingOpen(1));

        // After deadline: betting should be closed
        vm.warp(block.timestamp + 1 hours + 1);
        assertFalse(pool.isBettingOpen(1));
    }

    function testGetTimeUntilDeadline() public {
        uint256 generationTime = block.timestamp + 2 hours;
        pool.scheduleChapter(1, generationTime);

        // Should return 1 hour (in seconds)
        uint256 timeRemaining = pool.getTimeUntilDeadline(1);
        assertEq(timeRemaining, 1 hours);

        // Advance 30 minutes
        vm.warp(block.timestamp + 30 minutes);
        timeRemaining = pool.getTimeUntilDeadline(1);
        assertEq(timeRemaining, 30 minutes);

        // After deadline: should return 0
        vm.warp(block.timestamp + 31 minutes);
        timeRemaining = pool.getTimeUntilDeadline(1);
        assertEq(timeRemaining, 0);
    }

    // ============ DEADLINE EXTENSION TESTS ============

    function testExtendDeadline() public {
        uint256 originalGenTime = block.timestamp + 2 hours;
        pool.scheduleChapter(1, originalGenTime);

        uint256 newGenTime = block.timestamp + 4 hours;

        vm.expectEmit(true, false, false, true);
        emit CombinatorialBettingPool.BettingDeadlineExtended(
            1,
            originalGenTime - BETTING_DEADLINE_BUFFER,
            newGenTime - BETTING_DEADLINE_BUFFER
        );

        pool.extendDeadline(1, newGenTime);

        (uint256 genTime, uint256 deadline,,) = pool.getChapterSchedule(1);
        assertEq(genTime, newGenTime);
        assertEq(deadline, newGenTime - BETTING_DEADLINE_BUFFER);
    }

    function testCannotShortenDeadline() public {
        uint256 originalGenTime = block.timestamp + 4 hours;
        pool.scheduleChapter(1, originalGenTime);

        uint256 shortenedTime = block.timestamp + 2 hours;

        vm.expectRevert("Must extend, not shorten");
        pool.extendDeadline(1, shortenedTime);
    }

    function testExtendDeadlineAllowsMoreBets() public {
        uint256 originalGenTime = block.timestamp + 2 hours;
        pool.scheduleChapter(1, originalGenTime);

        uint256 outcome1 = pool.createOutcome(
            CombinatorialBettingPool.OutcomeType.STORY_CHOICE,
            "Choice A",
            1,
            1
        );

        uint256 outcome2 = pool.createOutcome(
            CombinatorialBettingPool.OutcomeType.STORY_CHOICE,
            "Choice B",
            1,
            2
        );

        // Advance past original deadline
        vm.warp(block.timestamp + 1 hours + 1);

        // Betting should be closed
        assertFalse(pool.isBettingOpen(1));

        // Extend deadline
        uint256 newGenTime = block.timestamp + 2 hours;
        pool.extendDeadline(1, newGenTime);

        // Betting should now be open
        assertTrue(pool.isBettingOpen(1));

        // Should be able to place bet
        vm.prank(user1);
        pool.placeCombiBet(
            arrayOf2(outcome1, outcome2),
            100 * 10**6,
            CombinatorialBettingPool.BetType.PARLAY
        );
    }

    // ============ PUBLISH TESTS ============

    function testMarkChapterPublished() public {
        uint256 generationTime = block.timestamp + 2 hours;
        pool.scheduleChapter(1, generationTime);

        pool.markChapterPublished(1);

        (,,bool published,) = pool.getChapterSchedule(1);
        assertTrue(published);
    }

    function testCannotExtendPublishedChapter() public {
        uint256 generationTime = block.timestamp + 2 hours;
        pool.scheduleChapter(1, generationTime);

        pool.markChapterPublished(1);

        uint256 newGenTime = block.timestamp + 4 hours;
        vm.expectRevert("Chapter already published");
        pool.extendDeadline(1, newGenTime);
    }

    function testPublishedChapterClosedForBetting() public {
        uint256 generationTime = block.timestamp + 2 hours;
        pool.scheduleChapter(1, generationTime);

        pool.markChapterPublished(1);

        assertFalse(pool.isBettingOpen(1));
    }

    // ============ MULTI-CHAPTER COMBO TESTS ============

    function testComboBetAcrossMultipleChapters() public {
        // Schedule Chapter 1 (deadline in 1 hour)
        pool.scheduleChapter(1, block.timestamp + 2 hours);

        // Schedule Chapter 2 (deadline in 3 hours)
        pool.scheduleChapter(2, block.timestamp + 4 hours);

        // Create outcomes
        uint256 outcome1 = pool.createOutcome(
            CombinatorialBettingPool.OutcomeType.STORY_CHOICE,
            "Chapter 1 Choice A",
            1,
            1
        );

        uint256 outcome2 = pool.createOutcome(
            CombinatorialBettingPool.OutcomeType.STORY_CHOICE,
            "Chapter 2 Choice B",
            2,
            2
        );

        // Place combo bet (should succeed - both still open)
        vm.prank(user1);
        pool.placeCombiBet(
            arrayOf2(outcome1, outcome2),
            100 * 10**6,
            CombinatorialBettingPool.BetType.PARLAY
        );
    }

    function testComboBetFailsIfAnyChapterClosed() public {
        // Schedule chapters
        pool.scheduleChapter(1, block.timestamp + 2 hours);
        pool.scheduleChapter(2, block.timestamp + 4 hours);

        uint256 outcome1 = pool.createOutcome(
            CombinatorialBettingPool.OutcomeType.STORY_CHOICE,
            "Chapter 1 Choice",
            1,
            1
        );

        uint256 outcome2 = pool.createOutcome(
            CombinatorialBettingPool.OutcomeType.STORY_CHOICE,
            "Chapter 2 Choice",
            2,
            2
        );

        // Advance past Chapter 1 deadline
        vm.warp(block.timestamp + 1 hours + 1);

        // Chapter 1 closed, Chapter 2 still open
        assertFalse(pool.isBettingOpen(1));
        assertTrue(pool.isBettingOpen(2));

        // Combo bet should fail (Chapter 1 closed)
        vm.prank(user1);
        vm.expectRevert(CombinatorialBettingPool.BettingClosed.selector);
        pool.placeCombiBet(
            arrayOf2(outcome1, outcome2),
            100 * 10**6,
            CombinatorialBettingPool.BetType.PARLAY
        );
    }

    // ============ SETTLEMENT TESTS ============

    function testFullBettingLifecycle() public {
        // 1. Schedule chapter
        uint256 generationTime = block.timestamp + 2 hours;
        pool.scheduleChapter(1, generationTime);

        // 2. Create outcomes
        uint256 outcome1 = pool.createOutcome(
            CombinatorialBettingPool.OutcomeType.STORY_CHOICE,
            "Choice A",
            1,
            1
        );

        uint256 outcome2 = pool.createOutcome(
            CombinatorialBettingPool.OutcomeType.STORY_CHOICE,
            "Choice B",
            1,
            2
        );

        // 3. Place bet before deadline
        vm.prank(user1);
        uint256 betId = pool.placeCombiBet(
            arrayOf2(outcome1, outcome2),
            100 * 10**6,
            CombinatorialBettingPool.BetType.PARLAY
        );

        // 4. Advance past deadline (but before generation)
        vm.warp(block.timestamp + 1 hours + 30 minutes);

        // 5. Generate story (advance to generation time)
        vm.warp(generationTime);

        // 6. Resolve outcomes
        pool.resolveOutcome(outcome1, true);  // Choice A won
        pool.resolveOutcome(outcome2, false); // Choice B lost

        // 7. Mark published
        pool.markChapterPublished(1);

        // 8. Settle bet (should fail - not all outcomes true)
        pool.settleBet(betId);

        (,,,,,bool won,) = pool.getBet(betId);
        assertFalse(won); // Bet lost (not all outcomes true)
    }

    function testWinningBetPayout() public {
        // Schedule and create outcomes
        uint256 generationTime = block.timestamp + 2 hours;
        pool.scheduleChapter(1, generationTime);

        uint256 outcome1 = pool.createOutcome(
            CombinatorialBettingPool.OutcomeType.STORY_CHOICE,
            "Choice A",
            1,
            1
        );

        uint256 outcome2 = pool.createOutcome(
            CombinatorialBettingPool.OutcomeType.STORY_CHOICE,
            "Choice B",
            1,
            2
        );

        // Place bet
        uint256 betAmount = 100 * 10**6; // 100 USDC
        vm.prank(user1);
        uint256 betId = pool.placeCombiBet(
            arrayOf2(outcome1, outcome2),
            betAmount,
            CombinatorialBettingPool.BetType.PARLAY
        );

        // Get combined odds
        uint256 combinedOdds = pool.calculateCombinedOdds(arrayOf2(outcome1, outcome2));

        // Advance to generation time and resolve (both win)
        vm.warp(generationTime);
        pool.resolveOutcome(outcome1, true);
        pool.resolveOutcome(outcome2, true);

        // Settle bet
        uint256 user1BalanceBefore = usdc.balanceOf(user1);
        pool.settleBet(betId);
        uint256 user1BalanceAfter = usdc.balanceOf(user1);

        // Calculate expected payout
        uint256 grossPayout = (betAmount * combinedOdds) / 1e18;
        uint256 platformFee = (grossPayout * 500) / 10000; // 5%
        uint256 expectedPayout = grossPayout - platformFee;

        assertEq(user1BalanceAfter - user1BalanceBefore, expectedPayout);

        (,,,,,bool won, uint256 payout) = pool.getBet(betId);
        assertTrue(won);
        assertEq(payout, expectedPayout);
    }

    // ============ HELPERS ============

    function arrayOf2(uint256 a, uint256 b) internal pure returns (uint256[] memory) {
        uint256[] memory arr = new uint256[](2);
        arr[0] = a;
        arr[1] = b;
        return arr;
    }
}
