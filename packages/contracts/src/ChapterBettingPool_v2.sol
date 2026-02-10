// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title ChapterBettingPool v2
/// @notice Parimutuel betting pool for story chapter branches (with security fixes)
/// @dev Pool settles with 85% to winners, 12.5% treasury, 2.5% ops
contract ChapterBettingPoolV2 is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ ENUMS ============

    enum PoolState {
        OPEN,
        LOCKED,
        SETTLED,
        CANCELLED
    }

    // ============ STRUCTS ============

    struct Bet {
        address bettor;
        uint8 branchIndex;
        uint256 amount;
        bool claimed;
        bool isAgent; // true if placed by an AI agent
    }

    struct BranchInfo {
        string branchHash; // IPFS hash of branch content
        uint256 totalBets; // total amount bet on this branch
        uint256 betCount; // number of bets on this branch
    }

    // ============ STATE ============

    uint256 public immutable storyId;
    uint256 public immutable chapterId;
    IERC20 public immutable bettingToken; // USDC on Base

    address public treasury;
    address public operationalWallet;

    uint256 public constant WINNER_SHARE_BPS = 8500; // 85%
    uint256 public constant TREASURY_SHARE_BPS = 1250; // 12.5%
    uint256 public constant OPERATIONAL_SHARE_BPS = 250; // 2.5%
    uint256 public constant BPS_DENOMINATOR = 10_000;

    uint256 public bettingDeadline;
    uint256 public minBet;
    uint256 public maxBet;

    PoolState public state;
    uint8 public winningBranch;
    uint8 public branchCount;

    uint256 public totalPoolAmount;

    mapping(uint8 => BranchInfo) public branches;
    Bet[] public bets;
    mapping(address => uint256[]) public userBetIndices;

    // ============ EVENTS ============

    event BetPlaced(address indexed bettor, uint8 indexed branchIndex, uint256 amount, bool isAgent);
    event PoolLocked(uint256 indexed chapterId, uint256 totalAmount, uint256 timestamp);
    event PoolSettled(
        uint256 indexed chapterId,
        uint8 indexed winningBranch,
        uint256 winnerPool,
        uint256 treasuryAmount,
        uint256 opAmount,
        uint256 timestamp
    );
    event RewardClaimed(address indexed bettor, uint256 amount);
    event PoolCancelled(uint256 indexed chapterId, uint256 timestamp);

    // ============ CONSTRUCTOR ============

    constructor(
        uint256 _storyId,
        uint256 _chapterId,
        address _bettingToken,
        address _treasury,
        address _operationalWallet,
        uint8 _branchCount,
        uint256 _bettingDuration,
        uint256 _minBet,
        uint256 _maxBet,
        string[] memory _branchHashes
    ) Ownable(msg.sender) {
        require(_branchCount >= 2 && _branchCount <= 5, "Invalid branch count");
        require(_branchHashes.length == _branchCount, "Hash count mismatch");
        require(_bettingToken != address(0), "Invalid token");
        require(_treasury != address(0), "Invalid treasury");
        require(_operationalWallet != address(0), "Invalid op wallet");
        require(_bettingDuration > 0 && _bettingDuration <= 30 days, "Invalid duration");
        require(_minBet > 0 && _minBet <= _maxBet, "Invalid bet range");

        storyId = _storyId;
        chapterId = _chapterId;
        bettingToken = IERC20(_bettingToken);
        treasury = _treasury;
        operationalWallet = _operationalWallet;
        branchCount = _branchCount;
        bettingDeadline = block.timestamp + _bettingDuration;
        minBet = _minBet;
        maxBet = _maxBet;
        state = PoolState.OPEN;

        for (uint8 i = 0; i < _branchCount; i++) {
            branches[i].branchHash = _branchHashes[i];
        }
    }

    // ============ BETTING ============

    /// @notice Place a bet on a specific branch
    /// @param _branchIndex Index of the branch to bet on (0 to branchCount-1)
    /// @param _amount Amount of USDC to bet
    /// @param _isAgent Whether the bettor is an AI agent
    function placeBet(uint8 _branchIndex, uint256 _amount, bool _isAgent) external nonReentrant {
        require(state == PoolState.OPEN, "Pool not open");
        require(block.timestamp < bettingDeadline, "Betting closed");
        require(_branchIndex < branchCount, "Invalid branch");
        require(_amount >= minBet && _amount <= maxBet, "Bet out of range");

        bettingToken.safeTransferFrom(msg.sender, address(this), _amount);

        uint256 betIndex = bets.length;
        bets.push(
            Bet({bettor: msg.sender, branchIndex: _branchIndex, amount: _amount, claimed: false, isAgent: _isAgent})
        );

        branches[_branchIndex].totalBets += _amount;
        branches[_branchIndex].betCount += 1;
        totalPoolAmount += _amount;

        userBetIndices[msg.sender].push(betIndex);

        emit BetPlaced(msg.sender, _branchIndex, _amount, _isAgent);
    }

    // ============ SETTLEMENT ============

    /// @notice Lock the pool after betting deadline
    /// @dev Can only be called by owner after betting deadline
    function lockPool() external onlyOwner {
        require(state == PoolState.OPEN, "Not open");
        require(block.timestamp >= bettingDeadline, "Betting still active");

        state = PoolState.LOCKED;
        emit PoolLocked(chapterId, totalPoolAmount, block.timestamp);
    }

    /// @notice Settle the pool with the winning branch
    /// @param _winningBranch Index of the winning branch
    /// @dev Can only be called by owner after pool is locked
    function settlePool(uint8 _winningBranch) external onlyOwner {
        require(state == PoolState.LOCKED, "Not locked");
        require(_winningBranch < branchCount, "Invalid branch");
        require(branches[_winningBranch].totalBets > 0, "No bets on winner"); // ← FIX: Prevent division by zero

        state = PoolState.SETTLED;
        winningBranch = _winningBranch;

        // Calculate exact amounts to avoid dust
        uint256 treasuryAmount = (totalPoolAmount * TREASURY_SHARE_BPS) / BPS_DENOMINATOR;
        uint256 opAmount = (totalPoolAmount * OPERATIONAL_SHARE_BPS) / BPS_DENOMINATOR;
        uint256 winnerPool = totalPoolAmount - treasuryAmount - opAmount; // Exact calculation

        bettingToken.safeTransfer(treasury, treasuryAmount);
        bettingToken.safeTransfer(operationalWallet, opAmount);

        emit PoolSettled(chapterId, _winningBranch, winnerPool, treasuryAmount, opAmount, block.timestamp);
    }

    /// @notice Claim rewards for all winning bets
    /// @dev Calculates pro-rata share of winner pool (GAS OPTIMIZED)
    function claimReward() external nonReentrant {
        require(state == PoolState.SETTLED, "Not settled");

        uint256 totalReward = 0;
        uint256[] storage indices = userBetIndices[msg.sender];

        // ← FIX: Cache these values (saves ~2,100 gas per iteration)
        uint256 treasuryAmount = (totalPoolAmount * TREASURY_SHARE_BPS) / BPS_DENOMINATOR;
        uint256 opAmount = (totalPoolAmount * OPERATIONAL_SHARE_BPS) / BPS_DENOMINATOR;
        uint256 winnerPool = totalPoolAmount - treasuryAmount - opAmount;
        uint256 winningBranchTotal = branches[winningBranch].totalBets;

        for (uint256 i = 0; i < indices.length; i++) {
            Bet storage bet = bets[indices[i]];
            if (bet.branchIndex == winningBranch && !bet.claimed) {
                bet.claimed = true;
                uint256 reward = (bet.amount * winnerPool) / winningBranchTotal;
                totalReward += reward;
            }
        }

        require(totalReward > 0, "No rewards");

        bettingToken.safeTransfer(msg.sender, totalReward);
        emit RewardClaimed(msg.sender, totalReward);
    }

    // ============ EMERGENCY ============

    /// @notice Cancel pool and refund all bets (EMERGENCY ONLY)
    /// @dev Can only be called before pool is locked (prevents rug pulls)
    function cancelPool() external onlyOwner {
        require(state == PoolState.OPEN, "Can only cancel before lock"); // ← FIX: Restrict to OPEN state

        state = PoolState.CANCELLED;

        for (uint256 i = 0; i < bets.length; i++) {
            if (!bets[i].claimed) {
                bets[i].claimed = true;
                bettingToken.safeTransfer(bets[i].bettor, bets[i].amount);
            }
        }

        emit PoolCancelled(chapterId, block.timestamp);
    }

    // ============ VIEWS ============

    /// @notice Get implied odds for a branch (in basis points)
    /// @param _branchIndex Branch to check
    /// @return impliedOdds Odds in BPS (e.g., 3500 = 35%)
    function getBranchOdds(uint8 _branchIndex) external view returns (uint256 impliedOdds) {
        if (totalPoolAmount == 0) return 0;
        return (branches[_branchIndex].totalBets * 10_000) / totalPoolAmount;
    }

    /// @notice Get all bets placed by a user
    /// @param _user User address
    /// @return Array of user's bets
    function getUserBets(address _user) external view returns (Bet[] memory) {
        uint256[] storage indices = userBetIndices[_user];
        Bet[] memory userBets = new Bet[](indices.length);
        for (uint256 i = 0; i < indices.length; i++) {
            userBets[i] = bets[indices[i]];
        }
        return userBets;
    }

    /// @notice Get pending reward for a user (if pool is settled)
    /// @param _user User address
    /// @return Pending reward amount
    function getPendingReward(address _user) external view returns (uint256) {
        if (state != PoolState.SETTLED) return 0;

        uint256 total = 0;
        uint256[] storage indices = userBetIndices[_user];
        
        // Calculate winner pool (same as claimReward)
        uint256 treasuryAmount = (totalPoolAmount * TREASURY_SHARE_BPS) / BPS_DENOMINATOR;
        uint256 opAmount = (totalPoolAmount * OPERATIONAL_SHARE_BPS) / BPS_DENOMINATOR;
        uint256 winnerPool = totalPoolAmount - treasuryAmount - opAmount;
        uint256 winningBranchTotal = branches[winningBranch].totalBets;

        for (uint256 i = 0; i < indices.length; i++) {
            Bet storage bet = bets[indices[i]];
            if (bet.branchIndex == winningBranch && !bet.claimed) {
                total += (bet.amount * winnerPool) / winningBranchTotal;
            }
        }
        return total;
    }

    /// @notice Get total number of bets
    function getTotalBets() external view returns (uint256) {
        return bets.length;
    }

    /// @notice Get branch info by index
    function getBranchInfo(uint8 _branchIndex)
        external
        view
        returns (string memory hash, uint256 total, uint256 count)
    {
        require(_branchIndex < branchCount, "Invalid branch");
        BranchInfo storage branch = branches[_branchIndex];
        return (branch.branchHash, branch.totalBets, branch.betCount);
    }
}
