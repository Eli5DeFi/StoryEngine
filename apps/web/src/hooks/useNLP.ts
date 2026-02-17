/**
 * React Hooks for Narrative Liquidity Pools (NLP)
 * 
 * Provides easy-to-use hooks for interacting with the NLP system.
 * Handles connection, transactions, and real-time state updates.
 * 
 * @author Voidborne Team (Innovation Cycle #46)
 * @version 1.0.0
 */

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { NarrativeLiquidityPoolClient } from '@/lib/nlp/client';
import type { PoolState, SwapQuote, LiquidityPosition } from '@/lib/nlp/client';

// ============ CONFIGURATION ============

const NLP_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NLP_CONTRACT_ADDRESS || '';

// ============ HOOKS ============

/**
 * Main NLP hook - provides client instance and connection status
 */
export function useNLP() {
  const { address, isConnected } = useAccount();
  // wagmi v2: useWalletClient replaces useSigner; cast to ethers Signer shape
  const { data: walletClient } = useWalletClient();
  const [client, setClient] = useState<NarrativeLiquidityPoolClient | null>(null);

  useEffect(() => {
    if (walletClient && NLP_CONTRACT_ADDRESS) {
      // wagmi v2 walletClient bridges to ethers v5 Signer at runtime
      // @ts-ignore - cross-version compatibility: wagmi v2 WalletClient → ethers v5 Signer
      setClient(new NarrativeLiquidityPoolClient(NLP_CONTRACT_ADDRESS, walletClient));
    } else {
      setClient(null);
    }
  }, [walletClient]);

  return {
    client,
    address,
    isConnected,
    contractAddress: NLP_CONTRACT_ADDRESS,
  };
}

/**
 * Hook for fetching and managing pool state
 */
export function usePoolState(chapterId: number, numOutcomes: number) {
  const { client } = useNLP();
  const [poolState, setPoolState] = useState<PoolState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!client) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const state = await client.getPoolState(chapterId, numOutcomes);
      setPoolState(state);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [client, chapterId, numOutcomes]);

  useEffect(() => {
    refetch();

    // Auto-refetch every 10 seconds
    const interval = setInterval(refetch, 10_000);
    return () => clearInterval(interval);
  }, [refetch]);

  return { poolState, loading, error, refetch };
}

/**
 * Hook for getting swap quotes
 */
export function useSwapQuote(
  chapterId: number,
  fromOutcome: number,
  toOutcome: number,
  amountIn: string
) {
  const { client } = useNLP();
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchQuote = useCallback(async () => {
    if (!client || !amountIn || parseFloat(amountIn) <= 0) {
      setQuote(null);
      return;
    }

    try {
      setLoading(true);
      const result = await client.getSwapQuote(chapterId, fromOutcome, toOutcome, amountIn);
      setQuote(result);
      setError(null);
    } catch (err) {
      setError(err as Error);
      setQuote(null);
    } finally {
      setLoading(false);
    }
  }, [client, chapterId, fromOutcome, toOutcome, amountIn]);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  return { quote, loading, error, refetch: fetchQuote };
}

/**
 * Hook for managing user's liquidity positions
 */
export function useLPPositions(chapterId: number, numOutcomes: number) {
  const { client, address } = useNLP();
  const [positions, setPositions] = useState<LiquidityPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!client || !address) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await client.getUserPositions(chapterId, numOutcomes, address);
      setPositions(result);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [client, address, chapterId, numOutcomes]);

  useEffect(() => {
    refetch();

    // Auto-refetch every 15 seconds
    const interval = setInterval(refetch, 15_000);
    return () => clearInterval(interval);
  }, [refetch]);

  return { positions, loading, error, refetch };
}

/**
 * Hook for executing swap transactions
 */
export function useSwap() {
  const { client } = useNLP();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const swap = useCallback(
    async (
      chapterId: number,
      fromOutcome: number,
      toOutcome: number,
      amountIn: string,
      slippageTolerance: number = 0.5
    ) => {
      if (!client) throw new Error('NLP client not initialized');

      try {
        setLoading(true);
        setError(null);
        setTxHash(null);

        const receipt = await client.swapPosition(
          chapterId,
          fromOutcome,
          toOutcome,
          amountIn,
          slippageTolerance
        );

        setTxHash(receipt.transactionHash);
        return receipt;
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client]
  );

  return { swap, loading, error, txHash };
}

/**
 * Hook for adding liquidity
 */
export function useAddLiquidity() {
  const { client } = useNLP();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const addLiquidity = useCallback(
    async (chapterId: number, outcomeId: number, amountUSDC: string) => {
      if (!client) throw new Error('NLP client not initialized');

      try {
        setLoading(true);
        setError(null);
        setTxHash(null);

        const receipt = await client.addLiquidity(chapterId, outcomeId, amountUSDC);
        setTxHash(receipt.transactionHash);
        return receipt;
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client]
  );

  return { addLiquidity, loading, error, txHash };
}

/**
 * Hook for removing liquidity
 */
export function useRemoveLiquidity() {
  const { client } = useNLP();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const removeLiquidity = useCallback(
    async (chapterId: number, outcomeId: number, lpTokens: string) => {
      if (!client) throw new Error('NLP client not initialized');

      try {
        setLoading(true);
        setError(null);
        setTxHash(null);

        const receipt = await client.removeLiquidity(chapterId, outcomeId, lpTokens);
        setTxHash(receipt.transactionHash);
        return receipt;
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client]
  );

  return { removeLiquidity, loading, error, txHash };
}

/**
 * Hook for checking if betting is still open
 */
export function useBettingStatus(chapterId: number) {
  const { client } = useNLP();
  const [isOpen, setIsOpen] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!client) return;

    const check = async () => {
      try {
        const [open, remaining] = await Promise.all([
          client.isBettingOpen(chapterId),
          client.getTimeRemaining(chapterId),
        ]);
        setIsOpen(open);
        setTimeRemaining(remaining);
      } catch (err) {
        console.error('Error checking betting status:', err);
      } finally {
        setLoading(false);
      }
    };

    check();

    // Update every second for countdown
    const interval = setInterval(check, 1_000);
    return () => clearInterval(interval);
  }, [client, chapterId]);

  const formatted = client?.formatTimeRemaining(timeRemaining) || 'Betting closed';

  return { isOpen, timeRemaining, formatted, loading };
}

/**
 * Hook for claiming winnings
 */
export function useClaimWinnings() {
  const { client } = useNLP();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const claim = useCallback(
    async (chapterId: number) => {
      if (!client) throw new Error('NLP client not initialized');

      try {
        setLoading(true);
        setError(null);
        setTxHash(null);

        const receipt = await client.claimWinnings(chapterId);
        setTxHash(receipt.transactionHash);
        return receipt;
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client]
  );

  return { claim, loading, error, txHash };
}
