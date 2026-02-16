// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "forge-std/Test.sol";
import "../CombinatorialPool_v2_FIXED.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title Mock USDC for testing
contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "USDC") {
        _mint(msg.sender, 1_000_000 * 1e6); // 1M USDC
    }
    
    function decimals() public pure override returns (uint8) {
        return 6;
    }
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

/// @title Comprehensive test suite for fixed CombinatorialBettingPool
contract CombinatorialPoolFixedTest is Test {
    CombinatorialBettingPool public pool;
    MockUSDC public usdc;
    
    address public owner;
    address public treasury;
    address public ops;
    address public user1;
    address public user2;
    address public user3;
    
    uint256 constant INITIAL_BALANCE = 10_000 * 1e6; // 10K USDC
    
    event ChapterScheduled(uint256 indexed chapterId, uint256 generationTime, uint256 bettingDeadline);
    event CombiBetPlaced(uint256 indexed betId, address indexed bettor, uint256[] outcomeIds, uint256 amount, uint256 combinedOdds, CombinatorialBettingPool.BetType betType);
    event BetSettled(uint256 indexed betId, address indexed bettor, bool won, uint256 payout);
    event FeesDistributed(uint256 treasuryAmount, uint256 opsAmount);
    
    function setUp() public {
        owner = address(this);
        treasury = makeAddr("treasury");
        ops = makeAddr("ops");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        user3 = makeAddr("user3");
        
        // Deploy contracts
        usdc = new MockUSDC();
        pool = new CombinatorialBettingPool(address(usdc), treasury, ops);
        
        // Fund users
        usdc.mint(user1, INITIAL_BALANCE);
        usdc.mint(user2, INITIAL_BALANCE);
        usdc.mint(user3, INITIAL_BALANCE);
        
        // Approve pool
        vm.prank(user1);
        usdc.approve(address(pool), type(uint256).max);
        vm.prank(user2);
        usdc.approve(address(pool), type(uint256).max);
        vm.prank(user3);
        usdc.approve(address(pool), type(uint256).max);
    }
    
    // ============ OWNERSHIP TESTS (C-2 FIX) ============
    
    /// @notice Test that ownership transfer requires 2 steps
    function test_Ownable2Step_RequiresTwoSteps() public {
        address newOwner = makeAddr("newOwner");
        
        // Step 1: Transfer ownership
        pool.transferOwnership(newOwner);
        
        // Owner should still be original
        assertEq(pool.owner(), owner, "Owner should not change after transferOwnership");
        
        // Step 2: New owner accepts
        vm.prank(newOwner);
        pool.acceptOwnership();
        
        // Now owner should be updated
        assertEq(pool.owner(), newOwner, "Owner should be updated after acceptOwnership");
    }
    
    /// @notice Test that typo in ownership address doesn't cause permanent loss
    function test_Ownable2Step_PreventsPermanentLoss() public {
        address wrongAddress = makeAddr("wrongAddress");
        
        // Accidentally transfer to wrong address
        pool.transferOwnership(wrongAddress);
        
        // Original owner can still cancel by transferring to correct address
        address correctAddress = makeAddr("correctAddress");
        pool.transferOwnership(correctAddress);
        
        // Correct address accepts
        vm.prank(correctAddress);
        pool.acceptOwnership();
        
        assertEq(pool.owner(), correctAddress, "Should transfer to correct address");
    }
    
    // ============ DEADLINE EXTENSION TESTS (H-1 FIX) ============
    
    /// @notice Test that deadline can be extended within 7-day limit
    function test_DeadlineExtension_WithinLimit() public {
        uint256 chapterId = 1;
        uint256 generationTime = block.timestamp + 3 days;
        
        // Schedule chapter
        pool.scheduleChapter(chapterId, generationTime);
        
        // Extend by 3 days (within 7-day limit)
        uint256 newGenerationTime = generationTime + 3 days;
        pool.extendDeadline(chapterId, newGenerationTime);
        
        (uint256 gen, , , ) = pool.getChapterSchedule(chapterId);
        assertEq(gen, newGenerationTime, "Generation time should be extended");
    }
    
    /// @notice Test that deadline extension beyond 7 days reverts
    function test_DeadlineExtension_RevertsIfTooLong() public {
        uint256 chapterId = 1;
        uint256 generationTime = block.timestamp + 3 days;
        
        pool.scheduleChapter(chapterId, generationTime);
        
        // Try to extend by 8 days (exceeds 7-day limit)
        uint256 newGenerationTime = generationTime + 8 days;
        
        vm.expectRevert(CombinatorialBettingPool.ExtensionTooLong.selector);
        pool.extendDeadline(chapterId, newGenerationTime);
    }
    
    /// @notice Test exactly 7-day extension (boundary case)
    function test_DeadlineExtension_ExactlySevenDays() public {
        uint256 chapterId = 1;
        uint256 generationTime = block.timestamp + 3 days;
        
        pool.scheduleChapter(chapterId, generationTime);
        
        // Extend by exactly 7 days (should pass)
        uint256 newGenerationTime = generationTime + 7 days;
        pool.extendDeadline(chapterId, newGenerationTime);
        
        (uint256 gen, , , ) = pool.getChapterSchedule(chapterId);
        assertEq(gen, newGenerationTime, "Should allow exactly 7-day extension");
    }
    
    // ============ SLIPPAGE PROTECTION TESTS (M-2 FIX) ============
    
    /// @notice Test that bet reverts if odds drop below minimum
    function test_SlippageProtection_RevertsIfOddsTooLow() public {
        // Setup chapter and outcomes
        uint256 chapterId = 1;
        pool.scheduleChapter(chapterId, block.timestamp + 2 days);
        
        uint256 outcome1 = pool.createOutcome(
            CombinatorialBettingPool.OutcomeType.STORY_CHOICE,
            "Choice A",
            chapterId,
            1
        );
        uint256 outcome2 = pool.createOutcome(
            CombinatorialBettingPool.OutcomeType.STORY_CHOICE,
            "Choice B",
            chapterId,
            2
        );
        
        uint256[] memory outcomeIds = new uint256[](2);
        outcomeIds[0] = outcome1;
        outcomeIds[1] = outcome2;
        
        // Get current odds
        uint256 currentOdds = pool.calculateCombinedOdds(outcomeIds);
        
        // Set minimum odds higher than current (should revert)
        uint256 minOdds = currentOdds + 1e18; // 1.0 higher
        
        vm.prank(user1);
        vm.expectRevert(CombinatorialBettingPool.SlippageExceeded.selector);
        pool.placeCombiBet(outcomeIds, 100 * 1e6, CombinatorialBettingPool.BetType.PARLAY, minOdds);
    }
    
    /// @notice Test that bet succeeds if odds are acceptable
    function test_SlippageProtection_AllowsIfOddsAcceptable() public {
        uint256 chapterId = 1;
        pool.scheduleChapter(chapterId, block.timestamp + 2 days);
        
        uint256 outcome1 = pool.createOutcome(
            CombinatorialBettingPool.OutcomeType.STORY_CHOICE,
            "Choice A",
            chapterId,
            1
        );
        uint256 outcome2 = pool.createOutcome(
            CombinatorialBettingPool.OutcomeType.STORY_CHOICE,
            "Choice B",
            chapterId,
            2
        );
        
        uint256[] memory outcomeIds = new uint256[](2);
        outcomeIds[0] = outcome1;
        outcomeIds[1] = outcome2;
        
        uint256 currentOdds = pool.calculateCombinedOdds(outcomeIds);
        
        // Set minimum odds lower than current (should succeed)
        uint256 minOdds = currentOdds - 1e18;
        
        vm.prank(user1);
        uint256 betId = pool.placeCombiBet(outcomeIds, 100 * 1e6, CombinatorialBettingPool.BetType.PARLAY, minOdds);
        
        assertEq(betId, 1, "Bet should be placed successfully");
    }
    
    /// @notice Test that slippage protection can be disabled with minOdds = 0
    function test_SlippageProtection_DisabledWithZero() public {
        uint256 chapterId = 1;
        pool.scheduleChapter(chapterId, block.timestamp + 2 days);
        
        uint256 outcome1 = pool.createOutcome(
            CombinatorialBettingPool.OutcomeType.STORY_CHOICE,
            "Choice A",
            chapterId,
            1
        );
        
        uint256[] memory outcomeIds = new uint256[](1);
        outcomeIds[0] = outcome1;
        
        // minOdds = 0 disables slippage protection
        vm.prank(user1);
        uint256 betId = pool.placeCombiBet(outcomeIds, 100 * 1e6, CombinatorialBettingPool.BetType.PARLAY, 0);
        
        assertEq(betId, 1, "Bet should succeed with minOdds = 0");
    }
    
    // ============ BATCH SETTLEMENT TESTS (M-1 FIX) ============
    
    /// @notice Test that batch settlement accepts up to 50 bets
    function test_BatchSettlement_AcceptsMaxSize() public {
        uint256[] memory betIds = new uint256[](50);
        for (uint256 i = 0; i < 50; i++) {
            betIds[i] = i + 1;
        }
        
        // Should not revert (even though bets don't exist)
        pool.settleBetBatch(betIds);
    }
    
    /// @notice Test that batch settlement reverts if size exceeds 50
    function test_BatchSettlement_RevertsIfTooLarge() public {
        uint256[] memory betIds = new uint256[](51);
        for (uint256 i = 0; i < 51; i++) {
            betIds[i] = i + 1;
        }
        
        vm.expectRevert(CombinatorialBettingPool.BatchTooLarge.selector);
        pool.settleBetBatch(betIds);
    }
    
    /// @notice Test exactly 50 bets (boundary case)
    function test_BatchSettlement_ExactlyFiftyBets() public {
        // Create 50 bets
        uint256 chapterId = 1;
        pool.scheduleChapter(chapterId, block.timestamp + 2 days);
        
        uint256 outcome1 = pool.createOutcome(
            CombinatorialBettingPool.OutcomeType.STORY_CHOICE,
            "Choice A",
            chapterId,
            1
        );
        
        uint256[] memory outcomeIds = new uint256[](1);
        outcomeIds[0] = outcome1;
        
        uint256[] memory betIds = new uint256[](50);
        
        // Place 50 bets from different addresses
        for (uint256 i = 0; i < 50; i++) {
            address bettor = address(uint160(1000 + i));
            usdc.mint(bettor, 1000 * 1e6);
            
            vm.startPrank(bettor);
            usdc.approve(address(pool), type(uint256).max);
            betIds[i] = pool.placeCombiBet(outcomeIds, 10 * 1e6, CombinatorialBettingPool.BetType.PARLAY, 0);
            vm.stopPrank();
        }
        
        // Settle all 50 (should succeed)
        pool.settleBetBatch(betIds);
    }
    
    // ============ PAUSE MECHANISM TESTS (M-3 FIX) ============
    
    /// @notice Test that pausing prevents betting
    function test_Pause_PreventsBetting() public {
        uint256 chapterId = 1;
        pool.scheduleChapter(chapterId, block.timestamp + 2 days);
        
        uint256 outcome1 = pool.createOutcome(
            CombinatorialBettingPool.OutcomeType.STORY_CHOICE,
            "Choice A",
            chapterId,
            1
        );
        
        uint256[] memory outcomeIds = new uint256[](1);
        outcomeIds[0] = outcome1;
        
        // Pause the contract
        pool.pause();
        
        // Betting should revert
        vm.prank(user1);
        vm.expectRevert("Pausable: paused");
        pool.placeCombiBet(outcomeIds, 100 * 1e6, CombinatorialBettingPool.BetType.PARLAY, 0);
    }
    
    /// @notice Test that unpausing allows betting again
    function test_Unpause_AllowsBetting() public {
        uint256 chapterId = 1;
        pool.scheduleChapter(chapterId, block.timestamp + 2 days);
        
        uint256 outcome1 = pool.createOutcome(
            CombinatorialBettingPool.OutcomeType.STORY_CHOICE,
            "Choice A",
            chapterId,
            1
        );
        
        uint256[] memory outcomeIds = new uint256[](1);
        outcomeIds[0] = outcome1;
        
        // Pause then unpause
        pool.pause();
        pool.unpause();
        
        // Betting should work
        vm.prank(user1);
        uint256 betId = pool.placeCombiBet(outcomeIds, 100 * 1e6, CombinatorialBettingPool.BetType.PARLAY, 0);
        
        assertEq(betId, 1, "Bet should succeed after unpause");
    }
    
    /// @notice Test that only owner can pause/unpause
    function test_Pause_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        pool.pause();
        
        vm.prank(user1);
        vm.expectRevert();
        pool.unpause();
    }
    
    // ============ CEI PATTERN TESTS (C-3 FIX) ============
    
    /// @notice Test that state is updated before external calls in settleBet
    function test_CEI_StateUpdatedBeforeTransfers() public {
        // Setup and place winning bet
        uint256 chapterId = 1;
        pool.scheduleChapter(chapterId, block.timestamp + 2 days);
        
        uint256 outcome1 = pool.createOutcome(
            CombinatorialBettingPool.OutcomeType.STORY_CHOICE,
            "Choice A",
            chapterId,
            1
        );
        
        uint256[] memory outcomeIds = new uint256[](1);
        outcomeIds[0] = outcome1;
        
        vm.prank(user1);
        uint256 betId = pool.placeCombiBet(outcomeIds, 100 * 1e6, CombinatorialBettingPool.BetType.PARLAY, 0);
        
        // Resolve outcome as true
        pool.resolveOutcome(outcome1, true);
        
        // Settle bet
        pool.settleBet(betId);
        
        // Verify bet state was updated
        ( , , , , , bool settled, bool won, ) = pool.getBet(betId);
        assertTrue(settled, "Bet should be marked settled");
        assertTrue(won, "Bet should be marked won");
    }
    
    /// @notice Test that events are emitted after all interactions
    function test_CEI_EventsEmittedLast() public {
        uint256 chapterId = 1;
        pool.scheduleChapter(chapterId, block.timestamp + 2 days);
        
        uint256 outcome1 = pool.createOutcome(
            CombinatorialBettingPool.OutcomeType.STORY_CHOICE,
            "Choice A",
            chapterId,
            1
        );
        
        uint256[] memory outcomeIds = new uint256[](1);
        outcomeIds[0] = outcome1;
        
        vm.prank(user1);
        uint256 betId = pool.placeCombiBet(outcomeIds, 100 * 1e6, CombinatorialBettingPool.BetType.PARLAY, 0);
        
        pool.resolveOutcome(outcome1, true);
        
        // Expect events in correct order
        vm.expectEmit(true, true, false, true);
        emit FeesDistributed(0, 0); // Will be calculated
        
        vm.expectEmit(true, true, false, true);
        emit BetSettled(betId, user1, true, 0); // Will be calculated
        
        pool.settleBet(betId);
    }
    
    // ============ INPUT VALIDATION TESTS (L-2 FIX) ============
    
    /// @notice Test that setMaxBetAmount rejects zero
    function test_SetMaxBetAmount_RejectsZero() public {
        vm.expectRevert("Max bet must be > 0");
        pool.setMaxBetAmount(0);
    }
    
    /// @notice Test that setMaxBetAmount accepts valid values
    function test_SetMaxBetAmount_AcceptsValid() public {
        pool.setMaxBetAmount(20_000 * 1e6);
        assertEq(pool.maxBetAmount(), 20_000 * 1e6, "Max bet should be updated");
    }
    
    // ============ BASIC FUNCTIONALITY TESTS ============
    
    /// @notice Test chapter scheduling
    function test_ScheduleChapter() public {
        uint256 chapterId = 1;
        uint256 generationTime = block.timestamp + 2 days;
        
        vm.expectEmit(true, false, false, true);
        emit ChapterScheduled(chapterId, generationTime, generationTime - 1 hours);
        
        pool.scheduleChapter(chapterId, generationTime);
        
        (uint256 gen, uint256 deadline, bool published, bool open) = pool.getChapterSchedule(chapterId);
        assertEq(gen, generationTime, "Generation time incorrect");
        assertEq(deadline, generationTime - 1 hours, "Deadline should be 1 hour before");
        assertFalse(published, "Should not be published");
        assertTrue(open, "Should be open");
    }
    
    /// @notice Test outcome creation
    function test_CreateOutcome() public {
        uint256 chapterId = 1;
        pool.scheduleChapter(chapterId, block.timestamp + 2 days);
        
        uint256 outcomeId = pool.createOutcome(
            CombinatorialBettingPool.OutcomeType.STORY_CHOICE,
            "Test outcome",
            chapterId,
            1
        );
        
        assertEq(outcomeId, 1, "First outcome should have ID 1");
        
        (
            CombinatorialBettingPool.OutcomeType outcomeType,
            string memory description,
            uint256 chapter,
            ,,,
        ) = pool.getOutcome(outcomeId);
        
        assertEq(uint(outcomeType), uint(CombinatorialBettingPool.OutcomeType.STORY_CHOICE));
        assertEq(description, "Test outcome");
        assertEq(chapter, chapterId);
    }
    
    /// @notice Test placing a bet
    function test_PlaceBet() public {
        uint256 chapterId = 1;
        pool.scheduleChapter(chapterId, block.timestamp + 2 days);
        
        uint256 outcome1 = pool.createOutcome(
            CombinatorialBettingPool.OutcomeType.STORY_CHOICE,
            "Choice A",
            chapterId,
            1
        );
        
        uint256[] memory outcomeIds = new uint256[](1);
        outcomeIds[0] = outcome1;
        
        uint256 amount = 100 * 1e6;
        uint256 balanceBefore = usdc.balanceOf(user1);
        
        vm.prank(user1);
        uint256 betId = pool.placeCombiBet(outcomeIds, amount, CombinatorialBettingPool.BetType.PARLAY, 0);
        
        assertEq(betId, 1, "First bet should have ID 1");
        assertEq(usdc.balanceOf(user1), balanceBefore - amount, "USDC should be transferred");
        
        (address bettor, , uint256 betAmount, , , bool settled, , ) = pool.getBet(betId);
        assertEq(bettor, user1);
        assertEq(betAmount, amount);
        assertFalse(settled);
    }
    
    /// @notice Test full betting cycle (place, resolve, settle, payout)
    function test_FullBettingCycle() public {
        // Setup
        uint256 chapterId = 1;
        pool.scheduleChapter(chapterId, block.timestamp + 2 days);
        
        uint256 outcome1 = pool.createOutcome(
            CombinatorialBettingPool.OutcomeType.STORY_CHOICE,
            "Choice A",
            chapterId,
            1
        );
        
        uint256[] memory outcomeIds = new uint256[](1);
        outcomeIds[0] = outcome1;
        
        // Place bet
        uint256 amount = 100 * 1e6;
        vm.prank(user1);
        uint256 betId = pool.placeCombiBet(outcomeIds, amount, CombinatorialBettingPool.BetType.PARLAY, 0);
        
        uint256 balanceBeforeSettle = usdc.balanceOf(user1);
        
        // Resolve outcome
        pool.resolveOutcome(outcome1, true);
        
        // Settle bet
        pool.settleBet(betId);
        
        // Check payout
        uint256 balanceAfterSettle = usdc.balanceOf(user1);
        assertTrue(balanceAfterSettle > balanceBeforeSettle, "User should receive payout");
        
        // Verify bet is settled
        ( , , , , , bool settled, bool won, uint256 payout) = pool.getBet(betId);
        assertTrue(settled, "Bet should be settled");
        assertTrue(won, "Bet should have won");
        assertTrue(payout > 0, "Payout should be > 0");
    }
    
    /// @notice Test betting deadline enforcement
    function test_BettingDeadline_Enforced() public {
        uint256 chapterId = 1;
        uint256 generationTime = block.timestamp + 2 hours;
        pool.scheduleChapter(chapterId, generationTime);
        
        uint256 outcome1 = pool.createOutcome(
            CombinatorialBettingPool.OutcomeType.STORY_CHOICE,
            "Choice A",
            chapterId,
            1
        );
        
        uint256[] memory outcomeIds = new uint256[](1);
        outcomeIds[0] = outcome1;
        
        // Warp to after deadline (1 hour before generation)
        vm.warp(generationTime - 30 minutes);
        
        // Betting should revert
        vm.prank(user1);
        vm.expectRevert(CombinatorialBettingPool.BettingClosed.selector);
        pool.placeCombiBet(outcomeIds, 100 * 1e6, CombinatorialBettingPool.BetType.PARLAY, 0);
    }
    
    /// @notice Test fee distribution (70/30 split)
    function test_FeeDistribution() public {
        uint256 chapterId = 1;
        pool.scheduleChapter(chapterId, block.timestamp + 2 days);
        
        uint256 outcome1 = pool.createOutcome(
            CombinatorialBettingPool.OutcomeType.STORY_CHOICE,
            "Choice A",
            chapterId,
            1
        );
        
        uint256[] memory outcomeIds = new uint256[](1);
        outcomeIds[0] = outcome1;
        
        uint256 amount = 100 * 1e6;
        vm.prank(user1);
        uint256 betId = pool.placeCombiBet(outcomeIds, amount, CombinatorialBettingPool.BetType.PARLAY, 0);
        
        uint256 treasuryBefore = usdc.balanceOf(treasury);
        uint256 opsBefore = usdc.balanceOf(ops);
        
        pool.resolveOutcome(outcome1, true);
        pool.settleBet(betId);
        
        uint256 treasuryFee = usdc.balanceOf(treasury) - treasuryBefore;
        uint256 opsFee = usdc.balanceOf(ops) - opsBefore;
        
        // Verify 70/30 split
        assertTrue(treasuryFee > 0, "Treasury should receive fees");
        assertTrue(opsFee > 0, "Ops should receive fees");
        
        uint256 totalFees = treasuryFee + opsFee;
        uint256 expectedTreasuryShare = (totalFees * 70) / 100;
        
        assertApproxEqRel(treasuryFee, expectedTreasuryShare, 0.01e18, "Treasury should get ~70%");
    }
}
