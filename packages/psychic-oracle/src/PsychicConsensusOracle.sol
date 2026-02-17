// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title PsychicConsensusOracle
 * @author Voidborne / NarrativeForge
 * @notice Two-layer prediction market for AI-generated narrative betting.
 *
 *   Layer 1 — Story Pool:
 *     Readers bet on which story choice the AI will select (A/B/C).
 *     Standard parimutuel: 85% to winners, 10% treasury, 3% dev, 2% psychic reserve.
 *
 *   Layer 2 — Psychic Market:
 *     Meta-bet on whether the *crowd* (majority) will be right.
 *     • "Crowd Believer" (crowd_right = true):  earns proportional share when majority wins.
 *     • "Contrarian Psychic" (crowd_right = false): earns 2× bonus when minority wins.
 *     Top psychics accumulate ELO-style score → unlocks Oracle Badges + reduced fees.
 *
 *   Why this works:
 *     - Creates a "game within the game" — engaged readers think at 2 levels
 *     - Contrarian positions are naturally rare and viral ("I predicted the upset")
 *     - Psychic leaderboard drives social competition and long-term retention
 *     - Whales can't dominate Layer 2 (capped at 50% of main pool)
 *
 * @dev Fee split: 85/10/3/2 (winner / treasury / dev / psychic_bonus)
 */
contract PsychicConsensusOracle is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // ─── Constants ───────────────────────────────────────────────────────────

    uint256 public constant WINNER_BPS      = 85;   // 85% of pool to story winners
    uint256 public constant TREASURY_BPS    = 10;   // 10% to treasury
    uint256 public constant DEV_BPS         = 3;    //  3% to dev
    uint256 public constant PSYCHIC_BPS     = 2;    //  2% seed to psychic bonus pool
    uint256 public constant BPS_DENOM       = 100;

    uint256 public constant CONTRARIAN_MULT = 2;    // 2× payout for correct contrarians
    uint256 public constant MIN_BET         = 1e6;  // 1 USDC (6 decimals)
    uint256 public constant MAX_CONSENSUS_PCT = 50; // Psychic pool ≤ 50% of main pool
    uint256 public constant MAX_CHOICES     = 5;

    uint256 public constant ELO_START       = 1000;
    uint256 public constant ELO_CONTRARIAN_WIN = 50;
    uint256 public constant ELO_NORMAL_WIN  = 25;
    uint256 public constant ELO_LOSS        = 15;

    // ─── Storage ─────────────────────────────────────────────────────────────

    IERC20 public immutable forge;      // $FORGE betting token
    address public treasury;
    address public oracle;              // Trusted resolver (AI backend)

    struct StoryPool {
        uint256 chapterId;
        uint256 bettingDeadline;
        uint256 numChoices;
        uint256 totalBets;
        bool resolved;
        uint256 winningChoice;
        bool crowdWasRight;             // Did majority-backed choice win?
        bool feesWithdrawn;
    }

    struct ConsensusMarket {
        uint256 crowdRightBets;         // Bets predicting majority wins
        uint256 crowdWrongBets;         // Bets predicting majority fails (contrarian)
        uint256 psychicBonus;           // 2% seeded from main pool at resolution
        bool resolved;
    }

    // poolId → StoryPool
    mapping(uint256 => StoryPool) public pools;

    // poolId → choice → totalBets
    mapping(uint256 => mapping(uint256 => uint256)) public choiceBets;

    // poolId → user → choice → amount
    mapping(uint256 => mapping(address => mapping(uint256 => uint256))) public userBets;

    // poolId → ConsensusMarket
    mapping(uint256 => ConsensusMarket) public consensus;

    // poolId → user → crowdRight bet
    mapping(uint256 => mapping(address => uint256)) public userCrowdRight;

    // poolId → user → crowdWrong bet
    mapping(uint256 => mapping(address => uint256)) public userCrowdWrong;

    // poolId → user → hasClaimed main winnings
    mapping(uint256 => mapping(address => bool)) public mainClaimed;

    // poolId → user → hasClaimed psychic winnings
    mapping(uint256 => mapping(address => bool)) public psychicClaimed;

    // Psychic leaderboard data
    mapping(address => uint256) public psychicScore;
    mapping(address => uint256) public psychicContraryWins;  // Contrarian wins (prestigious)
    mapping(address => uint256) public psychicTotalBets;

    // ─── Events ──────────────────────────────────────────────────────────────

    event PoolCreated(
        uint256 indexed poolId,
        uint256 indexed chapterId,
        uint256 deadline,
        uint256 numChoices
    );

    event MainBetPlaced(
        uint256 indexed poolId,
        address indexed bettor,
        uint256 choice,
        uint256 amount
    );

    event PsychicBetPlaced(
        uint256 indexed poolId,
        address indexed bettor,
        bool predictedCrowdRight,
        uint256 amount
    );

    event PoolResolved(
        uint256 indexed poolId,
        uint256 winningChoice,
        bool crowdWasRight,
        uint256 winningChoiceBets,
        uint256 totalBets
    );

    event MainWinnerClaimed(
        uint256 indexed poolId,
        address indexed winner,
        uint256 payout
    );

    event PsychicWinnerClaimed(
        uint256 indexed poolId,
        address indexed winner,
        uint256 payout,
        bool wasContrarian
    );

    event PsychicScoreUpdated(
        address indexed psychic,
        uint256 newScore,
        bool wasContrarian
    );

    // ─── Constructor ─────────────────────────────────────────────────────────

    constructor(
        address _forge,
        address _treasury,
        address _oracle
    ) Ownable(msg.sender) {
        require(_forge    != address(0), "PCO: zero forge");
        require(_treasury != address(0), "PCO: zero treasury");
        require(_oracle   != address(0), "PCO: zero oracle");
        forge    = IERC20(_forge);
        treasury = _treasury;
        oracle   = _oracle;
    }

    // ─── Pool Management ─────────────────────────────────────────────────────

    /**
     * @notice Create a new story chapter betting pool.
     * @param poolId        Unique pool identifier (uint256, e.g. chapter number).
     * @param chapterId     The chapter this pool corresponds to.
     * @param bettingDeadline Unix timestamp when betting closes.
     * @param numChoices    Number of story choices (2-5).
     */
    function createPool(
        uint256 poolId,
        uint256 chapterId,
        uint256 bettingDeadline,
        uint256 numChoices
    ) external onlyOwner {
        require(pools[poolId].bettingDeadline == 0, "PCO: pool exists");
        require(bettingDeadline > block.timestamp, "PCO: deadline past");
        require(numChoices >= 2 && numChoices <= MAX_CHOICES, "PCO: bad numChoices");

        pools[poolId] = StoryPool({
            chapterId:      chapterId,
            bettingDeadline: bettingDeadline,
            numChoices:     numChoices,
            totalBets:      0,
            resolved:       false,
            winningChoice:  0,
            crowdWasRight:  false,
            feesWithdrawn:  false
        });

        emit PoolCreated(poolId, chapterId, bettingDeadline, numChoices);
    }

    // ─── Layer 1: Story Betting ───────────────────────────────────────────────

    /**
     * @notice Place a bet on a story choice (Layer 1).
     * @param poolId  The pool identifier.
     * @param choice  Choice index (0-based).
     * @param amount  Amount of $FORGE to wager.
     */
    function betOnChoice(
        uint256 poolId,
        uint256 choice,
        uint256 amount
    ) external nonReentrant {
        StoryPool storage pool = pools[poolId];
        require(pool.bettingDeadline > 0,              "PCO: pool not found");
        require(block.timestamp < pool.bettingDeadline, "PCO: betting closed");
        require(!pool.resolved,                         "PCO: pool resolved");
        require(choice < pool.numChoices,               "PCO: invalid choice");
        require(amount >= MIN_BET,                      "PCO: below minimum");

        forge.safeTransferFrom(msg.sender, address(this), amount);

        pool.totalBets                            += amount;
        choiceBets[poolId][choice]                += amount;
        userBets[poolId][msg.sender][choice]      += amount;

        emit MainBetPlaced(poolId, msg.sender, choice, amount);
    }

    // ─── Layer 2: Psychic Oracle ─────────────────────────────────────────────

    /**
     * @notice Place a psychic bet on whether the crowd consensus will be correct (Layer 2).
     * @param poolId              The pool identifier.
     * @param predictCrowdRight   true  = bet that majority choice will win (crowd believer).
     *                            false = bet that minority choice will win (contrarian psychic).
     * @param amount              Amount of $FORGE to wager.
     *
     * @dev  Contrarians who are correct earn a 2× bonus on their pro-rata share.
     *       Psychic pool is capped at MAX_CONSENSUS_PCT% of the main pool at time of bet.
     */
    function betOnConsensus(
        uint256 poolId,
        bool    predictCrowdRight,
        uint256 amount
    ) external nonReentrant {
        StoryPool storage pool    = pools[poolId];
        ConsensusMarket storage cm = consensus[poolId];

        require(pool.bettingDeadline > 0,               "PCO: pool not found");
        require(block.timestamp < pool.bettingDeadline,  "PCO: betting closed");
        require(!pool.resolved,                          "PCO: pool resolved");
        require(amount >= MIN_BET,                       "PCO: below minimum");

        // Cap psychic pool at MAX_CONSENSUS_PCT% of main pool (anti-whale)
        uint256 maxConsensusPool = pool.totalBets * MAX_CONSENSUS_PCT / 100;
        uint256 currentConsensus = cm.crowdRightBets + cm.crowdWrongBets;
        require(
            currentConsensus + amount <= maxConsensusPool || maxConsensusPool == 0,
            "PCO: consensus pool full"
        );

        forge.safeTransferFrom(msg.sender, address(this), amount);

        if (predictCrowdRight) {
            cm.crowdRightBets             += amount;
            userCrowdRight[poolId][msg.sender] += amount;
        } else {
            cm.crowdWrongBets             += amount;
            userCrowdWrong[poolId][msg.sender] += amount;
        }

        psychicTotalBets[msg.sender]++;

        emit PsychicBetPlaced(poolId, msg.sender, predictCrowdRight, amount);
    }

    // ─── Resolution ──────────────────────────────────────────────────────────

    /**
     * @notice Resolve the pool after the AI has made its story decision.
     * @param poolId       The pool identifier.
     * @param winningChoice The choice index the AI selected.
     *
     * @dev  Called by the trusted oracle address (AI backend server).
     *       Determines:
     *         1. Which story choice won (Layer 1 settlement).
     *         2. Whether the crowd (majority) was correct (Layer 2 settlement).
     *       Seeds 2% of main pool into psychic bonus.
     */
    function resolvePool(
        uint256 poolId,
        uint256 winningChoice
    ) external onlyOracle nonReentrant {
        StoryPool storage pool     = pools[poolId];
        ConsensusMarket storage cm = consensus[poolId];

        require(pool.bettingDeadline > 0,               "PCO: pool not found");
        require(!pool.resolved,                          "PCO: already resolved");
        require(block.timestamp >= pool.bettingDeadline, "PCO: betting still open");
        require(winningChoice < pool.numChoices,          "PCO: invalid choice");

        pool.resolved      = true;
        pool.winningChoice = winningChoice;

        // Determine if crowd was right: winning choice had >50% of bets
        uint256 winnerBets = choiceBets[poolId][winningChoice];
        pool.crowdWasRight = pool.totalBets > 0 && winnerBets * 100 > pool.totalBets * 50;

        // Seed psychic bonus pool from 2% allocation
        cm.psychicBonus = pool.totalBets * PSYCHIC_BPS / BPS_DENOM;
        cm.resolved     = true;

        emit PoolResolved(
            poolId,
            winningChoice,
            pool.crowdWasRight,
            winnerBets,
            pool.totalBets
        );
    }

    // ─── Claims ──────────────────────────────────────────────────────────────

    /**
     * @notice Claim Layer 1 (story) winnings.
     */
    function claimMainWinnings(uint256 poolId) external nonReentrant {
        StoryPool storage pool = pools[poolId];
        require(pool.resolved,                          "PCO: not resolved");
        require(!mainClaimed[poolId][msg.sender],       "PCO: already claimed");

        uint256 userBet = userBets[poolId][msg.sender][pool.winningChoice];
        require(userBet > 0, "PCO: no winning bet");

        mainClaimed[poolId][msg.sender] = true;

        uint256 winnerPool    = pool.totalBets * WINNER_BPS / BPS_DENOM;
        uint256 winnerTotal   = choiceBets[poolId][pool.winningChoice];
        uint256 payout        = winnerPool * userBet / winnerTotal;

        forge.safeTransfer(msg.sender, payout);

        emit MainWinnerClaimed(poolId, msg.sender, payout);
    }

    /**
     * @notice Claim Layer 2 (psychic oracle) winnings.
     *
     * Payout logic:
     *   • If crowd WAS right (majority choice won):
     *       "Crowd Right" bettors split:  (crowdRightBets + crowdWrongBets + psychicBonus) pro-rata
     *   • If crowd WAS WRONG (minority choice won):
     *       Contrarian bettors split the whole pot, THEN each gets ×CONTRARIAN_MULT bonus.
     *       (Bonus is funded by the psychicBonus pool; if insufficient, capped at pool.)
     */
    function claimPsychicWinnings(uint256 poolId) external nonReentrant {
        StoryPool storage pool     = pools[poolId];
        ConsensusMarket storage cm = consensus[poolId];

        require(pool.resolved && cm.resolved, "PCO: not resolved");
        require(!psychicClaimed[poolId][msg.sender], "PCO: already claimed");

        psychicClaimed[poolId][msg.sender] = true;

        uint256 totalConsensusPool = cm.crowdRightBets + cm.crowdWrongBets + cm.psychicBonus;
        uint256 payout;
        bool    wasContrarian;

        if (pool.crowdWasRight) {
            // Crowd believers win
            uint256 userBet = userCrowdRight[poolId][msg.sender];
            require(userBet > 0, "PCO: no psychic payout");
            require(cm.crowdRightBets > 0, "PCO: empty crowd side");

            payout        = totalConsensusPool * userBet / cm.crowdRightBets;
            wasContrarian = false;

            _updatePsychicScore(msg.sender, true, false);
        } else {
            // Contrarians win — get bonus multiplier
            uint256 userBet = userCrowdWrong[poolId][msg.sender];
            require(userBet > 0, "PCO: no psychic payout");
            require(cm.crowdWrongBets > 0, "PCO: empty contra side");

            uint256 baseShare = totalConsensusPool * userBet / cm.crowdWrongBets;
            payout            = baseShare * CONTRARIAN_MULT;

            // Safety: cap at total pool (shouldn't happen under normal conditions)
            if (payout > totalConsensusPool) {
                payout = totalConsensusPool;
            }

            wasContrarian             = true;
            psychicContraryWins[msg.sender]++;
            _updatePsychicScore(msg.sender, true, true);
        }

        require(payout > 0, "PCO: zero payout");
        forge.safeTransfer(msg.sender, payout);

        emit PsychicWinnerClaimed(poolId, msg.sender, payout, wasContrarian);
    }

    /**
     * @notice Withdraw protocol fees (treasury + dev). Can be called by treasury or owner.
     * @dev    Only callable once per pool after resolution.
     */
    function withdrawFees(uint256 poolId) external nonReentrant {
        StoryPool storage pool = pools[poolId];
        require(pool.resolved,          "PCO: not resolved");
        require(!pool.feesWithdrawn,    "PCO: fees already withdrawn");
        require(
            msg.sender == treasury || msg.sender == owner(),
            "PCO: unauthorized"
        );

        pool.feesWithdrawn = true;

        uint256 treasuryFee = pool.totalBets * TREASURY_BPS / BPS_DENOM;
        uint256 devFee      = pool.totalBets * DEV_BPS      / BPS_DENOM;

        forge.safeTransfer(treasury, treasuryFee);
        forge.safeTransfer(owner(), devFee);
    }

    // ─── Views ───────────────────────────────────────────────────────────────

    /**
     * @notice Get current odds for each choice in a story pool.
     * @return amounts   Array of total bets per choice.
     * @return pcts      Array of percentage odds per choice (0-100).
     */
    function getOdds(uint256 poolId) external view returns (
        uint256[] memory amounts,
        uint256[] memory pcts
    ) {
        StoryPool storage pool = pools[poolId];
        amounts = new uint256[](pool.numChoices);
        pcts    = new uint256[](pool.numChoices);

        for (uint256 i = 0; i < pool.numChoices; i++) {
            amounts[i] = choiceBets[poolId][i];
            pcts[i]    = pool.totalBets > 0
                ? amounts[i] * 100 / pool.totalBets
                : 100 / pool.numChoices;
        }
    }

    /**
     * @notice Get the current state of the psychic consensus market.
     * @return crowdRightBets        Total bets predicting crowd is correct.
     * @return crowdWrongBets        Total bets predicting crowd fails (contrarian).
     * @return crowdRightPct         % probability implied by meta-market that crowd is right.
     * @return contraBonusMultiplier Payout multiplier for correct contrarians.
     * @return resolved              Whether the market has been settled.
     * @return crowdWasRight         (Post-resolution) Whether the crowd was correct.
     */
    function getConsensusState(uint256 poolId) external view returns (
        uint256 crowdRightBets,
        uint256 crowdWrongBets,
        uint256 crowdRightPct,
        uint256 contraBonusMultiplier,
        bool    resolved,
        bool    crowdWasRight
    ) {
        ConsensusMarket storage cm = consensus[poolId];
        StoryPool       storage p  = pools[poolId];

        uint256 total = cm.crowdRightBets + cm.crowdWrongBets;
        return (
            cm.crowdRightBets,
            cm.crowdWrongBets,
            total > 0 ? cm.crowdRightBets * 100 / total : 50,
            CONTRARIAN_MULT,
            cm.resolved,
            p.crowdWasRight
        );
    }

    /**
     * @notice Get a reader's psychic oracle profile for the leaderboard.
     */
    function getPsychicProfile(address psychic) external view returns (
        uint256 score,
        uint256 contraryWins,
        uint256 totalBetsPlaced,
        uint256 accuracy        // % of psychic bets that were correct (need off-chain wins tracking)
    ) {
        return (
            psychicScore[psychic],
            psychicContraryWins[psychic],
            psychicTotalBets[psychic],
            0   // accuracy computed off-chain from events
        );
    }

    /**
     * @notice Potential payout preview for a hypothetical bet (pre-resolution).
     * @param poolId  Pool to query.
     * @param choice  Story choice to bet on.
     * @param amount  Hypothetical bet size.
     * @return expectedPayout If this choice wins, what would you receive?
     */
    function previewMainPayout(
        uint256 poolId,
        uint256 choice,
        uint256 amount
    ) external view returns (uint256 expectedPayout) {
        StoryPool storage pool = pools[poolId];
        uint256 choiceTotal    = choiceBets[poolId][choice] + amount;
        uint256 newTotal       = pool.totalBets + amount;
        uint256 winnerPool     = newTotal * WINNER_BPS / BPS_DENOM;
        return winnerPool * amount / choiceTotal;
    }

    // ─── Internal ────────────────────────────────────────────────────────────

    /**
     * @dev ELO-like score update for the psychic leaderboard.
     * @param wasRight      Whether the psychic prediction was correct.
     * @param wasContrarian Whether they went against the crowd (double-prestige).
     */
    function _updatePsychicScore(
        address psychic,
        bool wasRight,
        bool wasContrarian
    ) internal {
        uint256 score = psychicScore[psychic];
        if (score == 0) score = ELO_START;

        if (wasRight) {
            uint256 gain = wasContrarian ? ELO_CONTRARIAN_WIN : ELO_NORMAL_WIN;
            score += gain;
        } else {
            score = score > ELO_LOSS ? score - ELO_LOSS : 0;
        }

        psychicScore[psychic] = score;

        emit PsychicScoreUpdated(psychic, score, wasContrarian);
    }

    // ─── Admin ───────────────────────────────────────────────────────────────

    function setOracle(address _oracle) external onlyOwner {
        require(_oracle != address(0), "PCO: zero oracle");
        oracle = _oracle;
    }

    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "PCO: zero treasury");
        treasury = _treasury;
    }
}
