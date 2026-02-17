// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title Narrative Insurance Protocol (NIP) - Story Outcome Hedging
/// @notice Allows readers to buy insurance against story outcomes they fear
/// @dev Premium-based insurance model: pay now to receive payout if feared outcome occurs
/// @author Voidborne Team (Innovation Cycle #47)
/// @custom:security-contact security@voidborne.io
///
/// @dev MECHANISM:
///   1. User buys "Character Death Insurance" for Captain Zara at 15% premium
///   2. User pays 150 USDC premium for 1000 USDC coverage
///   3. If Zara dies in the story → User receives 1000 USDC payout
///   4. If Zara survives → Premium goes to risk pool (Underwriters earn yield)
///
/// @dev ROLES:
///   - Policyholders: Pay premiums, receive payouts if feared event occurs
///   - Underwriters: Stake capital to back policies, earn premium yield
///   - Arbiters: (Owner/Oracle) Trigger settlements when events resolve
contract NarrativeInsurance is Ownable2Step, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============ CONSTANTS ============

    uint256 public constant BPS_DENOMINATOR = 10_000;
    uint256 public constant PROTOCOL_FEE_BPS = 300;       // 3% of premiums go to protocol
    uint256 public constant UNDERWRITER_RESERVE_BPS = 1_500; // 15% reserve requirement
    uint256 public constant MAX_COVERAGE_MULTIPLE = 20;    // Max 20x coverage vs premium pool
    uint256 public constant MIN_PREMIUM = 1e6;             // 1 USDC minimum premium
    uint256 public constant MAX_POLICY_DURATION = 30 days; // Policies expire after 30 days
    uint256 public constant MAX_BATCH_CLAIMS = 50;

    // ============ ENUMS ============

    enum PolicyStatus { Active, Claimed, Expired, Cancelled }
    enum EventStatus { Pending, Occurred, DidNotOccur }

    // ============ STRUCTS ============

    /// @dev An insurable narrative event (e.g., "Captain Zara dies in Chapter 15")
    struct NarrativeEvent {
        uint256 chapterId;          // Which chapter this event relates to
        string description;         // Human-readable event description (e.g., "Captain Zara dies")
        string characterId;         // Optional: character identifier
        uint256 premiumRateBps;     // Premium rate in bps (1500 = 15%)
        uint256 totalCoverage;      // Total coverage outstanding
        uint256 totalPremiums;      // Total premiums collected
        uint256 underwriterPool;    // Capital staked by underwriters
        uint256 createdAt;          // Timestamp of creation
        uint256 deadline;           // Betting deadline (after this, no new policies)
        EventStatus status;         // Pending/Occurred/DidNotOccur
        bool active;                // Is this event still accepting policies?
    }

    /// @dev An insurance policy held by a reader
    struct Policy {
        uint256 eventId;            // Which narrative event this covers
        address policyholder;       // Who owns this policy
        uint256 coverage;           // Max payout amount (in USDC, 6 decimals)
        uint256 premium;            // Amount paid (in USDC, 6 decimals)
        uint256 purchasedAt;        // Timestamp
        uint256 expiresAt;          // Expiry timestamp
        PolicyStatus status;        // Active/Claimed/Expired/Cancelled
    }

    /// @dev Underwriter stake record
    struct UnderwriterStake {
        uint256 eventId;            // Which event they're underwriting
        address underwriter;
        uint256 staked;             // USDC staked as backing capital
        uint256 earnedPremiums;     // Premiums earned so far
        uint256 claimedAt;          // Timestamp of claim/withdrawal
        bool withdrawn;
    }

    // ============ STATE ============

    IERC20 public immutable usdc;
    address public treasury;

    uint256 public nextEventId;
    uint256 public nextPolicyId;
    uint256 public nextStakeId;

    mapping(uint256 => NarrativeEvent) public events;
    mapping(uint256 => Policy) public policies;
    mapping(uint256 => UnderwriterStake) public stakes;

    // User → their policy IDs
    mapping(address => uint256[]) public userPolicies;
    // User → their stake IDs  
    mapping(address => uint256[]) public userStakes;
    // Event → all policy IDs
    mapping(uint256 => uint256[]) public eventPolicies;
    // Event → all stake IDs
    mapping(uint256 => uint256[]) public eventStakes;

    // Protocol earnings
    uint256 public protocolEarnings;

    // ============ EVENTS ============

    event EventCreated(
        uint256 indexed eventId,
        uint256 indexed chapterId,
        string description,
        uint256 premiumRateBps,
        uint256 deadline
    );

    event PolicyPurchased(
        uint256 indexed policyId,
        uint256 indexed eventId,
        address indexed policyholder,
        uint256 coverage,
        uint256 premium,
        uint256 expiresAt
    );

    event UnderwriterStaked(
        uint256 indexed stakeId,
        uint256 indexed eventId,
        address indexed underwriter,
        uint256 amount
    );

    event PolicyClaimed(
        uint256 indexed policyId,
        uint256 indexed eventId,
        address indexed policyholder,
        uint256 payout
    );

    event PolicyExpired(
        uint256 indexed policyId,
        uint256 indexed eventId,
        address indexed policyholder,
        uint256 premium  // forfeited
    );

    event UnderwriterWithdrew(
        uint256 indexed stakeId,
        uint256 indexed eventId,
        address indexed underwriter,
        uint256 principal,
        uint256 earned
    );

    event EventSettled(
        uint256 indexed eventId,
        EventStatus status,
        uint256 totalPaid,
        uint256 underwritersRewarded
    );

    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);

    // ============ CONSTRUCTOR ============

    constructor(address _usdc, address _treasury) Ownable(msg.sender) {
        require(_usdc != address(0), "NIP: invalid USDC");
        require(_treasury != address(0), "NIP: invalid treasury");
        usdc = IERC20(_usdc);
        treasury = _treasury;
    }

    // ============ OWNER FUNCTIONS ============

    /// @notice Create a new insurable narrative event
    /// @param chapterId The chapter this event belongs to
    /// @param description Human-readable event description
    /// @param characterId Optional character identifier
    /// @param premiumRateBps Premium rate (1500 = 15%)
    /// @param deadline Timestamp after which no new policies are accepted
    function createEvent(
        uint256 chapterId,
        string calldata description,
        string calldata characterId,
        uint256 premiumRateBps,
        uint256 deadline
    ) external onlyOwner whenNotPaused returns (uint256 eventId) {
        require(bytes(description).length > 0, "NIP: empty description");
        require(premiumRateBps >= 100 && premiumRateBps <= 9_000, "NIP: invalid premium rate");
        require(deadline > block.timestamp, "NIP: deadline in past");
        require(deadline <= block.timestamp + MAX_POLICY_DURATION, "NIP: deadline too far");

        eventId = nextEventId++;

        events[eventId] = NarrativeEvent({
            chapterId: chapterId,
            description: description,
            characterId: characterId,
            premiumRateBps: premiumRateBps,
            totalCoverage: 0,
            totalPremiums: 0,
            underwriterPool: 0,
            createdAt: block.timestamp,
            deadline: deadline,
            status: EventStatus.Pending,
            active: true
        });

        emit EventCreated(eventId, chapterId, description, premiumRateBps, deadline);
    }

    /// @notice Settle an event after chapter resolution
    /// @param eventId The event to settle
    /// @param occurred Whether the feared event actually occurred in the story
    function settleEvent(uint256 eventId, bool occurred) external onlyOwner nonReentrant {
        NarrativeEvent storage evt = events[eventId];
        require(evt.active, "NIP: event not active");
        require(evt.status == EventStatus.Pending, "NIP: already settled");

        evt.status = occurred ? EventStatus.Occurred : EventStatus.DidNotOccur;
        evt.active = false;

        uint256 totalPaid = 0;
        uint256 underwritersRewarded = 0;

        if (occurred) {
            // Pay out all active policies
            uint256[] memory policyIds = eventPolicies[eventId];
            uint256 len = policyIds.length > MAX_BATCH_CLAIMS ? MAX_BATCH_CLAIMS : policyIds.length;
            
            for (uint256 i = 0; i < len;) {
                Policy storage policy = policies[policyIds[i]];
                if (policy.status == PolicyStatus.Active && policy.expiresAt >= block.timestamp) {
                    policy.status = PolicyStatus.Claimed;
                    uint256 payout = policy.coverage;
                    totalPaid += payout;
                    usdc.safeTransfer(policy.policyholder, payout);
                    emit PolicyClaimed(policyIds[i], eventId, policy.policyholder, payout);
                }
                unchecked { ++i; }
            }
        } else {
            // Event did NOT occur: underwriters keep their principal + earned premiums
            // Remaining pool distributed proportionally to underwriters
            uint256 totalUnderwrites = evt.underwriterPool;
            if (totalUnderwrites > 0) {
                uint256[] memory stakeIds = eventStakes[eventId];
                uint256 len = stakeIds.length;
                
                for (uint256 i = 0; i < len;) {
                    UnderwriterStake storage stake = stakes[stakeIds[i]];
                    if (!stake.withdrawn && stake.staked > 0) {
                        // Proportional share of remaining premium pool
                        uint256 premiumShare = (evt.totalPremiums * stake.staked) / totalUnderwrites;
                        // Deduct protocol fee from premium share
                        uint256 protocolCut = (premiumShare * PROTOCOL_FEE_BPS) / BPS_DENOMINATOR;
                        uint256 underwriterEarned = premiumShare - protocolCut;
                        stake.earnedPremiums = underwriterEarned;
                        protocolEarnings += protocolCut;
                        underwritersRewarded += underwriterEarned;
                    }
                    unchecked { ++i; }
                }
            }
        }

        emit EventSettled(eventId, evt.status, totalPaid, underwritersRewarded);
    }

    /// @notice Update treasury address
    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "NIP: invalid treasury");
        emit TreasuryUpdated(treasury, _treasury);
        treasury = _treasury;
    }

    /// @notice Withdraw protocol earnings to treasury
    function withdrawProtocolFees() external onlyOwner nonReentrant {
        uint256 amount = protocolEarnings;
        require(amount > 0, "NIP: nothing to withdraw");
        protocolEarnings = 0;
        usdc.safeTransfer(treasury, amount);
    }

    /// @notice Emergency pause
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // ============ POLICYHOLDER FUNCTIONS ============

    /// @notice Purchase insurance against a narrative event
    /// @param eventId The event to insure against
    /// @param coverage Desired coverage amount (max payout in USDC)
    /// @return policyId The ID of the new policy
    function buyPolicy(
        uint256 eventId,
        uint256 coverage
    ) external nonReentrant whenNotPaused returns (uint256 policyId) {
        NarrativeEvent storage evt = events[eventId];
        require(evt.active, "NIP: event not active");
        require(evt.status == EventStatus.Pending, "NIP: event already settled");
        require(block.timestamp < evt.deadline, "NIP: deadline passed");

        // Calculate premium
        uint256 premium = (coverage * evt.premiumRateBps) / BPS_DENOMINATOR;
        require(premium >= MIN_PREMIUM, "NIP: premium too low");

        // Ensure underwriter pool can cover new policy
        uint256 newTotalCoverage = evt.totalCoverage + coverage;
        require(
            evt.underwriterPool >= (newTotalCoverage * UNDERWRITER_RESERVE_BPS) / BPS_DENOMINATOR,
            "NIP: insufficient underwriter capital"
        );

        // Transfer premium from policyholder
        usdc.safeTransferFrom(msg.sender, address(this), premium);

        // Create policy
        policyId = nextPolicyId++;
        uint256 expiresAt = evt.deadline + MAX_POLICY_DURATION;

        policies[policyId] = Policy({
            eventId: eventId,
            policyholder: msg.sender,
            coverage: coverage,
            premium: premium,
            purchasedAt: block.timestamp,
            expiresAt: expiresAt,
            status: PolicyStatus.Active
        });

        // Update event state
        evt.totalCoverage += coverage;
        evt.totalPremiums += premium;

        // Record for lookups
        userPolicies[msg.sender].push(policyId);
        eventPolicies[eventId].push(policyId);

        emit PolicyPurchased(policyId, eventId, msg.sender, coverage, premium, expiresAt);
    }

    /// @notice Cancel an active policy before event deadline (partial refund)
    /// @param policyId The policy to cancel
    function cancelPolicy(uint256 policyId) external nonReentrant {
        Policy storage policy = policies[policyId];
        require(policy.policyholder == msg.sender, "NIP: not policyholder");
        require(policy.status == PolicyStatus.Active, "NIP: policy not active");

        NarrativeEvent storage evt = events[policy.eventId];
        require(block.timestamp < evt.deadline, "NIP: past deadline, cannot cancel");

        policy.status = PolicyStatus.Cancelled;

        // Refund 80% of premium (20% penalty for cancellation)
        uint256 refund = (policy.premium * 8_000) / BPS_DENOMINATOR;
        uint256 penalty = policy.premium - refund;

        // Penalty goes to underwriter pool
        evt.underwriterPool += penalty;
        evt.totalCoverage -= policy.coverage;
        evt.totalPremiums -= policy.premium;
        evt.totalPremiums += penalty; // penalty stays in pool

        usdc.safeTransfer(msg.sender, refund);
    }

    // ============ UNDERWRITER FUNCTIONS ============

    /// @notice Stake USDC to underwrite policies for an event
    /// @param eventId The event to underwrite
    /// @param amount Amount of USDC to stake as backing capital
    /// @return stakeId The ID of the new stake
    function stakeCapital(
        uint256 eventId,
        uint256 amount
    ) external nonReentrant whenNotPaused returns (uint256 stakeId) {
        NarrativeEvent storage evt = events[eventId];
        require(evt.active, "NIP: event not active");
        require(evt.status == EventStatus.Pending, "NIP: event already settled");
        require(block.timestamp < evt.deadline, "NIP: deadline passed");
        require(amount > 0, "NIP: zero amount");

        usdc.safeTransferFrom(msg.sender, address(this), amount);

        stakeId = nextStakeId++;

        stakes[stakeId] = UnderwriterStake({
            eventId: eventId,
            underwriter: msg.sender,
            staked: amount,
            earnedPremiums: 0,
            claimedAt: 0,
            withdrawn: false
        });

        evt.underwriterPool += amount;

        userStakes[msg.sender].push(stakeId);
        eventStakes[eventId].push(stakeId);

        emit UnderwriterStaked(stakeId, eventId, msg.sender, amount);
    }

    /// @notice Withdraw stake + earned premiums after event settlement
    /// @param stakeId The stake to withdraw
    function withdrawStake(uint256 stakeId) external nonReentrant {
        UnderwriterStake storage stake = stakes[stakeId];
        require(stake.underwriter == msg.sender, "NIP: not underwriter");
        require(!stake.withdrawn, "NIP: already withdrawn");

        NarrativeEvent storage evt = events[stake.eventId];
        require(!evt.active || evt.status != EventStatus.Pending, "NIP: event not settled");

        stake.withdrawn = true;
        stake.claimedAt = block.timestamp;

        uint256 totalReturn;

        if (evt.status == EventStatus.DidNotOccur) {
            // Get principal back + earned premiums
            totalReturn = stake.staked + stake.earnedPremiums;
        } else {
            // Event occurred (claims paid out). Return remaining capital proportionally.
            // If pool was enough to cover all claims, return remainder
            uint256 totalClaims = evt.totalCoverage; // worst case
            uint256 pool = evt.underwriterPool;
            
            if (pool > totalClaims) {
                // Pool was more than enough, return proportional remainder
                uint256 remaining = pool - totalClaims;
                totalReturn = (remaining * stake.staked) / pool;
            }
            // If pool was insufficient, underwriters lose some/all stake (this is the risk!)
        }

        if (totalReturn > 0) {
            usdc.safeTransfer(msg.sender, totalReturn);
        }

        emit UnderwriterWithdrew(stakeId, stake.eventId, msg.sender, stake.staked, stake.earnedPremiums);
    }

    // ============ VIEW FUNCTIONS ============

    /// @notice Get all policies for a user
    function getUserPolicies(address user) external view returns (uint256[] memory) {
        return userPolicies[user];
    }

    /// @notice Get all stakes for an underwriter
    function getUserStakes(address user) external view returns (uint256[] memory) {
        return userStakes[user];
    }

    /// @notice Get all policies for an event
    function getEventPolicies(uint256 eventId) external view returns (uint256[] memory) {
        return eventPolicies[eventId];
    }

    /// @notice Get all stakes for an event
    function getEventStakes(uint256 eventId) external view returns (uint256[] memory) {
        return eventStakes[eventId];
    }

    /// @notice Calculate premium for a given coverage amount and event
    function calculatePremium(uint256 eventId, uint256 coverage) external view returns (uint256 premium) {
        NarrativeEvent storage evt = events[eventId];
        premium = (coverage * evt.premiumRateBps) / BPS_DENOMINATOR;
    }

    /// @notice Check available coverage capacity for an event
    function availableCapacity(uint256 eventId) external view returns (uint256 capacity) {
        NarrativeEvent storage evt = events[eventId];
        uint256 maxCoverage = (evt.underwriterPool * BPS_DENOMINATOR) / UNDERWRITER_RESERVE_BPS;
        if (maxCoverage > evt.totalCoverage) {
            capacity = maxCoverage - evt.totalCoverage;
        }
    }

    /// @notice Check if an event is still open for new policies
    function isEventOpen(uint256 eventId) external view returns (bool) {
        NarrativeEvent storage evt = events[eventId];
        return evt.active && evt.status == EventStatus.Pending && block.timestamp < evt.deadline;
    }

    /// @notice Get event summary
    function getEventSummary(uint256 eventId) external view returns (
        string memory description,
        uint256 premiumRateBps,
        uint256 totalCoverage,
        uint256 totalPremiums,
        uint256 underwriterPool,
        uint256 deadline,
        EventStatus status,
        bool active
    ) {
        NarrativeEvent storage evt = events[eventId];
        return (
            evt.description,
            evt.premiumRateBps,
            evt.totalCoverage,
            evt.totalPremiums,
            evt.underwriterPool,
            evt.deadline,
            evt.status,
            evt.active
        );
    }

    /// @notice Get underwriter APY estimate (based on current premium rate and reserve requirement)
    /// @dev APY = (premiumRate / reserveRequirement) * annualizationFactor
    function estimateUnderwriterAPY(uint256 eventId) external view returns (uint256 apyBps) {
        NarrativeEvent storage evt = events[eventId];
        // Simplified: premium yield on reserve capital
        // If reserve = 15% and premium = 15%, then yield = 100% on reserve
        // But adjusted for time window
        uint256 timeWindow = evt.deadline > block.timestamp ? evt.deadline - block.timestamp : 1;
        uint256 annualFactor = (365 days * BPS_DENOMINATOR) / timeWindow;
        uint256 rawYield = (evt.premiumRateBps * BPS_DENOMINATOR) / UNDERWRITER_RESERVE_BPS;
        apyBps = (rawYield * annualFactor) / BPS_DENOMINATOR;
    }
}
