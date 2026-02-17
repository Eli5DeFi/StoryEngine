// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title Narrative Liquidity Pool (NLP) - AMM for Story Outcomes
/// @notice Automated Market Maker for betting positions using constant product formula (x * y = k)
/// @dev Enables continuous trading of story outcome positions until chapter resolution
/// @author Voidborne Team (Innovation Cycle #46)
/// @custom:security-contact security@voidborne.io
contract NarrativeLiquidityPool is Ownable2Step, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============ CONSTANTS ============

    uint256 public constant SWAP_FEE_BPS = 30; // 0.3% swap fee
    uint256 public constant LP_FEE_BPS = 25; // 0.25% to LPs
    uint256 public constant PROTOCOL_FEE_BPS = 5; // 0.05% to protocol
    uint256 public constant BPS_DENOMINATOR = 10_000;
    uint256 public constant PRECISION = 1e18;
    uint256 public constant MIN_LIQUIDITY = 1e3; // Minimum LP tokens (prevent division issues)

    // ============ STATE ============

    IERC20 public immutable bettingToken; // USDC
    address public treasury;

    // Chapter → Outcome → Liquidity
    mapping(uint256 => mapping(uint256 => uint256)) public liquidity; // x and y reserves
    
    // Chapter → Outcome → LP Supply
    mapping(uint256 => mapping(uint256 => uint256)) public lpTotalSupply;
    
    // Chapter → Outcome → User → LP Balance
    mapping(uint256 => mapping(uint256 => mapping(address => uint256))) public lpBalances;
    
    // Chapter → Outcome → Accumulated Fees (for LPs)
    mapping(uint256 => mapping(uint256 => uint256)) public accumulatedFees;
    
    // Chapter → k constant (x * y = k)
    mapping(uint256 => uint256) public kConstant;
    
    // Chapter → Resolution Status
    mapping(uint256 => bool) public chapterResolved;
    mapping(uint256 => uint256) public winningOutcome;
    
    // Chapter → Betting Deadline
    mapping(uint256 => uint256) public bettingDeadline;

    // ============ EVENTS ============

    event LiquidityAdded(
        uint256 indexed chapterId,
        uint256 indexed outcomeId,
        address indexed provider,
        uint256 amountIn,
        uint256 lpTokens
    );

    event LiquidityRemoved(
        uint256 indexed chapterId,
        uint256 indexed outcomeId,
        address indexed provider,
        uint256 lpTokens,
        uint256 amountOut
    );

    event PositionSwapped(
        uint256 indexed chapterId,
        address indexed trader,
        uint256 fromOutcome,
        uint256 toOutcome,
        uint256 amountIn,
        uint256 amountOut,
        uint256 fee
    );

    event ChapterResolved(
        uint256 indexed chapterId,
        uint256 indexed winningOutcomeId
    );

    event WinningsClaimed(
        uint256 indexed chapterId,
        address indexed winner,
        uint256 amount
    );

    // ============ CONSTRUCTOR ============

    constructor(
        address _bettingToken,
        address _treasury
    ) Ownable(msg.sender) {
        require(_bettingToken != address(0), "NLP: Invalid token");
        require(_treasury != address(0), "NLP: Invalid treasury");
        
        bettingToken = IERC20(_bettingToken);
        treasury = _treasury;
    }

    // ============ CORE AMM FUNCTIONS ============

    /// @notice Add liquidity to an outcome pool (initial or proportional)
    /// @param chapterId The chapter ID
    /// @param outcomeId The outcome ID (0, 1, 2, etc.)
    /// @param amount Amount of USDC to add
    /// @return lpTokens Amount of LP tokens minted
    function addLiquidity(
        uint256 chapterId,
        uint256 outcomeId,
        uint256 amount
    ) external nonReentrant whenNotPaused returns (uint256 lpTokens) {
        require(!chapterResolved[chapterId], "NLP: Chapter resolved");
        require(block.timestamp < bettingDeadline[chapterId], "NLP: Betting closed");
        require(amount > 0, "NLP: Zero amount");

        // Transfer tokens from user
        bettingToken.safeTransferFrom(msg.sender, address(this), amount);

        uint256 currentLiquidity = liquidity[chapterId][outcomeId];
        uint256 currentSupply = lpTotalSupply[chapterId][outcomeId];

        if (currentSupply == 0) {
            // Initial liquidity
            lpTokens = amount - MIN_LIQUIDITY; // Lock MIN_LIQUIDITY forever (prevent division issues)
            liquidity[chapterId][outcomeId] = amount;
            lpTotalSupply[chapterId][outcomeId] = lpTokens + MIN_LIQUIDITY;
            lpBalances[chapterId][outcomeId][address(0)] = MIN_LIQUIDITY; // Burn to zero address
        } else {
            // Proportional liquidity
            lpTokens = (amount * currentSupply) / currentLiquidity;
            liquidity[chapterId][outcomeId] += amount;
            lpTotalSupply[chapterId][outcomeId] += lpTokens;
        }

        lpBalances[chapterId][outcomeId][msg.sender] += lpTokens;

        emit LiquidityAdded(chapterId, outcomeId, msg.sender, amount, lpTokens);
    }

    /// @notice Remove liquidity from an outcome pool
    /// @param chapterId The chapter ID
    /// @param outcomeId The outcome ID
    /// @param lpTokens Amount of LP tokens to burn
    /// @return amountOut Amount of USDC returned (including fees)
    function removeLiquidity(
        uint256 chapterId,
        uint256 outcomeId,
        uint256 lpTokens
    ) external nonReentrant returns (uint256 amountOut) {
        require(lpTokens > 0, "NLP: Zero LP tokens");
        require(lpBalances[chapterId][outcomeId][msg.sender] >= lpTokens, "NLP: Insufficient balance");

        uint256 currentLiquidity = liquidity[chapterId][outcomeId];
        uint256 currentSupply = lpTotalSupply[chapterId][outcomeId];

        // Calculate proportional share (including accumulated fees)
        uint256 fees = accumulatedFees[chapterId][outcomeId];
        amountOut = ((currentLiquidity + fees) * lpTokens) / currentSupply;

        // Update state
        lpBalances[chapterId][outcomeId][msg.sender] -= lpTokens;
        lpTotalSupply[chapterId][outcomeId] -= lpTokens;
        liquidity[chapterId][outcomeId] -= (amountOut - (fees * lpTokens / currentSupply));
        accumulatedFees[chapterId][outcomeId] -= (fees * lpTokens / currentSupply);

        // Transfer tokens to user
        bettingToken.safeTransfer(msg.sender, amountOut);

        emit LiquidityRemoved(chapterId, outcomeId, msg.sender, lpTokens, amountOut);
    }

    /// @notice Swap position from one outcome to another (constant product formula)
    /// @param chapterId The chapter ID
    /// @param fromOutcome The outcome ID to swap from
    /// @param toOutcome The outcome ID to swap to
    /// @param amountIn Amount of LP tokens to swap
    /// @param minAmountOut Minimum acceptable output (slippage protection)
    /// @return amountOut Amount of LP tokens received
    function swapPosition(
        uint256 chapterId,
        uint256 fromOutcome,
        uint256 toOutcome,
        uint256 amountIn,
        uint256 minAmountOut
    ) external nonReentrant whenNotPaused returns (uint256 amountOut) {
        require(!chapterResolved[chapterId], "NLP: Chapter resolved");
        require(block.timestamp < bettingDeadline[chapterId], "NLP: Betting closed");
        require(amountIn > 0, "NLP: Zero amount");
        require(fromOutcome != toOutcome, "NLP: Same outcome");
        require(lpBalances[chapterId][fromOutcome][msg.sender] >= amountIn, "NLP: Insufficient balance");

        // Get current reserves
        uint256 reserveFrom = liquidity[chapterId][fromOutcome];
        uint256 reserveTo = liquidity[chapterId][toOutcome];
        require(reserveFrom > 0 && reserveTo > 0, "NLP: No liquidity");

        // Calculate swap fee
        uint256 fee = (amountIn * SWAP_FEE_BPS) / BPS_DENOMINATOR;
        uint256 amountInAfterFee = amountIn - fee;

        // Calculate output using constant product formula: x * y = k
        // (reserveFrom + amountInAfterFee) * (reserveTo - amountOut) = k
        // amountOut = reserveTo - (k / (reserveFrom + amountInAfterFee))
        uint256 k = reserveFrom * reserveTo;
        uint256 newReserveFrom = reserveFrom + amountInAfterFee;
        amountOut = reserveTo - (k / newReserveFrom);

        require(amountOut >= minAmountOut, "NLP: Slippage exceeded");
        require(amountOut < reserveTo, "NLP: Insufficient liquidity");

        // Update reserves
        liquidity[chapterId][fromOutcome] = newReserveFrom;
        liquidity[chapterId][toOutcome] = reserveTo - amountOut;

        // Update user balances
        lpBalances[chapterId][fromOutcome][msg.sender] -= amountIn;
        lpBalances[chapterId][toOutcome][msg.sender] += amountOut;

        // Distribute fees (0.25% to LPs, 0.05% to protocol)
        uint256 lpFee = (fee * LP_FEE_BPS) / SWAP_FEE_BPS;
        uint256 protocolFee = fee - lpFee;

        accumulatedFees[chapterId][fromOutcome] += lpFee;
        bettingToken.safeTransfer(treasury, protocolFee);

        emit PositionSwapped(chapterId, msg.sender, fromOutcome, toOutcome, amountIn, amountOut, fee);
    }

    // ============ CHAPTER RESOLUTION ============

    /// @notice Resolve chapter outcome (only owner)
    /// @param chapterId The chapter ID
    /// @param _winningOutcome The winning outcome ID
    function resolveChapter(
        uint256 chapterId,
        uint256 _winningOutcome
    ) external onlyOwner {
        require(!chapterResolved[chapterId], "NLP: Already resolved");
        
        chapterResolved[chapterId] = true;
        winningOutcome[chapterId] = _winningOutcome;

        emit ChapterResolved(chapterId, _winningOutcome);
    }

    /// @notice Claim winnings after chapter resolution
    /// @param chapterId The chapter ID
    /// @return winnings Amount of USDC won
    function claimWinnings(
        uint256 chapterId
    ) external nonReentrant returns (uint256 winnings) {
        require(chapterResolved[chapterId], "NLP: Not resolved");
        
        uint256 _winningOutcome = winningOutcome[chapterId];
        uint256 userBalance = lpBalances[chapterId][_winningOutcome][msg.sender];
        require(userBalance > 0, "NLP: No winning position");

        // Calculate pro-rata share of winning pool
        uint256 totalWinningLiquidity = liquidity[chapterId][_winningOutcome];
        uint256 totalWinningSupply = lpTotalSupply[chapterId][_winningOutcome];
        
        winnings = (totalWinningLiquidity * userBalance) / totalWinningSupply;

        // Clear user balance
        lpBalances[chapterId][_winningOutcome][msg.sender] = 0;

        // Transfer winnings
        bettingToken.safeTransfer(msg.sender, winnings);

        emit WinningsClaimed(chapterId, msg.sender, winnings);
    }

    // ============ VIEW FUNCTIONS ============

    /// @notice Get current price of swapping 1 unit from outcomeA to outcomeB
    /// @param chapterId The chapter ID
    /// @param fromOutcome Outcome to swap from
    /// @param toOutcome Outcome to swap to
    /// @return price Price with 18 decimals (1e18 = 1:1 ratio)
    function getPrice(
        uint256 chapterId,
        uint256 fromOutcome,
        uint256 toOutcome
    ) external view returns (uint256 price) {
        uint256 reserveFrom = liquidity[chapterId][fromOutcome];
        uint256 reserveTo = liquidity[chapterId][toOutcome];
        
        if (reserveFrom == 0 || reserveTo == 0) return 0;
        
        // Price = reserveTo / reserveFrom (with precision)
        price = (reserveTo * PRECISION) / reserveFrom;
    }

    /// @notice Calculate output amount for a given input (before executing swap)
    /// @param chapterId The chapter ID
    /// @param fromOutcome Outcome to swap from
    /// @param toOutcome Outcome to swap to
    /// @param amountIn Amount to swap
    /// @return amountOut Expected output amount
    function getAmountOut(
        uint256 chapterId,
        uint256 fromOutcome,
        uint256 toOutcome,
        uint256 amountIn
    ) external view returns (uint256 amountOut) {
        uint256 reserveFrom = liquidity[chapterId][fromOutcome];
        uint256 reserveTo = liquidity[chapterId][toOutcome];
        
        if (reserveFrom == 0 || reserveTo == 0) return 0;
        
        // Apply swap fee
        uint256 fee = (amountIn * SWAP_FEE_BPS) / BPS_DENOMINATOR;
        uint256 amountInAfterFee = amountIn - fee;
        
        // Constant product formula
        uint256 k = reserveFrom * reserveTo;
        uint256 newReserveFrom = reserveFrom + amountInAfterFee;
        amountOut = reserveTo - (k / newReserveFrom);
    }

    /// @notice Get user's LP token balance for a specific outcome
    /// @param chapterId The chapter ID
    /// @param outcomeId The outcome ID
    /// @param user The user address
    /// @return balance LP token balance
    function getUserLPBalance(
        uint256 chapterId,
        uint256 outcomeId,
        address user
    ) external view returns (uint256 balance) {
        return lpBalances[chapterId][outcomeId][user];
    }

    /// @notice Get pool reserves for all outcomes in a chapter
    /// @param chapterId The chapter ID
    /// @param numOutcomes Number of outcomes
    /// @return reserves Array of reserve amounts
    function getPoolReserves(
        uint256 chapterId,
        uint256 numOutcomes
    ) external view returns (uint256[] memory reserves) {
        reserves = new uint256[](numOutcomes);
        for (uint256 i = 0; i < numOutcomes; i++) {
            reserves[i] = liquidity[chapterId][i];
        }
    }

    // ============ ADMIN FUNCTIONS ============

    /// @notice Set betting deadline for a chapter
    /// @param chapterId The chapter ID
    /// @param deadline Timestamp when betting closes
    function setBettingDeadline(
        uint256 chapterId,
        uint256 deadline
    ) external onlyOwner {
        require(deadline > block.timestamp, "NLP: Invalid deadline");
        bettingDeadline[chapterId] = deadline;
    }

    /// @notice Update treasury address
    /// @param _treasury New treasury address
    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "NLP: Invalid treasury");
        treasury = _treasury;
    }

    /// @notice Pause contract (emergency)
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpause contract
    function unpause() external onlyOwner {
        _unpause();
    }
}
