import { BankrClient as BankrSDK } from '@bankr/sdk';
import type { BankrConfig, Chain, PromptResult } from './types';

/**
 * NarrativeForge Bankr Client
 * 
 * Wrapper around @bankr/sdk with NarrativeForge-specific methods
 */
export class BankrClient {
  private sdk: BankrSDK;
  private config: Required<BankrConfig>;

  constructor(config: BankrConfig) {
    this.config = {
      apiKey: config.apiKey || process.env.BANKR_API_KEY || '',
      privateKey: config.privateKey || process.env.BANKR_PRIVATE_KEY || '',
      baseUrl: config.baseUrl || 'https://api.bankr.bot',
      chain: config.chain || 'base',
    };

    if (!this.config.privateKey && !this.config.apiKey) {
      throw new Error('BankrClient requires either privateKey or apiKey');
    }

    this.sdk = new BankrSDK({
      privateKey: this.config.privateKey,
      baseUrl: this.config.baseUrl,
    });
  }

  /**
   * Execute a natural language prompt via Bankr agent
   */
  async prompt(promptText: string): Promise<PromptResult> {
    try {
      const result = await this.sdk.promptAndWait({
        prompt: promptText,
      });

      return {
        response: result.response,
        transactions: result.transactions,
        status: result.status || 'completed',
      };
    } catch (error) {
      console.error('Bankr prompt failed:', error);
      throw new Error(`Bankr prompt failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get wallet address for the configured chain
   */
  async getWalletAddress(chain?: Chain): Promise<string> {
    const targetChain = chain || this.config.chain;
    const result = await this.prompt(`what is my ${targetChain} wallet address?`);
    
    // Parse address from response
    const addressMatch = result.response.match(/0x[a-fA-F0-9]{40}/);
    if (!addressMatch) {
      throw new Error(`Could not parse wallet address from response: ${result.response}`);
    }
    
    return addressMatch[0];
  }

  /**
   * Get wallet balances across all chains
   */
  async getBalances(): Promise<any> {
    const result = await this.prompt('what are my balances?');
    return result;
  }

  /**
   * Get token price
   */
  async getPrice(token: string, chain?: Chain): Promise<string> {
    const targetChain = chain || this.config.chain;
    const result = await this.prompt(`what is the price of ${token} on ${targetChain}?`);
    
    // Parse price from response
    const priceMatch = result.response.match(/\$?([\d,]+\.?\d*)/);
    if (!priceMatch) {
      throw new Error(`Could not parse price from response: ${result.response}`);
    }
    
    return priceMatch[1].replace(',', '');
  }

  /**
   * Check if Bankr skill is installed
   */
  static async checkInstallation(): Promise<boolean> {
    try {
      // Try to import @bankr/sdk
      await import('@bankr/sdk');
      return true;
    } catch {
      return false;
    }
  }
}
