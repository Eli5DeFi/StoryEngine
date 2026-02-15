/**
 * Dynamic Difficulty Betting - Skill Rating System
 * ELO-style ranking with adaptive odds for fair betting
 * 
 * @module dynamic-difficulty/skillRating
 */

export interface PlayerSkill {
  userId: string;
  eloRating: number;     // 1000-3000 (like chess)
  totalBets: number;
  wins: number;
  losses: number;
  winRate: number;       // 0-1
  currentStreak: number; // Positive = wins, negative = losses
  longestWinStreak: number;
  tier: SkillTier;
  lastBetDate: Date;
  averageBetSize: number; // In USDC
  totalWagered: number;
  totalEarnings: number;
}

export enum SkillTier {
  NOVICE = "NOVICE",        // 0-10 bets, 1000-1200 ELO
  INTERMEDIATE = "INTERMEDIATE", // 11-50 bets, 1200-1400 ELO
  EXPERT = "EXPERT",        // 51-200 bets, 1400-1600 ELO
  MASTER = "MASTER",        // 201-500 bets, 1600-1800 ELO
  LEGEND = "LEGEND"         // 501+ bets, 1800+ ELO, top 1%
}

export interface AdaptiveOdds {
  standardOdds: number;    // Base odds from pool distribution
  adjustedOdds: number;    // Personalized odds based on skill
  oddsMultiplier: number;  // 1.0 = no adjustment
  tier: SkillTier;
}

export class SkillRatingSystem {
  // ELO constants
  private readonly K_FACTOR = 32;        // Rating change sensitivity
  private readonly INITIAL_RATING = 1000; // Starting ELO
  private readonly MIN_RATING = 100;      // Floor
  private readonly MAX_RATING = 3000;     // Ceiling
  
  // Tier thresholds
  private readonly TIER_THRESHOLDS = {
    [SkillTier.NOVICE]: { minBets: 0, minELO: 0, maxELO: 1200 },
    [SkillTier.INTERMEDIATE]: { minBets: 11, minELO: 1200, maxELO: 1400 },
    [SkillTier.EXPERT]: { minBets: 51, minELO: 1400, maxELO: 1600 },
    [SkillTier.MASTER]: { minBets: 201, minELO: 1600, maxELO: 1800 },
    [SkillTier.LEGEND]: { minBets: 501, minELO: 1800, maxELO: 3000 }
  };
  
  // Odds multipliers by tier
  private readonly ODDS_MULTIPLIERS = {
    [SkillTier.NOVICE]: 1.15,      // +15% boost
    [SkillTier.INTERMEDIATE]: 1.05, // +5% boost
    [SkillTier.EXPERT]: 1.0,        // Standard odds
    [SkillTier.MASTER]: 0.95,       // -5% penalty
    [SkillTier.LEGEND]: 0.90        // -10% penalty
  };
  
  /**
   * Initialize a new player
   */
  createPlayer(userId: string): PlayerSkill {
    return {
      userId,
      eloRating: this.INITIAL_RATING,
      totalBets: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      currentStreak: 0,
      longestWinStreak: 0,
      tier: SkillTier.NOVICE,
      lastBetDate: new Date(),
      averageBetSize: 0,
      totalWagered: 0,
      totalEarnings: 0
    };
  }
  
  /**
   * Update player ELO rating after bet result
   * 
   * @param player Current player stats
   * @param opponentAvgRating Average ELO of all other bettors
   * @param won True if player won the bet
   * @returns Updated player stats
   */
  updateRating(
    player: PlayerSkill,
    opponentAvgRating: number,
    won: boolean
  ): PlayerSkill {
    // Calculate expected win probability
    const expected = this.expectedScore(player.eloRating, opponentAvgRating);
    
    // Actual score (1 = win, 0 = loss)
    const actual = won ? 1 : 0;
    
    // Calculate new rating
    let newRating = player.eloRating + this.K_FACTOR * (actual - expected);
    
    // Apply bounds
    newRating = Math.max(this.MIN_RATING, Math.min(this.MAX_RATING, newRating));
    
    // Update stats
    const updatedPlayer: PlayerSkill = {
      ...player,
      eloRating: Math.round(newRating),
      totalBets: player.totalBets + 1,
      wins: won ? player.wins + 1 : player.wins,
      losses: won ? player.losses : player.losses + 1,
      winRate: won 
        ? (player.wins + 1) / (player.totalBets + 1)
        : player.wins / (player.totalBets + 1),
      currentStreak: won 
        ? (player.currentStreak >= 0 ? player.currentStreak + 1 : 1)
        : (player.currentStreak <= 0 ? player.currentStreak - 1 : -1),
      longestWinStreak: won 
        ? Math.max(player.longestWinStreak, player.currentStreak + 1)
        : player.longestWinStreak,
      lastBetDate: new Date()
    };
    
    // Recalculate tier
    updatedPlayer.tier = this.calculateTier(updatedPlayer);
    
    return updatedPlayer;
  }
  
  /**
   * Calculate expected win probability using ELO formula
   * https://en.wikipedia.org/wiki/Elo_rating_system
   */
  private expectedScore(playerRating: number, opponentRating: number): number {
    return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  }
  
  /**
   * Determine player tier based on bets and ELO
   */
  calculateTier(player: PlayerSkill): SkillTier {
    const { totalBets, eloRating, winRate } = player;
    
    // Check each tier in descending order
    for (const tier of [
      SkillTier.LEGEND,
      SkillTier.MASTER,
      SkillTier.EXPERT,
      SkillTier.INTERMEDIATE,
      SkillTier.NOVICE
    ]) {
      const threshold = this.TIER_THRESHOLDS[tier];
      
      if (
        totalBets >= threshold.minBets &&
        eloRating >= threshold.minELO &&
        eloRating < threshold.maxELO
      ) {
        // Special case: LEGEND requires top 1% win rate (>70%)
        if (tier === SkillTier.LEGEND && winRate < 0.7) {
          continue;
        }
        
        return tier;
      }
    }
    
    return SkillTier.NOVICE; // Default
  }
  
  /**
   * Get odds multiplier for a tier
   */
  getOddsMultiplier(tier: SkillTier): number {
    return this.ODDS_MULTIPLIERS[tier];
  }
  
  /**
   * Calculate personalized odds for a player
   * 
   * @param standardOdds Base odds from pool distribution
   * @param playerTier Player's skill tier
   * @returns Adjusted odds
   */
  calculateAdaptiveOdds(
    standardOdds: number,
    playerTier: SkillTier
  ): AdaptiveOdds {
    const multiplier = this.getOddsMultiplier(playerTier);
    const adjustedOdds = standardOdds * multiplier;
    
    return {
      standardOdds,
      adjustedOdds,
      oddsMultiplier: multiplier,
      tier: playerTier
    };
  }
  
  /**
   * Calculate personalized payout
   * 
   * @param betAmount Amount bet in USDC
   * @param standardOdds Base odds
   * @param playerTier Player's tier
   * @returns Expected payout
   */
  calculatePersonalizedPayout(
    betAmount: number,
    standardOdds: number,
    playerTier: SkillTier
  ): number {
    const { adjustedOdds } = this.calculateAdaptiveOdds(standardOdds, playerTier);
    return betAmount * adjustedOdds;
  }
  
  /**
   * Calculate average opponent rating for a betting pool
   * 
   * @param allPlayers All players in the pool
   * @param currentPlayer The player to exclude
   * @returns Average ELO of opponents
   */
  calculateOpponentAverage(
    allPlayers: PlayerSkill[],
    currentPlayer: PlayerSkill
  ): number {
    const opponents = allPlayers.filter(p => p.userId !== currentPlayer.userId);
    
    if (opponents.length === 0) {
      return this.INITIAL_RATING; // Default if no opponents
    }
    
    const totalRating = opponents.reduce((sum, p) => sum + p.eloRating, 0);
    return totalRating / opponents.length;
  }
  
  /**
   * Get tier display info
   */
  getTierInfo(tier: SkillTier): {
    name: string;
    color: string;
    icon: string;
    description: string;
    oddsBonus: string;
  } {
    const info = {
      [SkillTier.NOVICE]: {
        name: "Novice",
        color: "#9CA3AF", // Gray
        icon: "🌱",
        description: "Learning the ropes",
        oddsBonus: "+15% odds boost"
      },
      [SkillTier.INTERMEDIATE]: {
        name: "Intermediate",
        color: "#60A5FA", // Blue
        icon: "📈",
        description: "Building experience",
        oddsBonus: "+5% odds boost"
      },
      [SkillTier.EXPERT]: {
        name: "Expert",
        color: "#A78BFA", // Purple
        icon: "⚡",
        description: "Proven bettor",
        oddsBonus: "Standard odds"
      },
      [SkillTier.MASTER]: {
        name: "Master",
        color: "#FBBF24", // Gold
        icon: "👑",
        description: "Veteran bettor",
        oddsBonus: "-5% odds (skill tax)"
      },
      [SkillTier.LEGEND]: {
        name: "Legend",
        color: "#EF4444", // Red
        icon: "🔥",
        description: "Top 1% bettor",
        oddsBonus: "-10% odds (skill tax)"
      }
    };
    
    return info[tier];
  }
  
  /**
   * Get progress to next tier
   */
  getTierProgress(player: PlayerSkill): {
    currentTier: SkillTier;
    nextTier: SkillTier | null;
    betsNeeded: number;
    eloNeeded: number;
    progressPercent: number;
  } {
    const currentTier = player.tier;
    const tierOrder = [
      SkillTier.NOVICE,
      SkillTier.INTERMEDIATE,
      SkillTier.EXPERT,
      SkillTier.MASTER,
      SkillTier.LEGEND
    ];
    
    const currentIndex = tierOrder.indexOf(currentTier);
    const nextTier = currentIndex < tierOrder.length - 1 
      ? tierOrder[currentIndex + 1] 
      : null;
    
    if (!nextTier) {
      return {
        currentTier,
        nextTier: null,
        betsNeeded: 0,
        eloNeeded: 0,
        progressPercent: 100
      };
    }
    
    const nextThreshold = this.TIER_THRESHOLDS[nextTier];
    
    const betsNeeded = Math.max(0, nextThreshold.minBets - player.totalBets);
    const eloNeeded = Math.max(0, nextThreshold.minELO - player.eloRating);
    
    // Progress is minimum of bet progress and ELO progress
    const betProgress = player.totalBets / nextThreshold.minBets;
    const eloProgress = player.eloRating / nextThreshold.minELO;
    const progressPercent = Math.min(100, Math.min(betProgress, eloProgress) * 100);
    
    return {
      currentTier,
      nextTier,
      betsNeeded,
      eloNeeded,
      progressPercent: Math.round(progressPercent)
    };
  }
  
  /**
   * Simulate a match (for testing)
   */
  simulateMatch(
    player1: PlayerSkill,
    player2: PlayerSkill,
    player1Wins: boolean
  ): { updatedPlayer1: PlayerSkill; updatedPlayer2: PlayerSkill } {
    const updatedPlayer1 = this.updateRating(
      player1,
      player2.eloRating,
      player1Wins
    );
    
    const updatedPlayer2 = this.updateRating(
      player2,
      player1.eloRating,
      !player1Wins
    );
    
    return { updatedPlayer1, updatedPlayer2 };
  }
}

// Export singleton instance
export const skillRatingSystem = new SkillRatingSystem();
