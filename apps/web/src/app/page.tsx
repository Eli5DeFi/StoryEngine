import dynamicImport from 'next/dynamic'
import { Navbar } from '@/components/landing/Navbar'
import { Hero } from '@/components/landing/Hero'
import { SixStrands } from '@/components/landing/SixStrands'
import { Protocols } from '@/components/landing/Protocols'
import { Footer } from '@/components/landing/Footer'

// Lazy load below-fold components for faster initial page load
const FeaturedStories = dynamicImport(() => import('@/components/landing/FeaturedStories').then(mod => ({ default: mod.FeaturedStories })), {
  loading: () => <div className="h-96 animate-pulse bg-muted" />,
  ssr: false,
})

const HowItWorks = dynamicImport(() => import('@/components/landing/HowItWorks').then(mod => ({ default: mod.HowItWorks })), {
  loading: () => <div className="h-96 animate-pulse bg-muted" />,
  ssr: false,
})

// Enable static generation for landing page
export const dynamic = 'force-static'
export const revalidate = 3600 // Revalidate every hour

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black">
      <Navbar />
      <Hero />
      <SixStrands />
      <Protocols />
      <FeaturedStories />
      <HowItWorks />
      <Footer />
    </main>
  )
}
