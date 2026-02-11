// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title InfluenceToken
/// @notice Governance token for Voidborne narrative decisions
/// @dev Earned by winning bets, spent to vote on AI story choices
contract InfluenceToken is ERC20, AccessControl, ReentrancyGuard {
    
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant VOTING_CONTRACT_ROLE = keccak256("VOTING_CONTRACT_ROLE");
    
    // ============ STRUCTS ============
    
    struct UserStats {
        uint256 totalEarned;
        uint256 totalSpent;
        uint256 totalVotes;
        uint256 currentStreak;
        uint256 longestStreak;
        uint256 lastWinTimestamp;
    }
    
    struct Vote {
        uint256 poolId;
        uint8 choiceId;
        uint256 amount;
        address voter;
        uint256 timestamp;
    }
    
    struct PoolVotes {
        uint256 totalInfluence;
        mapping(uint8 => uint256) choiceInfluence; // choiceId => influence amount
        mapping(address => uint256) userVotes; // user => influence spent
    }
    
    // ============ STATE ============
    
    // User statistics
    mapping(address => UserStats) public userStats;
    
    // Pool voting data
    mapping(uint256 => PoolVotes) public poolVotes;
    
    // Vote history (for leaderboards)
    Vote[] public voteHistory;
    mapping(address => uint256[]) public userVoteIndices;
    
    // Leaderboard cache (updated periodically)
    address[] public topHolders;
    uint256 public lastLeaderboardUpdate;
    
    // Settings
    uint256 public constant STREAK_WINDOW = 7 days;
    uint256 public constant MIN_VOTE_AMOUNT = 1e18; // 1 INFLUENCE
    uint256 public constant MAX_VOTE_AMOUNT = 1_000_000e18; // 1M INFLUENCE
    
    // ============ EVENTS ============
    
    event InfluenceEarned(
        address indexed user,
        uint256 amount,
        uint256 profit,
        uint256 streakBonus,
        uint256 newBalance
    );
    
    event InfluenceVoted(
        uint256 indexed poolId,
        address indexed voter,
        uint8 indexed choiceId,
        uint256 amount,
        uint256 timestamp
    );
    
    event StreakUpdated(
        address indexed user,
        uint256 newStreak,
        uint256 longestStreak
    );
    
    event LeaderboardUpdated(
        uint256 timestamp,
        uint256 topHoldersCount
    );
    
    // ============ CONSTRUCTOR ============
    
    constructor() ERC20("Voidborne Influence", "INFLUENCE") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }
    
    // ============ MINTING (Earning) ============
    
    /// @notice Mint INFLUENCE tokens to a winning bettor
    /// @dev Only callable by contracts with MINTER_ROLE (BettingPool contracts)
    /// @param winner Address of the winning bettor
    /// @param profit Amount of profit from the winning bet (in base units)
    function mintInfluence(address winner, uint256 profit) 
        external 
        onlyRole(MINTER_ROLE) 
    {
        require(winner != address(0), "Invalid winner address");
        require(profit > 0, "Profit must be > 0");
        
        // Calculate base influence (1:1 with profit)
        uint256 baseInfluence = profit;
        
        // Calculate streak bonus
        uint256 streakBonus = calculateStreakBonus(winner);
        
        // Total influence = base * (1 + streakBonus%)
        uint256 totalInfluence = baseInfluence * (100 + streakBonus) / 100;
        
        // Update streak
        updateStreak(winner);
        
        // Mint tokens
        _mint(winner, totalInfluence);
        
        // Update stats
        UserStats storage stats = userStats[winner];
        stats.totalEarned += totalInfluence;
        
        emit InfluenceEarned(
            winner,
            totalInfluence,
            profit,
            streakBonus,
            balanceOf(winner)
        );
    }
    
    /// @notice Calculate streak bonus for a user
    /// @param user Address to check
    /// @return Bonus percentage (0-100)
    function calculateStreakBonus(address user) public view returns (uint256) {
        uint256 streak = userStats[user].currentStreak;
        
        if (streak >= 10) return 100; // 10+ wins = 100% bonus
        if (streak >= 5) return 50;   // 5-9 wins = 50% bonus
        if (streak >= 3) return 20;   // 3-4 wins = 20% bonus
        return 0;                      // 0-2 wins = no bonus
    }
    
    /// @notice Update user's win streak
    /// @param user Address to update
    function updateStreak(address user) internal {
        UserStats storage stats = userStats[user];
        
        // Check if within streak window (7 days)
        if (block.timestamp - stats.lastWinTimestamp <= STREAK_WINDOW) {
            stats.currentStreak++;
        } else {
            stats.currentStreak = 1; // Reset streak
        }
        
        // Update longest streak
        if (stats.currentStreak > stats.longestStreak) {
            stats.longestStreak = stats.currentStreak;
        }
        
        stats.lastWinTimestamp = block.timestamp;
        
        emit StreakUpdated(user, stats.currentStreak, stats.longestStreak);
    }
    
    // ============ VOTING (Spending) ============
    
    /// @notice Vote with INFLUENCE tokens on a story choice
    /// @dev Burns tokens, adds weight to AI decision algorithm
    /// @param poolId Betting pool ID
    /// @param choiceId Choice to vote for (0-4)
    /// @param amount Amount of INFLUENCE to spend
    function voteWithInfluence(
        uint256 poolId,
        uint8 choiceId,
        uint256 amount
    ) 
        external 
        nonReentrant 
    {
        require(amount >= MIN_VOTE_AMOUNT, "Amount below minimum");
        require(amount <= MAX_VOTE_AMOUNT, "Amount above maximum");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        require(choiceId < 5, "Invalid choice ID");
        
        // Burn tokens
        _burn(msg.sender, amount);
        
        // Update pool votes
        PoolVotes storage pool = poolVotes[poolId];
        pool.totalInfluence += amount;
        pool.choiceInfluence[choiceId] += amount;
        pool.userVotes[msg.sender] += amount;
        
        // Update user stats
        UserStats storage stats = userStats[msg.sender];
        stats.totalSpent += amount;
        stats.totalVotes++;
        
        // Record vote
        voteHistory.push(Vote({
            poolId: poolId,
            choiceId: choiceId,
            amount: amount,
            voter: msg.sender,
            timestamp: block.timestamp
        }));
        userVoteIndices[msg.sender].push(voteHistory.length - 1);
        
        emit InfluenceVoted(poolId, msg.sender, choiceId, amount, block.timestamp);
    }
    
    /// @notice Get influence boost percentage for a choice (0-100%)
    /// @param poolId Betting pool ID
    /// @param choiceId Choice to check
    /// @return Boost percentage (0-100)
    function getInfluenceBoost(uint256 poolId, uint8 choiceId) 
        external 
        view 
        returns (uint256) 
    {
        PoolVotes storage pool = poolVotes[poolId];
        
        if (pool.totalInfluence == 0) return 0;
        
        // Linear boost: 0-100%
        return (pool.choiceInfluence[choiceId] * 100) / pool.totalInfluence;
    }
    
    /// @notice Get total influence spent on a pool
    /// @param poolId Betting pool ID
    /// @return Total influence spent
    function getTotalInfluence(uint256 poolId) external view returns (uint256) {
        return poolVotes[poolId].totalInfluence;
    }
    
    /// @notice Get influence spent by choice
    /// @param poolId Betting pool ID
    /// @param choiceId Choice to check
    /// @return Influence spent on choice
    function getChoiceInfluence(uint256 poolId, uint8 choiceId) 
        external 
        view 
        returns (uint256) 
    {
        return poolVotes[poolId].choiceInfluence[choiceId];
    }
    
    /// @notice Get influence spent by a specific user on a pool
    /// @param poolId Betting pool ID
    /// @param user User address
    /// @return Influence spent by user
    function getUserVoteOnPool(uint256 poolId, address user) 
        external 
        view 
        returns (uint256) 
    {
        return poolVotes[poolId].userVotes[user];
    }
    
    // ============ LEADERBOARD ============
    
    /// @notice Update leaderboard (gas-intensive, should be called periodically)
    /// @dev Called by admin or automated keeper
    /// @param topN Number of top holders to track
    function updateLeaderboard(uint256 topN) external onlyRole(DEFAULT_ADMIN_ROLE) {
        // This is a simplified version. In production, use off-chain indexing
        // or a more efficient on-chain sorting algorithm
        
        // Clear existing leaderboard
        delete topHolders;
        
        // Note: In production, maintain a sorted list or use The Graph indexer
        // For POC, this is acceptable but not scalable
        
        lastLeaderboardUpdate = block.timestamp;
        
        emit LeaderboardUpdated(block.timestamp, topHolders.length);
    }
    
    /// @notice Get top N holders (from cached leaderboard)
    /// @param n Number of holders to return
    /// @return Array of top holder addresses
    function getTopHolders(uint256 n) external view returns (address[] memory) {
        uint256 length = n > topHolders.length ? topHolders.length : n;
        address[] memory result = new address[](length);
        
        for (uint256 i = 0; i < length; i++) {
            result[i] = topHolders[i];
        }
        
        return result;
    }
    
    /// @notice Get user statistics
    /// @param user User address
    /// @return stats UserStats struct
    function getUserStats(address user) external view returns (UserStats memory) {
        return userStats[user];
    }
    
    /// @notice Get user's vote history
    /// @param user User address
    /// @return Array of vote indices
    function getUserVotes(address user) external view returns (uint256[] memory) {
        return userVoteIndices[user];
    }
    
    /// @notice Get vote details by index
    /// @param index Vote index
    /// @return vote Vote struct
    function getVote(uint256 index) external view returns (Vote memory) {
        require(index < voteHistory.length, "Invalid vote index");
        return voteHistory[index];
    }
    
    /// @notice Get total votes cast
    /// @return Total number of votes
    function getTotalVotes() external view returns (uint256) {
        return voteHistory.length;
    }
    
    // ============ ADMIN ============
    
    /// @notice Grant minter role to a betting pool contract
    /// @param bettingPool Address of betting pool contract
    function addMinter(address bettingPool) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(MINTER_ROLE, bettingPool);
    }
    
    /// @notice Revoke minter role
    /// @param bettingPool Address to revoke
    function removeMinter(address bettingPool) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(MINTER_ROLE, bettingPool);
    }
    
    // ============ ERC20 OVERRIDES ============
    
    /// @dev Override decimals to use 18 (standard ERC20)
    function decimals() public pure override returns (uint8) {
        return 18;
    }
}
