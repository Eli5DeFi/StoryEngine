// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CharacterMemoryNFT
 * @notice Dynamic NFT that evolves based on betting history in Voidborne
 * @dev Soul-bound (non-transferable) NFT that tracks user's story journey
 * 
 * Features:
 * - Mints automatically on first bet
 * - Evolves based on wins, losses, streaks
 * - Earns badges for story milestones
 * - Updates metadata URI on evolution
 * - Soul-bound (cannot transfer, only burn)
 */
contract CharacterMemoryNFT is ERC721URIStorage, Ownable, ReentrancyGuard {
    
    // ============ TYPES ============
    
    enum Archetype {
        NONE,       // Not yet determined
        STRATEGIST, // Conservative, high win rate
        GAMBLER,    // High risk, high variance
        ORACLE,     // Long-term thinker, futures trader
        CONTRARIAN  // Bets against the crowd
    }
    
    enum RiskLevel {
        CONSERVATIVE, // Small bets, safe choices
        BALANCED,     // Mixed strategy
        AGGRESSIVE    // Large bets, risky choices
    }
    
    enum Alignment {
        NEUTRAL, // Not yet determined
        ORDER,   // Bets on predictable outcomes
        CHAOS    // Bets on unlikely outcomes
    }
    
    struct CharacterStats {
        // Core stats
        uint64 totalBets;
        uint128 totalWagered; // in USDC (6 decimals)
        uint128 totalWon;     // in USDC (6 decimals)
        uint16 winRate;       // 0-10000 (basis points, 10000 = 100%)
        uint16 currentStreak;
        uint16 longestStreak;
        
        // Evolution traits
        Archetype archetype;
        RiskLevel riskLevel;
        Alignment alignment;
        
        // Metadata
        uint64 mintedAt;
        uint64 lastUpdatedAt;
    }
    
    struct Badge {
        bytes32 badgeId;      // Unique badge identifier
        uint64 earnedAt;      // Timestamp earned
        string chapterId;     // Chapter where earned
        uint8 rarity;         // 0=Common, 1=Rare, 2=Epic, 3=Legendary
    }
    
    // ============ STATE ============
    
    uint256 private _nextTokenId = 1;
    
    // Mapping from token ID to stats
    mapping(uint256 => CharacterStats) public characterStats;
    
    // Mapping from token ID to badges
    mapping(uint256 => Badge[]) public characterBadges;
    
    // Mapping from wallet address to token ID (one NFT per address)
    mapping(address => uint256) public walletToTokenId;
    
    // Authorized updaters (betting contracts, backend services)
    mapping(address => bool) public isAuthorizedUpdater;
    
    // Metadata base URI (IPFS gateway)
    string private _baseTokenURI;
    
    // ============ EVENTS ============
    
    event CharacterMinted(
        address indexed owner,
        uint256 indexed tokenId,
        uint64 timestamp
    );
    
    event CharacterEvolved(
        uint256 indexed tokenId,
        Archetype newArchetype,
        RiskLevel newRiskLevel,
        Alignment newAlignment,
        string newMetadataURI
    );
    
    event BadgeEarned(
        uint256 indexed tokenId,
        bytes32 indexed badgeId,
        string chapterId,
        uint8 rarity,
        uint64 timestamp
    );
    
    event StatsUpdated(
        uint256 indexed tokenId,
        uint64 totalBets,
        uint128 totalWagered,
        uint128 totalWon,
        uint16 winRate,
        uint16 currentStreak
    );
    
    // ============ ERRORS ============
    
    error AlreadyMinted();
    error NotTokenOwner();
    error TokenDoesNotExist();
    error SoulBoundToken();
    error Unauthorized();
    error BadgeAlreadyEarned();
    error InvalidBadgeRarity();
    
    // ============ CONSTRUCTOR ============
    
    constructor(
        string memory name,
        string memory symbol,
        string memory baseURI
    ) ERC721(name, symbol) Ownable(msg.sender) {
        _baseTokenURI = baseURI;
    }
    
    // ============ MINTING ============
    
    /**
     * @notice Mint a new Character Memory NFT
     * @dev Called automatically on user's first bet
     * @param to Address to mint to
     * @return tokenId The newly minted token ID
     */
    function mint(address to) external onlyAuthorized nonReentrant returns (uint256) {
        if (walletToTokenId[to] != 0) revert AlreadyMinted();
        
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        
        // Initialize stats
        characterStats[tokenId] = CharacterStats({
            totalBets: 0,
            totalWagered: 0,
            totalWon: 0,
            winRate: 0,
            currentStreak: 0,
            longestStreak: 0,
            archetype: Archetype.NONE,
            riskLevel: RiskLevel.CONSERVATIVE,
            alignment: Alignment.NEUTRAL,
            mintedAt: uint64(block.timestamp),
            lastUpdatedAt: uint64(block.timestamp)
        });
        
        walletToTokenId[to] = tokenId;
        
        // Set initial metadata URI (generic avatar)
        _setTokenURI(tokenId, "genesis.json");
        
        emit CharacterMinted(to, tokenId, uint64(block.timestamp));
        
        return tokenId;
    }
    
    // ============ STATS UPDATES ============
    
    /**
     * @notice Update character stats after a bet
     * @param tokenId Token to update
     * @param betAmount Amount wagered (USDC, 6 decimals)
     * @param won Whether the bet won
     * @param payout Payout amount if won (USDC, 6 decimals)
     */
    function updateStats(
        uint256 tokenId,
        uint128 betAmount,
        bool won,
        uint128 payout
    ) external onlyAuthorized nonReentrant {
        if (!_exists(tokenId)) revert TokenDoesNotExist();
        
        CharacterStats storage stats = characterStats[tokenId];
        
        // Update core stats
        stats.totalBets++;
        stats.totalWagered += betAmount;
        
        if (won) {
            stats.totalWon += payout;
            stats.currentStreak++;
            if (stats.currentStreak > stats.longestStreak) {
                stats.longestStreak = stats.currentStreak;
            }
        } else {
            stats.currentStreak = 0;
        }
        
        // Calculate win rate (basis points)
        if (stats.totalBets > 0) {
            // Count winning bets (approximate from totalWon vs totalWagered)
            uint256 estimatedWins = (stats.totalWon > stats.totalWagered) 
                ? (stats.totalWon * 10000) / (stats.totalWagered * 2) // Rough estimate
                : 0;
            stats.winRate = uint16(estimatedWins > 10000 ? 10000 : estimatedWins);
        }
        
        stats.lastUpdatedAt = uint64(block.timestamp);
        
        emit StatsUpdated(
            tokenId,
            stats.totalBets,
            stats.totalWagered,
            stats.totalWon,
            stats.winRate,
            stats.currentStreak
        );
        
        // Check for evolution triggers
        _checkEvolution(tokenId);
    }
    
    // ============ EVOLUTION ============
    
    /**
     * @notice Check if character should evolve based on stats
     * @param tokenId Token to check
     */
    function _checkEvolution(uint256 tokenId) internal {
        CharacterStats storage stats = characterStats[tokenId];
        
        bool evolved = false;
        Archetype newArchetype = stats.archetype;
        RiskLevel newRiskLevel = stats.riskLevel;
        Alignment newAlignment = stats.alignment;
        
        // Determine archetype based on behavior
        if (stats.totalBets >= 10) {
            if (stats.winRate >= 7000) {
                // High win rate → Strategist
                newArchetype = Archetype.STRATEGIST;
            } else if (stats.totalWagered > stats.totalBets * 50 * 1e6) {
                // Large average bets → Gambler
                newArchetype = Archetype.GAMBLER;
            } else if (stats.longestStreak >= 5) {
                // Long streaks → Oracle (good at predicting)
                newArchetype = Archetype.ORACLE;
            } else {
                // Default → Contrarian
                newArchetype = Archetype.CONTRARIAN;
            }
            
            if (newArchetype != stats.archetype) {
                stats.archetype = newArchetype;
                evolved = true;
            }
        }
        
        // Determine risk level based on bet sizes
        if (stats.totalBets >= 5) {
            uint256 avgBet = uint256(stats.totalWagered) / stats.totalBets;
            
            if (avgBet < 20 * 1e6) {
                // <$20 avg → Conservative
                newRiskLevel = RiskLevel.CONSERVATIVE;
            } else if (avgBet < 100 * 1e6) {
                // $20-100 avg → Balanced
                newRiskLevel = RiskLevel.BALANCED;
            } else {
                // >$100 avg → Aggressive
                newRiskLevel = RiskLevel.AGGRESSIVE;
            }
            
            if (newRiskLevel != stats.riskLevel) {
                stats.riskLevel = newRiskLevel;
                evolved = true;
            }
        }
        
        // Determine alignment (simplified for POC)
        if (stats.totalBets >= 10) {
            if (stats.winRate >= 6000) {
                // High win rate → Order (predictable)
                newAlignment = Alignment.ORDER;
            } else {
                // Low win rate → Chaos (unpredictable)
                newAlignment = Alignment.CHAOS;
            }
            
            if (newAlignment != stats.alignment) {
                stats.alignment = newAlignment;
                evolved = true;
            }
        }
        
        // If evolved, update metadata URI
        if (evolved) {
            string memory newURI = _generateMetadataURI(tokenId);
            _setTokenURI(tokenId, newURI);
            
            emit CharacterEvolved(
                tokenId,
                newArchetype,
                newRiskLevel,
                newAlignment,
                newURI
            );
        }
    }
    
    /**
     * @notice Generate metadata URI based on current stats
     * @param tokenId Token ID
     * @return uri Metadata URI (IPFS hash or API endpoint)
     */
    function _generateMetadataURI(uint256 tokenId) internal view returns (string memory) {
        CharacterStats memory stats = characterStats[tokenId];
        
        // In production, this would call an API that generates
        // dynamic metadata and images based on stats
        // For POC, return a deterministic URI
        
        string memory archetypeStr = _archetypeToString(stats.archetype);
        string memory riskStr = _riskLevelToString(stats.riskLevel);
        string memory alignmentStr = _alignmentToString(stats.alignment);
        
        // Example: "strategist-conservative-order.json"
        return string(abi.encodePacked(
            archetypeStr, "-",
            riskStr, "-",
            alignmentStr, ".json"
        ));
    }
    
    // ============ BADGES ============
    
    /**
     * @notice Award a badge to a character
     * @param tokenId Token to award badge to
     * @param badgeId Unique badge identifier (keccak256 hash)
     * @param chapterId Chapter where badge was earned
     * @param rarity Badge rarity (0-3)
     */
    function awardBadge(
        uint256 tokenId,
        bytes32 badgeId,
        string calldata chapterId,
        uint8 rarity
    ) external onlyAuthorized nonReentrant {
        if (!_exists(tokenId)) revert TokenDoesNotExist();
        if (rarity > 3) revert InvalidBadgeRarity();
        
        // Check if badge already earned (prevent duplicates)
        Badge[] storage badges = characterBadges[tokenId];
        for (uint i = 0; i < badges.length; i++) {
            if (badges[i].badgeId == badgeId) {
                revert BadgeAlreadyEarned();
            }
        }
        
        // Add badge
        badges.push(Badge({
            badgeId: badgeId,
            earnedAt: uint64(block.timestamp),
            chapterId: chapterId,
            rarity: rarity
        }));
        
        emit BadgeEarned(tokenId, badgeId, chapterId, rarity, uint64(block.timestamp));
        
        // Update metadata URI (badges affect appearance)
        string memory newURI = _generateMetadataURI(tokenId);
        _setTokenURI(tokenId, newURI);
    }
    
    /**
     * @notice Get all badges for a token
     * @param tokenId Token ID
     * @return badges Array of badges
     */
    function getBadges(uint256 tokenId) external view returns (Badge[] memory) {
        return characterBadges[tokenId];
    }
    
    // ============ SOUL-BOUND (NON-TRANSFERABLE) ============
    
    /**
     * @notice Override transferFrom to make soul-bound
     * @dev Reverts on any transfer attempt
     */
    function transferFrom(
        address /*from*/,
        address /*to*/,
        uint256 /*tokenId*/
    ) public pure override(ERC721, IERC721) {
        revert SoulBoundToken();
    }
    
    /**
     * @notice Override safeTransferFrom to make soul-bound
     */
    function safeTransferFrom(
        address /*from*/,
        address /*to*/,
        uint256 /*tokenId*/,
        bytes memory /*data*/
    ) public pure override(ERC721, IERC721) {
        revert SoulBoundToken();
    }
    
    /**
     * @notice Allow users to burn their own NFT
     * @param tokenId Token to burn
     */
    function burn(uint256 tokenId) external {
        if (ownerOf(tokenId) != msg.sender) revert NotTokenOwner();
        _burn(tokenId);
        delete characterStats[tokenId];
        delete characterBadges[tokenId];
        delete walletToTokenId[msg.sender];
    }
    
    // ============ ADMIN ============
    
    /**
     * @notice Set authorized updater
     * @param updater Address to authorize
     * @param authorized Whether to authorize or revoke
     */
    function setAuthorizedUpdater(address updater, bool authorized) external onlyOwner {
        isAuthorizedUpdater[updater] = authorized;
    }
    
    /**
     * @notice Set base token URI
     * @param baseURI New base URI
     */
    function setBaseURI(string calldata baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }
    
    /**
     * @notice Get token by wallet address
     * @param wallet Wallet address
     * @return tokenId Token ID (0 if not minted)
     */
    function getTokenByWallet(address wallet) external view returns (uint256) {
        return walletToTokenId[wallet];
    }
    
    // ============ INTERNAL HELPERS ============
    
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
    
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
    
    modifier onlyAuthorized() {
        if (!isAuthorizedUpdater[msg.sender] && msg.sender != owner()) {
            revert Unauthorized();
        }
        _;
    }
    
    // ============ ENUM TO STRING ============
    
    function _archetypeToString(Archetype archetype) internal pure returns (string memory) {
        if (archetype == Archetype.STRATEGIST) return "strategist";
        if (archetype == Archetype.GAMBLER) return "gambler";
        if (archetype == Archetype.ORACLE) return "oracle";
        if (archetype == Archetype.CONTRARIAN) return "contrarian";
        return "none";
    }
    
    function _riskLevelToString(RiskLevel risk) internal pure returns (string memory) {
        if (risk == RiskLevel.CONSERVATIVE) return "conservative";
        if (risk == RiskLevel.BALANCED) return "balanced";
        return "aggressive";
    }
    
    function _alignmentToString(Alignment alignment) internal pure returns (string memory) {
        if (alignment == Alignment.ORDER) return "order";
        if (alignment == Alignment.CHAOS) return "chaos";
        return "neutral";
    }
}
