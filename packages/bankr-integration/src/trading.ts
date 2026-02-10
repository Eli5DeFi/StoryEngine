import type { BankrClient } from './client';
import type { Chain } from './types';

/**
 * Trading utilities for automated market making and liquidity
 */
export class TradingManager {
  constructor(private client: BankrClient) {}

  /**
   * Set up DCA (Dollar Cost Averaging) for $FORGE accumulation
   */
  async setupDCA(params: {
    tokenAddress: string;
    amountPerPeriod: string;
    intervalHours: number;
    totalPeriods: number;
    chain?: Chain;
  }): Promise<void> {
    const chain = params.chain || 'base';
    const prompt = `set up DCA to buy ${params.amountPerPeriod} of token ${params.tokenAddress} every ${params.intervalHours} hours for ${params.totalPeriods} periods on ${chain}`;
    
    await this.client.prompt(prompt);
  }

  /**
   * Set limit order for $FORGE
   */
  async setLimitOrder(params: {
    tokenAddress: string;
    side: 'buy' | 'sell';
    price: string;
    amount: string;
    chain?: Chain;
  }): Promise<void> {
    const chain = params.chain || 'base';
    const action = params.side === 'buy' ? 'buy' : 'sell';
    const prompt = `set limit order to ${action} ${params.amount} of token ${params.tokenAddress} at $${params.price} on ${chain}`;
    
    await this.client.prompt(prompt);
  }

  /**
   * Set stop-loss for $FORGE position
   */
  async setStopLoss(params: {
    tokenAddress: string;
    triggerPrice: string;
    amount: string;
    chain?: Chain;
  }): Promise<void> {
    const chain = params.chain || 'base';
    const prompt = `set stop loss to sell ${params.amount} of token ${params.tokenAddress} if price drops to $${params.triggerPrice} on ${chain}`;
    
    await this.client.prompt(prompt);
  }

  /**
   * Query market data for $FORGE
   */
  async getMarketData(tokenAddress: string, chain: Chain = 'base'): Promise<any> {
    const result = await this.client.prompt(`show market data for token ${tokenAddress} on ${chain}`);
    return result;
  }

  /**
   * Get trading volume and liquidity metrics
   */
  async getLiquidityMetrics(tokenAddress: string, chain: Chain = 'base'): Promise<{
    volume24h: string;
    liquidity: string;
    priceChange24h: string;
  }> {
    const result = await this.client.prompt(`show liquidity and volume for token ${tokenAddress} on ${chain}`);
    
    // Parse response (mock for now)
    return {
      volume24h: '0',
      liquidity: '0',
      priceChange24h: '0',
    };
  }
}
