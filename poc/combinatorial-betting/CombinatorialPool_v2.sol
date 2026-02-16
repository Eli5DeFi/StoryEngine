// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title CombinatorialBettingPool v2
/// @notice Multi-dimensional narrative betting with anti-botting deadline protection
/// @dev Betting closes 1 hour before story generation to prevent last-minute manipulation
contract CombinatorialBettingPool is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ ENUMS ============

    enum BetType {
        PARLAY,      // All outcomes must occur (high risk, high reward)
        TEASER,      // Adjusted odds for safer bet
        ROUND_ROBIN, // Multiple parlays combined
        PROGRESSIVE  // Add legs over time
    }

    enum OutcomeType {
        STORY_CHOICE,     // Standard chapter choice
        CHARACTER_FATE,   // Character survives/dies
        RELATIONSHIP,     // Alliance formed/broken
        ITEM_DISCOVERY,   // Artifact found
        PLOT_TWIST,       // Specific event happens
        WORLD_STATE       // Global condition met
    }

    enum OutcomeStatus {
        PENDING,
        RESOLVED_TRUE,
        RESOLVED_FALSE,
        CANCELLED
    }

    // ============ STRUCTS ============

    struct Outcome {
        uint256 outcomeId;
        OutcomeType outcomeType;
        string description;
        uint256 chapterId;
        uint256 choiceId; // Optional, for STORY_CHOICE type
        OutcomeStatus status;
        uint256 resolvedAt;
        uint256 bettingDeadline; // NEW: Timestamp when betting closes (1hr before generation)
    }

    struct MultiDimensionalBet {
        address bettor;
        uint256[] outcomeIds;
        uint256 amount;
        uint256 combinedOdds; // Stored at bet time (18 decimals)
        BetType betType;
        bool settled;
        bool won;
        uint256 payout;
        uint256 timestamp;
    }

    struct ChapterSchedule {
        uint256 chapterId;
        uint256 generationTime;   // When AI generates the story
        uint256 bettingDeadline;  // generationTime - 1 hour
        bool published;
    }

    // ============ STATE ============

    IERC20 public immutable bettingToken; // USDC on Base
    
    address public treasury;
    address public operationalWallet;
    
    uint256 public constant PLATFORM_FEE_BPS = 500; // 5% for combi bets
    uint256 public constant TREASURY_SHARE = 70; // 70% of fees
    uint256 public constant OPS_SHARE = 30; // 30% of fees
    uint256 public constant BPS_DENOMINATOR = 10_000;
    uint256 public constant ODDS_DECIMALS = 1e18;
    
    // Anti-botting: Betting closes 1 hour before story generation
    uint256 public constant BETTING_DEADLINE_BUFFER = 1 hours;
    
    uint256 public nextBetId = 1;
    uint256 public nextOutcomeId = 1;
    
    uint256 public totalBetsPlaced;
    uint256 public totalVolume;
    uint256 public totalPayouts;
    
    mapping(uint256 => Outcome) public outcomes;
    mapping(uint256 => MultiDimensionalBet) public bets;
    mapping(address => uint256[]) public userBetIds;
    
    // Chapter scheduling (NEW)
    mapping(uint256 => ChapterSchedule) public chapterSchedules;
    
    // Outcome betting data (for odds calculation)
    mapping(uint256 => uint256) public outcomeTotalBets;
    mapping(uint256 => uint256) public outcomeNumBets;
    
    // Max limits for safety
    uint256 public constant MAX_OUTCOMES_PER_BET = 10;
    uint256 public constant MIN_OUTCOMES_PER_BET = 2;
    uint256 public maxBetAmount = 10_000 * 1e6; // $10,000 USDC

    // ============ EVENTS ============

    event ChapterScheduled(
        uint256 indexed chapterId,
        uint256 generationTime,
        uint256 bettingDeadline
    );
    
    event OutcomeCreated(
        uint256 indexed outcomeId,
        OutcomeType outcomeType,
        string description,
        uint256 chapterId,
        uint256 bettingDeadline
    );
    
    event CombiBetPlaced(
        uint256 indexed betId,
        address indexed bettor,
        uint256[] outcomeIds,
        uint256 amount,
        uint256 combinedOdds,
        BetType betType
    );
    
    event OutcomeResolved(
        uint256 indexed outcomeId,
        bool occurred,
        uint256 timestamp
    );
    
    event BetSettled(
        uint256 indexed betId,
        address indexed bettor,
        bool won,
        uint256 payout
    );
    
    event FeesDistributed(
        uint256 treasuryAmount,
        uint256 opsAmount
    );
    
    event BettingDeadlineExtended(
        uint256 indexed chapterId,
        uint256 oldDeadline,
        uint256 newDeadline
    );

    // ============ ERRORS ============

    error BettingClosed();
    error InvalidDeadline();
    error ChapterNotScheduled();
    error ChapterAlreadyPublished();

    // ============ CONSTRUCTOR ============

    constructor(
        address _bettingToken,
        address _treasury,
        address _operationalWallet
    ) Ownable(msg.sender) {
        require(_bettingToken != address(0), "Invalid token");
        require(_treasury != address(0), "Invalid treasury");
        require(_operationalWallet != address(0), "Invalid ops wallet");
        
        bettingToken = IERC20(_bettingToken);
        treasury = _treasury;
        operationalWallet = _operationalWallet;
    }

    // ============ CHAPTER SCHEDULING (NEW) ============

    /// @notice Schedule when a chapter will be generated (sets betting deadline automatically)
    /// @param chapterId Chapter ID
    /// @param generationTime Unix timestamp when AI will generate the story
    function scheduleChapter(
        uint256 chapterId,
        uint256 generationTime
    ) external onlyOwner {
        require(generationTime > block.timestamp, "Must be future time");
        require(!chapterSchedules[chapterId].published, "Chapter already published");
        
        uint256 deadline = generationTime - BETTING_DEADLINE_BUFFER;
        require(deadline > block.timestamp, "Deadline must be in future");
        
        chapterSchedules[chapterId] = ChapterSchedule({
            chapterId: chapterId,
            generationTime: generationTime,
            bettingDeadline: deadline,
            published: false
        });
        
        emit ChapterScheduled(chapterId, generationTime, deadline);
    }
    
    /// @notice Extend betting deadline if story generation is delayed
    /// @param chapterId Chapter ID
    /// @param newGenerationTime New generation time (must be later)
    function extendDeadline(
        uint256 chapterId,
        uint256 newGenerationTime
    ) external onlyOwner {
        ChapterSchedule storage schedule = chapterSchedules[chapterId];
        require(schedule.generationTime > 0, "Chapter not scheduled");
        require(!schedule.published, "Chapter already published");
        require(newGenerationTime > schedule.generationTime, "Must extend, not shorten");
        
        uint256 oldDeadline = schedule.bettingDeadline;
        uint256 newDeadline = newGenerationTime - BETTING_DEADLINE_BUFFER;
        
        schedule.generationTime = newGenerationTime;
        schedule.bettingDeadline = newDeadline;
        
        emit BettingDeadlineExtended(chapterId, oldDeadline, newDeadline);
    }
    
    /// @notice Mark chapter as published (prevents further schedule changes)
    /// @param chapterId Chapter ID
    function markChapterPublished(uint256 chapterId) external onlyOwner {
        ChapterSchedule storage schedule = chapterSchedules[chapterId];
        require(schedule.generationTime > 0, "Chapter not scheduled");
        schedule.published = true;
    }
    
    /// @notice Check if betting is still open for a chapter
    /// @param chapterId Chapter ID
    /// @return isOpen True if betting is allowed
    function isBettingOpen(uint256 chapterId) public view returns (bool isOpen) {
        ChapterSchedule storage schedule = chapterSchedules[chapterId];
        
        // Not scheduled = no betting
        if (schedule.generationTime == 0) return false;
        
        // Already published = no betting
        if (schedule.published) return false;
        
        // Past deadline = no betting
        if (block.timestamp >= schedule.bettingDeadline) return false;
        
        return true;
    }
    
    /// @notice Get time remaining until betting closes
    /// @param chapterId Chapter ID
    /// @return timeRemaining Seconds until deadline (0 if closed)
    function getTimeUntilDeadline(uint256 chapterId) external view returns (uint256 timeRemaining) {
        ChapterSchedule storage schedule = chapterSchedules[chapterId];
        
        if (schedule.bettingDeadline == 0 || block.timestamp >= schedule.bettingDeadline) {
            return 0;
        }
        
        return schedule.bettingDeadline - block.timestamp;
    }

    // ============ OUTCOME MANAGEMENT ============

    /// @notice Create a new outcome that users can bet on
    /// @dev Automatically inherits betting deadline from chapter schedule
    function createOutcome(
        OutcomeType outcomeType,
        string calldata description,
        uint256 chapterId,
        uint256 choiceId
    ) external onlyOwner returns (uint256 outcomeId) {
        ChapterSchedule storage schedule = chapterSchedules[chapterId];
        require(schedule.generationTime > 0, "Chapter not scheduled");
        
        outcomeId = nextOutcomeId++;
        
        outcomes[outcomeId] = Outcome({
            outcomeId: outcomeId,
            outcomeType: outcomeType,
            description: description,
            chapterId: chapterId,
            choiceId: choiceId,
            status: OutcomeStatus.PENDING,
            resolvedAt: 0,
            bettingDeadline: schedule.bettingDeadline
        });
        
        emit OutcomeCreated(outcomeId, outcomeType, description, chapterId, schedule.bettingDeadline);
    }
    
    /// @notice Resolve an outcome (set whether it occurred)
    function resolveOutcome(
        uint256 outcomeId,
        bool occurred
    ) external onlyOwner {
        Outcome storage outcome = outcomes[outcomeId];
        require(outcome.status == OutcomeStatus.PENDING, "Already resolved");
        
        outcome.status = occurred ? OutcomeStatus.RESOLVED_TRUE : OutcomeStatus.RESOLVED_FALSE;
        outcome.resolvedAt = block.timestamp;
        
        emit OutcomeResolved(outcomeId, occurred, block.timestamp);
    }

    // ============ BETTING ============

    /// @notice Place a combinatorial bet on multiple outcomes
    /// @dev Reverts if any outcome's betting window is closed
    function placeCombiBet(
        uint256[] calldata outcomeIds,
        uint256 amount,
        BetType betType
    ) external nonReentrant returns (uint256 betId) {
        require(outcomeIds.length >= MIN_OUTCOMES_PER_BET, "Need 2+ outcomes");
        require(outcomeIds.length <= MAX_OUTCOMES_PER_BET, "Max 10 outcomes");
        require(amount > 0 && amount <= maxBetAmount, "Invalid amount");
        
        // Verify all outcomes are valid, pending, AND betting is still open
        for (uint256 i = 0; i < outcomeIds.length; i++) {
            Outcome storage outcome = outcomes[outcomeIds[i]];
            require(outcome.outcomeId != 0, "Invalid outcome");
            require(outcome.status == OutcomeStatus.PENDING, "Outcome resolved");
            
            // ANTI-BOTTING CHECK: Ensure betting deadline hasn't passed
            if (block.timestamp >= outcome.bettingDeadline) {
                revert BettingClosed();
            }
        }
        
        // Calculate combined odds
        uint256 combinedOdds = calculateCombinedOdds(outcomeIds);
        
        // Store bet
        betId = nextBetId++;
        bets[betId] = MultiDimensionalBet({
            bettor: msg.sender,
            outcomeIds: outcomeIds,
            amount: amount,
            combinedOdds: combinedOdds,
            betType: betType,
            settled: false,
            won: false,
            payout: 0,
            timestamp: block.timestamp
        });
        
        userBetIds[msg.sender].push(betId);
        
        // Update outcome totals (for odds calculation)
        for (uint256 i = 0; i < outcomeIds.length; i++) {
            outcomeTotalBets[outcomeIds[i]] += amount;
            outcomeNumBets[outcomeIds[i]]++;
        }
        
        // Update global stats
        totalBetsPlaced++;
        totalVolume += amount;
        
        // Transfer tokens
        bettingToken.safeTransferFrom(msg.sender, address(this), amount);
        
        emit CombiBetPlaced(betId, msg.sender, outcomeIds, amount, combinedOdds, betType);
    }
    
    /// @notice Calculate combined odds for a set of outcomes
    function calculateCombinedOdds(
        uint256[] calldata outcomeIds
    ) public view returns (uint256) {
        uint256 odds = ODDS_DECIMALS; // Start at 1.0 (18 decimals)
        
        for (uint256 i = 0; i < outcomeIds.length; i++) {
            uint256 outcomeOdds = getOddsForOutcome(outcomeIds[i]);
            odds = (odds * outcomeOdds) / ODDS_DECIMALS;
        }
        
        return odds;
    }
    
    /// @notice Get current odds for a single outcome
    function getOddsForOutcome(uint256 outcomeId) public view returns (uint256) {
        Outcome storage outcome = outcomes[outcomeId];
        require(outcome.outcomeId != 0, "Invalid outcome");
        
        // Simple parimutuel odds: Total pool / Outcome pool
        // If no bets yet, default to 2.0x odds
        uint256 totalBets = outcomeTotalBets[outcomeId];
        if (totalBets == 0) {
            return 2 * ODDS_DECIMALS; // 2.0x default
        }
        
        // Calculate odds based on bet distribution
        uint256 numBets = outcomeNumBets[outcomeId];
        if (numBets == 0) return 2 * ODDS_DECIMALS;
        
        // More bets = lower odds (more likely)
        // Fewer bets = higher odds (less likely)
        uint256 baseOdds = (totalBets * ODDS_DECIMALS) / (totalBets + 1e6);
        return baseOdds < ODDS_DECIMALS ? ODDS_DECIMALS : baseOdds;
    }

    // ============ SETTLEMENT ============

    /// @notice Settle a bet after all outcomes are resolved
    function settleBet(uint256 betId) external nonReentrant {
        MultiDimensionalBet storage bet = bets[betId];
        require(!bet.settled, "Already settled");
        
        // Check if ALL outcomes in the bet are resolved
        bool allResolved = true;
        bool allHit = true;
        
        for (uint256 i = 0; i < bet.outcomeIds.length; i++) {
            Outcome storage outcome = outcomes[bet.outcomeIds[i]];
            
            if (outcome.status == OutcomeStatus.PENDING) {
                allResolved = false;
                break;
            }
            
            if (bet.betType == BetType.PARLAY) {
                // For PARLAY, ALL outcomes must be RESOLVED_TRUE
                if (outcome.status != OutcomeStatus.RESOLVED_TRUE) {
                    allHit = false;
                }
            }
        }
        
        require(allResolved, "Not all outcomes resolved");
        
        bet.settled = true;
        bet.won = allHit;
        
        if (allHit) {
            // Calculate gross payout
            uint256 grossPayout = (bet.amount * bet.combinedOdds) / ODDS_DECIMALS;
            
            // Deduct platform fee (5%)
            uint256 platformFee = (grossPayout * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
            uint256 netPayout = grossPayout - platformFee;
            
            bet.payout = netPayout;
            totalPayouts += netPayout;
            
            // Distribute fees
            uint256 treasuryFee = (platformFee * TREASURY_SHARE) / 100;
            uint256 opsFee = platformFee - treasuryFee;
            
            bettingToken.safeTransfer(treasury, treasuryFee);
            bettingToken.safeTransfer(operationalWallet, opsFee);
            
            emit FeesDistributed(treasuryFee, opsFee);
            
            // Pay bettor
            bettingToken.safeTransfer(bet.bettor, netPayout);
        }
        
        emit BetSettled(betId, bet.bettor, allHit, bet.payout);
    }
    
    /// @notice Batch settle multiple bets
    function settleBetBatch(uint256[] calldata betIds) external {
        for (uint256 i = 0; i < betIds.length; i++) {
            // Use try/catch to continue even if one fails
            try this.settleBet(betIds[i]) {} catch {}
        }
    }

    // ============ VIEW FUNCTIONS ============

    /// @notice Get chapter schedule details
    function getChapterSchedule(uint256 chapterId) external view returns (
        uint256 generationTime,
        uint256 bettingDeadline,
        bool published,
        bool bettingOpen
    ) {
        ChapterSchedule storage schedule = chapterSchedules[chapterId];
        return (
            schedule.generationTime,
            schedule.bettingDeadline,
            schedule.published,
            isBettingOpen(chapterId)
        );
    }
    
    /// @notice Get user's bet history
    function getUserBets(address user) external view returns (uint256[] memory) {
        return userBetIds[user];
    }
    
    /// @notice Get bet details
    function getBet(uint256 betId) external view returns (
        address bettor,
        uint256[] memory outcomeIds,
        uint256 amount,
        uint256 combinedOdds,
        BetType betType,
        bool settled,
        bool won,
        uint256 payout
    ) {
        MultiDimensionalBet storage bet = bets[betId];
        return (
            bet.bettor,
            bet.outcomeIds,
            bet.amount,
            bet.combinedOdds,
            bet.betType,
            bet.settled,
            bet.won,
            bet.payout
        );
    }
    
    /// @notice Get outcome details
    function getOutcome(uint256 outcomeId) external view returns (
        OutcomeType outcomeType,
        string memory description,
        uint256 chapterId,
        OutcomeStatus status,
        uint256 totalBets,
        uint256 numBets,
        uint256 bettingDeadline
    ) {
        Outcome storage outcome = outcomes[outcomeId];
        return (
            outcome.outcomeType,
            outcome.description,
            outcome.chapterId,
            outcome.status,
            outcomeTotalBets[outcomeId],
            outcomeNumBets[outcomeId],
            outcome.bettingDeadline
        );
    }
    
    /// @notice Get platform statistics
    function getStats() external view returns (
        uint256 _totalBetsPlaced,
        uint256 _totalVolume,
        uint256 _totalPayouts,
        uint256 _activeBets
    ) {
        return (
            totalBetsPlaced,
            totalVolume,
            totalPayouts,
            nextBetId - 1 - totalBetsPlaced
        );
    }

    // ============ ADMIN FUNCTIONS ============

    function setMaxBetAmount(uint256 newMax) external onlyOwner {
        maxBetAmount = newMax;
    }
    
    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid address");
        treasury = newTreasury;
    }
    
    function setOperationalWallet(address newOpsWallet) external onlyOwner {
        require(newOpsWallet != address(0), "Invalid address");
        operationalWallet = newOpsWallet;
    }
    
    /// @notice Emergency withdrawal (only if critical bug)
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = bettingToken.balanceOf(address(this));
        bettingToken.safeTransfer(owner(), balance);
    }
}
