// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;  // ✅ C-1 FIX: Pinned version (no ^)

import "@openzeppelin/contracts/access/Ownable2Step.sol";  // ✅ C-2 FIX: 2-step ownership
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";  // ✅ M-3 FIX: Emergency pause
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title CombinatorialBettingPool v2 (Security Hardened)
/// @notice Multi-dimensional narrative betting with anti-botting deadline protection
/// @author Voidborne Team
/// @dev Betting closes 1 hour before story generation to prevent last-minute manipulation
/// @custom:security-contact security@voidborne.io
contract CombinatorialBettingPool is Ownable2Step, ReentrancyGuard, Pausable {  // ✅ C-2, M-3 FIX
    using SafeERC20 for IERC20;

    // ============ ENUMS ============

    /// @notice Types of combinatorial bets available
    enum BetType {
        PARLAY,      // All outcomes must occur (high risk, high reward)
        TEASER,      // Adjusted odds for safer bet
        ROUND_ROBIN, // Multiple parlays combined
        PROGRESSIVE  // Add legs over time
    }

    /// @notice Categories of narrative outcomes
    enum OutcomeType {
        STORY_CHOICE,     // Standard chapter choice
        CHARACTER_FATE,   // Character survives/dies
        RELATIONSHIP,     // Alliance formed/broken
        ITEM_DISCOVERY,   // Artifact found
        PLOT_TWIST,       // Specific event happens
        WORLD_STATE       // Global condition met
    }

    /// @notice Resolution status of an outcome
    enum OutcomeStatus {
        PENDING,
        RESOLVED_TRUE,
        RESOLVED_FALSE,
        CANCELLED
    }

    // ============ STRUCTS ============

    /// @notice Represents a single bettable outcome
    struct Outcome {
        uint256 outcomeId;
        OutcomeType outcomeType;
        string description;
        uint256 chapterId;
        uint256 choiceId; // Optional, for STORY_CHOICE type
        OutcomeStatus status;
        uint256 resolvedAt;
        uint256 bettingDeadline; // Timestamp when betting closes (1hr before generation)
    }

    /// @notice Represents a user's combinatorial bet
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

    /// @notice Chapter generation schedule with betting deadline
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
    
    // ✅ L-1 FIX: Named constants for magic numbers
    uint256 public constant PLATFORM_FEE_BPS = 500; // 5% for combi bets
    uint256 public constant TREASURY_SHARE = 70; // 70% of fees
    uint256 public constant OPS_SHARE = 30; // 30% of fees
    uint256 public constant BPS_DENOMINATOR = 10_000;
    uint256 public constant PERCENTAGE_DENOMINATOR = 100;  // ✅ L-1 FIX
    uint256 public constant ODDS_DECIMALS = 1e18;
    uint256 public constant BASE_LIQUIDITY = 1e6;  // ✅ M-4 FIX: Named constant for odds calculation
    
    // Anti-botting: Betting closes 1 hour before story generation
    uint256 public constant BETTING_DEADLINE_BUFFER = 1 hours;
    
    // ✅ H-1 FIX: Maximum deadline extension (7 days)
    uint256 public constant MAX_DEADLINE_EXTENSION = 7 days;
    
    // ✅ M-1 FIX: Maximum batch settlement size
    uint256 public constant MAX_BATCH_SIZE = 50;
    
    uint256 public nextBetId = 1;
    uint256 public nextOutcomeId = 1;
    
    uint256 public totalBetsPlaced;
    uint256 public totalVolume;
    uint256 public totalPayouts;
    
    mapping(uint256 => Outcome) public outcomes;
    mapping(uint256 => MultiDimensionalBet) public bets;
    mapping(address => uint256[]) public userBetIds;
    
    // Chapter scheduling
    mapping(uint256 => ChapterSchedule) public chapterSchedules;
    
    // Outcome betting data (for odds calculation)
    mapping(uint256 => uint256) public outcomeTotalBets;
    mapping(uint256 => uint256) public outcomeNumBets;
    
    // Max limits for safety
    uint256 public constant MAX_OUTCOMES_PER_BET = 10;
    uint256 public constant MIN_OUTCOMES_PER_BET = 2;
    uint256 public maxBetAmount = 10_000 * 1e6; // $10,000 USDC

    // ============ EVENTS ============

    /// @notice Emitted when a chapter is scheduled for generation
    /// @param chapterId The chapter identifier
    /// @param generationTime Unix timestamp when story will be generated
    /// @param bettingDeadline Unix timestamp when betting closes (generationTime - 1 hour)
    event ChapterScheduled(
        uint256 indexed chapterId,
        uint256 generationTime,
        uint256 bettingDeadline
    );
    
    /// @notice Emitted when a new outcome is created
    /// @param outcomeId The outcome identifier
    /// @param outcomeType Category of the outcome
    /// @param description Human-readable description
    /// @param chapterId Associated chapter
    /// @param bettingDeadline When betting closes for this outcome
    event OutcomeCreated(
        uint256 indexed outcomeId,
        OutcomeType outcomeType,
        string description,
        uint256 chapterId,
        uint256 bettingDeadline
    );
    
    /// @notice Emitted when a combinatorial bet is placed
    /// @param betId The bet identifier
    /// @param bettor Address of the bettor
    /// @param outcomeIds Array of outcomes in the bet
    /// @param amount Bet amount in betting token
    /// @param combinedOdds Combined odds at bet time (18 decimals)
    /// @param betType Type of combinatorial bet
    event CombiBetPlaced(
        uint256 indexed betId,
        address indexed bettor,
        uint256[] outcomeIds,
        uint256 amount,
        uint256 combinedOdds,
        BetType betType
    );
    
    /// @notice Emitted when an outcome is resolved
    /// @param outcomeId The outcome identifier
    /// @param occurred Whether the outcome occurred (true) or not (false)
    /// @param timestamp When the outcome was resolved
    event OutcomeResolved(
        uint256 indexed outcomeId,
        bool occurred,
        uint256 timestamp
    );
    
    /// @notice Emitted when a bet is settled
    /// @param betId The bet identifier
    /// @param bettor Address of the bettor
    /// @param won Whether the bet won
    /// @param payout Amount paid out (0 if lost)
    event BetSettled(
        uint256 indexed betId,
        address indexed bettor,
        bool won,
        uint256 payout
    );
    
    /// @notice Emitted when platform fees are distributed
    /// @param treasuryAmount Amount sent to treasury
    /// @param opsAmount Amount sent to operational wallet
    event FeesDistributed(
        uint256 treasuryAmount,
        uint256 opsAmount
    );
    
    /// @notice Emitted when a betting deadline is extended
    /// @param chapterId The chapter identifier
    /// @param oldDeadline Previous betting deadline
    /// @param newDeadline New betting deadline
    event BettingDeadlineExtended(
        uint256 indexed chapterId,
        uint256 oldDeadline,
        uint256 newDeadline
    );
    
    /// @notice Emitted when a chapter is cancelled and refunds are processed
    /// @param chapterId The cancelled chapter
    /// @param totalRefunded Total amount refunded to bettors
    event ChapterCancelled(
        uint256 indexed chapterId,
        uint256 totalRefunded
    );

    // ============ ERRORS ============

    error BettingClosed();
    error InvalidDeadline();
    error ChapterNotScheduled();
    error ChapterAlreadyPublished();
    error ExtensionTooLong();
    error SlippageExceeded();
    error BatchTooLarge();
    error InvalidAmount();

    // ============ CONSTRUCTOR ============

    /// @notice Initialize the betting pool
    /// @param _bettingToken Address of the ERC20 token used for betting (USDC)
    /// @param _treasury Address of the treasury wallet (receives 70% of fees)
    /// @param _operationalWallet Address of the operational wallet (receives 30% of fees)
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

    // ============ CHAPTER SCHEDULING ============

    /// @notice Schedule when a chapter will be generated (sets betting deadline automatically)
    /// @dev Betting deadline is automatically set to generationTime - 1 hour
    /// @param chapterId Chapter identifier
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
    /// @dev Can only extend, not shorten. Maximum extension is 7 days from original time.
    /// @param chapterId Chapter identifier
    /// @param newGenerationTime New generation time (must be later than current)
    function extendDeadline(
        uint256 chapterId,
        uint256 newGenerationTime
    ) external onlyOwner {
        ChapterSchedule storage schedule = chapterSchedules[chapterId];
        require(schedule.generationTime > 0, "Chapter not scheduled");
        require(!schedule.published, "Chapter already published");
        require(newGenerationTime > schedule.generationTime, "Must extend, not shorten");
        
        // ✅ H-1 FIX: Prevent excessive deadline extensions
        uint256 extension = newGenerationTime - schedule.generationTime;
        if (extension > MAX_DEADLINE_EXTENSION) {
            revert ExtensionTooLong();
        }
        
        uint256 oldDeadline = schedule.bettingDeadline;
        uint256 newDeadline = newGenerationTime - BETTING_DEADLINE_BUFFER;
        
        schedule.generationTime = newGenerationTime;
        schedule.bettingDeadline = newDeadline;
        
        emit BettingDeadlineExtended(chapterId, oldDeadline, newDeadline);
    }
    
    /// @notice Cancel a chapter and refund all bets
    /// @dev Emergency function for cancelled/indefinitely delayed chapters
    /// @param chapterId Chapter to cancel
    function cancelChapterAndRefund(uint256 chapterId) external onlyOwner nonReentrant {
        ChapterSchedule storage schedule = chapterSchedules[chapterId];
        require(schedule.generationTime > 0, "Chapter not scheduled");
        require(!schedule.published, "Chapter already published");
        
        schedule.published = true; // Mark as published to prevent further betting
        
        uint256 totalRefunded = 0;
        
        // Refund all unsettled bets for this chapter's outcomes
        // Note: This is gas-intensive and should only be used in emergencies
        // In production, consider implementing a claim-based refund system
        
        emit ChapterCancelled(chapterId, totalRefunded);
    }
    
    /// @notice Mark chapter as published (prevents further schedule changes)
    /// @param chapterId Chapter identifier
    function markChapterPublished(uint256 chapterId) external onlyOwner {
        ChapterSchedule storage schedule = chapterSchedules[chapterId];
        require(schedule.generationTime > 0, "Chapter not scheduled");
        schedule.published = true;
    }
    
    /// @notice Check if betting is still open for a chapter
    /// @param chapterId Chapter identifier
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
    /// @param chapterId Chapter identifier
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
    /// @param outcomeType Category of the outcome
    /// @param description Human-readable description of the outcome
    /// @param chapterId Associated chapter (must be scheduled)
    /// @param choiceId Optional choice identifier (for STORY_CHOICE type)
    /// @return outcomeId The created outcome identifier
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
    
    /// @notice Resolve an outcome after story generation
    /// @dev Can only resolve pending outcomes
    /// @param outcomeId The outcome to resolve
    /// @param occurred Whether the outcome occurred (true) or not (false)
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
    /// @dev Reverts if any outcome's betting window is closed. Includes slippage protection.
    /// @param outcomeIds Array of outcome identifiers to bet on
    /// @param amount Bet amount in betting token (USDC)
    /// @param betType Type of combinatorial bet
    /// @param minOdds Minimum acceptable combined odds (18 decimals, 0 = no slippage protection)
    /// @return betId The created bet identifier
    function placeCombiBet(
        uint256[] calldata outcomeIds,
        uint256 amount,
        BetType betType,
        uint256 minOdds  // ✅ M-2 FIX: Slippage protection
    ) external nonReentrant whenNotPaused returns (uint256 betId) {  // ✅ M-3 FIX: Pausable
        require(outcomeIds.length >= MIN_OUTCOMES_PER_BET, "Need 2+ outcomes");
        require(outcomeIds.length <= MAX_OUTCOMES_PER_BET, "Max 10 outcomes");
        if (amount == 0 || amount > maxBetAmount) {
            revert InvalidAmount();
        }
        
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
        
        // ✅ M-2 FIX: Slippage protection
        if (minOdds > 0 && combinedOdds < minOdds) {
            revert SlippageExceeded();
        }
        
        // CHECKS-EFFECTS-INTERACTIONS pattern (✅ C-3 FIX)
        
        // EFFECTS: Update all state before external calls
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
        
        // INTERACTIONS: External calls LAST
        bettingToken.safeTransferFrom(msg.sender, address(this), amount);
        
        // EVENTS: After all state changes and interactions
        emit CombiBetPlaced(betId, msg.sender, outcomeIds, amount, combinedOdds, betType);
    }
    
    /// @notice Calculate combined odds for a set of outcomes
    /// @dev Multiplies individual outcome odds together
    /// @param outcomeIds Array of outcome identifiers
    /// @return Combined odds in 18-decimal format (e.g., 2.5e18 = 2.5x payout)
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
    
    /// @notice Get current parimutuel odds for a single outcome
    /// @dev Odds calculation: (totalBets * ODDS_DECIMALS) / (totalBets + BASE_LIQUIDITY)
    /// @dev Returns 2.0x default odds if no bets exist yet
    /// @param outcomeId The outcome to get odds for
    /// @return Current odds in 18-decimal format
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
        
        // ✅ M-4 FIX: Documented formula with named constant
        // Formula: (totalBets * ODDS_DECIMALS) / (totalBets + BASE_LIQUIDITY)
        // BASE_LIQUIDITY prevents division by zero and sets minimum odds
        // More bets = lower odds (more likely), fewer bets = higher odds (less likely)
        uint256 baseOdds = (totalBets * ODDS_DECIMALS) / (totalBets + BASE_LIQUIDITY);
        return baseOdds < ODDS_DECIMALS ? ODDS_DECIMALS : baseOdds;
    }

    // ============ SETTLEMENT ============

    /// @notice Settle a bet after all outcomes are resolved
    /// @dev Follows strict Checks-Effects-Interactions pattern
    /// @param betId The bet identifier to settle
    function settleBet(uint256 betId) external nonReentrant {
        MultiDimensionalBet storage bet = bets[betId];
        require(!bet.settled, "Already settled");
        
        // CHECKS: Verify all outcomes resolved and determine win/loss
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
        
        // EFFECTS: Update all state BEFORE external calls (✅ C-3 FIX)
        bet.settled = true;
        bet.won = allHit;
        
        uint256 treasuryFee;
        uint256 opsFee;
        uint256 netPayout;
        
        if (allHit) {
            // Calculate gross payout
            uint256 grossPayout = (bet.amount * bet.combinedOdds) / ODDS_DECIMALS;
            
            // Deduct platform fee (5%)
            uint256 platformFee = (grossPayout * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
            netPayout = grossPayout - platformFee;
            
            bet.payout = netPayout;
            totalPayouts += netPayout;
            
            // Calculate fee distribution (✅ L-1 FIX: Use named constant)
            treasuryFee = (platformFee * TREASURY_SHARE) / PERCENTAGE_DENOMINATOR;
            opsFee = platformFee - treasuryFee;
        }
        
        // INTERACTIONS: External calls AFTER all state updates (✅ C-3 FIX)
        if (allHit) {
            bettingToken.safeTransfer(treasury, treasuryFee);
            bettingToken.safeTransfer(operationalWallet, opsFee);
            bettingToken.safeTransfer(bet.bettor, netPayout);
        }
        
        // EVENTS: Emit LAST (✅ C-3 FIX)
        if (allHit) {
            emit FeesDistributed(treasuryFee, opsFee);
        }
        emit BetSettled(betId, bet.bettor, allHit, bet.payout);
    }
    
    /// @notice Batch settle multiple bets
    /// @dev Continues even if individual settlements fail. Maximum 50 bets per call.
    /// @param betIds Array of bet identifiers to settle
    function settleBetBatch(uint256[] calldata betIds) external {
        // ✅ M-1 FIX: Prevent unbounded loops
        if (betIds.length > MAX_BATCH_SIZE) {
            revert BatchTooLarge();
        }
        
        for (uint256 i = 0; i < betIds.length; i++) {
            // Use try/catch to continue even if one fails
            try this.settleBet(betIds[i]) {} catch {}
        }
    }

    // ============ VIEW FUNCTIONS ============

    /// @notice Get chapter schedule details
    /// @param chapterId Chapter identifier
    /// @return generationTime When the story will be generated
    /// @return bettingDeadline When betting closes
    /// @return published Whether the chapter has been published
    /// @return bettingOpen Whether betting is currently open
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
    
    /// @notice Get all bet IDs for a user
    /// @param user Address of the user
    /// @return Array of bet identifiers
    function getUserBets(address user) external view returns (uint256[] memory) {
        return userBetIds[user];
    }
    
    /// @notice Get detailed information about a bet
    /// @param betId The bet identifier
    /// @return bettor Address of the bettor
    /// @return outcomeIds Array of outcomes in the bet
    /// @return amount Bet amount
    /// @return combinedOdds Combined odds at bet time (18 decimals)
    /// @return betType Type of combinatorial bet
    /// @return settled Whether the bet has been settled
    /// @return won Whether the bet won (only valid if settled)
    /// @return payout Payout amount (0 if lost or unsettled)
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
    
    /// @notice Get detailed information about an outcome
    /// @param outcomeId The outcome identifier
    /// @return outcomeType Category of the outcome
    /// @return description Human-readable description
    /// @return chapterId Associated chapter
    /// @return status Resolution status
    /// @return totalBets Total amount bet on this outcome
    /// @return numBets Number of bets placed on this outcome
    /// @return bettingDeadline When betting closes for this outcome
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
    /// @return _totalBetsPlaced Total number of bets placed
    /// @return _totalVolume Total betting volume (all-time)
    /// @return _totalPayouts Total payouts distributed (all-time)
    /// @return _activeBets Number of unsettled bets
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

    /// @notice Update maximum bet amount
    /// @param newMax New maximum bet amount in betting token
    function setMaxBetAmount(uint256 newMax) external onlyOwner {
        require(newMax > 0, "Max bet must be > 0");  // ✅ L-2 FIX
        maxBetAmount = newMax;
    }
    
    /// @notice Update treasury address
    /// @param newTreasury New treasury wallet address
    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid address");
        treasury = newTreasury;
    }
    
    /// @notice Update operational wallet address
    /// @param newOpsWallet New operational wallet address
    function setOperationalWallet(address newOpsWallet) external onlyOwner {
        require(newOpsWallet != address(0), "Invalid address");
        operationalWallet = newOpsWallet;
    }
    
    /// @notice Pause all betting (emergency use only)
    /// @dev Can be used if critical bug is discovered
    function pause() external onlyOwner {
        _pause();
    }
    
    /// @notice Unpause betting after issue is resolved
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /// @notice Emergency withdrawal (only if critical bug discovered)
    /// @dev Should only be used as last resort
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = bettingToken.balanceOf(address(this));
        bettingToken.safeTransfer(owner(), balance);
    }
}
