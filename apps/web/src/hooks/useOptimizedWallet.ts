import { useAccount, useBalance } from 'wagmi'
import { useMemo } from 'react'

/**
 * Optimized wallet hook with memoization
 * Reduces re-renders and improves performance
 */
export function useOptimizedWallet() {
  const { address, isConnected, isConnecting } = useAccount()
  
  const { data: balance, isLoading: isBalanceLoading } = useBalance({
    address,
    query: {
      enabled: isConnected && !!address,
      // Cache balance for 30 seconds
      staleTime: 30_000,
      // Keep in cache for 5 minutes
      gcTime: 300_000,
    },
  })

  // Memoize wallet state to prevent unnecessary re-renders
  const walletState = useMemo(
    () => ({
      address,
      isConnected,
      isConnecting,
      balance: balance?.formatted,
      symbol: balance?.symbol,
      isBalanceLoading,
    }),
    [address, isConnected, isConnecting, balance, isBalanceLoading]
  )

  return walletState
}
