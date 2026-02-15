// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title FanFictionCanon
 * @notice Marketplace for fan-written stories to become official canon
 * @dev Community bets on which fan story becomes canonical
 * 
 * Flow:
 * 1. Authors submit stories (0.1 ETH fee) with IPFS hash
 * 2. Platform selects top 3 submissions for pool
 * 3. Community bets on which story will become canon
 * 4. Platform settles with AI + community scores
 * 5. Winner earns 70% of pool, becomes canonical author
 * 6. Winner receives Canonical Author NFT badge
 */
contract FanFictionCanon is ERC721, Ownable, ReentrancyGuard {
    // ============================================================================
    // STATE VARIABLES
    // ============================================================================
    
    struct Submission {
        uint256 id;
        address author;
        string storyHash; // IPFS hash
        string title;
        uint256 characterId;
        uint256 timestamp;
        uint256 votingEnds;
        bool finalized;
        bool isCanon;
        uint256 aiScore; // 0-100
        uint256 communityScore; // 0-10000 (basis points)
    }
    
    struct Pool {
        uint256 poolId;
        uint256[] submissionIds; // Top 3 submissions
        uint256 totalPool;
        mapping(uint256 => uint256) submissionBets; // submissionId => total bets
        mapping(address => BetPosition) bets; // bettor => position
        bool settled;
        uint256 winnerId;
        uint256 totalBettors;
    }
    
    struct BetPosition {
        uint256 submissionId;
        uint256 amount;
        bool claimed;
    }
    
    // Core state
    mapping(uint256 => Submission) public submissions;
    mapping(uint256 => Pool) public pools;
    mapping(address => uint256) public authorEarnings;
    mapping(address => uint256) public authorSubmissions; // Count of submissions per author
    
    uint256 public nextSubmissionId = 1;
    uint256 public nextPoolId = 1;
    uint256 public nextBadgeId = 1;
    
    // Economic parameters
    uint256 public constant SUBMISSION_FEE = 0.1 ether;
    uint256 public constant AUTHOR_SHARE = 7000; // 70%
    uint256 public constant BETTOR_SHARE = 8500; // 85%
    uint256 public constant PLATFORM_SHARE = 1500; // 15%
    
    // Scoring weights
    uint256 public constant AI_WEIGHT = 40; // 40%
    uint256 public constant COMMUNITY_WEIGHT = 60; // 60%
    
    IERC20 public bettingToken;
    
    // ============================================================================
    // EVENTS
    // ============================================================================
    
    event SubmissionCreated(
        uint256 indexed id,
        address indexed author,
        string title,
        string storyHash,
        uint256 characterId
    );
    
    event PoolCreated(
        uint256 indexed poolId,
        uint256[] submissionIds
    );
    
    event BetPlaced(
        uint256 indexed poolId,
        address indexed bettor,
        uint256 indexed submissionId,
        uint256 amount
    );
    
    event PoolSettled(
        uint256 indexed poolId,
        uint256 indexed winnerId,
        uint256 finalScore
    );
    
    event CanonAwarded(
        uint256 indexed submissionId,
        address indexed author,
        uint256 earnings
    );
    
    event BadgeMinted(
        address indexed author,
        uint256 badgeId,
        uint256 submissionId
    );
    
    event EarningsClaimed(
        address indexed author,
        uint256 amount
    );
    
    event WinningsClaimed(
        uint256 indexed poolId,
        address indexed bettor,
        uint256 amount
    );
    
    // ============================================================================
    // CONSTRUCTOR
    // ============================================================================
    
    constructor(address _bettingToken) 
        ERC721("Canonical Author Badge", "CAB") 
        Ownable(msg.sender) 
    {
        require(_bettingToken != address(0), "Invalid token address");
        bettingToken = IERC20(_bettingToken);
    }
    
    // ============================================================================
    // SUBMISSION FUNCTIONS
    // ============================================================================
    
    /**
     * @notice Submit a fan fiction story
     * @param storyHash IPFS hash of full story
     * @param title Story title
     * @param characterId Character this story is about
     * @return id Submission ID
     */
    function submitStory(
        string calldata storyHash,
        string calldata title,
        uint256 characterId
    ) external payable nonReentrant returns (uint256) {
        require(msg.value >= SUBMISSION_FEE, "Insufficient fee");
        require(bytes(storyHash).length > 0, "Empty story hash");
        require(bytes(title).length > 0, "Empty title");
        
        uint256 id = nextSubmissionId++;
        
        submissions[id] = Submission({
            id: id,
            author: msg.sender,
            storyHash: storyHash,
            title: title,
            characterId: characterId,
            timestamp: block.timestamp,
            votingEnds: block.timestamp + 3 days,
            finalized: false,
            isCanon: false,
            aiScore: 0,
            communityScore: 0
        });
        
        authorSubmissions[msg.sender]++;
        
        emit SubmissionCreated(id, msg.sender, title, storyHash, characterId);
        return id;
    }
    
    // ============================================================================
    // POOL FUNCTIONS
    // ============================================================================
    
    /**
     * @notice Platform creates pool from top 3 submissions
     * @param submissionIds Array of 3 submission IDs
     * @return poolId Created pool ID
     */
    function createPool(uint256[] calldata submissionIds) 
        external 
        onlyOwner 
        returns (uint256) 
    {
        require(submissionIds.length == 3, "Must have 3 submissions");
        
        // Verify all submissions exist and are valid
        for (uint256 i = 0; i < 3; i++) {
            Submission storage sub = submissions[submissionIds[i]];
            require(sub.id > 0, "Invalid submission");
            require(!sub.finalized, "Already finalized");
        }
        
        uint256 poolId = nextPoolId++;
        Pool storage pool = pools[poolId];
        
        pool.poolId = poolId;
        pool.submissionIds = submissionIds;
        pool.totalPool = 0;
        pool.settled = false;
        pool.totalBettors = 0;
        
        emit PoolCreated(poolId, submissionIds);
        return poolId;
    }
    
    /**
     * @notice Bet on which story becomes canon
     * @param poolId Pool to bet in
     * @param submissionId Story to bet on
     * @param amount USDC amount
     */
    function placeBet(
        uint256 poolId,
        uint256 submissionId,
        uint256 amount
    ) external nonReentrant {
        Pool storage pool = pools[poolId];
        require(pool.poolId > 0, "Pool does not exist");
        require(!pool.settled, "Pool settled");
        require(amount > 0, "Amount must be > 0");
        require(_isValidSubmission(poolId, submissionId), "Invalid submission");
        
        // Transfer tokens
        bettingToken.transferFrom(msg.sender, address(this), amount);
        
        // Update pool state
        pool.totalPool += amount;
        pool.submissionBets[submissionId] += amount;
        
        // Update or create bet position
        BetPosition storage position = pool.bets[msg.sender];
        if (position.amount == 0) {
            pool.totalBettors++;
            position.submissionId = submissionId;
            position.amount = amount;
            position.claimed = false;
        } else {
            // Can only bet on same submission (no switching)
            require(position.submissionId == submissionId, "Already bet on different submission");
            position.amount += amount;
        }
        
        emit BetPlaced(poolId, msg.sender, submissionId, amount);
    }
    
    /**
     * @notice Settle pool and determine canon
     * @param poolId Pool to settle
     * @param aiScores AI coherence scores for each submission (0-100)
     * @param communityScores Community vote percentages (basis points, sum to 10000)
     */
    function settlePool(
        uint256 poolId,
        uint256[] calldata aiScores,
        uint256[] calldata communityScores
    ) external onlyOwner nonReentrant {
        Pool storage pool = pools[poolId];
        require(pool.poolId > 0, "Pool does not exist");
        require(!pool.settled, "Already settled");
        require(aiScores.length == 3, "Invalid AI scores length");
        require(communityScores.length == 3, "Invalid community scores length");
        
        // Validate community scores sum to 10000 (100%)
        uint256 totalCommunity = communityScores[0] + communityScores[1] + communityScores[2];
        require(totalCommunity == 10000, "Community scores must sum to 10000");
        
        // Calculate final scores (40% AI, 60% community)
        uint256 maxScore = 0;
        uint256 winnerId = 0;
        
        for (uint256 i = 0; i < 3; i++) {
            uint256 submissionId = pool.submissionIds[i];
            require(aiScores[i] <= 100, "AI score must be 0-100");
            
            // Final score = (AI * 40 + Community * 60) / 100
            uint256 finalScore = (aiScores[i] * AI_WEIGHT + communityScores[i] * COMMUNITY_WEIGHT) / 100;
            
            if (finalScore > maxScore) {
                maxScore = finalScore;
                winnerId = submissionId;
            }
            
            // Store scores
            Submission storage sub = submissions[submissionId];
            sub.aiScore = aiScores[i];
            sub.communityScore = communityScores[i];
        }
        
        pool.settled = true;
        pool.winnerId = winnerId;
        
        // Mark winner as canon
        Submission storage winner = submissions[winnerId];
        winner.isCanon = true;
        winner.finalized = true;
        
        // Calculate and allocate author earnings (70% of total pool)
        uint256 authorEarning = (pool.totalPool * AUTHOR_SHARE) / 10000;
        authorEarnings[winner.author] += authorEarning;
        
        // Mint Canonical Author badge (NFT)
        _mintBadge(winner.author, winnerId);
        
        emit PoolSettled(poolId, winnerId, maxScore);
        emit CanonAwarded(winnerId, winner.author, authorEarning);
    }
    
    // ============================================================================
    // CLAIM FUNCTIONS
    // ============================================================================
    
    /**
     * @notice Author claims accumulated earnings
     */
    function claimEarnings() external nonReentrant {
        uint256 amount = authorEarnings[msg.sender];
        require(amount > 0, "No earnings to claim");
        
        authorEarnings[msg.sender] = 0;
        bettingToken.transfer(msg.sender, amount);
        
        emit EarningsClaimed(msg.sender, amount);
    }
    
    /**
     * @notice Bettor claims winnings from settled pool
     * @param poolId Pool to claim from
     */
    function claimWinnings(uint256 poolId) external nonReentrant {
        Pool storage pool = pools[poolId];
        require(pool.settled, "Pool not settled");
        
        BetPosition storage position = pool.bets[msg.sender];
        require(position.amount > 0, "No bet placed");
        require(!position.claimed, "Already claimed");
        require(position.submissionId == pool.winnerId, "Not a winning bet");
        
        // Calculate pro-rata payout
        // Bettor share: 85% of total pool
        uint256 winnerPool = pool.submissionBets[pool.winnerId];
        require(winnerPool > 0, "No bets on winner");
        
        uint256 bettorShareTotal = (pool.totalPool * BETTOR_SHARE) / 10000;
        uint256 payout = (position.amount * bettorShareTotal) / winnerPool;
        
        position.claimed = true;
        bettingToken.transfer(msg.sender, payout);
        
        emit WinningsClaimed(poolId, msg.sender, payout);
    }
    
    // ============================================================================
    // NFT BADGE FUNCTIONS
    // ============================================================================
    
    /**
     * @notice Mint Canonical Author NFT badge
     * @dev Internal function called when story becomes canon
     */
    function _mintBadge(address author, uint256 submissionId) internal {
        uint256 badgeId = nextBadgeId++;
        _safeMint(author, badgeId);
        
        emit BadgeMinted(author, badgeId, submissionId);
    }
    
    /**
     * @notice Get token URI for badge (metadata)
     * @dev Override ERC721 tokenURI
     */
    function tokenURI(uint256 tokenId) 
        public 
        view 
        virtual 
        override 
        returns (string memory) 
    {
        _requireOwned(tokenId);
        
        // Return IPFS hash for badge metadata
        // In production, this would point to dynamic metadata
        return string(
            abi.encodePacked(
                "ipfs://QmCanonicalAuthorBadge/",
                _toString(tokenId),
                ".json"
            )
        );
    }
    
    // ============================================================================
    // VIEW FUNCTIONS
    // ============================================================================
    
    /**
     * @notice Get submission details
     */
    function getSubmission(uint256 id) 
        external 
        view 
        returns (Submission memory) 
    {
        require(submissions[id].id > 0, "Submission does not exist");
        return submissions[id];
    }
    
    /**
     * @notice Get pool submissions
     */
    function getPoolSubmissions(uint256 poolId) 
        external 
        view 
        returns (uint256[] memory) 
    {
        require(pools[poolId].poolId > 0, "Pool does not exist");
        return pools[poolId].submissionIds;
    }
    
    /**
     * @notice Get total bets on a submission in a pool
     */
    function getSubmissionBets(uint256 poolId, uint256 submissionId) 
        external 
        view 
        returns (uint256) 
    {
        require(pools[poolId].poolId > 0, "Pool does not exist");
        return pools[poolId].submissionBets[submissionId];
    }
    
    /**
     * @notice Get bettor's position in a pool
     */
    function getBetPosition(uint256 poolId, address bettor) 
        external 
        view 
        returns (BetPosition memory) 
    {
        require(pools[poolId].poolId > 0, "Pool does not exist");
        return pools[poolId].bets[bettor];
    }
    
    /**
     * @notice Get pool info
     */
    function getPoolInfo(uint256 poolId) 
        external 
        view 
        returns (
            uint256[] memory submissionIds,
            uint256 totalPool,
            bool settled,
            uint256 winnerId,
            uint256 totalBettors
        ) 
    {
        Pool storage pool = pools[poolId];
        require(pool.poolId > 0, "Pool does not exist");
        
        return (
            pool.submissionIds,
            pool.totalPool,
            pool.settled,
            pool.winnerId,
            pool.totalBettors
        );
    }
    
    /**
     * @notice Calculate potential payout for a bet
     */
    function calculatePayout(
        uint256 poolId,
        uint256 submissionId,
        uint256 betAmount
    ) external view returns (uint256) {
        Pool storage pool = pools[poolId];
        require(pool.poolId > 0, "Pool does not exist");
        require(_isValidSubmission(poolId, submissionId), "Invalid submission");
        
        if (pool.totalPool == 0) return 0;
        
        uint256 submissionTotal = pool.submissionBets[submissionId];
        if (submissionTotal == 0) return 0;
        
        // Simulate winning payout
        uint256 bettorShareTotal = ((pool.totalPool + betAmount) * BETTOR_SHARE) / 10000;
        return (betAmount * bettorShareTotal) / (submissionTotal + betAmount);
    }
    
    // ============================================================================
    // INTERNAL HELPERS
    // ============================================================================
    
    function _isValidSubmission(uint256 poolId, uint256 submissionId) 
        internal 
        view 
        returns (bool) 
    {
        Pool storage pool = pools[poolId];
        for (uint256 i = 0; i < pool.submissionIds.length; i++) {
            if (pool.submissionIds[i] == submissionId) return true;
        }
        return false;
    }
    
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        
        return string(buffer);
    }
    
    // ============================================================================
    // ADMIN FUNCTIONS
    // ============================================================================
    
    /**
     * @notice Withdraw submission fees
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        payable(owner()).transfer(balance);
    }
    
    /**
     * @notice Withdraw platform share of betting pools
     */
    function withdrawPlatformShare(uint256 poolId) external onlyOwner nonReentrant {
        Pool storage pool = pools[poolId];
        require(pool.settled, "Pool not settled");
        
        uint256 platformShare = (pool.totalPool * PLATFORM_SHARE) / 10000;
        require(platformShare > 0, "No platform share");
        
        bettingToken.transfer(owner(), platformShare);
    }
    
    /**
     * @notice Emergency pause (future implementation)
     * @dev Add pause functionality if needed
     */
    function pause() external onlyOwner {
        // Implementation for emergency pause
    }
}
