// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {Test, console} from "forge-std/Test.sol";
import {CharacterSBT} from "../src/CharacterSBT.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract CharacterSBTTest is Test {
    CharacterSBT public sbt;
    MockERC20 public usdc;
    
    address public owner = address(1);
    address public treasury = address(2);
    address public alice = address(3);
    address public bob = address(4);
    address public carol = address(5);
    
    uint256 constant MINT_PRICE = 0.05 ether;
    uint256 constant MAX_SUPPLY = 100;
    
    event CharacterCreated(uint256 indexed characterId, string name, uint256 maxSupply, uint256 mintPrice);
    event CharacterMinted(address indexed holder, uint256 indexed characterId, uint256 tokenId, uint256 price);
    event RevenueDistributed(uint256 indexed characterId, uint256 indexed chapterId, uint256 amount, uint256 holderCount);
    event EarningsClaimed(address indexed holder, uint256 indexed characterId, uint256 amount);
    event CharacterLevelUp(uint256 indexed characterId, uint256 newLevel, uint256 xp);
    event XPGained(uint256 indexed characterId, uint256 xpAmount, uint256 totalXP);
    
    function setUp() public {
        // Deploy mock USDC
        usdc = new MockERC20("USDC", "USDC", 6);
        
        // Deploy Character SBT
        vm.prank(owner);
        sbt = new CharacterSBT(address(usdc), treasury);
        
        // Fund test accounts with ETH
        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
        vm.deal(carol, 10 ether);
        
        // Fund owner with USDC for revenue distribution
        usdc.mint(owner, 1_000_000e6); // 1M USDC
        
        // Approve SBT contract to spend owner's USDC
        vm.prank(owner);
        usdc.approve(address(sbt), type(uint256).max);
    }
    
    /*//////////////////////////////////////////////////////////////
                        CREATE CHARACTER TESTS
    //////////////////////////////////////////////////////////////*/
    
    function testCreateCharacter() public {
        vm.prank(owner);
        
        vm.expectEmit(true, true, true, true);
        emit CharacterCreated(1, "Commander Zara", MAX_SUPPLY, MINT_PRICE);
        
        uint256 charId = sbt.createCharacter(
            "Commander Zara",
            "ipfs://QmCharacterZara",
            MAX_SUPPLY,
            MINT_PRICE
        );
        
        assertEq(charId, 1, "First character should have ID 1");
        
        CharacterSBT.Character memory char = sbt.getCharacter(1);
        assertEq(char.name, "Commander Zara");
        assertEq(char.metadataURI, "ipfs://QmCharacterZara");
        assertEq(char.maxSupply, MAX_SUPPLY);
        assertEq(char.mintPrice, MINT_PRICE);
        assertEq(char.totalSupply, 0);
        assertEq(char.level, 1);
        assertEq(char.xp, 0);
        assertTrue(char.mintingOpen);
        assertTrue(char.isAlive);
    }
    
    function testOnlyOwnerCanCreateCharacter() public {
        vm.prank(alice);
        vm.expectRevert();
        sbt.createCharacter("Hacker", "ipfs://hack", 100, MINT_PRICE);
    }
    
    function testCreateMultipleCharacters() public {
        vm.startPrank(owner);
        
        uint256 char1 = sbt.createCharacter("Zara", "ipfs://zara", 100, 0.05 ether);
        uint256 char2 = sbt.createCharacter("Kael", "ipfs://kael", 50, 0.1 ether);
        uint256 char3 = sbt.createCharacter("Mira", "ipfs://mira", 200, 0.03 ether);
        
        vm.stopPrank();
        
        assertEq(char1, 1);
        assertEq(char2, 2);
        assertEq(char3, 3);
        assertEq(sbt.getTotalCharacters(), 3);
    }
    
    /*//////////////////////////////////////////////////////////////
                        MINT CHARACTER TESTS
    //////////////////////////////////////////////////////////////*/
    
    function testMintCharacter() public {
        // Create character
        vm.prank(owner);
        uint256 charId = sbt.createCharacter("Zara", "ipfs://zara", MAX_SUPPLY, MINT_PRICE);
        
        // Mint
        vm.prank(alice);
        vm.expectEmit(true, true, true, true);
        emit CharacterMinted(alice, charId, 1, MINT_PRICE);
        
        sbt.mintCharacter{value: MINT_PRICE}(charId);
        
        // Verify state
        assertTrue(sbt.hasCharacter(charId, alice));
        assertEq(sbt.ownerOf(1), alice);
        assertEq(sbt.tokenIdToCharacterId(1), charId);
        
        CharacterSBT.Character memory char = sbt.getCharacter(charId);
        assertEq(char.totalSupply, 1);
        
        // Verify user's character list
        uint256[] memory userChars = sbt.getUserCharacters(alice);
        assertEq(userChars.length, 1);
        assertEq(userChars[0], charId);
    }
    
    function testMintMultipleCharacters() public {
        // Create 3 characters
        vm.startPrank(owner);
        uint256 char1 = sbt.createCharacter("Zara", "ipfs://1", 100, MINT_PRICE);
        uint256 char2 = sbt.createCharacter("Kael", "ipfs://2", 100, MINT_PRICE);
        uint256 char3 = sbt.createCharacter("Mira", "ipfs://3", 100, MINT_PRICE);
        vm.stopPrank();
        
        // Alice mints all 3
        vm.startPrank(alice);
        sbt.mintCharacter{value: MINT_PRICE}(char1);
        sbt.mintCharacter{value: MINT_PRICE}(char2);
        sbt.mintCharacter{value: MINT_PRICE}(char3);
        vm.stopPrank();
        
        // Verify
        uint256[] memory userChars = sbt.getUserCharacters(alice);
        assertEq(userChars.length, 3);
        assertTrue(sbt.hasCharacter(char1, alice));
        assertTrue(sbt.hasCharacter(char2, alice));
        assertTrue(sbt.hasCharacter(char3, alice));
    }
    
    function testCannotMintTwice() public {
        vm.prank(owner);
        uint256 charId = sbt.createCharacter("Zara", "ipfs://zara", MAX_SUPPLY, MINT_PRICE);
        
        vm.startPrank(alice);
        sbt.mintCharacter{value: MINT_PRICE}(charId);
        
        vm.expectRevert(CharacterSBT.AlreadyOwnsCharacter.selector);
        sbt.mintCharacter{value: MINT_PRICE}(charId);
        vm.stopPrank();
    }
    
    function testCannotMintWithInsufficientPayment() public {
        vm.prank(owner);
        uint256 charId = sbt.createCharacter("Zara", "ipfs://zara", MAX_SUPPLY, MINT_PRICE);
        
        vm.prank(alice);
        vm.expectRevert(CharacterSBT.InsufficientPayment.selector);
        sbt.mintCharacter{value: 0.01 ether}(charId);
    }
    
    function testMintRefundsOverpayment() public {
        vm.prank(owner);
        uint256 charId = sbt.createCharacter("Zara", "ipfs://zara", MAX_SUPPLY, MINT_PRICE);
        
        uint256 balanceBefore = alice.balance;
        uint256 overpayment = 0.1 ether;
        
        vm.prank(alice);
        sbt.mintCharacter{value: overpayment}(charId);
        
        uint256 balanceAfter = alice.balance;
        assertEq(balanceBefore - balanceAfter, MINT_PRICE, "Should only charge mint price");
    }
    
    function testMintingClosesWhenSoldOut() public {
        vm.prank(owner);
        uint256 charId = sbt.createCharacter("Zara", "ipfs://zara", 2, MINT_PRICE); // Max supply = 2
        
        // Mint 2
        vm.prank(alice);
        sbt.mintCharacter{value: MINT_PRICE}(charId);
        
        vm.prank(bob);
        sbt.mintCharacter{value: MINT_PRICE}(charId);
        
        // Verify sold out
        CharacterSBT.Character memory char = sbt.getCharacter(charId);
        assertFalse(char.mintingOpen);
        assertEq(char.totalSupply, char.maxSupply);
        
        // Cannot mint anymore
        vm.prank(carol);
        vm.expectRevert(CharacterSBT.SoldOut.selector);
        sbt.mintCharacter{value: MINT_PRICE}(charId);
    }
    
    function testCannotMintWhenMintingClosed() public {
        vm.prank(owner);
        uint256 charId = sbt.createCharacter("Zara", "ipfs://zara", MAX_SUPPLY, MINT_PRICE);
        
        // Owner closes minting
        vm.prank(owner);
        sbt.closeMinting(charId);
        
        // Cannot mint
        vm.prank(alice);
        vm.expectRevert(CharacterSBT.MintingClosed.selector);
        sbt.mintCharacter{value: MINT_PRICE}(charId);
    }
    
    function testCannotMintKilledCharacter() public {
        vm.prank(owner);
        uint256 charId = sbt.createCharacter("Zara", "ipfs://zara", MAX_SUPPLY, MINT_PRICE);
        
        // Kill character
        vm.prank(owner);
        sbt.killCharacter(charId);
        
        // Cannot mint
        vm.prank(alice);
        vm.expectRevert(CharacterSBT.CharacterNotFound.selector);
        sbt.mintCharacter{value: MINT_PRICE}(charId);
    }
    
    /*//////////////////////////////////////////////////////////////
                    REVENUE DISTRIBUTION TESTS
    //////////////////////////////////////////////////////////////*/
    
    function testDistributeRevenue() public {
        // Setup
        vm.prank(owner);
        uint256 charId = sbt.createCharacter("Zara", "ipfs://zara", MAX_SUPPLY, MINT_PRICE);
        
        // Alice and Bob mint
        vm.prank(alice);
        sbt.mintCharacter{value: MINT_PRICE}(charId);
        vm.prank(bob);
        sbt.mintCharacter{value: MINT_PRICE}(charId);
        
        // Distribute revenue (10K USDC pool)
        uint256 poolAmount = 10_000e6; // 10K USDC
        uint256 expectedShare = (poolAmount * 500) / 10000; // 5% = 500 USDC
        
        vm.prank(owner);
        vm.expectEmit(true, true, true, true);
        emit RevenueDistributed(charId, 1, expectedShare, 2); // chapterId = 1
        
        sbt.distributeRevenue(charId, 1, poolAmount);
        
        // Verify
        CharacterSBT.Character memory char = sbt.getCharacter(charId);
        assertEq(char.totalEarnings, expectedShare);
        assertEq(char.xp, 1);
        assertEq(char.level, 1);
        
        // Check unclaimed earnings
        uint256 aliceUnclaimed = sbt.getUnclaimedEarnings(alice, charId);
        uint256 bobUnclaimed = sbt.getUnclaimedEarnings(bob, charId);
        
        assertEq(aliceUnclaimed, expectedShare / 2); // 250 USDC
        assertEq(bobUnclaimed, expectedShare / 2); // 250 USDC
    }
    
    function testDistributeRevenueMultipleTimes() public {
        // Setup
        vm.prank(owner);
        uint256 charId = sbt.createCharacter("Zara", "ipfs://zara", MAX_SUPPLY, MINT_PRICE);
        
        vm.prank(alice);
        sbt.mintCharacter{value: MINT_PRICE}(charId);
        
        // Distribute 3 times
        vm.startPrank(owner);
        sbt.distributeRevenue(charId, 1, 10_000e6);
        sbt.distributeRevenue(charId, 2, 15_000e6);
        sbt.distributeRevenue(charId, 3, 20_000e6);
        vm.stopPrank();
        
        // Verify XP and level
        CharacterSBT.Character memory char = sbt.getCharacter(charId);
        assertEq(char.xp, 3);
        assertEq(char.level, 1); // Not enough XP for level 2
        
        // Verify total earnings
        uint256 expectedTotal = ((10_000e6 + 15_000e6 + 20_000e6) * 500) / 10000;
        assertEq(char.totalEarnings, expectedTotal);
    }
    
    function testLevelUpAfter5Appearances() public {
        vm.prank(owner);
        uint256 charId = sbt.createCharacter("Zara", "ipfs://zara", MAX_SUPPLY, MINT_PRICE);
        
        vm.prank(alice);
        sbt.mintCharacter{value: MINT_PRICE}(charId);
        
        // Distribute 5 times
        vm.startPrank(owner);
        for (uint256 i = 1; i <= 5; i++) {
            sbt.distributeRevenue(charId, i, 10_000e6);
        }
        vm.stopPrank();
        
        CharacterSBT.Character memory char = sbt.getCharacter(charId);
        assertEq(char.xp, 5);
        assertEq(char.level, 2); // Should level up to 2
        
        // Distribute 5 more times
        vm.startPrank(owner);
        for (uint256 i = 6; i <= 10; i++) {
            sbt.distributeRevenue(charId, i, 10_000e6);
        }
        vm.stopPrank();
        
        char = sbt.getCharacter(charId);
        assertEq(char.xp, 10);
        assertEq(char.level, 3); // Should be level 3
    }
    
    function testCannotDistributeToKilledCharacter() public {
        vm.prank(owner);
        uint256 charId = sbt.createCharacter("Zara", "ipfs://zara", MAX_SUPPLY, MINT_PRICE);
        
        vm.prank(owner);
        sbt.killCharacter(charId);
        
        vm.prank(owner);
        vm.expectRevert(CharacterSBT.InvalidCharacter.selector);
        sbt.distributeRevenue(charId, 1, 10_000e6);
    }
    
    /*//////////////////////////////////////////////////////////////
                        CLAIM EARNINGS TESTS
    //////////////////////////////////////////////////////////////*/
    
    function testClaimEarnings() public {
        // Setup
        vm.prank(owner);
        uint256 charId = sbt.createCharacter("Zara", "ipfs://zara", MAX_SUPPLY, MINT_PRICE);
        
        vm.prank(alice);
        sbt.mintCharacter{value: MINT_PRICE}(charId);
        vm.prank(bob);
        sbt.mintCharacter{value: MINT_PRICE}(charId);
        
        // Distribute revenue
        uint256 poolAmount = 10_000e6;
        vm.prank(owner);
        sbt.distributeRevenue(charId, 1, poolAmount);
        
        // Alice claims
        uint256 aliceBalanceBefore = usdc.balanceOf(alice);
        uint256 expectedClaim = (poolAmount * 500) / 10000 / 2; // 250 USDC
        
        vm.prank(alice);
        vm.expectEmit(true, true, true, true);
        emit EarningsClaimed(alice, charId, expectedClaim);
        
        sbt.claimEarnings(charId);
        
        uint256 aliceBalanceAfter = usdc.balanceOf(alice);
        assertEq(aliceBalanceAfter - aliceBalanceBefore, expectedClaim);
        
        // Check unclaimed is now 0
        assertEq(sbt.getUnclaimedEarnings(alice, charId), 0);
    }
    
    function testClaimEarningsMultipleTimes() public {
        vm.prank(owner);
        uint256 charId = sbt.createCharacter("Zara", "ipfs://zara", MAX_SUPPLY, MINT_PRICE);
        
        vm.prank(alice);
        sbt.mintCharacter{value: MINT_PRICE}(charId);
        
        // Distribute 3 times
        vm.startPrank(owner);
        sbt.distributeRevenue(charId, 1, 10_000e6);
        sbt.distributeRevenue(charId, 2, 20_000e6);
        sbt.distributeRevenue(charId, 3, 30_000e6);
        vm.stopPrank();
        
        // Claim after each distribution
        vm.startPrank(alice);
        
        // First claim
        uint256 claim1 = sbt.getUnclaimedEarnings(alice, charId);
        sbt.claimEarnings(charId);
        assertEq(usdc.balanceOf(alice), claim1);
        
        // Second claim (should get more)
        uint256 claim2 = sbt.getUnclaimedEarnings(alice, charId);
        sbt.claimEarnings(charId);
        assertEq(usdc.balanceOf(alice), claim1 + claim2);
        
        vm.stopPrank();
    }
    
    function testClaimEarningsBatch() public {
        // Create 3 characters
        vm.startPrank(owner);
        uint256 char1 = sbt.createCharacter("Zara", "ipfs://1", 100, MINT_PRICE);
        uint256 char2 = sbt.createCharacter("Kael", "ipfs://2", 100, MINT_PRICE);
        uint256 char3 = sbt.createCharacter("Mira", "ipfs://3", 100, MINT_PRICE);
        vm.stopPrank();
        
        // Alice mints all 3
        vm.startPrank(alice);
        sbt.mintCharacter{value: MINT_PRICE}(char1);
        sbt.mintCharacter{value: MINT_PRICE}(char2);
        sbt.mintCharacter{value: MINT_PRICE}(char3);
        vm.stopPrank();
        
        // Distribute revenue to all 3
        vm.startPrank(owner);
        sbt.distributeRevenue(char1, 1, 10_000e6);
        sbt.distributeRevenue(char2, 1, 20_000e6);
        sbt.distributeRevenue(char3, 1, 30_000e6);
        vm.stopPrank();
        
        // Batch claim
        uint256[] memory charIds = new uint256[](3);
        charIds[0] = char1;
        charIds[1] = char2;
        charIds[2] = char3;
        
        uint256 expectedTotal = sbt.getTotalUnclaimedEarnings(alice);
        
        vm.prank(alice);
        sbt.claimEarningsBatch(charIds);
        
        assertEq(usdc.balanceOf(alice), expectedTotal);
        assertEq(sbt.getTotalUnclaimedEarnings(alice), 0);
    }
    
    function testCannotClaimIfNotOwner() public {
        vm.prank(owner);
        uint256 charId = sbt.createCharacter("Zara", "ipfs://zara", MAX_SUPPLY, MINT_PRICE);
        
        vm.prank(alice);
        sbt.mintCharacter{value: MINT_PRICE}(charId);
        
        vm.prank(owner);
        sbt.distributeRevenue(charId, 1, 10_000e6);
        
        vm.prank(bob); // Bob doesn't own the character
        vm.expectRevert(CharacterSBT.NotOwner.selector);
        sbt.claimEarnings(charId);
    }
    
    function testCannotClaimWithNoEarnings() public {
        vm.prank(owner);
        uint256 charId = sbt.createCharacter("Zara", "ipfs://zara", MAX_SUPPLY, MINT_PRICE);
        
        vm.prank(alice);
        sbt.mintCharacter{value: MINT_PRICE}(charId);
        
        // No revenue distributed
        vm.prank(alice);
        vm.expectRevert(CharacterSBT.NoEarningsToClaim.selector);
        sbt.claimEarnings(charId);
    }
    
    /*//////////////////////////////////////////////////////////////
                    SOUL-BOUND TRANSFER TESTS
    //////////////////////////////////////////////////////////////*/
    
    function testCannotTransfer() public {
        vm.prank(owner);
        uint256 charId = sbt.createCharacter("Zara", "ipfs://zara", MAX_SUPPLY, MINT_PRICE);
        
        vm.prank(alice);
        sbt.mintCharacter{value: MINT_PRICE}(charId);
        
        // Try to transfer from Alice to Bob
        vm.prank(alice);
        vm.expectRevert(CharacterSBT.SoulBoundToken.selector);
        sbt.transferFrom(alice, bob, 1);
    }
    
    function testCannotSafeTransfer() public {
        vm.prank(owner);
        uint256 charId = sbt.createCharacter("Zara", "ipfs://zara", MAX_SUPPLY, MINT_PRICE);
        
        vm.prank(alice);
        sbt.mintCharacter{value: MINT_PRICE}(charId);
        
        // Try safe transfer
        vm.prank(alice);
        vm.expectRevert(CharacterSBT.SoulBoundToken.selector);
        sbt.safeTransferFrom(alice, bob, 1);
    }
    
    /*//////////////////////////////////////////////////////////////
                        ADMIN FUNCTION TESTS
    //////////////////////////////////////////////////////////////*/
    
    function testCloseMinting() public {
        vm.prank(owner);
        uint256 charId = sbt.createCharacter("Zara", "ipfs://zara", MAX_SUPPLY, MINT_PRICE);
        
        vm.prank(owner);
        sbt.closeMinting(charId);
        
        assertFalse(sbt.getCharacter(charId).mintingOpen);
    }
    
    function testKillCharacter() public {
        vm.prank(owner);
        uint256 charId = sbt.createCharacter("Zara", "ipfs://zara", MAX_SUPPLY, MINT_PRICE);
        
        vm.prank(owner);
        vm.expectEmit(true, true, true, true);
        emit CharacterKilled(charId);
        
        sbt.killCharacter(charId);
        
        CharacterSBT.Character memory char = sbt.getCharacter(charId);
        assertFalse(char.isAlive);
        assertFalse(char.mintingOpen);
    }
    
    function testSetTreasury() public {
        address newTreasury = address(99);
        
        vm.prank(owner);
        sbt.setTreasury(newTreasury);
        
        assertEq(sbt.treasury(), newTreasury);
    }
    
    function testWithdrawMintFees() public {
        vm.prank(owner);
        uint256 charId = sbt.createCharacter("Zara", "ipfs://zara", MAX_SUPPLY, MINT_PRICE);
        
        // Alice and Bob mint
        vm.prank(alice);
        sbt.mintCharacter{value: MINT_PRICE}(charId);
        vm.prank(bob);
        sbt.mintCharacter{value: MINT_PRICE}(charId);
        
        uint256 treasuryBalanceBefore = treasury.balance;
        
        vm.prank(owner);
        sbt.withdrawMintFees();
        
        uint256 treasuryBalanceAfter = treasury.balance;
        assertEq(treasuryBalanceAfter - treasuryBalanceBefore, MINT_PRICE * 2);
    }
    
    /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTION TESTS
    //////////////////////////////////////////////////////////////*/
    
    function testGetUnclaimedEarnings() public {
        vm.prank(owner);
        uint256 charId = sbt.createCharacter("Zara", "ipfs://zara", MAX_SUPPLY, MINT_PRICE);
        
        vm.prank(alice);
        sbt.mintCharacter{value: MINT_PRICE}(charId);
        
        uint256 poolAmount = 10_000e6;
        vm.prank(owner);
        sbt.distributeRevenue(charId, 1, poolAmount);
        
        uint256 unclaimed = sbt.getUnclaimedEarnings(alice, charId);
        assertEq(unclaimed, (poolAmount * 500) / 10000); // 500 USDC
    }
    
    function testGetTotalUnclaimedEarnings() public {
        // Create 2 characters
        vm.startPrank(owner);
        uint256 char1 = sbt.createCharacter("Zara", "ipfs://1", 100, MINT_PRICE);
        uint256 char2 = sbt.createCharacter("Kael", "ipfs://2", 100, MINT_PRICE);
        vm.stopPrank();
        
        // Alice mints both
        vm.startPrank(alice);
        sbt.mintCharacter{value: MINT_PRICE}(char1);
        sbt.mintCharacter{value: MINT_PRICE}(char2);
        vm.stopPrank();
        
        // Distribute to both
        vm.startPrank(owner);
        sbt.distributeRevenue(char1, 1, 10_000e6); // 500 USDC
        sbt.distributeRevenue(char2, 1, 20_000e6); // 1000 USDC
        vm.stopPrank();
        
        uint256 totalUnclaimed = sbt.getTotalUnclaimedEarnings(alice);
        assertEq(totalUnclaimed, 500e6 + 1000e6); // 1500 USDC
    }
    
    function testTokenURI() public {
        vm.prank(owner);
        uint256 charId = sbt.createCharacter("Zara", "ipfs://zara-metadata", MAX_SUPPLY, MINT_PRICE);
        
        vm.prank(alice);
        sbt.mintCharacter{value: MINT_PRICE}(charId);
        
        string memory uri = sbt.tokenURI(1);
        assertEq(uri, "ipfs://zara-metadata");
    }
    
    /*//////////////////////////////////////////////////////////////
                        INTEGRATION TESTS
    //////////////////////////////////////////////////////////////*/
    
    function testFullLifecycle() public {
        // 1. Create character
        vm.prank(owner);
        uint256 charId = sbt.createCharacter("Commander Zara", "ipfs://zara", 3, MINT_PRICE);
        
        // 2. Three users mint
        vm.prank(alice);
        sbt.mintCharacter{value: MINT_PRICE}(charId);
        vm.prank(bob);
        sbt.mintCharacter{value: MINT_PRICE}(charId);
        vm.prank(carol);
        sbt.mintCharacter{value: MINT_PRICE}(charId);
        
        // 3. Character appears in 10 chapters
        vm.startPrank(owner);
        for (uint256 i = 1; i <= 10; i++) {
            sbt.distributeRevenue(charId, i, 10_000e6); // 10K pool each
        }
        vm.stopPrank();
        
        // 4. Verify level (should be level 3: 1 + 10/5)
        CharacterSBT.Character memory char = sbt.getCharacter(charId);
        assertEq(char.level, 3);
        assertEq(char.xp, 10);
        
        // 5. All users claim earnings
        vm.prank(alice);
        sbt.claimEarnings(charId);
        vm.prank(bob);
        sbt.claimEarnings(charId);
        vm.prank(carol);
        sbt.claimEarnings(charId);
        
        // 6. Verify earnings (each should get 1/3 of total revenue)
        uint256 totalRevenue = (10_000e6 * 10 * 500) / 10000; // 5000 USDC
        uint256 perHolder = totalRevenue / 3;
        
        assertEq(usdc.balanceOf(alice), perHolder);
        assertEq(usdc.balanceOf(bob), perHolder);
        assertEq(usdc.balanceOf(carol), perHolder);
        
        // 7. Character dies in story
        vm.prank(owner);
        sbt.killCharacter(charId);
        
        // 8. Cannot distribute revenue anymore
        vm.prank(owner);
        vm.expectRevert(CharacterSBT.InvalidCharacter.selector);
        sbt.distributeRevenue(charId, 11, 10_000e6);
        
        // 9. But holders can still claim existing earnings
        // (This would work if there were unclaimed earnings from before death)
    }
    
    function testGasOptimizationBatchClaim() public {
        // Create 10 characters
        uint256[] memory charIds = new uint256[](10);
        
        vm.startPrank(owner);
        for (uint256 i = 0; i < 10; i++) {
            charIds[i] = sbt.createCharacter(
                string(abi.encodePacked("Char", vm.toString(i))),
                string(abi.encodePacked("ipfs://", vm.toString(i))),
                100,
                MINT_PRICE
            );
        }
        vm.stopPrank();
        
        // Alice mints all 10
        vm.startPrank(alice);
        for (uint256 i = 0; i < 10; i++) {
            sbt.mintCharacter{value: MINT_PRICE}(charIds[i]);
        }
        vm.stopPrank();
        
        // Distribute revenue to all 10
        vm.startPrank(owner);
        for (uint256 i = 0; i < 10; i++) {
            sbt.distributeRevenue(charIds[i], 1, 10_000e6);
        }
        vm.stopPrank();
        
        // Batch claim (should be more gas-efficient than 10 individual claims)
        vm.prank(alice);
        sbt.claimEarningsBatch(charIds);
        
        // Verify all claimed
        assertEq(sbt.getTotalUnclaimedEarnings(alice), 0);
    }
}
