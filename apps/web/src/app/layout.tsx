import type { Metadata } from 'next'
import { Cinzel, Space_Grotesk, Rajdhani } from 'next/font/google'
import { Providers } from '@/components/providers/Providers'
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
  title: 'Voidborne: The Silent Throne',
  description: 'Navigate deadly succession politics. Bet USDC on which path shapes the narrative. Five houses. Five agendas. One choice.',
  keywords: ['AI stories', 'prediction market', 'betting', 'interactive fiction', 'web3', 'USDC', 'Base', 'space opera', 'political intrigue'],
  authors: [{ name: 'Voidborne' }],
  openGraph: {
    title: 'Voidborne: The Silent Throne',
    description: 'Bet on AI-generated narratives in a space political saga. Shape the story. Claim your share of the pot.',
    type: 'website',
    url: 'https://voidborne.ai',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Voidborne',
    description: 'The Silent Throne',
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
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
