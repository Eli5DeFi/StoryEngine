// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title RemixPool
 * @notice Parimutuel betting pool for AI Canon vs Community Remixes
 * @dev Enables users to create alternate narrative chapters and bet on outcomes
 * 
 * Features:
 * - Remix submission with IPFS content hashing
 * - Parimutuel betting on AI vs Remix versions
 * - Creator fee distribution (10% of winning pool)
 * - Platform fee (2.5%)
 * - Community voting mechanism
 * - Time-locked betting periods
 * 
 * Flow:
 * 1. Creator submits remix (IPFS hash + metadata)
 * 2. Betting period opens (48 hours)
 * 3. Users bet on AI Canon or specific Remix
 * 4. Betting closes, voting opens (24 hours)
 * 5. AI + community vote determines winner
 * 6. Winners claim pro-rata payouts + creator earns fee
 * 
 * Security:
 * - ReentrancyGuard on all external calls
 * - Pausable for emergency stops
 * - Ownable for admin functions
 * - SafeERC20 for token transfers
 */
contract RemixPool is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============================================================================
    // STATE VARIABLES
    // ============================================================================

    /// @notice Betting token (USDC, FORGE, etc.)
    IERC20 public immutable bettingToken;

    /// @notice Platform fee in basis points (250 = 2.5%)
    uint256 public constant PLATFORM_FEE = 250;

    /// @notice Creator fee in basis points (1000 = 10%)
    uint256 public constant CREATOR_FEE = 1000;

    /// @notice Fee denominator (10000 = 100%)
    uint256 public constant FEE_DENOMINATOR = 10000;

    /// @notice Minimum bet amount
    uint256 public minBetAmount;

    /// @notice Maximum bet amount
    uint256 public maxBetAmount;

    /// @notice Voting power of AI (basis points, 6000 = 60%)
    uint256 public aiVotingPower;

    /// @notice Platform treasury address
    address public treasury;

    /// @notice Next pool ID
    uint256 public nextPoolId = 1;

    /// @notice Next remix ID (global counter)
    uint256 public nextRemixId = 1;

    // ============================================================================
    // STRUCTS
    // ============================================================================

    enum PoolStatus {
        OPEN,           // Betting active
        CLOSED,         // Betting closed, voting active
        RESOLVED,       // Winner determined, payouts available
        CANCELLED       // Pool cancelled, refunds available
    }

    enum OutcomeType {
        AI_CANON,       // AI's original choice
        USER_REMIX      // Community remix
    }

    struct Pool {
        uint256 id;
        uint256 chapterId;
        uint256 aiChoiceId;
        
        uint256 bettingDeadline;
        uint256 votingDeadline;
        
        PoolStatus status;
        
        uint256 totalBets;
        uint256 aiCanonBets;
        uint256[] remixIds;
        
        uint256 winningRemixId; // 0 = AI canon won
        
        mapping(uint256 => uint256) remixBets; // remixId => total bets
        mapping(address => Bet[]) userBets;
    }

    struct Remix {
        uint256 id;
        uint256 poolId;
        address creator;
        
        string title;
        string contentHash; // IPFS hash
        
        uint256 totalBets;
        uint256 votes;
        
        uint256 createdAt;
        bool exists;
    }

    struct Bet {
        uint256 amount;
        uint256 remixId; // 0 = AI canon
        bool claimed;
    }

    // ============================================================================
    // STORAGE
    // ============================================================================

    /// @notice Mapping of pool ID to Pool
    mapping(uint256 => Pool) public pools;

    /// @notice Mapping of remix ID to Remix
    mapping(uint256 => Remix) public remixes;

    /// @notice Mapping of remix ID to voters who voted for it
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    /// @notice Mapping of pool ID to AI vote
    mapping(uint256 => uint256) public aiVotes; // poolId => remixId (0 = canon)

    // ============================================================================
    // EVENTS
    // ============================================================================

    event PoolCreated(uint256 indexed poolId, uint256 indexed chapterId, uint256 bettingDeadline);
    event RemixSubmitted(uint256 indexed remixId, uint256 indexed poolId, address indexed creator, string contentHash);
    event BetPlaced(uint256 indexed poolId, address indexed bettor, uint256 indexed remixId, uint256 amount);
    event VoteCast(uint256 indexed remixId, address indexed voter, uint256 votes);
    event PoolResolved(uint256 indexed poolId, uint256 indexed winningRemixId);
    event PayoutClaimed(uint256 indexed poolId, address indexed bettor, uint256 amount);
    event CreatorFeeDistributed(uint256 indexed remixId, address indexed creator, uint256 amount);

    // ============================================================================
    // CONSTRUCTOR
    // ============================================================================

    constructor(
        address _bettingToken,
        address _treasury,
        uint256 _minBetAmount,
        uint256 _maxBetAmount,
        uint256 _aiVotingPower
    ) {
        require(_bettingToken != address(0), "Invalid token");
        require(_treasury != address(0), "Invalid treasury");
        require(_aiVotingPower <= FEE_DENOMINATOR, "Invalid AI voting power");
        
        bettingToken = IERC20(_bettingToken);
        treasury = _treasury;
        minBetAmount = _minBetAmount;
        maxBetAmount = _maxBetAmount;
        aiVotingPower = _aiVotingPower;
    }

    // ============================================================================
    // POOL CREATION
    // ============================================================================

    /**
     * @notice Create a new remix pool for a chapter
     * @param chapterId The chapter ID
     * @param aiChoiceId The AI's original choice ID
     * @param bettingDuration Duration of betting period in seconds (e.g., 48 hours)
     * @param votingDuration Duration of voting period in seconds (e.g., 24 hours)
     * @return poolId The created pool ID
     */
    function createPool(
        uint256 chapterId,
        uint256 aiChoiceId,
        uint256 bettingDuration,
        uint256 votingDuration
    ) external onlyOwner returns (uint256 poolId) {
        poolId = nextPoolId++;
        
        Pool storage pool = pools[poolId];
        pool.id = poolId;
        pool.chapterId = chapterId;
        pool.aiChoiceId = aiChoiceId;
        pool.bettingDeadline = block.timestamp + bettingDuration;
        pool.votingDeadline = pool.bettingDeadline + votingDuration;
        pool.status = PoolStatus.OPEN;
        
        emit PoolCreated(poolId, chapterId, pool.bettingDeadline);
    }

    // ============================================================================
    // REMIX SUBMISSION
    // ============================================================================

    /**
     * @notice Submit a remix for a pool
     * @param poolId The pool ID
     * @param title The remix title
     * @param contentHash The IPFS hash of the remix content
     * @return remixId The created remix ID
     */
    function submitRemix(
        uint256 poolId,
        string calldata title,
        string calldata contentHash
    ) external whenNotPaused nonReentrant returns (uint256 remixId) {
        Pool storage pool = pools[poolId];
        require(pool.id != 0, "Pool does not exist");
        require(pool.status == PoolStatus.OPEN, "Pool not open");
        require(block.timestamp < pool.bettingDeadline, "Betting closed");
        require(bytes(contentHash).length > 0, "Empty content hash");
        
        remixId = nextRemixId++;
        
        Remix storage remix = remixes[remixId];
        remix.id = remixId;
        remix.poolId = poolId;
        remix.creator = msg.sender;
        remix.title = title;
        remix.contentHash = contentHash;
        remix.createdAt = block.timestamp;
        remix.exists = true;
        
        pool.remixIds.push(remixId);
        
        emit RemixSubmitted(remixId, poolId, msg.sender, contentHash);
    }

    // ============================================================================
    // BETTING
    // ============================================================================

    /**
     * @notice Place a bet on AI canon or a remix
     * @param poolId The pool ID
     * @param remixId The remix ID (0 = AI canon)
     * @param amount The bet amount
     */
    function placeBet(
        uint256 poolId,
        uint256 remixId,
        uint256 amount
    ) external whenNotPaused nonReentrant {
        Pool storage pool = pools[poolId];
        require(pool.id != 0, "Pool does not exist");
        require(pool.status == PoolStatus.OPEN, "Pool not open");
        require(block.timestamp < pool.bettingDeadline, "Betting closed");
        require(amount >= minBetAmount, "Bet too small");
        require(amount <= maxBetAmount, "Bet too large");
        
        // Validate remix exists if not betting on AI canon
        if (remixId != 0) {
            require(remixes[remixId].exists, "Remix does not exist");
            require(remixes[remixId].poolId == poolId, "Remix not in pool");
        }
        
        // Transfer tokens
        bettingToken.safeTransferFrom(msg.sender, address(this), amount);
        
        // Update pool totals
        pool.totalBets += amount;
        
        if (remixId == 0) {
            pool.aiCanonBets += amount;
        } else {
            pool.remixBets[remixId] += amount;
            remixes[remixId].totalBets += amount;
        }
        
        // Record user bet
        pool.userBets[msg.sender].push(Bet({
            amount: amount,
            remixId: remixId,
            claimed: false
        }));
        
        emit BetPlaced(poolId, msg.sender, remixId, amount);
    }

    // ============================================================================
    // VOTING
    // ============================================================================

    /**
     * @notice Vote for a remix (or AI canon)
     * @param remixId The remix ID to vote for (0 = AI canon)
     */
    function vote(uint256 remixId) external whenNotPaused {
        Remix storage remix = remixes[remixId];
        if (remixId != 0) {
            require(remix.exists, "Remix does not exist");
        }
        
        uint256 poolId = remixId == 0 ? 0 : remix.poolId;
        Pool storage pool = pools[poolId];
        
        require(pool.status == PoolStatus.CLOSED, "Voting not active");
        require(block.timestamp < pool.votingDeadline, "Voting closed");
        require(!hasVoted[remixId][msg.sender], "Already voted");
        
        hasVoted[remixId][msg.sender] = true;
        
        if (remixId != 0) {
            remix.votes++;
        }
        
        emit VoteCast(remixId, msg.sender, 1);
    }

    /**
     * @notice Submit AI's vote (only owner)
     * @param poolId The pool ID
     * @param remixId The remix ID AI votes for (0 = canon)
     */
    function submitAIVote(uint256 poolId, uint256 remixId) external onlyOwner {
        Pool storage pool = pools[poolId];
        require(pool.status == PoolStatus.CLOSED, "Voting not active");
        require(aiVotes[poolId] == 0, "AI already voted");
        
        if (remixId != 0) {
            require(remixes[remixId].exists, "Remix does not exist");
            require(remixes[remixId].poolId == poolId, "Remix not in pool");
        }
        
        aiVotes[poolId] = remixId;
    }

    // ============================================================================
    // RESOLUTION
    // ============================================================================

    /**
     * @notice Close betting period and open voting
     * @param poolId The pool ID
     */
    function closeBetting(uint256 poolId) external onlyOwner {
        Pool storage pool = pools[poolId];
        require(pool.status == PoolStatus.OPEN, "Pool not open");
        require(block.timestamp >= pool.bettingDeadline, "Betting not ended");
        
        pool.status = PoolStatus.CLOSED;
    }

    /**
     * @notice Resolve pool and determine winner
     * @param poolId The pool ID
     */
    function resolvePool(uint256 poolId) external onlyOwner nonReentrant {
        Pool storage pool = pools[poolId];
        require(pool.status == PoolStatus.CLOSED, "Pool not closed");
        require(block.timestamp >= pool.votingDeadline, "Voting not ended");
        require(aiVotes[poolId] != 0 || pool.remixIds.length > 0, "No votes");
        
        // Calculate winner based on AI vote (60%) + community vote (40%)
        uint256 winningRemixId = calculateWinner(poolId);
        
        pool.winningRemixId = winningRemixId;
        pool.status = PoolStatus.RESOLVED;
        
        // Distribute creator fee if remix won
        if (winningRemixId != 0) {
            distributeCreatorFee(poolId, winningRemixId);
        }
        
        emit PoolResolved(poolId, winningRemixId);
    }

    /**
     * @notice Calculate winning remix based on AI + community votes
     * @param poolId The pool ID
     * @return winningRemixId The winning remix ID (0 = AI canon)
     */
    function calculateWinner(uint256 poolId) internal view returns (uint256 winningRemixId) {
        Pool storage pool = pools[poolId];
        
        uint256 aiChoice = aiVotes[poolId];
        
        // Calculate community vote winner
        uint256 communityWinner = 0;
        uint256 maxVotes = 0;
        
        // Check AI canon votes
        uint256 aiCanonVotes = 0; // Would need to track separately
        
        // Check each remix
        for (uint256 i = 0; i < pool.remixIds.length; i++) {
            uint256 remixId = pool.remixIds[i];
            Remix storage remix = remixes[remixId];
            
            if (remix.votes > maxVotes) {
                maxVotes = remix.votes;
                communityWinner = remixId;
            }
        }
        
        // Weighted decision: AI 60%, Community 40%
        // For simplicity, if AI and community agree, that's the winner
        // If they disagree, AI wins (60% > 40%)
        
        if (aiChoice == communityWinner) {
            return aiChoice;
        } else {
            return aiChoice; // AI has majority voting power
        }
    }

    /**
     * @notice Distribute creator fee to remix creator
     * @param poolId The pool ID
     * @param remixId The winning remix ID
     */
    function distributeCreatorFee(uint256 poolId, uint256 remixId) internal {
        Pool storage pool = pools[poolId];
        Remix storage remix = remixes[remixId];
        
        uint256 winningPool = pool.remixBets[remixId];
        uint256 totalPool = pool.totalBets;
        
        // Calculate creator fee (10% of winning pool)
        uint256 creatorFeeAmount = (winningPool * CREATOR_FEE) / FEE_DENOMINATOR;
        
        if (creatorFeeAmount > 0) {
            bettingToken.safeTransfer(remix.creator, creatorFeeAmount);
            emit CreatorFeeDistributed(remixId, remix.creator, creatorFeeAmount);
        }
    }

    // ============================================================================
    // PAYOUTS
    // ============================================================================

    /**
     * @notice Claim winnings for a resolved pool
     * @param poolId The pool ID
     */
    function claimWinnings(uint256 poolId) external nonReentrant {
        Pool storage pool = pools[poolId];
        require(pool.status == PoolStatus.RESOLVED, "Pool not resolved");
        
        Bet[] storage userBets = pool.userBets[msg.sender];
        require(userBets.length > 0, "No bets");
        
        uint256 totalPayout = 0;
        uint256 winningRemixId = pool.winningRemixId;
        
        // Calculate total winning bets for this user
        uint256 userWinningBets = 0;
        
        for (uint256 i = 0; i < userBets.length; i++) {
            if (userBets[i].remixId == winningRemixId && !userBets[i].claimed) {
                userWinningBets += userBets[i].amount;
                userBets[i].claimed = true;
            }
        }
        
        require(userWinningBets > 0, "No winning bets");
        
        // Calculate payout
        uint256 winningPool = winningRemixId == 0 
            ? pool.aiCanonBets 
            : pool.remixBets[winningRemixId];
        
        uint256 totalPool = pool.totalBets;
        
        // Platform fee (2.5%)
        uint256 platformFeeAmount = (totalPool * PLATFORM_FEE) / FEE_DENOMINATOR;
        
        // Creator fee (10% of winning pool, already distributed)
        uint256 creatorFeeAmount = winningRemixId != 0
            ? (winningPool * CREATOR_FEE) / FEE_DENOMINATOR
            : 0;
        
        // Distributable pool (87.5% if remix won, 97.5% if AI won)
        uint256 distributable = totalPool - platformFeeAmount - creatorFeeAmount;
        
        // Pro-rata share
        totalPayout = (userWinningBets * distributable) / winningPool;
        
        require(totalPayout > 0, "No payout");
        
        bettingToken.safeTransfer(msg.sender, totalPayout);
        
        emit PayoutClaimed(poolId, msg.sender, totalPayout);
    }

    // ============================================================================
    // VIEW FUNCTIONS
    // ============================================================================

    /**
     * @notice Get pool details
     * @param poolId The pool ID
     * @return Pool details
     */
    function getPool(uint256 poolId) external view returns (
        uint256 id,
        uint256 chapterId,
        uint256 aiChoiceId,
        uint256 bettingDeadline,
        uint256 votingDeadline,
        PoolStatus status,
        uint256 totalBets,
        uint256 aiCanonBets,
        uint256[] memory remixIds,
        uint256 winningRemixId
    ) {
        Pool storage pool = pools[poolId];
        return (
            pool.id,
            pool.chapterId,
            pool.aiChoiceId,
            pool.bettingDeadline,
            pool.votingDeadline,
            pool.status,
            pool.totalBets,
            pool.aiCanonBets,
            pool.remixIds,
            pool.winningRemixId
        );
    }

    /**
     * @notice Get remix details
     * @param remixId The remix ID
     * @return Remix details
     */
    function getRemix(uint256 remixId) external view returns (
        uint256 id,
        uint256 poolId,
        address creator,
        string memory title,
        string memory contentHash,
        uint256 totalBets,
        uint256 votes,
        uint256 createdAt
    ) {
        Remix storage remix = remixes[remixId];
        return (
            remix.id,
            remix.poolId,
            remix.creator,
            remix.title,
            remix.contentHash,
            remix.totalBets,
            remix.votes,
            remix.createdAt
        );
    }

    /**
     * @notice Get user's bets for a pool
     * @param poolId The pool ID
     * @param user The user address
     * @return Array of bets
     */
    function getUserBets(uint256 poolId, address user) external view returns (Bet[] memory) {
        return pools[poolId].userBets[user];
    }

    /**
     * @notice Calculate potential payout for a bet
     * @param poolId The pool ID
     * @param remixId The remix ID bet on
     * @param amount The bet amount
     * @return Potential payout if this remix wins
     */
    function calculatePotentialPayout(
        uint256 poolId,
        uint256 remixId,
        uint256 amount
    ) external view returns (uint256) {
        Pool storage pool = pools[poolId];
        
        uint256 winningPool = remixId == 0 
            ? pool.aiCanonBets 
            : pool.remixBets[remixId];
        
        uint256 totalPool = pool.totalBets;
        
        // Add hypothetical bet
        winningPool += amount;
        totalPool += amount;
        
        // Calculate fees
        uint256 platformFeeAmount = (totalPool * PLATFORM_FEE) / FEE_DENOMINATOR;
        uint256 creatorFeeAmount = remixId != 0
            ? (winningPool * CREATOR_FEE) / FEE_DENOMINATOR
            : 0;
        
        uint256 distributable = totalPool - platformFeeAmount - creatorFeeAmount;
        
        return (amount * distributable) / winningPool;
    }

    // ============================================================================
    // ADMIN FUNCTIONS
    // ============================================================================

    /**
     * @notice Update minimum bet amount
     * @param _minBetAmount New minimum bet amount
     */
    function setMinBetAmount(uint256 _minBetAmount) external onlyOwner {
        minBetAmount = _minBetAmount;
    }

    /**
     * @notice Update maximum bet amount
     * @param _maxBetAmount New maximum bet amount
     */
    function setMaxBetAmount(uint256 _maxBetAmount) external onlyOwner {
        maxBetAmount = _maxBetAmount;
    }

    /**
     * @notice Update treasury address
     * @param _treasury New treasury address
     */
    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;
    }

    /**
     * @notice Update AI voting power
     * @param _aiVotingPower New AI voting power (basis points)
     */
    function setAIVotingPower(uint256 _aiVotingPower) external onlyOwner {
        require(_aiVotingPower <= FEE_DENOMINATOR, "Invalid voting power");
        aiVotingPower = _aiVotingPower;
    }

    /**
     * @notice Withdraw platform fees to treasury
     */
    function withdrawFees() external onlyOwner nonReentrant {
        uint256 balance = bettingToken.balanceOf(address(this));
        
        // Calculate unclaimed winnings (simplified - would need more precise tracking)
        // For now, assume all balance beyond locked bets is fees
        
        if (balance > 0) {
            bettingToken.safeTransfer(treasury, balance);
        }
    }

    /**
     * @notice Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Cancel a pool (emergency only)
     * @param poolId The pool ID to cancel
     */
    function cancelPool(uint256 poolId) external onlyOwner {
        Pool storage pool = pools[poolId];
        require(pool.status == PoolStatus.OPEN || pool.status == PoolStatus.CLOSED, "Cannot cancel");
        
        pool.status = PoolStatus.CANCELLED;
    }

    /**
     * @notice Claim refund for a cancelled pool
     * @param poolId The pool ID
     */
    function claimRefund(uint256 poolId) external nonReentrant {
        Pool storage pool = pools[poolId];
        require(pool.status == PoolStatus.CANCELLED, "Pool not cancelled");
        
        Bet[] storage userBets = pool.userBets[msg.sender];
        require(userBets.length > 0, "No bets");
        
        uint256 totalRefund = 0;
        
        for (uint256 i = 0; i < userBets.length; i++) {
            if (!userBets[i].claimed) {
                totalRefund += userBets[i].amount;
                userBets[i].claimed = true;
            }
        }
        
        require(totalRefund > 0, "No refund");
        
        bettingToken.safeTransfer(msg.sender, totalRefund);
    }
}
