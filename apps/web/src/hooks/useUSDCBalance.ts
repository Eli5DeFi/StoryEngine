import { useAccount, useReadContract } from 'wagmi'
import { CONTRACTS, ERC20_ABI, formatUSDC } from '@/lib/contracts'

/**
 * Hook to get user's USDC balance
 */
export function useUSDCBalance() {
  const { address } = useAccount()

  const { data: balance, isLoading, refetch } = useReadContract({
    address: CONTRACTS.usdc,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!CONTRACTS.usdc,
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  })

  return {
    balance: balance ? formatUSDC(balance) : '0.00',
    balanceRaw: balance || 0n,
    isLoading,
    refetch,
  }
}
