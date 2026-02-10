import { useAccount, useReadContract } from 'wagmi'
import { CONTRACTS, ERC20_ABI, formatForge } from '@/lib/contracts'

/**
 * Hook to get user's $FORGE balance
 */
export function useForgeBalance() {
  const { address } = useAccount()

  const { data: balance, isLoading, refetch } = useReadContract({
    address: CONTRACTS.forgeToken,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  })

  return {
    balance: balance ? formatForge(balance) : '0',
    balanceRaw: balance || 0n,
    isLoading,
    refetch,
  }
}
