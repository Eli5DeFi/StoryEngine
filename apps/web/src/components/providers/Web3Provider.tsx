'use client'

import { ReactNode, useState, useEffect } from 'react'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { baseSepolia, base } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, getDefaultConfig, darkTheme } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'

// Lazy create config only on client side
let config: ReturnType<typeof getDefaultConfig> | null = null
let queryClient: QueryClient | null = null

function getConfig() {
  if (!config && typeof window !== 'undefined') {
    config = getDefaultConfig({
      appName: 'Voidborne',
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'a3c3e8f5e8f3a7c5e8f3a7c5e8f3a7c5',
      chains: [baseSepolia],
      transports: {
        [baseSepolia.id]: http('https://sepolia.base.org'),
      },
      ssr: false,
    })
  }
  return config!
}

function getQueryClient() {
  if (!queryClient && typeof window !== 'undefined') {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false,
        },
      },
    })
  }
  return queryClient!
}

export function Web3Provider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <WagmiProvider config={getConfig()}>
      <QueryClientProvider client={getQueryClient()}>
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
