import type { Metadata } from 'next'
import { Cinzel, Space_Grotesk, Rajdhani } from 'next/font/google'
import './globals.css'

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '600', '700', '900'],
  variable: '--font-cinzel',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-rajdhani',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'NarrativeForge - Ruins of the Future',
  description: 'Prediction market meets interactive fiction. Bet USDC on AI story choices. Shape narratives. Win rewards.',
  keywords: ['AI stories', 'prediction market', 'betting', 'interactive fiction', 'web3', 'USDC', 'Base', 'parimutuel'],
  authors: [{ name: 'NarrativeForge' }],
  openGraph: {
    title: 'NarrativeForge - Ruins of the Future',
    description: 'Bet on AI-generated narratives. Shape the story. Claim your share of the pot.',
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
    <html lang="en" className={`${cinzel.variable} ${spaceGrotesk.variable} ${rajdhani.variable}`}>
      <body className="bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  )
}
