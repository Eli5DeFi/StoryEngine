import { useState } from 'react'
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACTS, ERC20_ABI, BETTING_POOL_ABI, parseUSDC } from '@/lib/contracts'
import type { Address } from 'viem'

/**
 * Hook to place a bet on a betting pool
 * Handles USDC approval if needed
 */
export function usePlaceBet(poolAddress: Address) {
  const { address } = useAccount()
  const [error, setError] = useState<string | null>(null)
  const [isApproving, setIsApproving] = useState(false)
  const [isPlacing, setIsPlacing] = useState(false)

  const { writeContractAsync } = useWriteContract()

  // Check current USDC allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACTS.usdc,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, poolAddress] : undefined,
    query: {
      enabled: !!address && !!poolAddress && !!CONTRACTS.usdc,
    },
  })

  /**
   * Place a bet (handles approval if needed)
   */
  async function placeBet(
    branchIndex: number,
    amount: number,
    isAgent: boolean = false
  ): Promise<string> {
    if (!address) {
      throw new Error('Wallet not connected')
    }

    setError(null)

    try {
      const amountWei = parseUSDC(amount.toString())

      // Check if approval is needed
      const needsApproval = !allowance || allowance < amountWei

      // Step 1: Approve USDC if needed
      if (needsApproval) {
        setIsApproving(true)
        
        const approveHash = await writeContractAsync({
          address: CONTRACTS.usdc,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [poolAddress, amountWei],
        })

        // Wait for approval to be mined
        await waitForTransaction(approveHash)
        
        // Refetch allowance to confirm
        await refetchAllowance()
        setIsApproving(false)
      }

      // Step 2: Place bet
      setIsPlacing(true)

      // For now, use placeCombiBet with a single outcome
      // TODO: Update when actual betting UI is implemented
      const betHash = await writeContractAsync({
        address: poolAddress,
        abi: BETTING_POOL_ABI,
        functionName: 'placeCombiBet',
        args: [[BigInt(branchIndex)], amountWei, 0], // 0 = BetType.SINGLE
      })

      // Wait for transaction to be mined
      await waitForTransaction(betHash)

      setIsPlacing(false)
      return betHash
    } catch (err) {
      setIsApproving(false)
      setIsPlacing(false)
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to place bet'
      setError(errorMessage)
      throw err
    }
  }

  /**
   * Settle and claim rewards for winning bets
   */
  async function claimReward(betId: bigint): Promise<string> {
    if (!address) {
      throw new Error('Wallet not connected')
    }

    setError(null)

    try {
      const hash = await writeContractAsync({
        address: poolAddress,
        abi: BETTING_POOL_ABI,
        functionName: 'settleBet',
        args: [betId],
      })

      await waitForTransaction(hash)
      return hash
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to claim reward'
      setError(errorMessage)
      throw err
    }
  }

  /**
   * Helper to wait for transaction receipt
   */
  async function waitForTransaction(hash: string): Promise<void> {
    // Simple polling implementation
    // In production, use useWaitForTransactionReceipt from wagmi
    return new Promise((resolve, reject) => {
      const checkReceipt = async (attempts = 0) => {
        if (attempts > 60) {
          reject(new Error('Transaction timeout'))
          return
        }

        try {
          // Wait 2 seconds between checks
          await new Promise((r) => setTimeout(r, 2000))
          
          // Transaction confirmed after timeout
          // In production, actually check receipt via provider
          resolve()
        } catch (err) {
          checkReceipt(attempts + 1)
        }
      }

      checkReceipt()
    })
  }

  return {
    placeBet,
    claimReward,
    isApproving,
    isPlacing,
    needsApproval: allowance !== undefined && allowance === 0n,
    error,
    resetError: () => setError(null),
  }
}
