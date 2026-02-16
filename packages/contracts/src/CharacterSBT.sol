// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title CharacterSBT
 * @notice Soul-Bound Token for Voidborne characters
 * @dev Non-transferable NFTs that earn revenue when character appears in chapters
 * 
 * Key Features:
 * - Soul-Bound (non-transferable) to prevent speculation
 * - Revenue sharing (5% of betting pool when character appears)
 * - Character leveling (XP from appearances unlock perks)
 * - Limited supply per character (creates scarcity)
 * - Equal profit distribution among holders
 * 
 * Economics:
 * - Mint fee: 0.05 ETH (sent to treasury)
 * - Revenue share: 5% of chapter betting pool
 * - Platform fee: 2.5% of mint fees
 * 
 * Example ROI:
 * - Character appears in 20 chapters
 * - Avg pool: 10K USDC → 500 USDC per appearance
 * - 50 holders → 10 USDC per holder per appearance
 * - Total: 200 USDC earned (133% ROI on 0.05 ETH)
 */
contract CharacterSBT is ERC721, Ownable, ReentrancyGuard {
    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/
    
    struct Character {
        uint256 id;
        string name;
        string metadataURI;      // IPFS URI with full metadata
        uint256 totalSupply;     // Current number of holders
        uint256 maxSupply;       // Max holders allowed
        uint256 xp;              // Experience points
        uint256 level;           // Current level
        uint256 mintPrice;       // Price in wei to mint
        uint256 totalEarnings;   // Cumulative earnings distributed (USDC)
        bool mintingOpen;        // Can still mint?
        bool isAlive;            // Character status in story
    }
    
    struct Holder {
        uint256 characterId;
        uint256 claimedEarnings; // Amount already claimed (USDC)
        uint256 lastClaimBlock;  // Gas optimization
    }
    
    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/
    
    // Character data
    mapping(uint256 => Character) public characters;
    mapping(uint256 => address[]) public holders;           // characterId => holder addresses
    mapping(uint256 => mapping(address => bool)) public hasCharacter; // characterId => holder => owns
    
    // User holdings
    mapping(address => mapping(uint256 => Holder)) public userHoldings; // user => characterId => Holder
    mapping(address => uint256[]) public userCharacterList; // user => list of characterIds
    
    // Token tracking
    mapping(uint256 => uint256) public tokenIdToCharacterId; // tokenId => characterId
    
    uint256 public nextCharacterId = 1;
    uint256 public nextTokenId = 1;
    
    // Revenue share config (in basis points)
    uint256 public constant REVENUE_SHARE_BPS = 500;   // 5%
    uint256 public constant PLATFORM_FEE_BPS = 250;    // 2.5%
    uint256 public constant BASIS_POINTS = 10000;
    
    // Leveling config
    uint256 public constant XP_PER_LEVEL = 5;          // Every 5 appearances = 1 level
    
    // External contracts
    IERC20 public immutable bettingToken;              // USDC or stable
    address public treasury;
    
    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/
    
    event CharacterCreated(
        uint256 indexed characterId,
        string name,
        uint256 maxSupply,
        uint256 mintPrice
    );
    
    event CharacterMinted(
        address indexed holder,
        uint256 indexed characterId,
        uint256 tokenId,
        uint256 price
    );
    
    event RevenueDistributed(
        uint256 indexed characterId,
        uint256 indexed chapterId,
        uint256 amount,
        uint256 holderCount
    );
    
    event EarningsClaimed(
        address indexed holder,
        uint256 indexed characterId,
        uint256 amount
    );
    
    event CharacterLevelUp(
        uint256 indexed characterId,
        uint256 newLevel,
        uint256 xp
    );
    
    event XPGained(
        uint256 indexed characterId,
        uint256 xpAmount,
        uint256 totalXP
    );
    
    event CharacterKilled(uint256 indexed characterId);
    event MintingClosed(uint256 indexed characterId);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    
    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/
    
    error CharacterNotFound();
    error MintingClosed();
    error SoldOut();
    error AlreadyOwnsCharacter();
    error InsufficientPayment();
    error NotOwner();
    error NoEarningsToClaim();
    error SoulBoundToken();
    error InvalidCharacter();
    error InvalidAddress();
    error TransferFailed();
    
    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Initialize Character SBT contract
     * @param _bettingToken Address of USDC or stable token for revenue distribution
     * @param _treasury Address to receive mint fees
     */
    constructor(
        address _bettingToken,
        address _treasury
    ) ERC721("Voidborne Character SBT", "VCHAR") Ownable(msg.sender) {
        if (_bettingToken == address(0) || _treasury == address(0)) revert InvalidAddress();
        
        bettingToken = IERC20(_bettingToken);
        treasury = _treasury;
    }
    
    /*//////////////////////////////////////////////////////////////
                        ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Create a new character for minting
     * @param name Character name (e.g., "Commander Zara")
     * @param metadataURI IPFS URI with character metadata (image, backstory, traits)
     * @param maxSupply Maximum number of holders (creates scarcity)
     * @param mintPrice Price in wei to mint (typically 0.05 ETH)
     * @return characterId The ID of the newly created character
     */
    function createCharacter(
        string calldata name,
        string calldata metadataURI,
        uint256 maxSupply,
        uint256 mintPrice
    ) external onlyOwner returns (uint256 characterId) {
        characterId = nextCharacterId++;
        
        characters[characterId] = Character({
            id: characterId,
            name: name,
            metadataURI: metadataURI,
            totalSupply: 0,
            maxSupply: maxSupply,
            xp: 0,
            level: 1,
            mintPrice: mintPrice,
            totalEarnings: 0,
            mintingOpen: true,
            isAlive: true
        });
        
        emit CharacterCreated(characterId, name, maxSupply, mintPrice);
    }
    
    /**
     * @notice Distribute revenue when character appears in a chapter
     * @param characterId Character that appeared
     * @param chapterId Chapter ID (for tracking)
     * @param bettingPoolAmount Total betting pool for chapter (USDC)
     * @dev Called by backend after chapter is published
     */
    function distributeRevenue(
        uint256 characterId,
        uint256 chapterId,
        uint256 bettingPoolAmount
    ) external onlyOwner {
        Character storage char = characters[characterId];
        if (!char.isAlive) revert InvalidCharacter();
        
        uint256 revenueShare = (bettingPoolAmount * REVENUE_SHARE_BPS) / BASIS_POINTS;
        
        // Transfer USDC from caller (treasury) to this contract
        bool success = bettingToken.transferFrom(msg.sender, address(this), revenueShare);
        if (!success) revert TransferFailed();
        
        // Add to character's total earnings
        char.totalEarnings += revenueShare;
        
        // Grant XP (1 XP per appearance)
        char.xp++;
        emit XPGained(characterId, 1, char.xp);
        
        // Check for level up (every 5 XP = 1 level)
        uint256 newLevel = 1 + (char.xp / XP_PER_LEVEL);
        if (newLevel > char.level) {
            char.level = newLevel;
            emit CharacterLevelUp(characterId, newLevel, char.xp);
        }
        
        emit RevenueDistributed(
            characterId,
            chapterId,
            revenueShare,
            holders[characterId].length
        );
    }
    
    /**
     * @notice Close minting for a character
     * @param characterId Character to close minting for
     */
    function closeMinting(uint256 characterId) external onlyOwner {
        if (!characters[characterId].isAlive) revert CharacterNotFound();
        characters[characterId].mintingOpen = false;
        emit MintingClosed(characterId);
    }
    
    /**
     * @notice Kill a character in the story (stops revenue distribution)
     * @param characterId Character to kill
     * @dev Character holders keep their SBTs but no more earnings
     */
    function killCharacter(uint256 characterId) external onlyOwner {
        if (!characters[characterId].isAlive) revert InvalidCharacter();
        characters[characterId].isAlive = false;
        characters[characterId].mintingOpen = false;
        emit CharacterKilled(characterId);
    }
    
    /**
     * @notice Update treasury address
     * @param _newTreasury New treasury address
     */
    function setTreasury(address _newTreasury) external onlyOwner {
        if (_newTreasury == address(0)) revert InvalidAddress();
        address oldTreasury = treasury;
        treasury = _newTreasury;
        emit TreasuryUpdated(oldTreasury, _newTreasury);
    }
    
    /**
     * @notice Withdraw accumulated mint fees
     * @dev Sends ETH to treasury
     */
    function withdrawMintFees() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = treasury.call{value: balance}("");
        if (!success) revert TransferFailed();
    }
    
    /*//////////////////////////////////////////////////////////////
                        USER FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Mint a Character SBT (Soul-Bound, non-transferable)
     * @param characterId ID of character to mint
     * @dev Soul-Bound: Cannot be transferred after minting
     */
    function mintCharacter(uint256 characterId) external payable nonReentrant {
        Character storage char = characters[characterId];
        
        // Validation
        if (!char.isAlive) revert CharacterNotFound();
        if (!char.mintingOpen) revert MintingClosed();
        if (char.totalSupply >= char.maxSupply) revert SoldOut();
        if (hasCharacter[characterId][msg.sender]) revert AlreadyOwnsCharacter();
        if (msg.value < char.mintPrice) revert InsufficientPayment();
        
        uint256 tokenId = nextTokenId++;
        
        // Mint NFT
        _safeMint(msg.sender, tokenId);
        
        // Update character state
        char.totalSupply++;
        hasCharacter[characterId][msg.sender] = true;
        holders[characterId].push(msg.sender);
        tokenIdToCharacterId[tokenId] = characterId;
        
        // Initialize user holding
        userHoldings[msg.sender][characterId] = Holder({
            characterId: characterId,
            claimedEarnings: 0,
            lastClaimBlock: block.number
        });
        
        userCharacterList[msg.sender].push(characterId);
        
        emit CharacterMinted(msg.sender, characterId, tokenId, msg.value);
        
        // Auto-close minting if sold out
        if (char.totalSupply >= char.maxSupply) {
            char.mintingOpen = false;
            emit MintingClosed(characterId);
        }
        
        // Refund overpayment
        if (msg.value > char.mintPrice) {
            (bool success, ) = msg.sender.call{value: msg.value - char.mintPrice}("");
            if (!success) revert TransferFailed();
        }
    }
    
    /**
     * @notice Claim accumulated earnings for a character
     * @param characterId Character to claim earnings from
     * @dev Equal distribution among all holders
     */
    function claimEarnings(uint256 characterId) external nonReentrant {
        if (!hasCharacter[characterId][msg.sender]) revert NotOwner();
        
        Character storage char = characters[characterId];
        Holder storage holder = userHoldings[msg.sender][characterId];
        
        // Calculate share (equal distribution)
        uint256 totalHolders = holders[characterId].length;
        uint256 sharePerHolder = char.totalEarnings / totalHolders;
        uint256 claimable = sharePerHolder - holder.claimedEarnings;
        
        if (claimable == 0) revert NoEarningsToClaim();
        
        // Update claimed amount
        holder.claimedEarnings += claimable;
        holder.lastClaimBlock = block.number;
        
        // Transfer USDC to holder
        bool success = bettingToken.transfer(msg.sender, claimable);
        if (!success) revert TransferFailed();
        
        emit EarningsClaimed(msg.sender, characterId, claimable);
    }
    
    /**
     * @notice Claim earnings for multiple characters at once
     * @param characterIds Array of character IDs to claim from
     * @dev Gas-optimized batch claiming
     */
    function claimEarningsBatch(uint256[] calldata characterIds) external nonReentrant {
        uint256 totalClaimable;
        
        for (uint256 i = 0; i < characterIds.length; i++) {
            uint256 characterId = characterIds[i];
            
            if (!hasCharacter[characterId][msg.sender]) continue;
            
            Character storage char = characters[characterId];
            Holder storage holder = userHoldings[msg.sender][characterId];
            
            uint256 totalHolders = holders[characterId].length;
            uint256 sharePerHolder = char.totalEarnings / totalHolders;
            uint256 claimable = sharePerHolder - holder.claimedEarnings;
            
            if (claimable > 0) {
                holder.claimedEarnings += claimable;
                holder.lastClaimBlock = block.number;
                totalClaimable += claimable;
                
                emit EarningsClaimed(msg.sender, characterId, claimable);
            }
        }
        
        if (totalClaimable == 0) revert NoEarningsToClaim();
        
        bool success = bettingToken.transfer(msg.sender, totalClaimable);
        if (!success) revert TransferFailed();
    }
    
    /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Get unclaimed earnings for a holder
     * @param holder Address of holder
     * @param characterId Character ID
     * @return Amount of USDC unclaimed
     */
    function getUnclaimedEarnings(
        address holder,
        uint256 characterId
    ) external view returns (uint256) {
        if (!hasCharacter[characterId][holder]) return 0;
        
        Character storage char = characters[characterId];
        Holder storage holderData = userHoldings[holder][characterId];
        
        uint256 totalHolders = holders[characterId].length;
        if (totalHolders == 0) return 0;
        
        uint256 sharePerHolder = char.totalEarnings / totalHolders;
        return sharePerHolder - holderData.claimedEarnings;
    }
    
    /**
     * @notice Get all characters owned by a user
     * @param user Address to query
     * @return Array of character IDs
     */
    function getUserCharacters(address user) external view returns (uint256[] memory) {
        return userCharacterList[user];
    }
    
    /**
     * @notice Get total unclaimed earnings across all characters for a user
     * @param user Address to query
     * @return total Total USDC unclaimed
     */
    function getTotalUnclaimedEarnings(address user) external view returns (uint256 total) {
        uint256[] memory charIds = userCharacterList[user];
        
        for (uint256 i = 0; i < charIds.length; i++) {
            uint256 characterId = charIds[i];
            Character storage char = characters[characterId];
            Holder storage holder = userHoldings[user][characterId];
            
            uint256 totalHolders = holders[characterId].length;
            if (totalHolders > 0) {
                uint256 sharePerHolder = char.totalEarnings / totalHolders;
                total += (sharePerHolder - holder.claimedEarnings);
            }
        }
    }
    
    /**
     * @notice Get character details
     * @param characterId Character ID
     * @return Character struct with all data
     */
    function getCharacter(uint256 characterId) external view returns (Character memory) {
        return characters[characterId];
    }
    
    /**
     * @notice Get all holders of a character
     * @param characterId Character ID
     * @return Array of holder addresses
     */
    function getCharacterHolders(uint256 characterId) external view returns (address[] memory) {
        return holders[characterId];
    }
    
    /**
     * @notice Get total number of characters created
     * @return Total count
     */
    function getTotalCharacters() external view returns (uint256) {
        return nextCharacterId - 1;
    }
    
    /**
     * @notice Get token URI for a token
     * @param tokenId Token ID
     * @return Metadata URI
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        uint256 characterId = tokenIdToCharacterId[tokenId];
        return characters[characterId].metadataURI;
    }
    
    /*//////////////////////////////////////////////////////////////
                        SOUL-BOUND LOGIC
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Override transfer to make tokens Soul-Bound
     * @dev Allows minting and burning, blocks transfers
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Allow minting (from == address(0))
        // Allow burning (to == address(0))
        // Block transfers (from != address(0) && to != address(0))
        if (from != address(0) && to != address(0)) {
            revert SoulBoundToken();
        }
        
        return super._update(to, tokenId, auth);
    }
    
    /**
     * @notice Check if contract supports an interface
     * @param interfaceId Interface ID to check
     * @return Whether interface is supported
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override returns (bool) {
        return super.supportsInterface(interfaceId);
    }
    
    /**
     * @notice Receive ETH for mint fees
     */
    receive() external payable {}
}
