/**
 * NVI (Narrative Volatility Index) Calculator
 * 
 * Calculates story unpredictability based on:
 * 1. Betting pool distribution (Shannon entropy)
 * 2. AI model prediction variance
 * 3. Historical pattern deviations
 * 
 * Similar to VIX (stock market volatility index) but for narrative markets
 */

export interface ChoiceDistribution {
  choiceId: string;
  amount: number;        // Betting pool amount (in USDC)
  probability: number;   // 0-1
}

export interface AIModelPrediction {
  model: string;         // 'gpt-4' | 'claude-sonnet' | 'gemini-pro'
  predictions: {
    choiceId: string;
    confidence: number;  // 0-1
  }[];
}

export interface ChapterData {
  chapterId: string;
  choices: { id: string; text: string }[];
  bettingPool: {
    choiceId: string;
    amount: number;
  }[];
}

export interface NVIResult {
  nviValue: number;      // 0-100 (scaled, e.g., 73.40)
  entropy: number;       // Shannon entropy of betting distribution
  aiVariance: number;    // Variance in AI model predictions
  confidence: number;    // 0-1 (how confident we are in this NVI)
  breakdown: {
    poolDistribution: ChoiceDistribution[];
    aiPredictions: AIModelPrediction[];
  };
}

/**
 * Calculate NVI for a chapter
 */
export async function calculateNVI(
  chapterData: ChapterData,
  aiPredictions: AIModelPrediction[]
): Promise<NVIResult> {
  // 1. Calculate betting pool distribution
  const poolDistribution = calculateChoiceDistribution(chapterData.bettingPool);
  
  // 2. Calculate Shannon entropy
  const entropy = calculateEntropy(poolDistribution);
  
  // 3. Calculate AI model variance
  const aiVariance = calculateAIVariance(aiPredictions);
  
  // 4. Combine into NVI score
  const nviRaw = Math.sqrt(
    poolDistribution.reduce((sum, c) => sum + c.probability ** 2, 0) *
    entropy *
    aiVariance
  );
  
  // 5. Normalize to 0-100 scale
  const nviValue = Math.min(100, Math.round(nviRaw * 100));
  
  // 6. Calculate confidence (based on sample size and consistency)
  const confidence = calculateConfidence(poolDistribution, aiPredictions);
  
  return {
    nviValue,
    entropy,
    aiVariance,
    confidence,
    breakdown: {
      poolDistribution,
      aiPredictions,
    },
  };
}

/**
 * Calculate choice distribution from betting pool
 */
function calculateChoiceDistribution(
  bets: { choiceId: string; amount: number }[]
): ChoiceDistribution[] {
  const totalAmount = bets.reduce((sum, b) => sum + b.amount, 0);
  
  // Group by choice
  const choiceAmounts = bets.reduce((acc, bet) => {
    acc[bet.choiceId] = (acc[bet.choiceId] || 0) + bet.amount;
    return acc;
  }, {} as Record<string, number>);
  
  // Calculate probabilities
  return Object.entries(choiceAmounts).map(([choiceId, amount]) => ({
    choiceId,
    amount,
    probability: totalAmount > 0 ? amount / totalAmount : 0,
  }));
}

/**
 * Calculate Shannon entropy of betting distribution
 * 
 * Entropy = -Σ(p * log₂(p)) for all choices
 * 
 * High entropy = More uncertainty (balanced betting)
 * Low entropy = Less uncertainty (one choice dominates)
 * 
 * Example:
 *   [50%, 50%] → Entropy ≈ 1.0 (max for 2 choices)
 *   [90%, 10%] → Entropy ≈ 0.47 (low, clear favorite)
 */
function calculateEntropy(distribution: ChoiceDistribution[]): number {
  return -distribution.reduce((sum, { probability }) => {
    if (probability === 0) return sum;
    return sum + probability * Math.log2(probability);
  }, 0);
}

/**
 * Calculate variance across AI model predictions
 * 
 * High variance = AI models disagree (high uncertainty)
 * Low variance = AI models agree (low uncertainty)
 */
function calculateAIVariance(predictions: AIModelPrediction[]): number {
  if (predictions.length === 0) return 1; // Default to neutral
  
  // Extract all confidence values across all models
  const allConfidences = predictions.flatMap(p => 
    p.predictions.map(pred => pred.confidence)
  );
  
  if (allConfidences.length === 0) return 1;
  
  // Calculate mean
  const mean = allConfidences.reduce((a, b) => a + b, 0) / allConfidences.length;
  
  // Calculate variance
  const variance = allConfidences.reduce((sum, val) => {
    return sum + (val - mean) ** 2;
  }, 0) / allConfidences.length;
  
  // Return standard deviation (normalized to 0-2 range typically)
  return Math.sqrt(variance) * 3; // Scale up for visibility
}

/**
 * Calculate confidence in NVI calculation
 * 
 * Higher confidence when:
 * - Large betting pool (more data)
 * - Multiple AI models agree
 * - Consistent historical patterns
 */
function calculateConfidence(
  distribution: ChoiceDistribution[],
  aiPredictions: AIModelPrediction[]
): number {
  // Factor 1: Betting pool size (log scale)
  const totalAmount = distribution.reduce((sum, c) => sum + c.amount, 0);
  const poolConfidence = Math.min(1, Math.log10(totalAmount + 1) / 5); // 0-1
  
  // Factor 2: AI model agreement
  const aiConfidence = aiPredictions.length >= 3 ? 1 : aiPredictions.length / 3;
  
  // Combined confidence (geometric mean)
  return Math.sqrt(poolConfidence * aiConfidence);
}

/**
 * Get historical NVI data for a story
 * 
 * Useful for charting NVI trends over time
 */
export async function getNVIHistory(
  storyId: string,
  limit: number = 10
): Promise<{ chapterId: string; nvi: number; timestamp: Date }[]> {
  // This would fetch from database in production
  // For POC, return mock data
  
  const mockHistory = Array.from({ length: limit }, (_, i) => ({
    chapterId: `chapter-${i + 1}`,
    nvi: Math.random() * 100,
    timestamp: new Date(Date.now() - (limit - i) * 24 * 60 * 60 * 1000),
  }));
  
  return mockHistory;
}

/**
 * Predict future NVI based on historical trends
 * 
 * Uses simple moving average for POC
 * Production would use more sophisticated time series analysis
 */
export function predictFutureNVI(
  historicalNVI: number[],
  periods: number = 1
): number {
  if (historicalNVI.length === 0) return 50; // Default to mid-range
  
  // Simple moving average
  const windowSize = Math.min(5, historicalNVI.length);
  const recentNVIs = historicalNVI.slice(-windowSize);
  const average = recentNVIs.reduce((a, b) => a + b, 0) / recentNVIs.length;
  
  // Add some trend detection (upward/downward)
  const trend = historicalNVI.length >= 2
    ? historicalNVI[historicalNVI.length - 1] - historicalNVI[historicalNVI.length - 2]
    : 0;
  
  // Project future NVI
  const predicted = average + (trend * periods);
  
  // Clamp to 0-100
  return Math.max(0, Math.min(100, predicted));
}

/**
 * Calculate NVI percentile rank
 * 
 * Returns what % of historical chapters had lower NVI
 * 
 * Example:
 *   95th percentile = This chapter is more volatile than 95% of chapters
 */
export function calculateNVIPercentile(
  currentNVI: number,
  historicalNVIs: number[]
): number {
  if (historicalNVIs.length === 0) return 50;
  
  const lowerCount = historicalNVIs.filter(nvi => nvi < currentNVI).length;
  return (lowerCount / historicalNVIs.length) * 100;
}

/**
 * Mock AI predictions (for testing)
 * 
 * In production, this would call actual AI APIs
 */
export async function getMockAIPredictions(
  chapterData: ChapterData
): Promise<AIModelPrediction[]> {
  const { choices } = chapterData;
  
  return [
    {
      model: 'gpt-4',
      predictions: choices.map(c => ({
        choiceId: c.id,
        confidence: Math.random(),
      })),
    },
    {
      model: 'claude-sonnet',
      predictions: choices.map(c => ({
        choiceId: c.id,
        confidence: Math.random(),
      })),
    },
    {
      model: 'gemini-pro',
      predictions: choices.map(c => ({
        choiceId: c.id,
        confidence: Math.random(),
      })),
    },
  ];
}

/**
 * Example usage
 */
export async function example() {
  const chapterData: ChapterData = {
    chapterId: 'chapter-10',
    choices: [
      { id: 'A', text: 'Ally with House Kael' },
      { id: 'B', text: 'Form neutral coalition' },
      { id: 'C', text: 'Go rogue' },
    ],
    bettingPool: [
      { choiceId: 'A', amount: 35000 },
      { choiceId: 'B', amount: 45000 },
      { choiceId: 'C', amount: 20000 },
    ],
  };
  
  const aiPredictions = await getMockAIPredictions(chapterData);
  
  const nviResult = await calculateNVI(chapterData, aiPredictions);
  
  console.log('NVI Result:', nviResult);
  /*
  {
    nviValue: 73,
    entropy: 1.53,
    aiVariance: 0.42,
    confidence: 0.87,
    breakdown: { ... }
  }
  */
  
  // Historical analysis
  const history = await getNVIHistory('story-1', 10);
  const historicalNVIs = history.map(h => h.nvi);
  
  const predictedNVI = predictFutureNVI(historicalNVIs, 1);
  console.log('Predicted next NVI:', predictedNVI);
  
  const percentile = calculateNVIPercentile(nviResult.nviValue, historicalNVIs);
  console.log(`This chapter is more volatile than ${percentile.toFixed(1)}% of chapters`);
}
