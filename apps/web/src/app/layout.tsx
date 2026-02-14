import type { Metadata } from 'next'
import { Cinzel, Space_Grotesk } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Providers } from '@/components/providers/Providers'
import './globals.css'

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-cinzel',
  display: 'swap',
  preload: true,
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-space-grotesk',
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://voidborne.vercel.app'),
  title: {
    default: 'Voidborne: The Silent Throne',
    template: '%s | Voidborne',
  },
  description: 'Navigate deadly succession politics. Bet USDC on which path shapes the narrative. Five houses. Five agendas. One choice.',
  keywords: ['AI stories', 'prediction market', 'betting', 'interactive fiction', 'web3', 'USDC', 'Base', 'space opera', 'political intrigue'],
  authors: [{ name: 'Voidborne' }],
  openGraph: {
    title: 'Voidborne: The Silent Throne',
    description: 'Bet on AI-generated narratives in a space political saga. Shape the story. Claim your share of the pot.',
    type: 'website',
    url: 'https://voidborne.ai',
    siteName: 'Voidborne',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Voidborne',
    description: 'The Silent Throne',
    creator: '@Eli5DeFi',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${cinzel.variable} ${spaceGrotesk.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-background text-foreground antialiased">
        <Providers>
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
