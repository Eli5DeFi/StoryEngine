/**
 * /auction/[chapterId] — Single Chapter Auction Detail
 *
 * Shows full bid history, countdown, bid form, and
 * winner parameters for a specific blank chapter auction.
 */

import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { MOCK_AUCTIONS } from '@/lib/auction-data'

interface Props {
  params: { chapterId: string }
}

export const revalidate = 15

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const chapterNum = parseInt(params.chapterId, 10)
  const auction = MOCK_AUCTIONS.find((a) => a.chapterNumber === chapterNum)

  if (!auction) {
    return { title: 'Auction Not Found | Voidborne' }
  }

  return {
    title: `${auction.title} | Voidborne Auction House`,
    description: auction.description,
    openGraph: {
      title: auction.title,
      description: `${auction.status === 'active' ? '🔴 LIVE — ' : ''}Current bid: $${auction.currentBidUsdc.toLocaleString()} USDC. ${auction.description}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: auction.title,
      description: `Bid: $${auction.currentBidUsdc.toLocaleString()} USDC — Win narrative ownership + earn 10% of all bets`,
      creator: '@Eli5DeFi',
    },
  }
}

export function generateStaticParams() {
  return MOCK_AUCTIONS.map((a) => ({ chapterId: a.chapterNumber.toString() }))
}

// Lazy-load the heavy detail component
const AuctionDetailContent = dynamic(
  () =>
    import('@/components/auction/AuctionDetailContent').then((m) => ({
      default: m.AuctionDetailContent,
    })),
  { ssr: false }
)

export default function AuctionDetailPage({ params }: Props) {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24">
        <AuctionDetailContent chapterId={params.chapterId} />
      </div>
      <Footer />
    </main>
  )
}
