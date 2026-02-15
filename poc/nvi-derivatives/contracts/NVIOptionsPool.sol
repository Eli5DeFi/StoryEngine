// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title NVIOptionsPool
 * @notice European-style options trading on Narrative Volatility Index (NVI)
 * @dev POC implementation - production version needs more robust oracle integration
 * 
 * NVI (Narrative Volatility Index) measures story unpredictability based on:
 * - Betting pool distribution (entropy)
 * - AI model prediction variance
 * - Historical pattern deviations
 * 
 * Similar to VIX for stocks, traders can:
 * - Buy CALL options (bet volatility increases)
 * - Buy PUT options (bet volatility decreases)
 * - Settle options after chapter NVI is finalized
 */
contract NVIOptionsPool is Ownable, ReentrancyGuard {
    
    // ==================== ENUMS & STRUCTS ====================
    
    enum OptionType { CALL, PUT }
    
    struct Option {
        uint256 id;
        uint256 chapterId;           // Chapter this option expires at
        OptionType optionType;       // CALL or PUT
        uint256 strikeNVI;           // Strike volatility (scaled by 100, e.g., 7000 = 70.00)
        uint256 premium;             // Cost to buy option (in USDC)
        uint256 expiry;              // Timestamp when option expires
        address creator;             // Option writer (liquidity provider)
        address holder;              // Option buyer (address(0) if unsold)
        uint256 collateral;          // Locked collateral by creator
        bool settled;
        uint256 payout;
    }
    
    struct NVISnapshot {
        uint256 chapterId;
        uint256 nviValue;            // Scaled by 100 (e.g., 7340 = 73.40)
        uint256 timestamp;
        bool finalized;
    }
    
    // ==================== STATE VARIABLES ====================
    
    IERC20 public immutable forgeToken;
    
    mapping(uint256 => Option) public options;
    mapping(uint256 => NVISnapshot) public nviSnapshots;
    mapping(uint256 => uint256[]) public chapterOptions; // chapterId => optionIds
    
    uint256 public nextOptionId = 1;
    uint256 public platformFee = 250;        // 2.5% (basis points: 250/10000)
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public constant MAX_LEVERAGE = 3; // Max 3x payout potential
    
    // ==================== EVENTS ====================
    
    event OptionCreated(
        uint256 indexed optionId,
        uint256 indexed chapterId,
        OptionType optionType,
        uint256 strikeNVI,
        uint256 premium,
        address indexed creator
    );
    
    event OptionPurchased(
        uint256 indexed optionId,
        address indexed buyer,
        uint256 premium
    );
    
    event OptionSettled(
        uint256 indexed optionId,
        uint256 finalNVI,
        uint256 payout,
        address indexed winner
    );
    
    event NVIFinalized(
        uint256 indexed chapterId,
        uint256 nviValue
    );
    
    event CollateralReturned(
        uint256 indexed optionId,
        address indexed creator,
        uint256 amount
    );
    
    // ==================== ERRORS ====================
    
    error InvalidStrike();
    error InvalidPremium();
    error ChapterAlreadyFinalized();
    error OptionAlreadySold();
    error OptionAlreadySettled();
    error ChapterNotFinalized();
    error NotOptionHolder();
    error InsufficientCollateral();
    error TransferFailed();
    error Unauthorized();
    
    // ==================== CONSTRUCTOR ====================
    
    constructor(address _forgeToken) Ownable(msg.sender) {
        forgeToken = IERC20(_forgeToken);
    }
    
    // ==================== CORE FUNCTIONS ====================
    
    /**
     * @notice Create a new NVI option (option writer provides liquidity)
     * @param chapterId Chapter this option expires at
     * @param optionType CALL or PUT
     * @param strikeNVI Strike volatility index (scaled by 100)
     * @param premium Cost to buy this option
     * @param expiry Timestamp when option expires
     * @return optionId The ID of the created option
     * 
     * Example:
     * createOption(
     *   100,          // Chapter 100
     *   OptionType.CALL,
     *   7000,         // Strike NVI = 70.00
     *   5 * 1e18,     // Premium = 5 USDC
     *   block.timestamp + 7 days
     * )
     */
    function createOption(
        uint256 chapterId,
        OptionType optionType,
        uint256 strikeNVI,
        uint256 premium,
        uint256 expiry
    ) external nonReentrant returns (uint256) {
        if (strikeNVI == 0) revert InvalidStrike();
        if (premium == 0) revert InvalidPremium();
        if (nviSnapshots[chapterId].finalized) revert ChapterAlreadyFinalized();
        
        uint256 optionId = nextOptionId++;
        
        // Calculate max payout (premium * MAX_LEVERAGE)
        uint256 maxPayout = premium * MAX_LEVERAGE;
        
        // Creator must lock collateral (max potential payout)
        if (!forgeToken.transferFrom(msg.sender, address(this), maxPayout)) {
            revert TransferFailed();
        }
        
        options[optionId] = Option({
            id: optionId,
            chapterId: chapterId,
            optionType: optionType,
            strikeNVI: strikeNVI,
            premium: premium,
            expiry: expiry,
            creator: msg.sender,
            holder: address(0),
            collateral: maxPayout,
            settled: false,
            payout: 0
        });
        
        chapterOptions[chapterId].push(optionId);
        
        emit OptionCreated(
            optionId,
            chapterId,
            optionType,
            strikeNVI,
            premium,
            msg.sender
        );
        
        return optionId;
    }
    
    /**
     * @notice Purchase an option (become the holder)
     * @param optionId Option to buy
     * 
     * Transfers premium to option creator (minus platform fee)
     */
    function purchaseOption(uint256 optionId) external nonReentrant {
        Option storage option = options[optionId];
        
        if (option.holder != address(0)) revert OptionAlreadySold();
        if (option.settled) revert OptionAlreadySettled();
        if (block.timestamp >= option.expiry) revert ChapterAlreadyFinalized();
        
        // Calculate fees
        uint256 fee = (option.premium * platformFee) / FEE_DENOMINATOR;
        uint256 creatorAmount = option.premium - fee;
        
        // Transfer premium to creator
        if (!forgeToken.transferFrom(msg.sender, option.creator, creatorAmount)) {
            revert TransferFailed();
        }
        
        // Transfer fee to platform
        if (!forgeToken.transferFrom(msg.sender, owner(), fee)) {
            revert TransferFailed();
        }
        
        option.holder = msg.sender;
        
        emit OptionPurchased(optionId, msg.sender, option.premium);
    }
    
    /**
     * @notice Settle option after chapter NVI is finalized
     * @param optionId Option to settle
     * 
     * Calculates payout based on final NVI and option type:
     * - CALL: Profit if finalNVI > strikeNVI
     * - PUT: Profit if finalNVI < strikeNVI
     * 
     * Distributes payout to holder and returns remaining collateral to creator
     */
    function settleOption(uint256 optionId) external nonReentrant {
        Option storage option = options[optionId];
        
        if (option.holder == address(0)) revert NotOptionHolder();
        if (option.settled) revert OptionAlreadySettled();
        
        NVISnapshot storage snapshot = nviSnapshots[option.chapterId];
        if (!snapshot.finalized) revert ChapterNotFinalized();
        
        // Calculate payout
        uint256 payout = _calculatePayout(option, snapshot.nviValue);
        option.payout = payout;
        option.settled = true;
        
        // Transfer payout to holder
        if (payout > 0) {
            if (!forgeToken.transfer(option.holder, payout)) {
                revert TransferFailed();
            }
        }
        
        // Return remaining collateral to creator
        uint256 remaining = option.collateral - payout;
        if (remaining > 0) {
            if (!forgeToken.transfer(option.creator, remaining)) {
                revert TransferFailed();
            }
            emit CollateralReturned(optionId, option.creator, remaining);
        }
        
        emit OptionSettled(
            optionId,
            snapshot.nviValue,
            payout,
            option.holder
        );
    }
    
    /**
     * @notice Calculate option payout based on final NVI
     * @param option Option struct
     * @param finalNVI Final NVI value (scaled by 100)
     * @return payout amount
     * 
     * CALL option payout formula:
     *   If finalNVI > strikeNVI:
     *     payout = premium + ((finalNVI - strikeNVI) * premium / 100)
     *   Else:
     *     payout = 0 (expires worthless)
     * 
     * PUT option payout formula:
     *   If finalNVI < strikeNVI:
     *     payout = premium + ((strikeNVI - finalNVI) * premium / 100)
     *   Else:
     *     payout = 0 (expires worthless)
     * 
     * Example:
     *   CALL option: strike 70, premium 5 USDC
     *   Final NVI: 80
     *   Profit: (80 - 70) * 5 / 100 = 0.5 USDC
     *   Total payout: 5 + 0.5 = 5.5 USDC (1.1x)
     */
    function _calculatePayout(
        Option memory option,
        uint256 finalNVI
    ) internal pure returns (uint256) {
        if (option.optionType == OptionType.CALL) {
            // CALL: Profit if finalNVI > strikeNVI
            if (finalNVI > option.strikeNVI) {
                uint256 profit = (finalNVI - option.strikeNVI) * option.premium / 100;
                uint256 totalPayout = option.premium + profit;
                
                // Cap at max collateral
                return totalPayout > option.collateral ? option.collateral : totalPayout;
            }
        } else {
            // PUT: Profit if finalNVI < strikeNVI
            if (finalNVI < option.strikeNVI) {
                uint256 profit = (option.strikeNVI - finalNVI) * option.premium / 100;
                uint256 totalPayout = option.premium + profit;
                
                // Cap at max collateral
                return totalPayout > option.collateral ? option.collateral : totalPayout;
            }
        }
        
        // Option expires worthless
        return 0;
    }
    
    /**
     * @notice Finalize NVI for a chapter (owner/oracle only)
     * @param chapterId Chapter ID
     * @param nviValue Final NVI (scaled by 100, e.g., 7340 = 73.40)
     * 
     * In production, this should be called by a trusted oracle or DAO
     */
    function finalizeNVI(
        uint256 chapterId,
        uint256 nviValue
    ) external onlyOwner {
        if (nviSnapshots[chapterId].finalized) revert ChapterAlreadyFinalized();
        
        nviSnapshots[chapterId] = NVISnapshot({
            chapterId: chapterId,
            nviValue: nviValue,
            timestamp: block.timestamp,
            finalized: true
        });
        
        emit NVIFinalized(chapterId, nviValue);
    }
    
    // ==================== VIEW FUNCTIONS ====================
    
    /**
     * @notice Get all options for a chapter
     */
    function getChapterOptions(uint256 chapterId) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return chapterOptions[chapterId];
    }
    
    /**
     * @notice Get option details
     */
    function getOption(uint256 optionId) 
        external 
        view 
        returns (Option memory) 
    {
        return options[optionId];
    }
    
    /**
     * @notice Get NVI snapshot for a chapter
     */
    function getNVISnapshot(uint256 chapterId) 
        external 
        view 
        returns (NVISnapshot memory) 
    {
        return nviSnapshots[chapterId];
    }
    
    /**
     * @notice Simulate payout for an option (before settlement)
     * @param optionId Option to simulate
     * @param hypotheticalNVI Hypothetical final NVI
     * @return Estimated payout
     */
    function simulatePayout(
        uint256 optionId,
        uint256 hypotheticalNVI
    ) external view returns (uint256) {
        Option memory option = options[optionId];
        return _calculatePayout(option, hypotheticalNVI);
    }
    
    // ==================== ADMIN FUNCTIONS ====================
    
    /**
     * @notice Update platform fee (owner only)
     * @param newFee New fee in basis points (max 1000 = 10%)
     */
    function updatePlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee too high"); // Max 10%
        platformFee = newFee;
    }
}
