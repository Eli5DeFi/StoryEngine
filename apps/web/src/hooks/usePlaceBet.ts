import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { CONTRACTS, BETTING_POOL_ABI, ERC20_ABI, parseForge } from '@/lib/contracts'

/**
 * Hook to place a bet on a story choice
 */
export function usePlaceBet() {
  const { address } = useAccount()
  const [isApproving, setIsApproving] = useState(false)

  // Approve $FORGE spending
  const { writeContractAsync: approve } = useWriteContract()

  // Place bet
  const { 
    writeContract: placeBetWrite,
    data: placeBetHash,
    isPending: isPlacing,
    error: placeBetError,
  } = useWriteContract()

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: placeBetHash,
  })

  /**
   * Place a bet with automatic approval if needed
   */
  async function placeBet(params: {
    poolId: number
    choiceIndex: number
    amount: string
  }) {
    if (!address) throw new Error('Wallet not connected')

    const amountWei = parseForge(params.amount)

    // Step 1: Check if approval needed
    const { data: allowance } = await useReadContract({
      address: CONTRACTS.forgeToken,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [address, CONTRACTS.bettingPool],
    })

    // Step 2: Approve if needed
    if (!allowance || allowance < amountWei) {
      setIsApproving(true)
      try {
        const approveTx = await approve({
          address: CONTRACTS.forgeToken,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [CONTRACTS.bettingPool, amountWei],
        })
        
        // Wait for approval to confirm
        await waitForTransactionReceipt({ hash: approveTx })
      } catch (error) {
        setIsApproving(false)
        throw new Error('Approval failed: ' + (error as Error).message)
      }
      setIsApproving(false)
    }

    // Step 3: Place bet
    placeBetWrite({
      address: CONTRACTS.bettingPool,
      abi: BETTING_POOL_ABI,
      functionName: 'placeBet',
      args: [BigInt(params.poolId), BigInt(params.choiceIndex), amountWei],
    })
  }

  return {
    placeBet,
    isApproving,
    isPlacing,
    isConfirming,
    isSuccess,
    txHash: placeBetHash,
    error: placeBetError,
  }
}
