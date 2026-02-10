import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NarrativeForge - Bet on AI Story Choices',
  description: 'The blockchain-integrated AI story generation platform where readers bet on which story branch the AI will choose next. Powered by $FORGE token.',
  keywords: ['AI stories', 'blockchain', 'betting', 'narrative', 'web3', 'interactive fiction'],
  authors: [{ name: 'NarrativeForge Team' }],
  openGraph: {
    title: 'NarrativeForge - Bet on AI Story Choices',
    description: 'Blockchain-integrated AI story generation platform',
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
    <html lang="en" className="dark">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
