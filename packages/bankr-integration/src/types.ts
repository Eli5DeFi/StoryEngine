import { z } from 'zod';

/**
 * Supported chains for NarrativeForge
 */
export const ChainSchema = z.enum(['base', 'ethereum', 'polygon', 'unichain', 'solana']);
export type Chain = z.infer<typeof ChainSchema>;

/**
 * $FORGE token metadata
 */
export interface ForgeToken {
  address: string;
  chain: Chain;
  symbol: string;
  name: string;
  decimals: number;
  totalSupply: string;
  tradingVolume24h: string;
  priceUSD: string;
  marketCap: string;
  holders: number;
}

/**
 * Bankr client configuration
 */
export interface BankrConfig {
  apiKey?: string;          // For Agent API mode
  privateKey?: string;      // For SDK mode (self-custody)
  baseUrl?: string;         // Defaults to https://api.bankr.bot
  chain?: Chain;            // Default chain
}

/**
 * Trading prompt result
 */
export interface PromptResult {
  response: string;
  transactions?: {
    to: string;
    data: string;
    value: string;
    chainId: number;
  }[];
  status: 'completed' | 'pending' | 'failed';
  jobId?: string;
}

/**
 * Token launch parameters
 */
export interface TokenLaunchParams {
  name: string;
  symbol: string;
  chain: Chain;
  initialSupply?: string;   // Optional, defaults to 1B
  metadata?: {
    description?: string;
    image?: string;
    website?: string;
    twitter?: string;
  };
}

/**
 * Wallet balance
 */
export interface WalletBalance {
  chain: Chain;
  token: string;
  symbol: string;
  balance: string;
  balanceUSD: string;
}

/**
 * Trading fees earned
 */
export interface TradingFees {
  token: string;
  chain: Chain;
  totalFeesUSD: string;
  fees24h: string;
  trades24h: number;
  lastUpdated: Date;
}
