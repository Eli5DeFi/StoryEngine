// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title CharacterSBT
 * @notice Soul-Bound Token for Voidborne characters
 * @dev Non-transferable NFTs that earn revenue when character appears in chapters
 * 
 * Features:
 * - Soul-bound (non-transferable) to reward true fans, not speculators
 * - Revenue sharing: 5% of betting pool distributed to holders when character appears
 * - Character leveling: XP gained per appearance, unlock perks at milestones
 * - Equal distribution: All holders earn equal share (community over whales)
 * 
 * Economics:
 * - Mint fee: 0.05 ETH (configurable)
 * - Max supply per character: 50-150 (creates scarcity)
 * - Revenue share: 5% of chapter betting pool
 * - Platform fee: 2.5% of betting pool (unchanged)
 * 
 * Security:
 * - ReentrancyGuard: Prevents reentrancy attacks on claim
 * - Pausable: Emergency stop in case of exploit
 * - Ownable: Only owner can create characters, distribute revenue
 */
contract CharacterSBT is ERC721, Ownable, ReentrancyGuard, Pausable {
    
    // ========================================
    // STRUCTS
    // ========================================
    
    struct Character {
        uint256 id;
        string name;
        string characterHash; // IPFS hash (metadata: backstory, image, etc.)
        uint256 totalSupply;
        uint256 maxSupply;
        uint256 xp;
        uint256 level;
        uint256 mintPrice;
        uint256 totalEarnings; // Cumulative earnings distributed to all holders
        bool mintingOpen;
        bool isAlive; // Can be killed in story
        bool exists;
    }
    
    struct Holder {
        uint256 characterId;
        uint256 claimedEarnings;
        uint256 lastClaimChapter;
        uint256 tokenId;
    }
    
    // ========================================
    // STATE VARIABLES
    // ========================================
    
    // Character registry
    mapping(uint256 => Character) public characters;
    uint256 public nextCharacterId = 1;
    
    // Token tracking
    mapping(uint256 => mapping(address => bool)) public hasCharacter; // characterId => holder => bool
    mapping(uint256 => address[]) public holders; // characterId => list of holders
    mapping(address => mapping(uint256 => Holder)) public userHoldings; // user => characterId => Holder
    uint256 public nextTokenId = 1;
    
    // Revenue tracking
    IERC20 public bettingToken; // USDC or $FORGE
    
    // Constants
    uint256 public constant REVENUE_SHARE = 500; // 5% in basis points
    uint256 public constant XP_PER_APPEARANCE = 1;
    uint256 public constant XP_PER_LEVEL = 5; // Every 5 XP = 1 level
    
    // ========================================
    // EVENTS
    // ========================================
    
    event CharacterCreated(
        uint256 indexed characterId, 
        string name, 
        uint256 maxSupply, 
        uint256 mintPrice
    );
    
    event CharacterMinted(
        address indexed holder, 
        uint256 indexed characterId, 
        uint256 tokenId
    );
    
    event RevenueDistributed(
        uint256 indexed characterId, 
        uint256 amount, 
        uint256 chapterId
    );
    
    event EarningsClaimed(
        address indexed holder, 
        uint256 indexed characterId, 
        uint256 amount
    );
    
    event CharacterLevelUp(
        uint256 indexed characterId, 
        uint256 newLevel
    );
    
    event XPGained(
        uint256 indexed characterId, 
        uint256 xpAmount
    );
    
    event CharacterKilled(
        uint256 indexed characterId,
        uint256 chapterId
    );
    
    // ========================================
    // CONSTRUCTOR
    // ========================================
    
    /**
     * @notice Initialize the CharacterSBT contract
     * @param _bettingToken Address of USDC or $FORGE token used for revenue distribution
     */
    constructor(address _bettingToken) 
        ERC721("Voidborne Character SBT", "VCSBT") 
        Ownable(msg.sender) 
    {
        require(_bettingToken != address(0), "Invalid token address");
        bettingToken = IERC20(_bettingToken);
    }
    
    // ========================================
    // CHARACTER MANAGEMENT (OWNER ONLY)
    // ========================================
    
    /**
     * @notice Create a new character
     * @param name Character name (e.g., "Commander Zara")
     * @param characterHash IPFS hash with metadata (backstory, image, rarity, etc.)
     * @param maxSupply Max number of holders (creates scarcity, typical: 50-150)
     * @param mintPrice Price to mint in ETH (e.g., 0.05 ETH)
     * @return characterId The ID of the newly created character
     */
    function createCharacter(
        string calldata name,
        string calldata characterHash,
        uint256 maxSupply,
        uint256 mintPrice
    ) external onlyOwner returns (uint256 characterId) {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(characterHash).length > 0, "Hash cannot be empty");
        require(maxSupply > 0 && maxSupply <= 1000, "Invalid max supply");
        
        characterId = nextCharacterId++;
        
        characters[characterId] = Character({
            id: characterId,
            name: name,
            characterHash: characterHash,
            totalSupply: 0,
            maxSupply: maxSupply,
            xp: 0,
            level: 1,
            mintPrice: mintPrice,
            totalEarnings: 0,
            mintingOpen: true,
            isAlive: true,
            exists: true
        });
        
        emit CharacterCreated(characterId, name, maxSupply, mintPrice);
    }
    
    /**
     * @notice Close minting for a character (once sold out or manually closed)
     * @param characterId Character to close minting for
     */
    function closeMinting(uint256 characterId) external onlyOwner {
        require(characters[characterId].exists, "Character does not exist");
        characters[characterId].mintingOpen = false;
    }
    
    /**
     * @notice Kill a character in the story (narrative event)
     * @param characterId Character to kill
     * @param chapterId Chapter where character died
     */
    function killCharacter(uint256 characterId, uint256 chapterId) external onlyOwner {
        require(characters[characterId].exists, "Character does not exist");
        require(characters[characterId].isAlive, "Already dead");
        
        Character storage char = characters[characterId];
        
        // Level 50+ characters are immortal (special perk)
        require(char.level < 50, "Character is immortal (level 50+)");
        
        char.isAlive = false;
        
        emit CharacterKilled(characterId, chapterId);
    }
    
    // ========================================
    // MINTING
    // ========================================
    
    /**
     * @notice Mint a Character SBT (Soul-Bound, non-transferable)
     * @param characterId ID of character to mint
     */
    function mintCharacter(uint256 characterId) external payable nonReentrant whenNotPaused {
        Character storage char = characters[characterId];
        
        require(char.exists, "Character does not exist");
        require(char.mintingOpen, "Minting is closed");
        require(char.totalSupply < char.maxSupply, "Sold out");
        require(!hasCharacter[characterId][msg.sender], "Already owns this character");
        require(msg.value >= char.mintPrice, "Insufficient payment");
        
        uint256 tokenId = nextTokenId++;
        
        // Mint NFT
        _safeMint(msg.sender, tokenId);
        
        // Update state
        char.totalSupply++;
        hasCharacter[characterId][msg.sender] = true;
        holders[characterId].push(msg.sender);
        
        userHoldings[msg.sender][characterId] = Holder({
            characterId: characterId,
            claimedEarnings: 0,
            lastClaimChapter: 0,
            tokenId: tokenId
        });
        
        emit CharacterMinted(msg.sender, characterId, tokenId);
        
        // Auto-close minting if sold out
        if (char.totalSupply >= char.maxSupply) {
            char.mintingOpen = false;
        }
        
        // Refund excess payment
        if (msg.value > char.mintPrice) {
            payable(msg.sender).transfer(msg.value - char.mintPrice);
        }
    }
    
    /**
     * @notice Burn token and get 80% refund (within 7 days of mint)
     * @param tokenId Token to burn
     * @dev Allows users to "try before you buy" (7-day return policy)
     */
    function burnForRefund(uint256 tokenId) external nonReentrant {
        require(_ownerOf(tokenId) == msg.sender, "Not the owner");
        
        // Find character (iterate through holdings)
        uint256 characterId = 0;
        for (uint256 i = 1; i < nextCharacterId; i++) {
            if (userHoldings[msg.sender][i].tokenId == tokenId) {
                characterId = i;
                break;
            }
        }
        
        require(characterId != 0, "Character not found");
        
        Character storage char = characters[characterId];
        Holder storage holder = userHoldings[msg.sender][characterId];
        
        // Must be within 7 days (604800 seconds)
        require(block.timestamp <= 604800, "Refund period expired");
        
        // 80% refund
        uint256 refund = (char.mintPrice * 80) / 100;
        
        // Clean up state
        _burn(tokenId);
        hasCharacter[characterId][msg.sender] = false;
        delete userHoldings[msg.sender][characterId];
        
        // Remove from holders array (expensive, but rare operation)
        _removeHolder(characterId, msg.sender);
        
        char.totalSupply--;
        char.mintingOpen = true; // Reopen if was sold out
        
        // Send refund
        payable(msg.sender).transfer(refund);
    }
    
    // ========================================
    // REVENUE DISTRIBUTION
    // ========================================
    
    /**
     * @notice Distribute revenue when character appears in a chapter
     * @param characterId Character that appeared
     * @param chapterId Chapter ID
     * @param bettingPoolAmount Total betting pool for chapter
     * @dev Called by betting pool contract after chapter resolves
     */
    function distributeRevenue(
        uint256 characterId,
        uint256 chapterId,
        uint256 bettingPoolAmount
    ) external onlyOwner nonReentrant {
        Character storage char = characters[characterId];
        require(char.exists, "Character does not exist");
        require(char.totalSupply > 0, "No holders");
        
        uint256 revenueShare = (bettingPoolAmount * REVENUE_SHARE) / 10000; // 5%
        
        // Transfer tokens to contract for distribution
        bettingToken.transferFrom(msg.sender, address(this), revenueShare);
        
        char.totalEarnings += revenueShare;
        
        // Add XP (1 XP per appearance)
        char.xp += XP_PER_APPEARANCE;
        emit XPGained(characterId, XP_PER_APPEARANCE);
        
        // Check for level up (every 5 XP = 1 level)
        uint256 newLevel = 1 + (char.xp / XP_PER_LEVEL);
        if (newLevel > char.level) {
            char.level = newLevel;
            emit CharacterLevelUp(characterId, newLevel);
        }
        
        emit RevenueDistributed(characterId, revenueShare, chapterId);
    }
    
    /**
     * @notice Claim accumulated earnings for a character
     * @param characterId Character to claim earnings from
     */
    function claimEarnings(uint256 characterId) external nonReentrant whenNotPaused {
        require(hasCharacter[characterId][msg.sender], "Do not own this character");
        
        Character storage char = characters[characterId];
        Holder storage holder = userHoldings[msg.sender][characterId];
        
        // Calculate share (equal distribution among all holders)
        uint256 totalHolders = holders[characterId].length;
        require(totalHolders > 0, "No holders");
        
        uint256 sharePerHolder = char.totalEarnings / totalHolders;
        uint256 claimable = sharePerHolder - holder.claimedEarnings;
        
        require(claimable > 0, "No earnings to claim");
        
        holder.claimedEarnings += claimable;
        
        bettingToken.transfer(msg.sender, claimable);
        
        emit EarningsClaimed(msg.sender, characterId, claimable);
    }
    
    // ========================================
    // VIEW FUNCTIONS
    // ========================================
    
    /**
     * @notice Get unclaimed earnings for a holder
     * @param holder Address of holder
     * @param characterId Character ID
     * @return Unclaimed earnings in betting token (USDC)
     */
    function getUnclaimedEarnings(address holder, uint256 characterId) 
        external 
        view 
        returns (uint256) 
    {
        if (!hasCharacter[characterId][holder]) return 0;
        
        Character storage char = characters[characterId];
        Holder storage holderData = userHoldings[holder][characterId];
        
        uint256 totalHolders = holders[characterId].length;
        if (totalHolders == 0) return 0;
        
        uint256 sharePerHolder = char.totalEarnings / totalHolders;
        return sharePerHolder - holderData.claimedEarnings;
    }
    
    /**
     * @notice Get all characters a user holds
     * @param user Address to query
     * @return Array of character IDs
     */
    function getUserCharacters(address user) external view returns (uint256[] memory) {
        uint256 count = 0;
        
        // Count characters
        for (uint256 i = 1; i < nextCharacterId; i++) {
            if (hasCharacter[i][user]) count++;
        }
        
        // Build array
        uint256[] memory charIds = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i < nextCharacterId; i++) {
            if (hasCharacter[i][user]) {
                charIds[index++] = i;
            }
        }
        
        return charIds;
    }
    
    /**
     * @notice Get character details
     * @param characterId Character ID
     * @return Character struct
     */
    function getCharacter(uint256 characterId) external view returns (Character memory) {
        require(characters[characterId].exists, "Character does not exist");
        return characters[characterId];
    }
    
    /**
     * @notice Get holder details
     * @param user Address of holder
     * @param characterId Character ID
     * @return Holder struct
     */
    function getHolderInfo(address user, uint256 characterId) 
        external 
        view 
        returns (Holder memory) 
    {
        require(hasCharacter[characterId][user], "Not a holder");
        return userHoldings[user][characterId];
    }
    
    /**
     * @notice Get total number of characters created
     * @return Total characters
     */
    function getTotalCharacters() external view returns (uint256) {
        return nextCharacterId - 1;
    }
    
    // ========================================
    // SOUL-BOUND ENFORCEMENT
    // ========================================
    
    /**
     * @notice Override transfer to make tokens Soul-Bound (non-transferable)
     * @dev Only allows minting (from == address(0)) and burning (to == address(0))
     */
    function _update(address to, uint256 tokenId, address auth) 
        internal 
        virtual 
        override 
        returns (address) 
    {
        address from = _ownerOf(tokenId);
        
        // Allow minting (from == address(0))
        // Block transfers (from != address(0) && to != address(0))
        // Allow burning (to == address(0))
        if (from != address(0) && to != address(0)) {
            revert("Soul-Bound: cannot transfer");
        }
        
        return super._update(to, tokenId, auth);
    }
    
    // ========================================
    // ADMIN FUNCTIONS
    // ========================================
    
    /**
     * @notice Withdraw accumulated mint fees
     * @dev Only owner can withdraw
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        payable(owner()).transfer(balance);
    }
    
    /**
     * @notice Emergency pause (in case of exploit)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause after emergency
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // ========================================
    // INTERNAL HELPERS
    // ========================================
    
    /**
     * @notice Remove holder from holders array
     * @param characterId Character ID
     * @param holder Address to remove
     */
    function _removeHolder(uint256 characterId, address holder) internal {
        address[] storage holdersList = holders[characterId];
        
        for (uint256 i = 0; i < holdersList.length; i++) {
            if (holdersList[i] == holder) {
                // Swap with last element and pop
                holdersList[i] = holdersList[holdersList.length - 1];
                holdersList.pop();
                break;
            }
        }
    }
    
    // ========================================
    // METADATA
    // ========================================
    
    /**
     * @notice Get token URI (IPFS hash)
     * @param tokenId Token ID
     * @return IPFS URI
     */
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        
        // Find character for this token
        uint256 characterId = 0;
        for (uint256 i = 1; i < nextCharacterId; i++) {
            Character storage char = characters[i];
            if (char.exists) {
                // Check if any holder has this tokenId
                for (uint256 j = 0; j < holders[i].length; j++) {
                    if (userHoldings[holders[i][j]][i].tokenId == tokenId) {
                        characterId = i;
                        break;
                    }
                }
            }
            if (characterId != 0) break;
        }
        
        require(characterId != 0, "Character not found");
        
        return string(abi.encodePacked("ipfs://", characters[characterId].characterHash));
    }
}

// ========================================
// IERC20 INTERFACE (for bettingToken)
// ========================================

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}
