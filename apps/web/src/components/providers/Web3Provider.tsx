'use client'

import { ReactNode } from 'react'
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

const config = getDefaultConfig({
  appName: 'Voidborne',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'a3c3e8f5e8f3a7c5e8f3a7c5e8f3a7c5',
  chains: [anvilLocal, baseSepolia],
  ssr: false,
})

const queryClient = new QueryClient()

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme({
          accentColor: '#d4a853',
          accentColorForeground: '#05060b',
          borderRadius: 'medium',
        })}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
