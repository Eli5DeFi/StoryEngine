// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Test.sol";
import "../src/influence/InfluenceToken.sol";

contract InfluenceTokenTest is Test {
    InfluenceToken public token;
    
    address public admin = address(1);
    address public minter = address(2);
    address public alice = address(3);
    address public bob = address(4);
    address public carol = address(5);
    
    function setUp() public {
        vm.startPrank(admin);
        token = new InfluenceToken();
        token.addMinter(minter);
        vm.stopPrank();
    }
    
    // ========================================================================
    // MINTING TESTS
    // ========================================================================
    
    function testMintInfluence() public {
        vm.prank(minter);
        token.mintInfluence(alice, 1000e18);
        
        assertEq(token.balanceOf(alice), 1000e18);
    }
    
    function testMintInfluenceWithStreak() public {
        // First win: no streak bonus
        vm.prank(minter);
        token.mintInfluence(alice, 1000e18);
        assertEq(token.balanceOf(alice), 1000e18);
        
        // Second win within 7 days: no bonus (streak = 1)
        vm.warp(block.timestamp + 1 days);
        vm.prank(minter);
        token.mintInfluence(alice, 1000e18);
        assertEq(token.balanceOf(alice), 2000e18);
        
        // Third win: 20% bonus (streak = 2)
        vm.warp(block.timestamp + 1 days);
        vm.prank(minter);
        token.mintInfluence(alice, 1000e18);
        assertEq(token.balanceOf(alice), 3200e18); // 2000 + 1200 (20% bonus)
        
        // Fourth win: 20% bonus (streak = 3)
        vm.warp(block.timestamp + 1 days);
        vm.prank(minter);
        token.mintInfluence(alice, 1000e18);
        assertEq(token.balanceOf(alice), 4400e18); // 3200 + 1200
        
        // Fifth win: 50% bonus (streak = 4)
        vm.warp(block.timestamp + 1 days);
        vm.prank(minter);
        token.mintInfluence(alice, 1000e18);
        assertEq(token.balanceOf(alice), 5900e18); // 4400 + 1500 (50% bonus)
    }
    
    function testStreakResets() public {
        // Win 1
        vm.prank(minter);
        token.mintInfluence(alice, 1000e18);
        
        // Wait 8 days (beyond streak window)
        vm.warp(block.timestamp + 8 days);
        
        // Win 2: streak resets
        vm.prank(minter);
        token.mintInfluence(alice, 1000e18);
        
        InfluenceToken.UserStats memory stats = token.getUserStats(alice);
        assertEq(stats.currentStreak, 1);
    }
    
    function testOnlyMinterCanMint() public {
        vm.prank(alice);
        vm.expectRevert();
        token.mintInfluence(bob, 1000e18);
    }
    
    // ========================================================================
    // VOTING TESTS
    // ========================================================================
    
    function testVoteWithInfluence() public {
        // Give Alice 1000 INFLUENCE
        vm.prank(minter);
        token.mintInfluence(alice, 1000e18);
        
        // Alice votes 500 INFLUENCE on choice 1
        vm.prank(alice);
        token.voteWithInfluence(1, 1, 500e18);
        
        // Check balance decreased
        assertEq(token.balanceOf(alice), 500e18);
        
        // Check vote recorded
        uint256 choiceInfluence = token.getChoiceInfluence(1, 1);
        assertEq(choiceInfluence, 500e18);
        
        // Check total influence
        uint256 totalInfluence = token.getTotalInfluence(1);
        assertEq(totalInfluence, 500e18);
    }
    
    function testMultipleVotersOnSameChoice() public {
        // Give Alice and Bob INFLUENCE
        vm.prank(minter);
        token.mintInfluence(alice, 1000e18);
        vm.prank(minter);
        token.mintInfluence(bob, 2000e18);
        
        // Both vote on choice 1
        vm.prank(alice);
        token.voteWithInfluence(1, 1, 500e18);
        
        vm.prank(bob);
        token.voteWithInfluence(1, 1, 1000e18);
        
        // Check total influence on choice 1
        uint256 choiceInfluence = token.getChoiceInfluence(1, 1);
        assertEq(choiceInfluence, 1500e18);
        
        // Check total pool influence
        uint256 totalInfluence = token.getTotalInfluence(1);
        assertEq(totalInfluence, 1500e18);
    }
    
    function testVotingAcrossMultipleChoices() public {
        // Give Alice and Bob INFLUENCE
        vm.prank(minter);
        token.mintInfluence(alice, 1000e18);
        vm.prank(minter);
        token.mintInfluence(bob, 1000e18);
        
        // Alice votes on choice 1, Bob votes on choice 2
        vm.prank(alice);
        token.voteWithInfluence(1, 1, 600e18);
        
        vm.prank(bob);
        token.voteWithInfluence(1, 2, 400e18);
        
        // Check individual choice influences
        assertEq(token.getChoiceInfluence(1, 1), 600e18);
        assertEq(token.getChoiceInfluence(1, 2), 400e18);
        
        // Check total pool influence
        assertEq(token.getTotalInfluence(1), 1000e18);
        
        // Check influence boosts
        assertEq(token.getInfluenceBoost(1, 1), 60); // 60%
        assertEq(token.getInfluenceBoost(1, 2), 40); // 40%
    }
    
    function testInfluenceBoostCalculation() public {
        // Give Alice 1000 INFLUENCE
        vm.prank(minter);
        token.mintInfluence(alice, 1000e18);
        
        // Alice votes 700 on choice 1, 300 on choice 2
        vm.prank(alice);
        token.voteWithInfluence(1, 1, 700e18);
        
        vm.prank(alice);
        token.voteWithInfluence(1, 2, 300e18);
        
        // Check boosts
        assertEq(token.getInfluenceBoost(1, 1), 70); // 70%
        assertEq(token.getInfluenceBoost(1, 2), 30); // 30%
    }
    
    function testCannotVoteWithoutBalance() public {
        vm.prank(alice);
        vm.expectRevert("Insufficient balance");
        token.voteWithInfluence(1, 1, 100e18);
    }
    
    function testCannotVoteBelowMinimum() public {
        vm.prank(minter);
        token.mintInfluence(alice, 1000e18);
        
        vm.prank(alice);
        vm.expectRevert("Amount below minimum");
        token.voteWithInfluence(1, 1, 0.5e18);
    }
    
    function testCannotVoteAboveMaximum() public {
        vm.prank(minter);
        token.mintInfluence(alice, 2_000_000e18);
        
        vm.prank(alice);
        vm.expectRevert("Amount above maximum");
        token.voteWithInfluence(1, 1, 1_500_000e18);
    }
    
    // ========================================================================
    // STATS TESTS
    // ========================================================================
    
    function testUserStatsTracking() public {
        // Mint to Alice
        vm.prank(minter);
        token.mintInfluence(alice, 1000e18);
        
        // Alice votes
        vm.prank(alice);
        token.voteWithInfluence(1, 1, 500e18);
        
        // Check stats
        InfluenceToken.UserStats memory stats = token.getUserStats(alice);
        assertEq(stats.totalEarned, 1000e18);
        assertEq(stats.totalSpent, 500e18);
        assertEq(stats.totalVotes, 1);
        assertEq(stats.currentStreak, 1);
    }
    
    function testLongestStreakTracking() public {
        // Win 10 times in a row
        for (uint256 i = 0; i < 10; i++) {
            vm.prank(minter);
            token.mintInfluence(alice, 1000e18);
            vm.warp(block.timestamp + 1 days);
        }
        
        InfluenceToken.UserStats memory stats = token.getUserStats(alice);
        assertEq(stats.currentStreak, 10);
        assertEq(stats.longestStreak, 10);
        
        // Break streak
        vm.warp(block.timestamp + 8 days);
        vm.prank(minter);
        token.mintInfluence(alice, 1000e18);
        
        stats = token.getUserStats(alice);
        assertEq(stats.currentStreak, 1);
        assertEq(stats.longestStreak, 10); // Longest streak preserved
    }
    
    // ========================================================================
    // VOTE HISTORY TESTS
    // ========================================================================
    
    function testVoteHistoryRecording() public {
        // Give Alice INFLUENCE
        vm.prank(minter);
        token.mintInfluence(alice, 1000e18);
        
        // Alice votes twice
        vm.prank(alice);
        token.voteWithInfluence(1, 1, 300e18);
        
        vm.prank(alice);
        token.voteWithInfluence(2, 2, 200e18);
        
        // Check vote history
        uint256[] memory voteIndices = token.getUserVotes(alice);
        assertEq(voteIndices.length, 2);
        
        // Check first vote
        InfluenceToken.Vote memory vote1 = token.getVote(voteIndices[0]);
        assertEq(vote1.poolId, 1);
        assertEq(vote1.choiceId, 1);
        assertEq(vote1.amount, 300e18);
        assertEq(vote1.voter, alice);
        
        // Check second vote
        InfluenceToken.Vote memory vote2 = token.getVote(voteIndices[1]);
        assertEq(vote2.poolId, 2);
        assertEq(vote2.choiceId, 2);
        assertEq(vote2.amount, 200e18);
        assertEq(vote2.voter, bob);
    }
    
    function testTotalVotesCount() public {
        // Give Alice and Bob INFLUENCE
        vm.prank(minter);
        token.mintInfluence(alice, 1000e18);
        vm.prank(minter);
        token.mintInfluence(bob, 1000e18);
        
        // Both vote
        vm.prank(alice);
        token.voteWithInfluence(1, 1, 500e18);
        
        vm.prank(bob);
        token.voteWithInfluence(1, 2, 500e18);
        
        // Check total votes
        assertEq(token.getTotalVotes(), 2);
    }
    
    // ========================================================================
    // ADMIN TESTS
    // ========================================================================
    
    function testAddMinter() public {
        address newMinter = address(6);
        
        vm.prank(admin);
        token.addMinter(newMinter);
        
        // New minter can mint
        vm.prank(newMinter);
        token.mintInfluence(alice, 1000e18);
        
        assertEq(token.balanceOf(alice), 1000e18);
    }
    
    function testRemoveMinter() public {
        vm.prank(admin);
        token.removeMinter(minter);
        
        // Minter can no longer mint
        vm.prank(minter);
        vm.expectRevert();
        token.mintInfluence(alice, 1000e18);
    }
    
    function testOnlyAdminCanAddMinter() public {
        vm.prank(alice);
        vm.expectRevert();
        token.addMinter(address(6));
    }
}
