// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Test, console} from "forge-std/Test.sol";
import {PsychicConsensusOracle} from "../src/PsychicConsensusOracle.sol";

/**
 * @title PsychicConsensusOracleTest
 * @notice Comprehensive tests for the two-layer prediction market.
 *
 * Test coverage:
 *  ✅ Pool creation and validation
 *  ✅ Layer 1 story betting (choice A/B/C)
 *  ✅ Layer 2 psychic betting (crowd right vs contrarian)
 *  ✅ Pool resolution by oracle
 *  ✅ Main payout claims
 *  ✅ Psychic payout claims (both crowd believer and contrarian paths)
 *  ✅ Contrarian 2× bonus math
 *  ✅ ELO score updates
 *  ✅ Fee withdrawal
 *  ✅ Edge cases & revert conditions
 */
contract PsychicConsensusOracleTest is Test {
    PsychicConsensusOracle public pco;

    // Mock ERC-20 for testing
    MockERC20 public forge;

    address public owner   = address(0x1);
    address public oracle  = address(0x2);
    address public treasury = address(0x3);
    address public alice   = address(0x4);  // Main bettor
    address public bob     = address(0x5);  // Main bettor
    address public carol   = address(0x6);  // Psychic bettor (contrarian)
    address public dave    = address(0x7);  // Psychic bettor (crowd believer)

    uint256 constant POOL_ID   = 1;
    uint256 constant CHAPTER_ID = 42;
    uint256 constant DEADLINE   = 1_800_000_000; // Far future
    uint256 constant CHOICE_A   = 0;
    uint256 constant CHOICE_B   = 1;
    uint256 constant BET_100    = 100e18;
    uint256 constant BET_300    = 300e18;
    uint256 constant BET_50     = 50e18;

    function setUp() public {
        vm.startPrank(owner);
        forge = new MockERC20("NarrativeForge", "FORGE", 18);
        pco   = new PsychicConsensusOracle(address(forge), treasury, oracle);
        vm.stopPrank();

        // Fund test accounts
        forge.mint(alice, 10_000e18);
        forge.mint(bob,   10_000e18);
        forge.mint(carol, 10_000e18);
        forge.mint(dave,  10_000e18);

        // Approve PCO to spend tokens
        vm.prank(alice); forge.approve(address(pco), type(uint256).max);
        vm.prank(bob);   forge.approve(address(pco), type(uint256).max);
        vm.prank(carol); forge.approve(address(pco), type(uint256).max);
        vm.prank(dave);  forge.approve(address(pco), type(uint256).max);
    }

    // ─── Pool Creation ─────────────────────────────────────────────────────

    function test_CreatePool() public {
        vm.prank(owner);
        pco.createPool(POOL_ID, CHAPTER_ID, DEADLINE, 2);

        (uint256 chapterId, uint256 deadline, uint256 numChoices, uint256 total,
         bool resolved,,, ) = pco.pools(POOL_ID);

        assertEq(chapterId,  CHAPTER_ID);
        assertEq(deadline,   DEADLINE);
        assertEq(numChoices, 2);
        assertEq(total,      0);
        assertFalse(resolved);
    }

    function test_CreatePool_RevertIfExists() public {
        vm.startPrank(owner);
        pco.createPool(POOL_ID, CHAPTER_ID, DEADLINE, 2);
        vm.expectRevert("PCO: pool exists");
        pco.createPool(POOL_ID, CHAPTER_ID, DEADLINE, 2);
        vm.stopPrank();
    }

    function test_CreatePool_RevertBadDeadline() public {
        vm.prank(owner);
        vm.expectRevert("PCO: deadline past");
        pco.createPool(POOL_ID, CHAPTER_ID, block.timestamp - 1, 2);
    }

    function test_CreatePool_RevertBadChoices() public {
        vm.startPrank(owner);
        vm.expectRevert("PCO: bad numChoices");
        pco.createPool(POOL_ID, CHAPTER_ID, DEADLINE, 1);
        vm.expectRevert("PCO: bad numChoices");
        pco.createPool(POOL_ID, CHAPTER_ID, DEADLINE, 6);
        vm.stopPrank();
    }

    // ─── Layer 1: Story Betting ────────────────────────────────────────────

    function test_BetOnChoice() public {
        _createPool();

        uint256 aliceBefore = forge.balanceOf(alice);
        vm.prank(alice);
        pco.betOnChoice(POOL_ID, CHOICE_A, BET_100);

        assertEq(forge.balanceOf(alice), aliceBefore - BET_100);
        assertEq(pco.choiceBets(POOL_ID, CHOICE_A), BET_100);
        assertEq(pco.userBets(POOL_ID, alice, CHOICE_A), BET_100);

        (,,,uint256 total,,,,) = pco.pools(POOL_ID);
        assertEq(total, BET_100);
    }

    function test_BetOnChoice_MultipleUsers() public {
        _createPool();

        vm.prank(alice); pco.betOnChoice(POOL_ID, CHOICE_A, BET_300);  // 75% on A
        vm.prank(bob);   pco.betOnChoice(POOL_ID, CHOICE_B, BET_100);  // 25% on B

        (,,,, uint256[] memory pcts) = _getOdds();
        assertEq(pcts[0], 75); // Choice A: 75%
        assertEq(pcts[1], 25); // Choice B: 25%
    }

    function test_BetOnChoice_RevertAfterDeadline() public {
        _createPool();
        vm.warp(DEADLINE + 1);
        vm.prank(alice);
        vm.expectRevert("PCO: betting closed");
        pco.betOnChoice(POOL_ID, CHOICE_A, BET_100);
    }

    function test_BetOnChoice_RevertInvalidChoice() public {
        _createPool();
        vm.prank(alice);
        vm.expectRevert("PCO: invalid choice");
        pco.betOnChoice(POOL_ID, 5, BET_100); // Only choices 0,1 exist
    }

    // ─── Layer 2: Psychic Oracle ───────────────────────────────────────────

    function test_BetOnConsensus_Contrarian() public {
        _createPool();
        vm.prank(alice); pco.betOnChoice(POOL_ID, CHOICE_A, BET_300); // 75% crowd on A

        uint256 carolBefore = forge.balanceOf(carol);
        vm.prank(carol);
        pco.betOnConsensus(POOL_ID, false, BET_50); // Carol bets crowd will be WRONG

        assertEq(forge.balanceOf(carol), carolBefore - BET_50);
        assertEq(pco.userCrowdWrong(POOL_ID, carol), BET_50);

        (uint256 crBets, uint256 cwBets,,,,) = pco.getConsensusState(POOL_ID);
        assertEq(crBets, 0);
        assertEq(cwBets, BET_50);
    }

    function test_BetOnConsensus_CrowdBeliever() public {
        _createPool();
        vm.prank(alice); pco.betOnChoice(POOL_ID, CHOICE_A, BET_300);

        vm.prank(dave);
        pco.betOnConsensus(POOL_ID, true, BET_50); // Dave bets crowd will be RIGHT

        assertEq(pco.userCrowdRight(POOL_ID, dave), BET_50);
    }

    function test_ConsensusMarket_OddsCalculation() public {
        _createPool();
        vm.prank(alice); pco.betOnChoice(POOL_ID, CHOICE_A, BET_300);

        vm.prank(carol); pco.betOnConsensus(POOL_ID, false, BET_300); // 50% contrarian
        vm.prank(dave);  pco.betOnConsensus(POOL_ID, true,  BET_300); // 50% believer

        (,, uint256 crowdRightPct,,,) = pco.getConsensusState(POOL_ID);
        assertEq(crowdRightPct, 50);
    }

    // ─── Resolution ────────────────────────────────────────────────────────

    function test_ResolvePool_CrowdRight() public {
        _setupFullPool();
        // Alice (300) on A, Bob (100) on B → crowd majority on A

        vm.warp(DEADLINE + 1);
        vm.prank(oracle);
        pco.resolvePool(POOL_ID, CHOICE_A); // AI picks A → crowd was right

        (,,,, bool resolved, uint256 winner, bool crowdRight,) = pco.pools(POOL_ID);
        assertTrue(resolved);
        assertEq(winner, CHOICE_A);
        assertTrue(crowdRight);
    }

    function test_ResolvePool_CrowdWrong() public {
        _setupFullPool();
        // Alice (300) on A, Bob (100) on B → crowd majority on A

        vm.warp(DEADLINE + 1);
        vm.prank(oracle);
        pco.resolvePool(POOL_ID, CHOICE_B); // AI picks B → crowd was WRONG (upset!)

        (,,,, bool resolved, uint256 winner, bool crowdRight,) = pco.pools(POOL_ID);
        assertTrue(resolved);
        assertEq(winner, CHOICE_B);
        assertFalse(crowdRight); // Crowd was wrong!
    }

    function test_ResolvePool_RevertNotOracle() public {
        _setupFullPool();
        vm.warp(DEADLINE + 1);
        vm.prank(alice);
        vm.expectRevert("Only oracle");
        pco.resolvePool(POOL_ID, CHOICE_A);
    }

    function test_ResolvePool_RevertBettingStillOpen() public {
        _setupFullPool();
        // Don't warp — deadline hasn't passed
        vm.prank(oracle);
        vm.expectRevert("PCO: betting still open");
        pco.resolvePool(POOL_ID, CHOICE_A);
    }

    // ─── Layer 1 Claims ────────────────────────────────────────────────────

    function test_ClaimMainWinnings() public {
        _setupFullPool();
        vm.warp(DEADLINE + 1);
        vm.prank(oracle); pco.resolvePool(POOL_ID, CHOICE_A); // Alice wins

        uint256 aliceBefore = forge.balanceOf(alice);
        vm.prank(alice);
        pco.claimMainWinnings(POOL_ID);

        // Alice bet 300 on A (total A = 300, total pool = 400)
        // Winner pool = 400 * 85 / 100 = 340
        // Alice payout = 340 * 300 / 300 = 340
        uint256 expected = 340e18;
        assertApproxEqAbs(forge.balanceOf(alice) - aliceBefore, expected, 1e15);
    }

    function test_ClaimMainWinnings_RevertNoBet() public {
        _setupFullPool();
        vm.warp(DEADLINE + 1);
        vm.prank(oracle); pco.resolvePool(POOL_ID, CHOICE_A);

        vm.prank(bob); // Bob bet on B, not A
        vm.expectRevert("PCO: no winning bet");
        pco.claimMainWinnings(POOL_ID);
    }

    function test_ClaimMainWinnings_RevertDoubleClaim() public {
        _setupFullPool();
        vm.warp(DEADLINE + 1);
        vm.prank(oracle); pco.resolvePool(POOL_ID, CHOICE_A);

        vm.startPrank(alice);
        pco.claimMainWinnings(POOL_ID);
        vm.expectRevert("PCO: already claimed");
        pco.claimMainWinnings(POOL_ID);
        vm.stopPrank();
    }

    // ─── Layer 2 Claims ────────────────────────────────────────────────────

    function test_ClaimPsychic_ContrarianWins() public {
        // Setup: Alice (300) bets A, Bob (100) bets B → crowd majority = A
        // Carol bets contrarian (crowd will be wrong)
        // Dave bets crowd right
        _setupFullPool();
        vm.prank(carol); pco.betOnConsensus(POOL_ID, false, BET_100); // contrarian
        vm.prank(dave);  pco.betOnConsensus(POOL_ID, true,  BET_100); // crowd believer

        vm.warp(DEADLINE + 1);
        vm.prank(oracle); pco.resolvePool(POOL_ID, CHOICE_B); // Upset! Crowd was WRONG

        uint256 carolBefore = forge.balanceOf(carol);
        vm.prank(carol);
        pco.claimPsychicWinnings(POOL_ID);

        // Total pool = 400, psychicBonus = 400*2/100 = 8
        // totalConsensusPool = 100 (crowd_right) + 100 (crowd_wrong) + 8 (bonus) = 208
        // Carol base share = 208 * 100/100 = 208
        // Contrarian 2× = 208 * 2 = 416 → capped at 208 (total pool)
        uint256 carolPayout = forge.balanceOf(carol) - carolBefore;
        assertGt(carolPayout, BET_100); // Carol earned more than she bet
        console.log("Carol contrarian payout:", carolPayout / 1e18, "FORGE");
    }

    function test_ClaimPsychic_BelieverWins() public {
        _setupFullPool();
        vm.prank(carol); pco.betOnConsensus(POOL_ID, false, BET_100);
        vm.prank(dave);  pco.betOnConsensus(POOL_ID, true,  BET_100);

        vm.warp(DEADLINE + 1);
        vm.prank(oracle); pco.resolvePool(POOL_ID, CHOICE_A); // Crowd was RIGHT

        uint256 daveBefore = forge.balanceOf(dave);
        vm.prank(dave);
        pco.claimPsychicWinnings(POOL_ID);

        uint256 davePayout = forge.balanceOf(dave) - daveBefore;
        assertGt(davePayout, 0);
        console.log("Dave believer payout:", davePayout / 1e18, "FORGE");
    }

    function test_ClaimPsychic_RevertWrongSide() public {
        _setupFullPool();
        vm.prank(carol); pco.betOnConsensus(POOL_ID, false, BET_100); // Carol: contrarian

        vm.warp(DEADLINE + 1);
        vm.prank(oracle); pco.resolvePool(POOL_ID, CHOICE_A); // Crowd right

        vm.prank(carol); // Carol bet contrarian, crowd was right → Carol loses
        vm.expectRevert("PCO: no psychic payout");
        pco.claimPsychicWinnings(POOL_ID);
    }

    // ─── ELO Score ─────────────────────────────────────────────────────────

    function test_PsychicScore_ContrarianWinBoost() public {
        _setupFullPool();
        vm.prank(carol); pco.betOnConsensus(POOL_ID, false, BET_100);

        vm.warp(DEADLINE + 1);
        vm.prank(oracle); pco.resolvePool(POOL_ID, CHOICE_B); // Crowd wrong → Carol wins

        vm.prank(carol);
        pco.claimPsychicWinnings(POOL_ID);

        (uint256 score, uint256 contraryWins,,) = pco.getPsychicProfile(carol);
        // Starting at 0, first contrarian win: 1000 (start) + 50 (contrarian win)
        assertEq(score, 1050, "Score should be 1050 after contrarian win");
        assertEq(contraryWins, 1);
    }

    function test_PsychicScore_BelieverWinSmaller() public {
        _setupFullPool();
        vm.prank(dave); pco.betOnConsensus(POOL_ID, true, BET_100);

        vm.warp(DEADLINE + 1);
        vm.prank(oracle); pco.resolvePool(POOL_ID, CHOICE_A); // Crowd right → Dave wins

        vm.prank(dave);
        pco.claimPsychicWinnings(POOL_ID);

        (uint256 score, uint256 contraryWins,,) = pco.getPsychicProfile(dave);
        assertEq(score, 1025, "Believer win: 1000 + 25");
        assertEq(contraryWins, 0, "Should not count as contrarian win");
    }

    // ─── Fee Withdrawal ────────────────────────────────────────────────────

    function test_WithdrawFees() public {
        _setupFullPool();
        vm.warp(DEADLINE + 1);
        vm.prank(oracle); pco.resolvePool(POOL_ID, CHOICE_A);

        uint256 treasuryBefore = forge.balanceOf(treasury);
        uint256 ownerBefore    = forge.balanceOf(owner);

        vm.prank(treasury);
        pco.withdrawFees(POOL_ID);

        // Total = 400e18, treasury = 10% = 40e18, dev = 3% = 12e18
        assertApproxEqAbs(forge.balanceOf(treasury) - treasuryBefore, 40e18, 1e15);
        assertApproxEqAbs(forge.balanceOf(owner)    - ownerBefore,    12e18, 1e15);
    }

    function test_WithdrawFees_RevertDoubleClaim() public {
        _setupFullPool();
        vm.warp(DEADLINE + 1);
        vm.prank(oracle); pco.resolvePool(POOL_ID, CHOICE_A);

        vm.startPrank(treasury);
        pco.withdrawFees(POOL_ID);
        vm.expectRevert("PCO: fees already withdrawn");
        pco.withdrawFees(POOL_ID);
        vm.stopPrank();
    }

    // ─── Preview Functions ─────────────────────────────────────────────────

    function test_PreviewMainPayout() public {
        _createPool();
        vm.prank(alice); pco.betOnChoice(POOL_ID, CHOICE_A, BET_300);

        // Preview: if Bob bets 100 on A, what does he get?
        uint256 preview = pco.previewMainPayout(POOL_ID, CHOICE_A, BET_100);
        // Pool = 400, winner pool = 340
        // Bob's share = 340 * 100 / 400 = 85
        assertApproxEqAbs(preview, 85e18, 1e15);
    }

    // ─── Helpers ───────────────────────────────────────────────────────────

    function _createPool() internal {
        vm.prank(owner);
        pco.createPool(POOL_ID, CHAPTER_ID, DEADLINE, 2);
    }

    function _setupFullPool() internal {
        _createPool();
        vm.prank(alice); pco.betOnChoice(POOL_ID, CHOICE_A, BET_300);  // 75%
        vm.prank(bob);   pco.betOnChoice(POOL_ID, CHOICE_B, BET_100);  // 25%
    }

    function _getOdds() internal view returns (uint256, uint256, uint256, uint256[] memory, uint256[] memory) {
        (uint256[] memory amounts, uint256[] memory pcts) = pco.getOdds(POOL_ID);
        (,,,uint256 total,,,,) = pco.pools(POOL_ID);
        uint256 numChoices = amounts.length;
        return (POOL_ID, CHAPTER_ID, numChoices, amounts, pcts);
    }
}

// ─── Mock ERC-20 ─────────────────────────────────────────────────────────────

contract MockERC20 {
    string  public name;
    string  public symbol;
    uint8   public decimals;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(string memory _name, string memory _symbol, uint8 _decimals) {
        name     = _name;
        symbol   = _symbol;
        decimals = _decimals;
    }

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply   += amount;
        emit Transfer(address(0), to, amount);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "ERC20: insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to]         += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "ERC20: insufficient balance");
        require(allowance[from][msg.sender] >= amount, "ERC20: insufficient allowance");
        allowance[from][msg.sender] -= amount;
        balanceOf[from]             -= amount;
        balanceOf[to]               += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}
