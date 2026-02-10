'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Wallet } from 'lucide-react'
import { USDCBalance } from './USDCBalance'

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
                    className="btn-primary"
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
                    className="inline-flex items-center gap-2 px-6 py-3 bg-error text-background font-ui font-semibold rounded-lg hover:bg-error/90 transition-colors duration-600"
                  >
                    Wrong Network
                  </button>
                )
              }

              return (
                <div className="flex items-center gap-3">
                  {/* USDC Balance */}
                  <USDCBalance />

                  {/* Chain selector */}
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="glass-card px-4 py-2 rounded-lg hover:bg-white/5 transition-colors duration-600"
                  >
                    <div className="flex items-center gap-2">
                      {chain.hasIcon && chain.iconUrl && (
                        <img
                          alt={chain.name ?? 'Chain icon'}
                          src={chain.iconUrl}
                          className="w-5 h-5"
                        />
                      )}
                      <span className="text-sm font-ui font-medium text-foreground">{chain.name}</span>
                    </div>
                  </button>

                  {/* Account */}
                  <button
                    onClick={openAccountModal}
                    type="button"
                    className="glass-card px-4 py-2 rounded-lg hover:bg-white/5 transition-colors duration-600"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-ui font-medium text-gold">{account.displayName}</span>
                      {account.displayBalance && (
                        <span className="text-sm text-void-400 font-ui tabular-nums">
                          {account.displayBalance}
                        </span>
                      )}
                    </div>
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
