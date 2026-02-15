/**
 * NVI (Narrative Volatility Index) Calculator
 * 
 * Production version - adapted from POC
 * Calculates story unpredictability based on betting pools and AI predictions
 */

export interface ChoiceDistribution {
  choiceId: string;
  amount: number;
  probability: number;
}

export interface AIModelPrediction {
  model: string;
  predictions: {
    choiceId: string;
    confidence: number;
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
  nviValue: number;      // 0-100
  entropy: number;       // Shannon entropy
  aiVariance: number;    // AI prediction variance
  confidence: number;    // 0-1
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
  
  // 6. Calculate confidence
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
  bettingPool: { choiceId: string; amount: number }[]
): ChoiceDistribution[] {
  const total = bettingPool.reduce((sum, bet) => sum + bet.amount, 0);
  
  if (total === 0) {
    // No bets yet - equal probability
    return bettingPool.map(bet => ({
      choiceId: bet.choiceId,
      amount: 0,
      probability: 1 / bettingPool.length,
    }));
  }
  
  return bettingPool.map(bet => ({
    choiceId: bet.choiceId,
    amount: bet.amount,
    probability: bet.amount / total,
  }));
}

/**
 * Calculate Shannon entropy
 */
function calculateEntropy(distribution: ChoiceDistribution[]): number {
  let entropy = 0;
  
  for (const choice of distribution) {
    if (choice.probability > 0) {
      entropy -= choice.probability * Math.log2(choice.probability);
    }
  }
  
  // Normalize to 0-1 (max entropy for N choices is log2(N))
  const maxEntropy = Math.log2(distribution.length);
  return maxEntropy > 0 ? entropy / maxEntropy : 0;
}

/**
 * Calculate AI model prediction variance
 */
function calculateAIVariance(predictions: AIModelPrediction[]): number {
  if (predictions.length === 0) return 0.5; // Default moderate variance
  
  // Group predictions by choice
  const predictionsByChoice = new Map<string, number[]>();
  
  for (const model of predictions) {
    for (const pred of model.predictions) {
      if (!predictionsByChoice.has(pred.choiceId)) {
        predictionsByChoice.set(pred.choiceId, []);
      }
      predictionsByChoice.get(pred.choiceId)!.push(pred.confidence);
    }
  }
  
  // Calculate variance for each choice, then average
  let totalVariance = 0;
  let count = 0;
  
  for (const confidences of predictionsByChoice.values()) {
    if (confidences.length > 1) {
      const mean = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
      const variance = confidences.reduce((sum, c) => sum + (c - mean) ** 2, 0) / confidences.length;
      totalVariance += variance;
      count++;
    }
  }
  
  return count > 0 ? totalVariance / count : 0.5;
}

/**
 * Calculate confidence in NVI score
 */
function calculateConfidence(
  distribution: ChoiceDistribution[],
  aiPredictions: AIModelPrediction[]
): number {
  // Confidence based on:
  // 1. Sample size (more bets = higher confidence)
  // 2. AI model agreement (less variance = higher confidence)
  
  const totalAmount = distribution.reduce((sum, d) => sum + d.amount, 0);
  const sampleSizeConfidence = Math.min(1, totalAmount / 10000); // Max confidence at $10K pool
  
  const aiVariance = calculateAIVariance(aiPredictions);
  const aiConfidence = 1 - aiVariance; // Less variance = more confidence
  
  // Weighted average
  return (sampleSizeConfidence * 0.7 + aiConfidence * 0.3);
}

/**
 * Get mock AI predictions for testing
 * TODO: Replace with actual AI model calls in production
 */
export async function getMockAIPredictions(
  chapterData: ChapterData
): Promise<AIModelPrediction[]> {
  // Simulate predictions from 3 AI models
  const models = ['gpt-4', 'claude-sonnet', 'gemini-pro'];
  
  return models.map(model => {
    // Random predictions for each choice (varies by model)
    const predictions = chapterData.choices.map(choice => {
      // Add some randomness to simulate model disagreement
      const baseConfidence = 1 / chapterData.choices.length;
      const variance = (Math.random() - 0.5) * 0.4; // ±20%
      const confidence = Math.max(0.1, Math.min(0.9, baseConfidence + variance));
      
      return {
        choiceId: choice.id,
        confidence,
      };
    });
    
    // Normalize so confidences sum to 1
    const total = predictions.reduce((sum, p) => sum + p.confidence, 0);
    const normalized = predictions.map(p => ({
      ...p,
      confidence: p.confidence / total,
    }));
    
    return {
      model,
      predictions: normalized,
    };
  });
}
