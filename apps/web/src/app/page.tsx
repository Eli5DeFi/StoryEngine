import dynamic from 'next/dynamic'
import { Navbar } from '@/components/landing/Navbar'
import { Hero } from '@/components/landing/Hero'
import { Footer } from '@/components/landing/Footer'

// Lazy load below-fold components for faster initial page load
const FeaturedStories = dynamic(() => import('@/components/landing/FeaturedStories').then(mod => ({ default: mod.FeaturedStories })), {
  loading: () => <div className="h-96 animate-pulse bg-muted" />,
  ssr: false,
})

const HowItWorks = dynamic(() => import('@/components/landing/HowItWorks').then(mod => ({ default: mod.HowItWorks })), {
  loading: () => <div className="h-96 animate-pulse bg-muted" />,
  ssr: false,
})

const AgentIntegration = dynamic(() => import('@/components/landing/AgentIntegration').then(mod => ({ default: mod.AgentIntegration })), {
  loading: () => <div className="h-96 animate-pulse bg-muted" />,
  ssr: false,
})

// Enable static generation for landing page
export const dynamic = 'force-static'
export const revalidate = 3600 // Revalidate every hour

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <FeaturedStories />
      <HowItWorks />
      <AgentIntegration />
      <Footer />
    </main>
  )
}
