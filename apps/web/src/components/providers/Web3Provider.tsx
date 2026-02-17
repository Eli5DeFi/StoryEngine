'use client'

import { ReactNode, useState } from 'react'
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

/** Module-level wagmi config (stable, never recreated) */
const wagmiConfig = getDefaultConfig({
  appName: 'Voidborne',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'a3c3e8f5e8f3a7c5e8f3a7c5e8f3a7c5',
  chains: [anvilLocal, baseSepolia],
  ssr: false,
})

/**
 * Web3Provider wraps wagmi + react-query + RainbowKit.
 *
 * QueryClient is created with useState so React guarantees a stable
 * instance per component tree, avoiding the "new client on every render"
 * pitfall when the provider is used inside Strict Mode or fast-refresh.
 */
export function Web3Provider({ children }: { children: ReactNode }) {
  // useState ensures a single QueryClient per provider instance
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Keep stale data for 60 s before background refetch
            staleTime: 60_000,
            // Retry failed queries up to 2 times
            retry: 2,
          },
        },
      })
  )

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#d4a853',
            accentColorForeground: '#05060b',
            borderRadius: 'medium',
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
