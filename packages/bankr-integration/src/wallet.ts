import type { BankrClient } from './client';
import type { Chain, WalletBalance } from './types';

/**
 * Wallet management utilities
 */
export class WalletManager {
  constructor(private client: BankrClient) {}

  /**
   * Get wallet address for specific chain
   */
  async getAddress(chain: Chain = 'base'): Promise<string> {
    return this.client.getWalletAddress(chain);
  }

  /**
   * Get all wallet balances
   */
  async getAllBalances(): Promise<WalletBalance[]> {
    const result = await this.client.getBalances();
    
    // Parse balances from response
    // In real implementation, this would parse structured data
    return [];
  }

  /**
   * Get balance for specific token
   */
  async getTokenBalance(tokenAddress: string, chain: Chain = 'base'): Promise<string> {
    const result = await this.client.prompt(`what is my balance of token ${tokenAddress} on ${chain}?`);
    
    // Parse balance from response
    const balanceMatch = result.response.match(/([\d,]+\.?\d*)/);
    if (!balanceMatch) {
      throw new Error(`Could not parse balance from response: ${result.response}`);
    }
    
    return balanceMatch[1].replace(',', '');
  }

  /**
   * Get ETH balance on specific chain
   */
  async getETHBalance(chain: Chain = 'base'): Promise<string> {
    const result = await this.client.prompt(`what is my ETH balance on ${chain}?`);
    
    // Parse balance
    const balanceMatch = result.response.match(/([\d,]+\.?\d*)/);
    if (!balanceMatch) {
      throw new Error(`Could not parse ETH balance from response: ${result.response}`);
    }
    
    return balanceMatch[1].replace(',', '');
  }

  /**
   * Transfer tokens
   */
  async transfer(params: {
    to: string;
    amount: string;
    tokenAddress?: string;
    chain?: Chain;
  }): Promise<void> {
    const chain = params.chain || 'base';
    const asset = params.tokenAddress 
      ? `token ${params.tokenAddress}` 
      : 'ETH';
    
    const prompt = `send ${params.amount} ${asset} to ${params.to} on ${chain}`;
    await this.client.prompt(prompt);
  }

  /**
   * Check if wallet has sufficient balance
   */
  async hasSufficientBalance(params: {
    amount: string;
    tokenAddress?: string;
    chain?: Chain;
  }): Promise<boolean> {
    const balance = params.tokenAddress
      ? await this.getTokenBalance(params.tokenAddress, params.chain)
      : await this.getETHBalance(params.chain);
    
    return parseFloat(balance) >= parseFloat(params.amount);
  }
}
