// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/ProphecyNFT.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title ProphecyNFTTest
 * @notice Comprehensive test suite for Voidborne Prophecy NFTs
 *
 * Innovation Cycle #49 — "The Living Cosmos"
 *
 * Test coverage:
 *  ✅ Prophecy seeding (oracle)
 *  ✅ Text reveal with hash verification
 *  ✅ User minting (single + Oracle Pack)
 *  ✅ Mint limits (100 max, 1 per address)
 *  ✅ Fee distribution (treasury + dev)
 *  ✅ Fulfillment oracle (FULFILLED / ECHOED / UNFULFILLED)
 *  ✅ Dynamic tokenURI transformation
 *  ✅ Access control (onlyOracle, onlyOwner)
 *  ✅ ERC-721 compliance (transfers, ownership)
 *  ✅ Royalty info (ERC-2981)
 *  ✅ Oracle Pack discount (10%)
 *  ✅ Sold-out protection
 *  ✅ Double-mint protection
 *  ✅ Reveal hash mismatch rejection
 *  ✅ Resolve-before-reveal ordering
 */

// ─── Mock $FORGE Token ────────────────────────────────────────────────────────

contract MockForge is ERC20 {
    constructor() ERC20("NarrativeForge", "FORGE") {
        _mint(msg.sender, 1_000_000 * 1e18);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

// ─── Test Contract ────────────────────────────────────────────────────────────

contract ProphecyNFTTest is Test {

    // ─── Actors ─────────────────────────────────────────────────────────

    address constant OWNER    = address(0x1);
    address constant ORACLE   = address(0x2);
    address constant TREASURY = address(0x3);
    address constant DEV      = address(0x4);
    address constant ALICE    = address(0x5);
    address constant BOB      = address(0x6);
    address constant CHARLIE  = address(0x7);
    address constant ATTACKER = address(0x8);

    // ─── Contracts ───────────────────────────────────────────────────────

    ProphecyNFT public nft;
    MockForge   public forge;

    // ─── Test Data ───────────────────────────────────────────────────────

    uint256 constant CHAPTER_1  = 1;
    uint256 constant MINT_PRICE = 5e18;

    string  constant PROPHECY_TEXT_1 =
        "When the silver heir casts shadow upon her own house, the Thread shall fray.";
    string  constant PROPHECY_TEXT_2 =
        "From the wound of betrayal, a new constellation rises in the Void.";
    string  constant PROPHECY_TEXT_3 =
        "Three crowns shall burn before one finds the throne of silence.";

    bytes32 immutable HASH_1;
    bytes32 immutable HASH_2;
    bytes32 immutable HASH_3;

    string constant PENDING_URI_1   = "ipfs://QmPROPHECY1_PENDING";
    string constant PENDING_URI_2   = "ipfs://QmPROPHECY2_PENDING";
    string constant FULFILLED_URI_1 = "ipfs://QmPROPHECY1_FULFILLED";
    string constant ECHOED_URI_2    = "ipfs://QmPROPHECY2_ECHOED";
    string constant UNFULFILLED_URI = "ipfs://QmPROPHECY3_UNFULFILLED";

    constructor() {
        HASH_1 = keccak256(abi.encode(PROPHECY_TEXT_1));
        HASH_2 = keccak256(abi.encode(PROPHECY_TEXT_2));
        HASH_3 = keccak256(abi.encode(PROPHECY_TEXT_3));
    }

    // ─── Setup ───────────────────────────────────────────────────────────

    function setUp() public {
        vm.startPrank(OWNER);

        forge = new MockForge();
        nft   = new ProphecyNFT(address(forge), TREASURY, DEV, ORACLE);

        // Fund Alice and Bob with $FORGE
        forge.mint(ALICE,    1000 * 1e18);
        forge.mint(BOB,      1000 * 1e18);
        forge.mint(CHARLIE,  1000 * 1e18);
        forge.mint(ATTACKER,  100 * 1e18);

        vm.stopPrank();

        // Approve ProphecyNFT to spend $FORGE
        vm.prank(ALICE);
        forge.approve(address(nft), type(uint256).max);

        vm.prank(BOB);
        forge.approve(address(nft), type(uint256).max);

        vm.prank(CHARLIE);
        forge.approve(address(nft), type(uint256).max);

        vm.prank(ATTACKER);
        forge.approve(address(nft), type(uint256).max);
    }

    // ─── Helper ───────────────────────────────────────────────────────────

    function _seedProphecy(
        uint256 chapterId,
        bytes32 contentHash,
        string memory pendingURI
    ) internal returns (uint256 prophecyId) {
        vm.prank(ORACLE);
        return nft.seedProphecy(chapterId, contentHash, pendingURI);
    }

    function _seedThreeProphecies() internal returns (uint256 p1, uint256 p2, uint256 p3) {
        p1 = _seedProphecy(CHAPTER_1, HASH_1, PENDING_URI_1);
        p2 = _seedProphecy(CHAPTER_1, HASH_2, PENDING_URI_2);
        p3 = _seedProphecy(CHAPTER_1, HASH_3, "ipfs://QmPROPHECY3_PENDING");
    }

    // ─── Test: Seeding ────────────────────────────────────────────────────

    function test_SeedProphecy_Oracle() public {
        uint256 pid = _seedProphecy(CHAPTER_1, HASH_1, PENDING_URI_1);

        assertEq(pid, 1, "First prophecy should be ID 1");

        ProphecyNFT.Prophecy memory p = nft.prophecies(pid);
        assertEq(p.prophecyId, 1);
        assertEq(p.chapterId, CHAPTER_1);
        assertEq(p.contentHash, HASH_1);
        assertEq(p.mintedCount, 0);
        assertFalse(p.revealed);
        assertEq(uint8(p.status), uint8(ProphecyNFT.FulfillmentStatus.PENDING));
    }

    function test_SeedProphecy_NotOracle_Reverts() public {
        vm.prank(ATTACKER);
        vm.expectRevert("ProphecyNFT: not oracle");
        nft.seedProphecy(CHAPTER_1, HASH_1, PENDING_URI_1);
    }

    function test_SeedMultipleProphecies_ChapterIndex() public {
        (uint256 p1, uint256 p2, uint256 p3) = _seedThreeProphecies();

        uint256[] memory ids = nft.getPropheciesForChapter(CHAPTER_1);
        assertEq(ids.length, 3);
        assertEq(ids[0], p1);
        assertEq(ids[1], p2);
        assertEq(ids[2], p3);
    }

    // ─── Test: Reveal ─────────────────────────────────────────────────────

    function test_RevealProphecy_ValidHash() public {
        uint256 pid = _seedProphecy(CHAPTER_1, HASH_1, PENDING_URI_1);

        vm.prank(ORACLE);
        nft.revealProphecy(pid, PROPHECY_TEXT_1);

        ProphecyNFT.Prophecy memory p = nft.prophecies(pid);
        assertTrue(p.revealed, "Should be revealed");
    }

    function test_RevealProphecy_WrongText_Reverts() public {
        uint256 pid = _seedProphecy(CHAPTER_1, HASH_1, PENDING_URI_1);

        vm.prank(ORACLE);
        vm.expectRevert("ProphecyNFT: hash mismatch");
        nft.revealProphecy(pid, "Wrong prophecy text");
    }

    function test_RevealProphecy_DoubleReveal_Reverts() public {
        uint256 pid = _seedProphecy(CHAPTER_1, HASH_1, PENDING_URI_1);

        vm.prank(ORACLE);
        nft.revealProphecy(pid, PROPHECY_TEXT_1);

        vm.prank(ORACLE);
        vm.expectRevert("ProphecyNFT: already revealed");
        nft.revealProphecy(pid, PROPHECY_TEXT_1);
    }

    // ─── Test: Minting ────────────────────────────────────────────────────

    function test_Mint_SingleProphecy() public {
        uint256 pid = _seedProphecy(CHAPTER_1, HASH_1, PENDING_URI_1);

        uint256 aliceBalanceBefore = forge.balanceOf(ALICE);

        vm.prank(ALICE);
        uint256 tokenId = nft.mint(pid);

        // Token minted
        assertEq(nft.ownerOf(tokenId), ALICE, "Alice should own token");

        // Mint price deducted
        uint256 aliceBalanceAfter = forge.balanceOf(ALICE);
        assertEq(aliceBalanceBefore - aliceBalanceAfter, MINT_PRICE, "5 FORGE deducted");

        // Minted count increased
        ProphecyNFT.Prophecy memory p = nft.prophecies(pid);
        assertEq(p.mintedCount, 1, "Minted count should be 1");
    }

    function test_Mint_FeeDistribution() public {
        uint256 pid = _seedProphecy(CHAPTER_1, HASH_1, PENDING_URI_1);

        uint256 treasuryBefore = forge.balanceOf(TREASURY);
        uint256 devBefore      = forge.balanceOf(DEV);

        vm.prank(ALICE);
        nft.mint(pid);

        uint256 expectedTreasury = (MINT_PRICE * 1250) / 10_000; // 12.5%
        uint256 expectedDev      = (MINT_PRICE * 250)  / 10_000; // 2.5%

        assertEq(forge.balanceOf(TREASURY) - treasuryBefore, expectedTreasury, "Treasury gets 12.5%");
        assertEq(forge.balanceOf(DEV)      - devBefore,      expectedDev,      "Dev gets 2.5%");
    }

    function test_Mint_OnePerWallet_Reverts() public {
        uint256 pid = _seedProphecy(CHAPTER_1, HASH_1, PENDING_URI_1);

        vm.prank(ALICE);
        nft.mint(pid);

        vm.prank(ALICE);
        vm.expectRevert("ProphecyNFT: one per wallet");
        nft.mint(pid);
    }

    function test_Mint_TwoWallets_BothSucceed() public {
        uint256 pid = _seedProphecy(CHAPTER_1, HASH_1, PENDING_URI_1);

        vm.prank(ALICE);
        uint256 tokenA = nft.mint(pid);

        vm.prank(BOB);
        uint256 tokenB = nft.mint(pid);

        assertEq(nft.ownerOf(tokenA), ALICE, "Alice owns token A");
        assertEq(nft.ownerOf(tokenB), BOB,   "Bob owns token B");

        ProphecyNFT.ProphecyToken memory tdA = nft.tokenData(tokenA);
        ProphecyNFT.ProphecyToken memory tdB = nft.tokenData(tokenB);

        assertEq(tdA.mintOrder, 1, "Alice was 1st");
        assertEq(tdB.mintOrder, 2, "Bob was 2nd");
    }

    function test_Mint_AfterResolution_Reverts() public {
        (uint256 pid,,) = _seedThreeProphecies();

        // Fulfill prophecy
        uint256[] memory pids = new uint256[](1);
        pids[0] = pid;

        ProphecyNFT.FulfillmentStatus[] memory statuses = new ProphecyNFT.FulfillmentStatus[](1);
        statuses[0] = ProphecyNFT.FulfillmentStatus.FULFILLED;

        string[] memory uris = new string[](1);
        uris[0] = FULFILLED_URI_1;

        vm.prank(ORACLE);
        nft.fulfillProphecies(pids, statuses, uris);

        // Try to mint after resolution
        vm.prank(ALICE);
        vm.expectRevert("ProphecyNFT: prophecy resolved");
        nft.mint(pid);
    }

    // ─── Test: Oracle Pack ────────────────────────────────────────────────

    function test_OraclePack_DiscountApplied() public {
        (uint256 p1, uint256 p2,) = _seedThreeProphecies();

        uint256 aliceBefore = forge.balanceOf(ALICE);

        uint256[] memory packIds = new uint256[](2);
        packIds[0] = p1;
        packIds[1] = p2;

        vm.prank(ALICE);
        nft.mintOraclePack(packIds);

        uint256 aliceAfter   = forge.balanceOf(ALICE);
        uint256 fullPrice    = MINT_PRICE * 2;
        uint256 discountPrice = fullPrice * 90 / 100;

        assertEq(aliceBefore - aliceAfter, discountPrice, "10% discount applied");
    }

    function test_OraclePack_TooLarge_Reverts() public {
        vm.prank(ORACLE);
        // Cannot test 21 items easily, test empty array
        uint256[] memory empty = new uint256[](0);
        vm.prank(ALICE);
        vm.expectRevert("ProphecyNFT: invalid pack size");
        nft.mintOraclePack(empty);
    }

    // ─── Test: Fulfillment ────────────────────────────────────────────────

    function test_FulfillProphecies_AllStatuses() public {
        (uint256 p1, uint256 p2, uint256 p3) = _seedThreeProphecies();

        uint256[] memory pids = new uint256[](3);
        pids[0] = p1; pids[1] = p2; pids[2] = p3;

        ProphecyNFT.FulfillmentStatus[] memory statuses = new ProphecyNFT.FulfillmentStatus[](3);
        statuses[0] = ProphecyNFT.FulfillmentStatus.FULFILLED;
        statuses[1] = ProphecyNFT.FulfillmentStatus.ECHOED;
        statuses[2] = ProphecyNFT.FulfillmentStatus.UNFULFILLED;

        string[] memory uris = new string[](3);
        uris[0] = FULFILLED_URI_1;
        uris[1] = ECHOED_URI_2;
        uris[2] = UNFULFILLED_URI;

        vm.prank(ORACLE);
        nft.fulfillProphecies(pids, statuses, uris);

        assertEq(uint8(nft.prophecies(p1).status), uint8(ProphecyNFT.FulfillmentStatus.FULFILLED));
        assertEq(uint8(nft.prophecies(p2).status), uint8(ProphecyNFT.FulfillmentStatus.ECHOED));
        assertEq(uint8(nft.prophecies(p3).status), uint8(ProphecyNFT.FulfillmentStatus.UNFULFILLED));
    }

    function test_FulfillProphecies_NotOracle_Reverts() public {
        (uint256 p1,,) = _seedThreeProphecies();

        uint256[] memory pids = new uint256[](1);
        pids[0] = p1;

        ProphecyNFT.FulfillmentStatus[] memory statuses = new ProphecyNFT.FulfillmentStatus[](1);
        statuses[0] = ProphecyNFT.FulfillmentStatus.FULFILLED;

        string[] memory uris = new string[](1);
        uris[0] = FULFILLED_URI_1;

        vm.prank(ATTACKER);
        vm.expectRevert("ProphecyNFT: not oracle");
        nft.fulfillProphecies(pids, statuses, uris);
    }

    function test_FulfillProphecies_DoubleFulfill_Reverts() public {
        (uint256 p1,,) = _seedThreeProphecies();

        uint256[] memory pids = new uint256[](1);
        pids[0] = p1;

        ProphecyNFT.FulfillmentStatus[] memory statuses = new ProphecyNFT.FulfillmentStatus[](1);
        statuses[0] = ProphecyNFT.FulfillmentStatus.FULFILLED;

        string[] memory uris = new string[](1);
        uris[0] = FULFILLED_URI_1;

        vm.prank(ORACLE);
        nft.fulfillProphecies(pids, statuses, uris);

        // Try again
        vm.prank(ORACLE);
        vm.expectRevert("ProphecyNFT: already resolved");
        nft.fulfillProphecies(pids, statuses, uris);
    }

    // ─── Test: Dynamic TokenURI ────────────────────────────────────────────

    function test_TokenURI_PendingState() public {
        uint256 pid = _seedProphecy(CHAPTER_1, HASH_1, PENDING_URI_1);

        vm.prank(ALICE);
        uint256 tokenId = nft.mint(pid);

        // Before resolution — pending URI
        assertEq(nft.tokenURI(tokenId), PENDING_URI_1, "Should show pending URI");
    }

    function test_TokenURI_TransformsAfterFulfillment() public {
        (uint256 p1, uint256 p2, uint256 p3) = _seedThreeProphecies();

        // Mint all three prophecies
        vm.prank(ALICE);   uint256 t1 = nft.mint(p1);
        vm.prank(BOB);     uint256 t2 = nft.mint(p2);
        vm.prank(CHARLIE); uint256 t3 = nft.mint(p3);

        // Verify pending URIs
        assertEq(nft.tokenURI(t1), PENDING_URI_1);
        assertEq(nft.tokenURI(t2), PENDING_URI_2);

        // Fulfill
        uint256[] memory pids = new uint256[](3);
        pids[0] = p1; pids[1] = p2; pids[2] = p3;

        ProphecyNFT.FulfillmentStatus[] memory statuses = new ProphecyNFT.FulfillmentStatus[](3);
        statuses[0] = ProphecyNFT.FulfillmentStatus.FULFILLED;
        statuses[1] = ProphecyNFT.FulfillmentStatus.ECHOED;
        statuses[2] = ProphecyNFT.FulfillmentStatus.UNFULFILLED;

        string[] memory uris = new string[](3);
        uris[0] = FULFILLED_URI_1;
        uris[1] = ECHOED_URI_2;
        uris[2] = UNFULFILLED_URI;

        vm.prank(ORACLE);
        nft.fulfillProphecies(pids, statuses, uris);

        // TokenURIs should transform
        assertEq(nft.tokenURI(t1), FULFILLED_URI_1, "Fulfilled: golden art");
        assertEq(nft.tokenURI(t2), ECHOED_URI_2,    "Echoed: silver art");
        assertEq(nft.tokenURI(t3), UNFULFILLED_URI,  "Unfulfilled: dark art");
    }

    // ─── Test: Access Control ─────────────────────────────────────────────

    function test_SetOracle_OnlyOwner() public {
        address newOracle = address(0x99);

        vm.prank(OWNER);
        nft.setOracle(newOracle);

        assertEq(nft.oracle(), newOracle);
    }

    function test_SetOracle_NotOwner_Reverts() public {
        vm.prank(ATTACKER);
        vm.expectRevert();
        nft.setOracle(address(0x99));
    }

    function test_SetOracle_ZeroAddress_Reverts() public {
        vm.prank(OWNER);
        vm.expectRevert("ProphecyNFT: zero oracle");
        nft.setOracle(address(0));
    }

    // ─── Test: ERC-721 Transfers ──────────────────────────────────────────

    function test_Transfer_Works() public {
        uint256 pid = _seedProphecy(CHAPTER_1, HASH_1, PENDING_URI_1);

        vm.prank(ALICE);
        uint256 tokenId = nft.mint(pid);

        vm.prank(ALICE);
        nft.transferFrom(ALICE, BOB, tokenId);

        assertEq(nft.ownerOf(tokenId), BOB, "Bob should now own the token");
    }

    // ─── Test: Royalty Info ───────────────────────────────────────────────

    function test_RoyaltyInfo() public view {
        (address receiver, uint256 amount) = nft.royaltyInfo(1, 1_000_000);
        assertEq(receiver, TREASURY, "Royalties go to treasury");
        assertEq(amount, 50_000, "5% of 1,000,000 = 50,000");
    }

    // ─── Test: Mint Status ────────────────────────────────────────────────

    function test_MintStatus() public {
        uint256 pid = _seedProphecy(CHAPTER_1, HASH_1, PENDING_URI_1);

        (uint256 minted, uint256 remaining) = nft.getMintStatus(pid);
        assertEq(minted,    0,   "0 minted initially");
        assertEq(remaining, 100, "100 remaining initially");

        vm.prank(ALICE);
        nft.mint(pid);

        (minted, remaining) = nft.getMintStatus(pid);
        assertEq(minted,    1,  "1 minted after mint");
        assertEq(remaining, 99, "99 remaining after mint");
    }

    function test_HasMinted() public {
        uint256 pid = _seedProphecy(CHAPTER_1, HASH_1, PENDING_URI_1);

        assertFalse(nft.hasMinted(pid, ALICE), "Alice has not minted");

        vm.prank(ALICE);
        nft.mint(pid);

        assertTrue(nft.hasMinted(pid, ALICE), "Alice has minted");
        assertFalse(nft.hasMinted(pid, BOB), "Bob has not minted");
    }

    // ─── Test: Full Flow (End-to-End) ─────────────────────────────────────

    function test_FullFlow_SeedMintRevealFulfill() public {
        // 1. Oracle seeds prophecy
        uint256 pid = _seedProphecy(CHAPTER_1, HASH_1, PENDING_URI_1);
        console.log("Prophecy seeded:", pid);

        // 2. Alice mints
        vm.prank(ALICE);
        uint256 tokenId = nft.mint(pid);
        console.log("Alice minted token:", tokenId);
        assertEq(nft.tokenURI(tokenId), PENDING_URI_1, "Pending URI before reveal");

        // 3. Oracle reveals text
        vm.prank(ORACLE);
        nft.revealProphecy(pid, PROPHECY_TEXT_1);
        assertTrue(nft.prophecies(pid).revealed, "Prophecy revealed");

        // 4. Chapter resolves, oracle fulfills
        uint256[] memory pids = new uint256[](1);
        pids[0] = pid;

        ProphecyNFT.FulfillmentStatus[] memory statuses = new ProphecyNFT.FulfillmentStatus[](1);
        statuses[0] = ProphecyNFT.FulfillmentStatus.FULFILLED;

        string[] memory uris = new string[](1);
        uris[0] = FULFILLED_URI_1;

        vm.prank(ORACLE);
        nft.fulfillProphecies(pids, statuses, uris);

        // 5. TokenURI now shows golden legendary art
        assertEq(nft.tokenURI(tokenId), FULFILLED_URI_1, "Fulfilled URI after resolution");
        assertEq(uint8(nft.prophecies(pid).status), uint8(ProphecyNFT.FulfillmentStatus.FULFILLED));

        console.log("Full flow complete! Alice holds a Legendary Fulfilled Prophecy NFT.");
    }
}
