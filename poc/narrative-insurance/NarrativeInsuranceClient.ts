/**
 * Narrative Insurance Protocol (NIP) - TypeScript Client SDK
 * Innovation Cycle #47 - "The Living Story Protocol"
 *
 * Allows readers to hedge against story outcomes they fear.
 * Allows underwriters to earn yield by backing narrative risk pools.
 *
 * @example
 * // Policyholder: Insure Captain Zara against death
 * const client = new NarrativeInsuranceClient(provider, signer, contractAddress, usdcAddress);
 *
 * // Buy 1000 USDC coverage at 15% premium (pay 150 USDC)
 * const { policyId, premium } = await client.buyPolicy(eventId, 1000_000000n);
 * console.log(`Policy #${policyId} purchased. Premium: ${premium / 1e6} USDC`);
 *
 * @example
 * // Underwriter: Earn yield by backing narrative risk
 * const apy = await client.estimateUnderwriterAPY(eventId);
 * await client.stakeCapital(eventId, 5000_000000n); // Stake 5000 USDC
 */

import { ethers } from "ethers";

// ============ ABI ============

const NARRATIVE_INSURANCE_ABI = [
  // Events
  "event EventCreated(uint256 indexed eventId, uint256 indexed chapterId, string description, uint256 premiumRateBps, uint256 deadline)",
  "event PolicyPurchased(uint256 indexed policyId, uint256 indexed eventId, address indexed policyholder, uint256 coverage, uint256 premium, uint256 expiresAt)",
  "event UnderwriterStaked(uint256 indexed stakeId, uint256 indexed eventId, address indexed underwriter, uint256 amount)",
  "event PolicyClaimed(uint256 indexed policyId, uint256 indexed eventId, address indexed policyholder, uint256 payout)",
  "event UnderwriterWithdrew(uint256 indexed stakeId, uint256 indexed eventId, address indexed underwriter, uint256 principal, uint256 earned)",
  "event EventSettled(uint256 indexed eventId, uint8 status, uint256 totalPaid, uint256 underwritersRewarded)",

  // View functions
  "function events(uint256) view returns (uint256 chapterId, string description, string characterId, uint256 premiumRateBps, uint256 totalCoverage, uint256 totalPremiums, uint256 underwriterPool, uint256 createdAt, uint256 deadline, uint8 status, bool active)",
  "function policies(uint256) view returns (uint256 eventId, address policyholder, uint256 coverage, uint256 premium, uint256 purchasedAt, uint256 expiresAt, uint8 status)",
  "function stakes(uint256) view returns (uint256 eventId, address underwriter, uint256 staked, uint256 earnedPremiums, uint256 claimedAt, bool withdrawn)",
  "function getUserPolicies(address user) view returns (uint256[])",
  "function getUserStakes(address user) view returns (uint256[])",
  "function getEventPolicies(uint256 eventId) view returns (uint256[])",
  "function calculatePremium(uint256 eventId, uint256 coverage) view returns (uint256 premium)",
  "function availableCapacity(uint256 eventId) view returns (uint256 capacity)",
  "function isEventOpen(uint256 eventId) view returns (bool)",
  "function getEventSummary(uint256 eventId) view returns (string description, uint256 premiumRateBps, uint256 totalCoverage, uint256 totalPremiums, uint256 underwriterPool, uint256 deadline, uint8 status, bool active)",
  "function estimateUnderwriterAPY(uint256 eventId) view returns (uint256 apyBps)",
  "function protocolEarnings() view returns (uint256)",
  "function nextEventId() view returns (uint256)",
  "function nextPolicyId() view returns (uint256)",

  // Policyholder write functions
  "function buyPolicy(uint256 eventId, uint256 coverage) returns (uint256 policyId)",
  "function cancelPolicy(uint256 policyId)",

  // Underwriter write functions
  "function stakeCapital(uint256 eventId, uint256 amount) returns (uint256 stakeId)",
  "function withdrawStake(uint256 stakeId)",

  // Owner functions
  "function createEvent(uint256 chapterId, string description, string characterId, uint256 premiumRateBps, uint256 deadline) returns (uint256 eventId)",
  "function settleEvent(uint256 eventId, bool occurred)",
  "function withdrawProtocolFees()",
  "function pause()",
  "function unpause()",
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
];

// ============ TYPES ============

export enum EventStatus {
  Pending = 0,
  Occurred = 1,
  DidNotOccur = 2,
}

export enum PolicyStatus {
  Active = 0,
  Claimed = 1,
  Expired = 2,
  Cancelled = 3,
}

export interface NarrativeEvent {
  eventId: bigint;
  chapterId: bigint;
  description: string;
  characterId: string;
  premiumRateBps: bigint;
  totalCoverage: bigint;
  totalPremiums: bigint;
  underwriterPool: bigint;
  createdAt: bigint;
  deadline: bigint;
  status: EventStatus;
  active: boolean;
}

export interface Policy {
  policyId: bigint;
  eventId: bigint;
  policyholder: string;
  coverage: bigint;
  premium: bigint;
  purchasedAt: bigint;
  expiresAt: bigint;
  status: PolicyStatus;
}

export interface UnderwriterStake {
  stakeId: bigint;
  eventId: bigint;
  underwriter: string;
  staked: bigint;
  earnedPremiums: bigint;
  claimedAt: bigint;
  withdrawn: boolean;
}

export interface EventSummary {
  description: string;
  premiumRateBps: bigint;
  premiumRatePercent: number;
  totalCoverage: bigint;
  totalCoverageUSDC: number;
  totalPremiums: bigint;
  totalPremiumsUSDC: number;
  underwriterPool: bigint;
  underwriterPoolUSDC: number;
  deadline: bigint;
  deadlineDate: Date;
  status: EventStatus;
  statusLabel: string;
  active: boolean;
  availableCapacity: bigint;
  availableCapacityUSDC: number;
  estimatedAPYBps: bigint;
  estimatedAPYPercent: number;
}

export interface BuyPolicyResult {
  policyId: bigint;
  txHash: string;
  coverage: bigint;
  coverageUSDC: number;
  premium: bigint;
  premiumUSDC: number;
  expiresAt: Date;
}

export interface StakeResult {
  stakeId: bigint;
  txHash: string;
  staked: bigint;
  stakedUSDC: number;
  estimatedAPYPercent: number;
}

// ============ CLIENT ============

export class NarrativeInsuranceClient {
  private contract: ethers.Contract;
  private usdc: ethers.Contract;
  private signer: ethers.Signer;

  constructor(
    provider: ethers.Provider,
    signer: ethers.Signer,
    contractAddress: string,
    usdcAddress: string
  ) {
    this.signer = signer;
    this.contract = new ethers.Contract(contractAddress, NARRATIVE_INSURANCE_ABI, signer);
    this.usdc = new ethers.Contract(usdcAddress, ERC20_ABI, signer);
  }

  // ============ POLICYHOLDER: BUY COVERAGE ============

  /**
   * Buy insurance against a narrative event occurring
   * @param eventId The event to insure against
   * @param coverage Coverage amount in USDC atomic units (e.g., 1000_000000n = 1000 USDC)
   * @returns Policy details and transaction hash
   *
   * @example
   * // Insure Captain Zara against death for 1000 USDC coverage
   * // At 15% premium rate → pays 150 USDC, receives 1000 USDC if she dies
   * const result = await client.buyPolicy(zaraDeathEventId, 1000_000000n);
   * console.log(`Paid ${result.premiumUSDC} USDC for ${result.coverageUSDC} USDC coverage`);
   */
  async buyPolicy(eventId: bigint, coverage: bigint): Promise<BuyPolicyResult> {
    // Calculate premium
    const premium = await this.contract.calculatePremium(eventId, coverage);

    // Approve USDC spend
    await this._approveIfNeeded(premium);

    // Buy policy
    const tx = await this.contract.buyPolicy(eventId, coverage);
    const receipt = await tx.wait();

    // Parse PolicyPurchased event
    const iface = new ethers.Interface(NARRATIVE_INSURANCE_ABI);
    let policyId = 0n;
    let expiresAt = 0n;

    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed?.name === "PolicyPurchased") {
          policyId = parsed.args.policyId;
          expiresAt = parsed.args.expiresAt;
          break;
        }
      } catch {}
    }

    return {
      policyId,
      txHash: receipt.hash,
      coverage,
      coverageUSDC: Number(coverage) / 1e6,
      premium,
      premiumUSDC: Number(premium) / 1e6,
      expiresAt: new Date(Number(expiresAt) * 1000),
    };
  }

  /**
   * Cancel an active policy (before deadline, 80% refund)
   */
  async cancelPolicy(policyId: bigint): Promise<{ txHash: string; refundUSDC: number }> {
    const policy = await this.getPolicy(policyId);
    const tx = await this.contract.cancelPolicy(policyId);
    const receipt = await tx.wait();
    const refundAmount = (Number(policy.premium) * 0.8);
    return { txHash: receipt.hash, refundUSDC: refundAmount / 1e6 };
  }

  // ============ UNDERWRITER: EARN YIELD ============

  /**
   * Stake capital to underwrite insurance policies for an event
   * @param eventId The event to underwrite
   * @param amount Amount of USDC to stake (atomic units)
   * @returns Stake details including estimated APY
   *
   * @example
   * // Stake 5000 USDC to earn premium yield
   * // If Zara survives → keep stake + earn premiums (could be 50-200% APY)
   * // If Zara dies → cover claims (risk of loss)
   * const result = await client.stakeCapital(zaraDeathEventId, 5000_000000n);
   * console.log(`Staked ${result.stakedUSDC} USDC at ~${result.estimatedAPYPercent}% APY`);
   */
  async stakeCapital(eventId: bigint, amount: bigint): Promise<StakeResult> {
    // Get estimated APY before staking
    const apyBps = await this.contract.estimateUnderwriterAPY(eventId);

    // Approve USDC
    await this._approveIfNeeded(amount);

    // Stake
    const tx = await this.contract.stakeCapital(eventId, amount);
    const receipt = await tx.wait();

    // Parse stakeId from event
    const iface = new ethers.Interface(NARRATIVE_INSURANCE_ABI);
    let stakeId = 0n;
    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed?.name === "UnderwriterStaked") {
          stakeId = parsed.args.stakeId;
          break;
        }
      } catch {}
    }

    return {
      stakeId,
      txHash: receipt.hash,
      staked: amount,
      stakedUSDC: Number(amount) / 1e6,
      estimatedAPYPercent: Number(apyBps) / 100,
    };
  }

  /**
   * Withdraw stake + earned premiums after event settlement
   */
  async withdrawStake(stakeId: bigint): Promise<{ txHash: string; returnedUSDC: number; earnedUSDC: number }> {
    const stake = await this.getStake(stakeId);
    const tx = await this.contract.withdrawStake(stakeId);
    const receipt = await tx.wait();
    return {
      txHash: receipt.hash,
      returnedUSDC: Number(stake.staked) / 1e6,
      earnedUSDC: Number(stake.earnedPremiums) / 1e6,
    };
  }

  // ============ VIEW FUNCTIONS ============

  /**
   * Get rich summary of an event including APY, capacity, and status
   */
  async getEventSummary(eventId: bigint): Promise<EventSummary> {
    const [summary, capacity, apyBps] = await Promise.all([
      this.contract.getEventSummary(eventId),
      this.contract.availableCapacity(eventId),
      this.contract.estimateUnderwriterAPY(eventId),
    ]);

    const statusLabels = ["⏳ Pending", "⚡ Occurred", "✅ Did Not Occur"];

    return {
      description: summary.description,
      premiumRateBps: summary.premiumRateBps,
      premiumRatePercent: Number(summary.premiumRateBps) / 100,
      totalCoverage: summary.totalCoverage,
      totalCoverageUSDC: Number(summary.totalCoverage) / 1e6,
      totalPremiums: summary.totalPremiums,
      totalPremiumsUSDC: Number(summary.totalPremiums) / 1e6,
      underwriterPool: summary.underwriterPool,
      underwriterPoolUSDC: Number(summary.underwriterPool) / 1e6,
      deadline: summary.deadline,
      deadlineDate: new Date(Number(summary.deadline) * 1000),
      status: Number(summary.status) as EventStatus,
      statusLabel: statusLabels[Number(summary.status)] || "Unknown",
      active: summary.active,
      availableCapacity: capacity,
      availableCapacityUSDC: Number(capacity) / 1e6,
      estimatedAPYBps: apyBps,
      estimatedAPYPercent: Number(apyBps) / 100,
    };
  }

  /**
   * Get all policies for a user with full details
   */
  async getUserPortfolio(userAddress: string): Promise<{
    policies: Policy[];
    stakes: UnderwriterStake[];
    totalCoverageUSDC: number;
    totalPremiumsPaidUSDC: number;
    totalStakedUSDC: number;
    totalEarnedUSDC: number;
  }> {
    const [policyIds, stakeIds] = await Promise.all([
      this.contract.getUserPolicies(userAddress),
      this.contract.getUserStakes(userAddress),
    ]);

    const [policies, stakes] = await Promise.all([
      Promise.all(policyIds.map((id: bigint) => this.getPolicy(id))),
      Promise.all(stakeIds.map((id: bigint) => this.getStake(id))),
    ]);

    const totalCoverageUSDC = policies.reduce((sum: number, p: Policy) => sum + Number(p.coverage) / 1e6, 0);
    const totalPremiumsPaidUSDC = policies.reduce((sum: number, p: Policy) => sum + Number(p.premium) / 1e6, 0);
    const totalStakedUSDC = stakes.reduce((sum: number, s: UnderwriterStake) => sum + Number(s.staked) / 1e6, 0);
    const totalEarnedUSDC = stakes.reduce((sum: number, s: UnderwriterStake) => sum + Number(s.earnedPremiums) / 1e6, 0);

    return { policies, stakes, totalCoverageUSDC, totalPremiumsPaidUSDC, totalStakedUSDC, totalEarnedUSDC };
  }

  async getPolicy(policyId: bigint): Promise<Policy> {
    const raw = await this.contract.policies(policyId);
    return {
      policyId,
      eventId: raw.eventId,
      policyholder: raw.policyholder,
      coverage: raw.coverage,
      premium: raw.premium,
      purchasedAt: raw.purchasedAt,
      expiresAt: raw.expiresAt,
      status: Number(raw.status) as PolicyStatus,
    };
  }

  async getStake(stakeId: bigint): Promise<UnderwriterStake> {
    const raw = await this.contract.stakes(stakeId);
    return {
      stakeId,
      eventId: raw.eventId,
      underwriter: raw.underwriter,
      staked: raw.staked,
      earnedPremiums: raw.earnedPremiums,
      claimedAt: raw.claimedAt,
      withdrawn: raw.withdrawn,
    };
  }

  // ============ HELPERS ============

  /**
   * Pretty-print event summary to console
   */
  async printEventSummary(eventId: bigint): Promise<void> {
    const s = await this.getEventSummary(eventId);
    console.log(`
╔══════════════════════════════════════════════════════╗
║     🛡️  Narrative Insurance Event #${eventId}             ║
╠══════════════════════════════════════════════════════╣
║  Event: ${s.description.padEnd(44)} ║
║  Status: ${s.statusLabel.padEnd(43)} ║
║  Premium Rate: ${String(s.premiumRatePercent + "%").padEnd(37)} ║
╠══════════════════════════════════════════════════════╣
║  📊 Market Stats                                     ║
║  Total Coverage Sold: $${String(s.totalCoverageUSDC.toFixed(2)).padEnd(30)} ║
║  Total Premiums: $${String(s.totalPremiumsUSDC.toFixed(2)).padEnd(34)} ║
║  Underwriter Pool: $${String(s.underwriterPoolUSDC.toFixed(2)).padEnd(32)} ║
║  Available Capacity: $${String(s.availableCapacityUSDC.toFixed(2)).padEnd(30)} ║
╠══════════════════════════════════════════════════════╣
║  💰 Underwriter Yield                                ║
║  Estimated APY: ${String(s.estimatedAPYPercent.toFixed(1) + "%").padEnd(36)} ║
║  Deadline: ${s.deadlineDate.toLocaleString().padEnd(41)} ║
╚══════════════════════════════════════════════════════╝
    `);
  }

  private async _approveIfNeeded(amount: bigint): Promise<void> {
    const signerAddress = await this.signer.getAddress();
    const contractAddress = await this.contract.getAddress();
    const allowance: bigint = await this.usdc.allowance(signerAddress, contractAddress);
    if (allowance < amount) {
      const tx = await this.usdc.approve(contractAddress, ethers.MaxUint256);
      await tx.wait();
    }
  }
}

// ============ DEMO ============

async function demo() {
  console.log("🛡️  Narrative Insurance Protocol - Demo");
  console.log("============================================\n");

  // This demo shows the user flow without a live contract
  console.log("📖 Scenario: Captain Zara faces mortal danger in Chapter 15");
  console.log("   The AI might choose to kill her for narrative impact...\n");

  console.log("👩‍🚀 As a POLICYHOLDER (reader who loves Zara):");
  console.log("   • Event: 'Captain Zara dies in Chapter 15'");
  console.log("   • Premium Rate: 15% (high risk event)");
  console.log("   • You buy 1,000 USDC coverage for 150 USDC premium");
  console.log("   • If Zara dies → You receive 1,000 USDC payout");
  console.log("   • If Zara survives → You lose 150 USDC (but Zara lives! 🎉)\n");

  console.log("🏦 As an UNDERWRITER (yield farmer):");
  console.log("   • You stake 5,000 USDC in the risk pool");
  console.log("   • If Zara survives → You earn share of 150 USDC premium (~50-200% APY)");
  console.log("   • If Zara dies → Your stake covers the payout (risk of loss)");
  console.log("   • You're betting Zara survives. You're the 'house' for this risk.\n");

  console.log("📊 Market Dynamics:");
  console.log("   • High premium rates = high implied probability of event");
  console.log("   • Underwriters fill available capacity = event can be insured");
  console.log("   • Price discovery: readers collectively price narrative risk");
  console.log("   • Net result: a living derivative market on story outcomes\n");

  console.log("💡 Why This Creates 100x Engagement:");
  console.log("   • Readers with favorite characters MUST insure them");
  console.log("   • FOMO: uninsured characters can die at any chapter");
  console.log("   • Social: everyone knows who's insured (on-chain transparency)");
  console.log("   • Metagame: underwriters analyze narratives to find safe bets");
  console.log("   • DeFi-native: yield farmers enter the story economy\n");

  console.log("🔑 Revenue Model:");
  console.log("   • 3% protocol fee on all premiums");
  console.log("   • If 10,000 readers buy 1,000 USDC coverage = 10M coverage");
  console.log("   • At 15% premium = 1.5M in premiums");
  console.log("   • Protocol earns 3% = 45,000 USDC per major event");
  console.log("   • 100 events/year = $4.5M protocol revenue\n");

  console.log("✅ Demo complete. See NarrativeInsurance.sol for full implementation.");
}

if (require.main === module) {
  demo().catch(console.error);
}
