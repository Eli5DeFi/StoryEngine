// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Test.sol";
import "../src/CharacterMemoryNFT.sol";

/**
 * Basic tests for CharacterMemoryNFT
 * Tests core functionality: minting, stats updates, badges
 */
contract CharacterMemoryNFTBasicTest is Test {
    CharacterMemoryNFT public nft;
    
    address public owner = address(1);
    address public updater = address(2);
    address public user1 = address(3);
    address public user2 = address(4);
    
    string constant BASE_URI = "ipfs://QmTest/";
    
    function setUp() public {
        vm.startPrank(owner);
        nft = new CharacterMemoryNFT("Voidborne Character", "VOIDCHAR", BASE_URI);
        nft.setAuthorizedUpdater(updater, true);
        vm.stopPrank();
    }
    
    function testMintFirstNFT() public {
        vm.startPrank(updater);
        
        uint256 tokenId = nft.mint(user1);
        
        assertEq(tokenId, 1, "First token should be ID 1");
        assertEq(nft.ownerOf(tokenId), user1, "User1 should own token");
        assertEq(nft.walletToTokenId(user1), tokenId, "Wallet mapping should be set");
        
        vm.stopPrank();
    }
    
    function testCannotMintTwice() public {
        vm.startPrank(updater);
        
        nft.mint(user1);
        
        vm.expectRevert(CharacterMemoryNFT.AlreadyMinted.selector);
        nft.mint(user1);
        
        vm.stopPrank();
    }
    
    function testOnlyAuthorizedCanMint() public {
        vm.startPrank(user1);
        
        vm.expectRevert(CharacterMemoryNFT.Unauthorized.selector);
        nft.mint(user2);
        
        vm.stopPrank();
    }
    
    function testUpdateStatsWinning() public {
        vm.startPrank(updater);
        
        uint256 tokenId = nft.mint(user1);
        
        // Simulate winning bet: $25 bet, $50 payout
        uint128 betAmount = 25_000000; // 25 USDC (6 decimals)
        uint128 payout = 50_000000;    // 50 USDC
        
        nft.updateStats(tokenId, betAmount, true, payout);
        
        vm.stopPrank();
    }
    
    function testUpdateStatsLosing() public {
        vm.startPrank(updater);
        
        uint256 tokenId = nft.mint(user1);
        
        // Simulate losing bet: $25 bet, $0 payout
        uint128 betAmount = 25_000000;
        
        nft.updateStats(tokenId, betAmount, false, 0);
        
        vm.stopPrank();
    }
    
    function testAwardBadge() public {
        vm.startPrank(updater);
        
        uint256 tokenId = nft.mint(user1);
        
        bytes32 badgeId = keccak256("First Bet");
        string memory chapterId = "chapter-1";
        
        nft.awardBadge(tokenId, badgeId, chapterId, 0); // Common rarity
        
        vm.stopPrank();
    }
    
    function testCannotAwardDuplicateBadge() public {
        vm.startPrank(updater);
        
        uint256 tokenId = nft.mint(user1);
        
        bytes32 badgeId = keccak256("First Bet");
        
        nft.awardBadge(tokenId, badgeId, "chapter-1", 0); // Common
        
        vm.expectRevert(CharacterMemoryNFT.BadgeAlreadyEarned.selector);
        nft.awardBadge(tokenId, badgeId, "chapter-2", 1); // Rare
        
        vm.stopPrank();
    }
    
    function testCannotTransfer() public {
        vm.startPrank(updater);
        uint256 tokenId = nft.mint(user1);
        vm.stopPrank();
        
        vm.startPrank(user1);
        
        vm.expectRevert(CharacterMemoryNFT.SoulBoundToken.selector);
        nft.transferFrom(user1, user2, tokenId);
        
        vm.stopPrank();
    }
    
    function testCanBurn() public {
        vm.startPrank(updater);
        uint256 tokenId = nft.mint(user1);
        vm.stopPrank();
        
        vm.startPrank(user1);
        
        nft.burn(tokenId);
        
        // Token should no longer exist
        vm.expectRevert();
        nft.ownerOf(tokenId);
        
        // Wallet mapping should be cleared
        assertEq(nft.walletToTokenId(user1), 0, "Wallet mapping should be cleared");
        
        vm.stopPrank();
    }
    
    function testOnlyAuthorizedCanUpdate() public {
        vm.startPrank(updater);
        uint256 tokenId = nft.mint(user1);
        vm.stopPrank();
        
        vm.startPrank(user1);
        
        vm.expectRevert(CharacterMemoryNFT.Unauthorized.selector);
        nft.updateStats(tokenId, 10_000000, true, 20_000000);
        
        vm.expectRevert(CharacterMemoryNFT.Unauthorized.selector);
        nft.awardBadge(tokenId, keccak256("Test"), "chapter-1", 0);
        
        vm.stopPrank();
    }
    
    function testGetTokenByWallet() public {
        vm.startPrank(updater);
        
        uint256 tokenId = nft.mint(user1);
        
        uint256 retrievedTokenId = nft.getTokenByWallet(user1);
        assertEq(retrievedTokenId, tokenId, "Should retrieve correct token ID");
        
        vm.stopPrank();
    }
}
