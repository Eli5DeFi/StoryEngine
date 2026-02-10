import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NarrativeForge - Bet on AI Story Choices',
  description: 'Prediction market meets interactive fiction. Bet USDC on AI story choices. Shape narratives. Win rewards.',
  keywords: ['AI stories', 'prediction market', 'betting', 'interactive fiction', 'web3', 'USDC', 'Base'],
  authors: [{ name: 'NarrativeForge Team' }],
  openGraph: {
    title: 'NarrativeForge - Bet on AI Story Choices',
    description: 'Prediction market meets interactive fiction. Bet USDC on AI-generated narratives.',
    type: 'website',
    url: 'https://narrativeforge.ai',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NarrativeForge',
    description: 'Bet on AI Story Choices',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
