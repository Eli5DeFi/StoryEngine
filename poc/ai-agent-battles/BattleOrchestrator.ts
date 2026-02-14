/**
 * AI Battle Orchestrator
 * 
 * Handles:
 * - Multi-AI chapter generation
 * - Battle pool creation
 * - Reputation tracking
 * - Quality scoring
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { ethers } from 'ethers';

interface ChapterContext {
  storyId: string;
  chapterId: number;
  previousChapters: string[];
  characterStates: Record<string, any>;
  worldState: Record<string, any>;
  readerChoices: string[];
}

interface AIAgentConfig {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'custom';
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

interface GeneratedChapter {
  agentId: string;
  content: string;
  ipfsHash: string;
  metadata: {
    wordCount: number;
    sentimentScore: number;
    coherenceScore: number;
    styleSignature: string;
  };
  timestamp: number;
}

interface BattleResult {
  battleId: number;
  chapterId: number;
  agents: GeneratedChapter[];
  poolAddress: string;
  deadline: number;
}

export class AIBattleOrchestrator {
  private openai: OpenAI;
  private anthropic: Anthropic;
  private contract: ethers.Contract;
  private ipfsClient: any;
  
  // Default AI agent configs
  private defaultAgents: AIAgentConfig[] = [
    {
      id: 'gpt-4',
      name: 'GPT-4',
      provider: 'openai',
      model: 'gpt-4-turbo-preview',
      temperature: 0.8,
      maxTokens: 2000,
      systemPrompt: `You are a master storyteller specializing in political intrigue and subtle character development. 
      Write chapters that focus on:
      - Complex motivations and hidden agendas
      - Diplomatic maneuvering and power plays
      - Subtle clues and foreshadowing
      - Realistic dialogue that reveals character
      Style: Sophisticated, nuanced, cerebral`
    },
    {
      id: 'claude-sonnet-4',
      name: 'Claude Sonnet',
      provider: 'anthropic',
      model: 'claude-sonnet-4-20250514',
      temperature: 0.9,
      maxTokens: 2000,
      systemPrompt: `You are a master storyteller specializing in emotional depth and character psychology.
      Write chapters that focus on:
      - Deep character introspection and growth
      - Emotional resonance and human connection
      - Moral dilemmas and ethical complexity
      - Beautiful, evocative prose
      Style: Literary, introspective, emotionally powerful`
    },
    {
      id: 'gpt-4-action',
      name: 'GPT-4 Action',
      provider: 'openai',
      model: 'gpt-4-turbo-preview',
      temperature: 0.7,
      maxTokens: 2000,
      systemPrompt: `You are a master storyteller specializing in cinematic action and visual storytelling.
      Write chapters that focus on:
      - High-stakes action sequences
      - Vivid visual descriptions
      - Fast pacing and tension
      - Dramatic reveals and cliffhangers
      Style: Cinematic, visceral, high-energy`
    }
  ];
  
  constructor(
    openaiKey: string,
    anthropicKey: string,
    contractAddress: string,
    provider: ethers.Provider,
    ipfsEndpoint: string
  ) {
    this.openai = new OpenAI({ apiKey: openaiKey });
    this.anthropic = new Anthropic({ apiKey: anthropicKey });
    
    // Initialize contract (ABI would be imported from compiled contracts)
    const abi = [/* Contract ABI */];
    this.contract = new ethers.Contract(contractAddress, abi, provider);
    
    // Initialize IPFS client (e.g., Pinata, web3.storage)
    this.ipfsClient = null; // Would initialize based on ipfsEndpoint
  }
  
  /**
   * Generate chapter with multiple AI agents
   */
  async generateBattle(
    context: ChapterContext,
    agentIds?: string[]
  ): Promise<BattleResult> {
    console.log(`🎬 Starting AI Battle for Chapter ${context.chapterId}`);
    
    // Select agents (default or custom)
    const selectedAgents = agentIds 
      ? this.defaultAgents.filter(a => agentIds.includes(a.id))
      : this.defaultAgents;
    
    // Generate chapters in parallel
    const generationPromises = selectedAgents.map(agent => 
      this.generateChapterWithAgent(agent, context)
    );
    
    console.log(`⚡ Generating ${selectedAgents.length} versions in parallel...`);
    const generatedChapters = await Promise.all(generationPromises);
    
    // Upload to IPFS
    console.log(`📦 Uploading to IPFS...`);
    const uploadedChapters = await Promise.all(
      generatedChapters.map(chapter => this.uploadToIPFS(chapter))
    );
    
    // Create battle on-chain
    console.log(`⛓️ Creating battle on-chain...`);
    const battleId = await this.createBattleOnChain(
      context.chapterId,
      uploadedChapters
    );
    
    console.log(`✅ Battle created! ID: ${battleId}`);
    
    return {
      battleId,
      chapterId: context.chapterId,
      agents: uploadedChapters,
      poolAddress: await this.contract.getAddress(),
      deadline: Date.now() + (48 * 60 * 60 * 1000) // 48 hours
    };
  }
  
  /**
   * Generate chapter with specific AI agent
   */
  private async generateChapterWithAgent(
    agent: AIAgentConfig,
    context: ChapterContext
  ): Promise<GeneratedChapter> {
    console.log(`  🤖 ${agent.name} writing...`);
    
    // Build prompt
    const prompt = this.buildPrompt(context);
    
    let content: string;
    
    // Call appropriate AI provider
    if (agent.provider === 'openai') {
      const response = await this.openai.chat.completions.create({
        model: agent.model,
        messages: [
          { role: 'system', content: agent.systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: agent.temperature,
        max_tokens: agent.maxTokens
      });
      
      content = response.choices[0].message.content || '';
      
    } else if (agent.provider === 'anthropic') {
      const response = await this.anthropic.messages.create({
        model: agent.model,
        system: agent.systemPrompt,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: agent.temperature,
        max_tokens: agent.maxTokens
      });
      
      content = response.content[0].type === 'text' 
        ? response.content[0].text 
        : '';
        
    } else {
      // Custom model (would call fine-tuned endpoint)
      content = await this.callCustomModel(agent, prompt);
    }
    
    // Analyze chapter quality
    const metadata = await this.analyzeChapter(content);
    
    console.log(`  ✅ ${agent.name} done (${metadata.wordCount} words, coherence: ${metadata.coherenceScore})`);
    
    return {
      agentId: agent.id,
      content,
      ipfsHash: '', // Will be set during upload
      metadata,
      timestamp: Date.now()
    };
  }
  
  /**
   * Build prompt from chapter context
   */
  private buildPrompt(context: ChapterContext): string {
    const previousChaptersSummary = context.previousChapters.slice(-3).join('\n\n');
    const characterStatesSummary = Object.entries(context.characterStates)
      .map(([name, state]) => `${name}: ${JSON.stringify(state)}`)
      .join('\n');
    
    return `
# Story Context

## Previous Chapters (Last 3)
${previousChaptersSummary}

## Current Character States
${characterStatesSummary}

## World State
${JSON.stringify(context.worldState, null, 2)}

## Reader Choices (Recent)
${context.readerChoices.slice(-5).join('\n')}

# Your Task

Write Chapter ${context.chapterId} that:
1. Builds on previous events naturally
2. Advances the plot with meaningful consequences
3. Develops characters in unexpected but believable ways
4. Sets up future story threads
5. Ends with a compelling choice for readers

Length: 1500-2000 words
Format: Prose narrative, third-person limited POV

Write the chapter now:
    `.trim();
  }
  
  /**
   * Analyze chapter quality
   */
  private async analyzeChapter(content: string): Promise<{
    wordCount: number;
    sentimentScore: number;
    coherenceScore: number;
    styleSignature: string;
  }> {
    const wordCount = content.split(/\s+/).length;
    
    // Use GPT-4 to score coherence and sentiment
    const analysis = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `Analyze this story chapter and provide:
          1. Coherence score (0-100): How well does it flow and make sense?
          2. Sentiment score (-100 to +100): Overall emotional tone
          3. Style signature (one word): dominant writing style
          
          Respond in JSON: {"coherence": 85, "sentiment": 20, "style": "introspective"}`
        },
        {
          role: 'user',
          content: content.slice(0, 4000) // Limit for API
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 100
    });
    
    const result = JSON.parse(analysis.choices[0].message.content || '{}');
    
    return {
      wordCount,
      sentimentScore: result.sentiment || 0,
      coherenceScore: result.coherence || 70,
      styleSignature: result.style || 'unknown'
    };
  }
  
  /**
   * Upload chapter to IPFS
   */
  private async uploadToIPFS(chapter: GeneratedChapter): Promise<GeneratedChapter> {
    // In production, would use Pinata or web3.storage
    // For POC, simulate IPFS hash
    const hash = `ipfs://Qm${Buffer.from(chapter.content).toString('base64').slice(0, 44)}`;
    
    return {
      ...chapter,
      ipfsHash: hash
    };
  }
  
  /**
   * Create battle on blockchain
   */
  private async createBattleOnChain(
    chapterId: number,
    chapters: GeneratedChapter[]
  ): Promise<number> {
    const agentIds = chapters.map(c => c.agentId);
    const ipfsHashes = chapters.map(c => c.ipfsHash);
    
    // Call contract
    const tx = await this.contract.createBattle(
      chapterId,
      agentIds,
      ipfsHashes,
      48 // 48 hours
    );
    
    const receipt = await tx.wait();
    
    // Extract battleId from event
    const event = receipt.logs.find((log: any) => 
      log.topics[0] === ethers.id('BattleCreated(uint256,uint256,string[],uint256)')
    );
    
    return event ? Number(event.topics[1]) : 0;
  }
  
  /**
   * Custom model call (fine-tuned)
   */
  private async callCustomModel(
    agent: AIAgentConfig,
    prompt: string
  ): Promise<string> {
    // Would call custom API endpoint
    // For POC, use GPT-4 as fallback
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: agent.systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: agent.temperature,
      max_tokens: agent.maxTokens
    });
    
    return response.choices[0].message.content || '';
  }
  
  /**
   * Get agent stats from blockchain
   */
  async getAgentStats(agentId: string) {
    return await this.contract.getAgent(agentId);
  }
  
  /**
   * Get battle details
   */
  async getBattle(battleId: number) {
    return await this.contract.getBattle(battleId);
  }
  
  /**
   * Resolve battle (oracle function)
   */
  async resolveBattle(battleId: number, winningAgentId: string) {
    const tx = await this.contract.resolveBattle(battleId, winningAgentId);
    return await tx.wait();
  }
}

// Example usage
async function exampleUsage() {
  const orchestrator = new AIBattleOrchestrator(
    process.env.OPENAI_API_KEY!,
    process.env.ANTHROPIC_API_KEY!,
    '0x...', // Contract address
    new ethers.JsonRpcProvider('https://base-sepolia.g.alchemy.com/v2/...'),
    'https://api.pinata.cloud'
  );
  
  const battle = await orchestrator.generateBattle({
    storyId: 'voidborne-1',
    chapterId: 15,
    previousChapters: [
      'Chapter 14: The heir discovered...',
      'Chapter 13: House Kael proposed...'
    ],
    characterStates: {
      'The Heir': { alive: true, stress: 85, loyalty_house_kael: 40 },
      'Ambassador Kael': { alive: true, trust: 60, hidden_agenda: true }
    },
    worldState: {
      political_tension: 90,
      war_probability: 0.45,
      economy_stability: 60
    },
    readerChoices: [
      'Ch14: Investigated suspicious activity',
      'Ch13: Agreed to meet House Kael',
      'Ch12: Rejected military buildup'
    ]
  });
  
  console.log(`Battle created: ${battle.battleId}`);
  console.log(`Agents: ${battle.agents.map(a => a.agentId).join(', ')}`);
  console.log(`Deadline: ${new Date(battle.deadline).toISOString()}`);
  
  // Get agent stats
  const gpt4Stats = await orchestrator.getAgentStats('gpt-4');
  console.log(`GPT-4: ${gpt4Stats.battlesWon}/${gpt4Stats.totalBattles} wins`);
}
