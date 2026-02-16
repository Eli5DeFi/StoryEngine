// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SyndicateBetting
 * @notice Group betting with social sharing, voting, and profit distribution
 * @dev Allows users to create/join betting syndicates, propose bets, vote, and share winnings
 */
contract SyndicateBetting is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // ============================================================================
    // STRUCTS
    // ============================================================================

    struct Syndicate {
        string name;
        address creator;
        address[] members;
        mapping(address => uint256) stakes;
        uint256 totalStake;
        uint256 treasury;
        uint256 minStake;
        uint256 maxMembers;
        uint256 votingThreshold; // 0-100 (percentage)
        bool isPublic;
        uint256 totalProfit;
        uint256 totalLoss;
        uint256 totalBets;
        uint256 wins;
        bool isActive;
        uint256 createdAt;
    }

    struct BetProposal {
        uint256 syndicateId;
        address proposer;
        uint256 amount;
        uint256[] outcomeIds;
        string reasoning;
        mapping(address => bool) hasVoted;
        uint256 votesFor;
        uint256 votesAgainst;
        bool executed;
        bool cancelled;
        uint256 createdAt;
        uint256 deadline;
    }

    struct MemberStake {
        uint256 amount;
        uint256 joinedAt;
        uint256 claimableRewards;
    }

    // ============================================================================
    // STATE VARIABLES
    // ============================================================================

    IERC20 public immutable bettingToken; // USDC
    address public treasury;
    address public bettingPool; // External betting pool contract

    mapping(uint256 => Syndicate) public syndicates;
    mapping(uint256 => BetProposal) public proposals;
    mapping(uint256 => mapping(address => MemberStake)) public memberStakes;

    uint256 public syndicateCount;
    uint256 public proposalCount;

    // Fee configuration (basis points: 100 = 1%)
    uint256 public constant TREASURY_FEE = 800; // 8%
    uint256 public constant PROPOSER_REWARD = 200; // 2%
    uint256 public constant MEMBER_SHARE = 9000; // 90%
    uint256 public constant BASIS_POINTS = 10000;

    // ============================================================================
    // EVENTS
    // ============================================================================

    event SyndicateCreated(
        uint256 indexed syndicateId,
        string name,
        address indexed creator,
        uint256 minStake,
        uint256 maxMembers
    );

    event MemberJoined(
        uint256 indexed syndicateId,
        address indexed member,
        uint256 amount
    );

    event MemberLeft(
        uint256 indexed syndicateId,
        address indexed member,
        uint256 amount
    );

    event StakeAdded(
        uint256 indexed syndicateId,
        address indexed member,
        uint256 amount
    );

    event ProposalCreated(
        uint256 indexed proposalId,
        uint256 indexed syndicateId,
        address indexed proposer,
        uint256 amount,
        uint256[] outcomeIds
    );

    event ProposalVoted(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 votingPower
    );

    event BetExecuted(
        uint256 indexed proposalId,
        uint256 indexed syndicateId,
        uint256 amount
    );

    event ProposalCancelled(
        uint256 indexed proposalId,
        uint256 indexed syndicateId
    );

    event ProfitDistributed(
        uint256 indexed syndicateId,
        uint256 totalProfit,
        uint256 toMembers,
        uint256 toTreasury,
        uint256 toProposer
    );

    event SyndicateDeactivated(uint256 indexed syndicateId);

    // ============================================================================
    // ERRORS
    // ============================================================================

    error InvalidThreshold();
    error SyndicateInactive();
    error NotPublic();
    error BelowMinimumStake();
    error SyndicateFull();
    error NotMember();
    error InsufficientTreasury();
    error AlreadyVoted();
    error ProposalExecuted();
    error VotingClosed();
    error ThresholdNotMet();
    error InsufficientStake();

    // ============================================================================
    // CONSTRUCTOR
    // ============================================================================

    constructor(address _bettingToken, address _treasury) {
        require(_bettingToken != address(0), "Invalid token");
        require(_treasury != address(0), "Invalid treasury");

        bettingToken = IERC20(_bettingToken);
        treasury = _treasury;
    }

    // ============================================================================
    // SYNDICATE MANAGEMENT
    // ============================================================================

    /**
     * @notice Create a new betting syndicate
     * @param _name Syndicate name
     * @param _minStake Minimum stake to join (USDC, 6 decimals)
     * @param _maxMembers Maximum number of members
     * @param _votingThreshold Voting threshold (0-100, percentage)
     * @param _isPublic Whether syndicate is public
     * @return syndicateId ID of created syndicate
     */
    function createSyndicate(
        string memory _name,
        uint256 _minStake,
        uint256 _maxMembers,
        uint256 _votingThreshold,
        bool _isPublic
    ) external returns (uint256) {
        if (_votingThreshold == 0 || _votingThreshold > 100) {
            revert InvalidThreshold();
        }

        uint256 syndicateId = syndicateCount++;
        Syndicate storage s = syndicates[syndicateId];

        s.name = _name;
        s.creator = msg.sender;
        s.minStake = _minStake;
        s.maxMembers = _maxMembers;
        s.votingThreshold = _votingThreshold;
        s.isPublic = _isPublic;
        s.isActive = true;
        s.createdAt = block.timestamp;

        emit SyndicateCreated(
            syndicateId,
            _name,
            msg.sender,
            _minStake,
            _maxMembers
        );

        return syndicateId;
    }

    /**
     * @notice Join a syndicate by staking capital
     * @param _syndicateId Syndicate to join
     * @param _amount Amount to stake (USDC, 6 decimals)
     */
    function joinSyndicate(uint256 _syndicateId, uint256 _amount)
        external
        nonReentrant
    {
        Syndicate storage s = syndicates[_syndicateId];

        if (!s.isActive) revert SyndicateInactive();
        if (!s.isPublic && !isMember(_syndicateId, msg.sender)) {
            revert NotPublic();
        }
        if (_amount < s.minStake) revert BelowMinimumStake();
        if (s.members.length >= s.maxMembers) revert SyndicateFull();

        // Transfer stake
        bettingToken.safeTransferFrom(msg.sender, address(this), _amount);

        // Add member if new
        if (s.stakes[msg.sender] == 0) {
            s.members.push(msg.sender);
            memberStakes[_syndicateId][msg.sender].joinedAt = block.timestamp;
        }

        // Update stakes
        s.stakes[msg.sender] += _amount;
        s.totalStake += _amount;
        s.treasury += _amount;
        memberStakes[_syndicateId][msg.sender].amount += _amount;

        emit MemberJoined(_syndicateId, msg.sender, _amount);
    }

    /**
     * @notice Leave a syndicate and withdraw stake
     * @param _syndicateId Syndicate to leave
     */
    function leaveSyndicate(uint256 _syndicateId) external nonReentrant {
        Syndicate storage s = syndicates[_syndicateId];
        uint256 stake = s.stakes[msg.sender];

        if (stake == 0) revert NotMember();

        // Calculate withdrawable amount (stake + claimable rewards)
        uint256 claimable = memberStakes[_syndicateId][msg.sender]
            .claimableRewards;
        uint256 totalWithdraw = stake + claimable;

        if (totalWithdraw > s.treasury) {
            revert InsufficientTreasury();
        }

        // Update state
        s.stakes[msg.sender] = 0;
        s.totalStake -= stake;
        s.treasury -= totalWithdraw;
        memberStakes[_syndicateId][msg.sender].amount = 0;
        memberStakes[_syndicateId][msg.sender].claimableRewards = 0;

        // Remove from members array
        _removeMember(_syndicateId, msg.sender);

        // Transfer funds
        bettingToken.safeTransfer(msg.sender, totalWithdraw);

        emit MemberLeft(_syndicateId, msg.sender, totalWithdraw);
    }

    /**
     * @notice Add more stake to existing membership
     * @param _syndicateId Syndicate ID
     * @param _amount Additional amount to stake
     */
    function addStake(uint256 _syndicateId, uint256 _amount)
        external
        nonReentrant
    {
        Syndicate storage s = syndicates[_syndicateId];

        if (!s.isActive) revert SyndicateInactive();
        if (s.stakes[msg.sender] == 0) revert NotMember();

        bettingToken.safeTransferFrom(msg.sender, address(this), _amount);

        s.stakes[msg.sender] += _amount;
        s.totalStake += _amount;
        s.treasury += _amount;
        memberStakes[_syndicateId][msg.sender].amount += _amount;

        emit StakeAdded(_syndicateId, msg.sender, _amount);
    }

    // ============================================================================
    // BET PROPOSALS & VOTING
    // ============================================================================

    /**
     * @notice Propose a bet for the syndicate
     * @param _syndicateId Syndicate ID
     * @param _amount Amount to bet from treasury
     * @param _outcomeIds Outcome IDs to bet on (single or combo)
     * @param _reasoning Explanation for the bet
     * @return proposalId ID of created proposal
     */
    function proposeBet(
        uint256 _syndicateId,
        uint256 _amount,
        uint256[] memory _outcomeIds,
        string memory _reasoning
    ) external returns (uint256) {
        Syndicate storage s = syndicates[_syndicateId];

        if (s.stakes[msg.sender] == 0) revert NotMember();
        if (_amount > s.treasury) revert InsufficientTreasury();

        uint256 proposalId = proposalCount++;
        BetProposal storage p = proposals[proposalId];

        p.syndicateId = _syndicateId;
        p.proposer = msg.sender;
        p.amount = _amount;
        p.outcomeIds = _outcomeIds;
        p.reasoning = _reasoning;
        p.createdAt = block.timestamp;
        p.deadline = block.timestamp + 24 hours;

        emit ProposalCreated(
            proposalId,
            _syndicateId,
            msg.sender,
            _amount,
            _outcomeIds
        );

        return proposalId;
    }

    /**
     * @notice Vote on a bet proposal
     * @param _proposalId Proposal ID
     * @param _support True to support, false to oppose
     */
    function vote(uint256 _proposalId, bool _support) external {
        BetProposal storage p = proposals[_proposalId];
        Syndicate storage s = syndicates[p.syndicateId];

        if (s.stakes[msg.sender] == 0) revert NotMember();
        if (p.executed) revert ProposalExecuted();
        if (block.timestamp >= p.deadline) revert VotingClosed();
        if (p.hasVoted[msg.sender]) revert AlreadyVoted();

        p.hasVoted[msg.sender] = true;

        // Calculate voting power (proportional to stake)
        uint256 votingPower = (s.stakes[msg.sender] * 100) / s.totalStake;

        if (_support) {
            p.votesFor += votingPower;
        } else {
            p.votesAgainst += votingPower;
        }

        emit ProposalVoted(_proposalId, msg.sender, _support, votingPower);

        // Auto-execute if threshold reached
        if (p.votesFor >= s.votingThreshold) {
            _executeBet(_proposalId);
        }
    }

    /**
     * @notice Execute a bet proposal (called automatically or manually)
     * @param _proposalId Proposal ID
     */
    function executeBet(uint256 _proposalId) external {
        BetProposal storage p = proposals[_proposalId];
        Syndicate storage s = syndicates[p.syndicateId];

        if (p.votesFor < s.votingThreshold) revert ThresholdNotMet();

        _executeBet(_proposalId);
    }

    /**
     * @notice Cancel a proposal (only proposer or after deadline)
     * @param _proposalId Proposal ID
     */
    function cancelProposal(uint256 _proposalId) external {
        BetProposal storage p = proposals[_proposalId];

        require(
            msg.sender == p.proposer || block.timestamp >= p.deadline,
            "Unauthorized"
        );
        require(!p.executed, "Already executed");

        p.cancelled = true;

        emit ProposalCancelled(_proposalId, p.syndicateId);
    }

    // ============================================================================
    // PROFIT DISTRIBUTION
    // ============================================================================

    /**
     * @notice Distribute profits after a winning bet
     * @param _syndicateId Syndicate ID
     * @param _profit Total profit from bet
     * @param _proposalId Proposal that won
     */
    function distributeProfits(
        uint256 _syndicateId,
        uint256 _profit,
        uint256 _proposalId
    ) external {
        // Only betting pool contract can call this
        require(msg.sender == bettingPool, "Unauthorized");

        Syndicate storage s = syndicates[_syndicateId];
        BetProposal storage p = proposals[_proposalId];

        // Calculate distribution
        uint256 toMembers = (_profit * MEMBER_SHARE) / BASIS_POINTS;
        uint256 toTreasury = (_profit * TREASURY_FEE) / BASIS_POINTS;
        uint256 toProposer = (_profit * PROPOSER_REWARD) / BASIS_POINTS;

        // Update syndicate treasury
        s.treasury += toTreasury;
        s.totalProfit += _profit;
        s.wins++;

        // Distribute to members proportionally
        for (uint256 i = 0; i < s.members.length; i++) {
            address member = s.members[i];
            uint256 memberShare = (toMembers * s.stakes[member]) /
                s.totalStake;
            memberStakes[_syndicateId][member].claimableRewards += memberShare;
        }

        // Proposer bonus
        memberStakes[_syndicateId][p.proposer].claimableRewards += toProposer;

        emit ProfitDistributed(
            _syndicateId,
            _profit,
            toMembers,
            toTreasury,
            toProposer
        );
    }

    /**
     * @notice Claim accumulated rewards
     * @param _syndicateId Syndicate ID
     */
    function claimRewards(uint256 _syndicateId) external nonReentrant {
        uint256 claimable = memberStakes[_syndicateId][msg.sender]
            .claimableRewards;

        require(claimable > 0, "No rewards");

        memberStakes[_syndicateId][msg.sender].claimableRewards = 0;

        bettingToken.safeTransfer(msg.sender, claimable);
    }

    // ============================================================================
    // VIEW FUNCTIONS
    // ============================================================================

    /**
     * @notice Check if address is member of syndicate
     * @param _syndicateId Syndicate ID
     * @param _user User address
     * @return bool True if member
     */
    function isMember(uint256 _syndicateId, address _user)
        public
        view
        returns (bool)
    {
        return syndicates[_syndicateId].stakes[_user] > 0;
    }

    /**
     * @notice Get syndicate members
     * @param _syndicateId Syndicate ID
     * @return address[] Array of member addresses
     */
    function getMembers(uint256 _syndicateId)
        external
        view
        returns (address[] memory)
    {
        return syndicates[_syndicateId].members;
    }

    /**
     * @notice Get member stake amount
     * @param _syndicateId Syndicate ID
     * @param _member Member address
     * @return uint256 Stake amount
     */
    function getMemberStake(uint256 _syndicateId, address _member)
        external
        view
        returns (uint256)
    {
        return syndicates[_syndicateId].stakes[_member];
    }

    /**
     * @notice Get syndicate stats
     * @param _syndicateId Syndicate ID
     * @return totalStake Total stake
     * @return treasury Treasury balance
     * @return totalBets Total bets placed
     * @return wins Win count
     * @return roi Return on investment (basis points)
     */
    function getSyndicateStats(uint256 _syndicateId)
        external
        view
        returns (
            uint256 totalStake,
            uint256 treasury,
            uint256 totalBets,
            uint256 wins,
            uint256 roi
        )
    {
        Syndicate storage s = syndicates[_syndicateId];

        totalStake = s.totalStake;
        treasury = s.treasury;
        totalBets = s.totalBets;
        wins = s.wins;

        // Calculate ROI: (profit - loss) / totalStake * 10000
        if (s.totalStake > 0) {
            int256 netProfit = int256(s.totalProfit) - int256(s.totalLoss);
            roi = netProfit > 0
                ? uint256((netProfit * 10000) / int256(s.totalStake))
                : 0;
        }
    }

    /**
     * @notice Get proposal outcome IDs
     * @param _proposalId Proposal ID
     * @return uint256[] Array of outcome IDs
     */
    function getProposalOutcomes(uint256 _proposalId)
        external
        view
        returns (uint256[] memory)
    {
        return proposals[_proposalId].outcomeIds;
    }

    // ============================================================================
    // ADMIN FUNCTIONS
    // ============================================================================

    /**
     * @notice Set betting pool contract address
     * @param _bettingPool Betting pool address
     */
    function setBettingPool(address _bettingPool) external onlyOwner {
        require(_bettingPool != address(0), "Invalid address");
        bettingPool = _bettingPool;
    }

    /**
     * @notice Update treasury address
     * @param _treasury New treasury address
     */
    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid address");
        treasury = _treasury;
    }

    /**
     * @notice Deactivate a syndicate (emergency only)
     * @param _syndicateId Syndicate ID
     */
    function deactivateSyndicate(uint256 _syndicateId) external onlyOwner {
        syndicates[_syndicateId].isActive = false;
        emit SyndicateDeactivated(_syndicateId);
    }

    // ============================================================================
    // INTERNAL FUNCTIONS
    // ============================================================================

    /**
     * @dev Execute bet proposal
     */
    function _executeBet(uint256 _proposalId) internal {
        BetProposal storage p = proposals[_proposalId];
        Syndicate storage s = syndicates[p.syndicateId];

        require(!p.executed, "Already executed");
        require(!p.cancelled, "Cancelled");

        p.executed = true;
        s.treasury -= p.amount;
        s.totalBets++;

        // Transfer to betting pool
        // In production, this would call external betting pool contract
        bettingToken.safeTransfer(bettingPool, p.amount);

        emit BetExecuted(_proposalId, p.syndicateId, p.amount);
    }

    /**
     * @dev Remove member from members array
     */
    function _removeMember(uint256 _syndicateId, address _member) internal {
        Syndicate storage s = syndicates[_syndicateId];

        for (uint256 i = 0; i < s.members.length; i++) {
            if (s.members[i] == _member) {
                s.members[i] = s.members[s.members.length - 1];
                s.members.pop();
                break;
            }
        }
    }
}
