'use client'

import { useState, useMemo } from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, darkTheme, getDefaultConfig } from '@rainbow-me/rainbowkit'
import { baseSepolia } from 'wagmi/chains'
import { defineChain } from 'viem'
import '@rainbow-me/rainbowkit/styles.css'

// Define Anvil local chain
const anvilLocal = defineChain({
  id: 31337,
  name: 'Anvil Local',
  network: 'anvil',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
      webSocket: ['ws://127.0.0.1:8545'],
    },
    public: {
      http: ['http://127.0.0.1:8545'],
      webSocket: ['ws://127.0.0.1:8545'],
    },
  },
  blockExplorers: {
    default: { name: 'Anvil', url: '' },
  },
  testnet: true,
})

/** Stable wagmi config — defined once per module, safe to share */
const wagmiConfig = getDefaultConfig({
  appName: 'Voidborne',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'a3c3e8f5e8f3a7c5e8f3a7c5e8f3a7c5',
  chains: [anvilLocal, baseSepolia],
  ssr: false,
})

/** RainbowKit theme — memoised outside component to avoid re-creation on render */
const rainbowTheme = darkTheme({
  accentColor: '#d4a853',
  accentColorForeground: '#05060b',
  borderRadius: 'medium',
})

interface Web3ProviderProps {
  children: React.ReactNode
}

/**
 * Web3Provider
 *
 * Wraps the app with Wagmi + React Query + RainbowKit providers.
 *
 * Optimisations (this cycle):
 * - QueryClient moved into useState so React 18 Concurrent Mode + Strict Mode
 *   don't share state between renders / server and client hydration.
 * - wagmiConfig and rainbowTheme are module-level constants (safe — they don't
 *   capture component state) so they aren't re-created on every render.
 */
export function Web3Provider({ children }: Web3ProviderProps) {
  // Create QueryClient once per component instance (React 18 safe)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Reduces unnecessary refetches on window focus for blockchain data
            staleTime: 10_000, // 10s
            // Don't retry on 4xx — wallet not connected, user not found, etc.
            retry: (failureCount, error: unknown) => {
              const status = (error as { status?: number })?.status
              if (status && status >= 400 && status < 500) return false
              return failureCount < 2
            },
          },
        },
      })
  )

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={rainbowTheme}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
