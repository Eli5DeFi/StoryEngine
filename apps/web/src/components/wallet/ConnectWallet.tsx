'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Wallet } from 'lucide-react'

/**
 * Custom wallet connect button with NarrativeForge styling
 */
export function ConnectWallet() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading'
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === 'authenticated')

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-colors"
                  >
                    <Wallet className="w-5 h-5" />
                    Connect Wallet
                  </button>
                )
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
                  >
                    Wrong Network
                  </button>
                )
              }

              return (
                <div className="flex items-center gap-3">
                  {/* Chain selector */}
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-lg hover:bg-accent transition-colors"
                  >
                    {chain.hasIcon && chain.iconUrl && (
                      <img
                        alt={chain.name ?? 'Chain icon'}
                        src={chain.iconUrl}
                        className="w-5 h-5"
                      />
                    )}
                    <span className="text-sm font-medium">{chain.name}</span>
                  </button>

                  {/* Account */}
                  <button
                    onClick={openAccountModal}
                    type="button"
                    className="flex items-center gap-3 px-4 py-2 bg-background border border-border rounded-lg hover:bg-accent transition-colors"
                  >
                    <span className="text-sm font-medium">{account.displayName}</span>
                    {account.displayBalance && (
                      <span className="text-sm text-foreground/60">
                        {account.displayBalance}
                      </span>
                    )}
                  </button>
                </div>
              )
            })()}
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
}
