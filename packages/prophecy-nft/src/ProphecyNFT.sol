// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ProphecyNFT
 * @author Voidborne Protocol
 * @notice Innovation Cycle #49 — "Prophecy NFTs"
 *
 * Readers mint cryptic AI-generated prophecies before chapter resolution.
 * When a chapter resolves, an on-chain oracle evaluates each prophecy:
 *   - UNFULFILLED: The dark remains unspoken (still collectible)
 *   - ECHOED:      Partial fulfillment — silver artifact (3× base value)
 *   - FULFILLED:   Direct match — legendary artifact (10× base value)
 *
 * Revenue: 5 $FORGE per mint, 5% secondary royalty, Oracle Pack bundles.
 *
 *  ┌─────────────────────────────────────────────────────┐
 *  │  PRE-CHAPTER: AI generates 10-20 cryptic prophecies │
 *  │  MINTING: 100 NFTs max per prophecy (5 $FORGE each) │
 *  │  RESOLUTION: Oracle evaluates fulfillment on-chain  │
 *  │  TRANSFORM: NFT metadata updates to final state     │
 *  └─────────────────────────────────────────────────────┘
 */
contract ProphecyNFT is ERC721URIStorage, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;

    // ─── Constants ───────────────────────────────────────────────────────────

    uint256 public constant MINT_PRICE       = 5e18;     // 5 $FORGE
    uint256 public constant MAX_PER_PROPHECY = 100;      // 100 NFTs per prophecy
    uint256 public constant ROYALTY_BPS      = 500;      // 5% secondary royalty
    uint256 public constant TREASURY_SHARE   = 1250;     // 12.5% to treasury
    uint256 public constant DEV_SHARE        = 250;      // 2.5% to dev

    // ─── Enums ───────────────────────────────────────────────────────────────

    enum FulfillmentStatus {
        PENDING,      // Chapter not yet resolved
        UNFULFILLED,  // Prophecy did not come true
        ECHOED,       // Partial match — silver artifact
        FULFILLED     // Direct match — legendary artifact
    }

    // ─── Structs ─────────────────────────────────────────────────────────────

    struct Prophecy {
        uint256 prophecyId;    // Unique prophecy identifier
        uint256 chapterId;     // Chapter this prophecy belongs to
        bytes32 contentHash;   // Keccak256 of prophecy text (sealed pre-resolution)
        string  pendingURI;    // IPFS URI for pending state
        string  fulfilledURI;  // IPFS URI for fulfilled state (set by oracle)
        string  echoedURI;     // IPFS URI for echoed state
        string  unfulfilledURI;// IPFS URI for unfulfilled state
        uint256 mintedCount;   // How many have been minted
        uint256 mintedAt;      // Block timestamp when prophecy was seeded
        bool    revealed;      // Whether content has been revealed
        FulfillmentStatus status;
    }

    struct TokenData {
        uint256 prophecyId;    // Which prophecy this token belongs to
        uint256 mintOrder;     // 1-indexed mint order (e.g., "3rd to mint")
        uint256 mintedAt;      // Timestamp of mint
        address minter;        // Original minter address
    }

    // ─── State ───────────────────────────────────────────────────────────────

    Counters.Counter private _tokenIdCounter;
    Counters.Counter private _prophecyIdCounter;

    IERC20  public immutable forge;       // $FORGE token
    address public           treasury;
    address public           dev;
    address public           oracle;      // Authorized fulfillment oracle

    mapping(uint256 => Prophecy)  public prophecies;   // prophecyId → Prophecy
    mapping(uint256 => TokenData) public tokenData;    // tokenId → TokenData
    mapping(uint256 => uint256[]) public chapterProphecies; // chapterId → prophecyIds[]
    mapping(uint256 => mapping(address => uint256)) public prophecyMints; // prophecyId → addr → count

    // ─── Events ──────────────────────────────────────────────────────────────

    event ProphecySeeded(
        uint256 indexed prophecyId,
        uint256 indexed chapterId,
        bytes32         contentHash
    );

    event ProphecyRevealed(
        uint256 indexed prophecyId,
        string          text
    );

    event ProphecyMinted(
        uint256 indexed tokenId,
        uint256 indexed prophecyId,
        address indexed minter,
        uint256         mintOrder
    );

    event ProphecyFulfilled(
        uint256 indexed prophecyId,
        FulfillmentStatus status,
        uint256 affectedTokenCount
    );

    event OracleUpdated(address indexed oldOracle, address indexed newOracle);

    // ─── Constructor ─────────────────────────────────────────────────────────

    constructor(
        address _forge,
        address _treasury,
        address _dev,
        address _oracle
    ) ERC721("Voidborne Prophecy", "VOID-PROPH") Ownable(msg.sender) {
        require(_forge    != address(0), "ProphecyNFT: zero forge");
        require(_treasury != address(0), "ProphecyNFT: zero treasury");
        require(_dev      != address(0), "ProphecyNFT: zero dev");
        require(_oracle   != address(0), "ProphecyNFT: zero oracle");

        forge    = IERC20(_forge);
        treasury = _treasury;
        dev      = _dev;
        oracle   = _oracle;
    }

    // ─── Modifiers ───────────────────────────────────────────────────────────

    modifier onlyOracle() {
        require(msg.sender == oracle, "ProphecyNFT: not oracle");
        _;
    }

    // ─── Oracle Functions ─────────────────────────────────────────────────────

    /**
     * @notice Seed a new prophecy for a chapter (called by oracle pre-chapter).
     * @dev    Content is sealed as a hash. Text is revealed after minting window closes.
     * @param  chapterId   The chapter this prophecy belongs to
     * @param  contentHash keccak256 of the prophecy text (preimage hidden until reveal)
     * @param  pendingURI  IPFS metadata URI for the pending/unminted NFT art
     */
    function seedProphecy(
        uint256 chapterId,
        bytes32 contentHash,
        string  calldata pendingURI
    ) external onlyOracle returns (uint256 prophecyId) {
        _prophecyIdCounter.increment();
        prophecyId = _prophecyIdCounter.current();

        prophecies[prophecyId] = Prophecy({
            prophecyId:     prophecyId,
            chapterId:      chapterId,
            contentHash:    contentHash,
            pendingURI:     pendingURI,
            fulfilledURI:   "",
            echoedURI:      "",
            unfulfilledURI: "",
            mintedCount:    0,
            mintedAt:       block.timestamp,
            revealed:       false,
            status:         FulfillmentStatus.PENDING
        });

        chapterProphecies[chapterId].push(prophecyId);

        emit ProphecySeeded(prophecyId, chapterId, contentHash);
    }

    /**
     * @notice Reveal the prophecy text after the minting window closes.
     * @dev    Verifies the preimage matches the sealed hash.
     * @param  prophecyId The prophecy to reveal
     * @param  text       Plaintext of the prophecy
     */
    function revealProphecy(
        uint256 prophecyId,
        string calldata text
    ) external onlyOracle {
        Prophecy storage p = prophecies[prophecyId];
        require(p.prophecyId != 0,     "ProphecyNFT: invalid prophecy");
        require(!p.revealed,           "ProphecyNFT: already revealed");
        require(
            keccak256(abi.encodePacked(text)) == p.contentHash,
            "ProphecyNFT: hash mismatch"
        );

        p.revealed = true;
        emit ProphecyRevealed(prophecyId, text);
    }

    /**
     * @notice Fulfill prophecies after chapter resolution.
     * @dev    Can batch-fulfill multiple prophecies at once.
     * @param  prophecyIds  Array of prophecy IDs to evaluate
     * @param  statuses     Corresponding fulfillment statuses
     * @param  metadataURIs Corresponding final metadata URIs per status
     */
    function fulfillProphecies(
        uint256[]           calldata prophecyIds,
        FulfillmentStatus[] calldata statuses,
        string[]            calldata metadataURIs
    ) external onlyOracle {
        require(
            prophecyIds.length == statuses.length &&
            statuses.length    == metadataURIs.length,
            "ProphecyNFT: array length mismatch"
        );

        for (uint256 i = 0; i < prophecyIds.length; i++) {
            uint256 pid = prophecyIds[i];
            Prophecy storage p = prophecies[pid];

            require(p.prophecyId != 0,                        "ProphecyNFT: invalid prophecy");
            require(p.status == FulfillmentStatus.PENDING,    "ProphecyNFT: already resolved");
            require(statuses[i] != FulfillmentStatus.PENDING, "ProphecyNFT: cannot set PENDING");

            p.status = statuses[i];

            // Store the appropriate URI for each fulfillment state
            if (statuses[i] == FulfillmentStatus.FULFILLED) {
                p.fulfilledURI = metadataURIs[i];
            } else if (statuses[i] == FulfillmentStatus.ECHOED) {
                p.echoedURI = metadataURIs[i];
            } else {
                p.unfulfilledURI = metadataURIs[i];
            }

            emit ProphecyFulfilled(pid, statuses[i], p.mintedCount);
        }
    }

    // ─── Minting ─────────────────────────────────────────────────────────────

    /**
     * @notice Mint a Prophecy NFT.
     * @dev    Prophecy must be PENDING. Max 100 per prophecy, 1 per address.
     * @param  prophecyId The prophecy to mint
     */
    function mint(uint256 prophecyId) external nonReentrant returns (uint256 tokenId) {
        Prophecy storage p = prophecies[prophecyId];

        require(p.prophecyId != 0,                           "ProphecyNFT: invalid prophecy");
        require(p.status == FulfillmentStatus.PENDING,       "ProphecyNFT: prophecy resolved");
        require(p.mintedCount < MAX_PER_PROPHECY,            "ProphecyNFT: sold out");
        require(prophecyMints[prophecyId][msg.sender] == 0,  "ProphecyNFT: one per wallet");

        // Collect 5 $FORGE
        require(
            forge.transferFrom(msg.sender, address(this), MINT_PRICE),
            "ProphecyNFT: forge transfer failed"
        );

        // Distribute fees (async — track in contract)
        uint256 toTreasury = (MINT_PRICE * TREASURY_SHARE) / 10_000;
        uint256 toDev      = (MINT_PRICE * DEV_SHARE)      / 10_000;
        forge.transfer(treasury, toTreasury);
        forge.transfer(dev, toDev);

        // Mint NFT
        _tokenIdCounter.increment();
        tokenId = _tokenIdCounter.current();

        p.mintedCount++;
        prophecyMints[prophecyId][msg.sender] = tokenId;

        tokenData[tokenId] = TokenData({
            prophecyId: prophecyId,
            mintOrder:  p.mintedCount,
            mintedAt:   block.timestamp,
            minter:     msg.sender
        });

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, p.pendingURI);

        emit ProphecyMinted(tokenId, prophecyId, msg.sender, p.mintedCount);
    }

    /**
     * @notice Oracle Pack: Mint multiple prophecies in one tx (20 prophecies, 80 $FORGE).
     * @dev    10% discount vs individual minting. One per prophecy per address still applies.
     * @param  prophecyIds Array of prophecy IDs to mint (max 20)
     */
    function mintOraclePack(
        uint256[] calldata prophecyIds
    ) external nonReentrant returns (uint256[] memory tokenIds) {
        require(prophecyIds.length > 0 && prophecyIds.length <= 20, "ProphecyNFT: invalid pack size");

        uint256 packPrice = MINT_PRICE * prophecyIds.length * 90 / 100; // 10% discount
        require(
            forge.transferFrom(msg.sender, address(this), packPrice),
            "ProphecyNFT: forge transfer failed"
        );

        // Distribute fees
        uint256 toTreasury = (packPrice * TREASURY_SHARE) / 10_000;
        uint256 toDev      = (packPrice * DEV_SHARE)      / 10_000;
        forge.transfer(treasury, toTreasury);
        forge.transfer(dev, toDev);

        tokenIds = new uint256[](prophecyIds.length);

        for (uint256 i = 0; i < prophecyIds.length; i++) {
            uint256 pid = prophecyIds[i];
            Prophecy storage p = prophecies[pid];

            require(p.prophecyId != 0,                         "ProphecyNFT: invalid prophecy");
            require(p.status == FulfillmentStatus.PENDING,     "ProphecyNFT: prophecy resolved");
            require(p.mintedCount < MAX_PER_PROPHECY,          "ProphecyNFT: sold out");
            require(prophecyMints[pid][msg.sender] == 0,       "ProphecyNFT: one per wallet");

            _tokenIdCounter.increment();
            uint256 tokenId = _tokenIdCounter.current();

            p.mintedCount++;
            prophecyMints[pid][msg.sender] = tokenId;

            tokenData[tokenId] = TokenData({
                prophecyId: pid,
                mintOrder:  p.mintedCount,
                mintedAt:   block.timestamp,
                minter:     msg.sender
            });

            _safeMint(msg.sender, tokenId);
            _setTokenURI(tokenId, p.pendingURI);

            tokenIds[i] = tokenId;

            emit ProphecyMinted(tokenId, pid, msg.sender, p.mintedCount);
        }
    }

    // ─── Token URI (Dynamic) ─────────────────────────────────────────────────

    /**
     * @notice Returns the current metadata URI based on fulfillment state.
     * @dev    NFT art transforms on-chain after oracle fulfillment.
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721URIStorage)
        returns (string memory)
    {
        _requireOwned(tokenId);

        TokenData storage td = tokenData[tokenId];
        Prophecy storage p   = prophecies[td.prophecyId];

        if (p.status == FulfillmentStatus.FULFILLED && bytes(p.fulfilledURI).length > 0) {
            return p.fulfilledURI;
        } else if (p.status == FulfillmentStatus.ECHOED && bytes(p.echoedURI).length > 0) {
            return p.echoedURI;
        } else if (p.status == FulfillmentStatus.UNFULFILLED && bytes(p.unfulfilledURI).length > 0) {
            return p.unfulfilledURI;
        }

        return p.pendingURI;
    }

    // ─── View Functions ──────────────────────────────────────────────────────

    /// @notice Get all prophecies for a given chapter
    function getPropheciesForChapter(uint256 chapterId)
        external view returns (uint256[] memory)
    {
        return chapterProphecies[chapterId];
    }

    /// @notice Get all token data for a specific token
    function getTokenData(uint256 tokenId)
        external view returns (TokenData memory)
    {
        _requireOwned(tokenId);
        return tokenData[tokenId];
    }

    /// @notice How many tokens of a prophecy are minted + available
    function getMintStatus(uint256 prophecyId)
        external view returns (uint256 minted, uint256 remaining)
    {
        minted    = prophecies[prophecyId].mintedCount;
        remaining = MAX_PER_PROPHECY - minted;
    }

    /// @notice Check if an address minted a specific prophecy
    function hasMinted(uint256 prophecyId, address addr)
        external view returns (bool)
    {
        return prophecyMints[prophecyId][addr] != 0;
    }

    /// @notice ERC-2981 royalty info for marketplaces
    function royaltyInfo(uint256, uint256 salePrice)
        external view returns (address receiver, uint256 royaltyAmount)
    {
        receiver      = treasury;
        royaltyAmount = (salePrice * ROYALTY_BPS) / 10_000;
    }

    // ─── Admin ───────────────────────────────────────────────────────────────

    function setOracle(address newOracle) external onlyOwner {
        require(newOracle != address(0), "ProphecyNFT: zero oracle");
        emit OracleUpdated(oracle, newOracle);
        oracle = newOracle;
    }

    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "ProphecyNFT: zero treasury");
        treasury = newTreasury;
    }

    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner(), amount);
    }

    // ─── Interfaces ──────────────────────────────────────────────────────────

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
