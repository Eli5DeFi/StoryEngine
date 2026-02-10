import { Hero } from '@/components/landing/Hero'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { TokenStats } from '@/components/landing/TokenStats'
import { FeaturedStories } from '@/components/landing/FeaturedStories'
import { PlatformMetrics } from '@/components/landing/PlatformMetrics'
import { Footer } from '@/components/landing/Footer'
import { Navbar } from '@/components/landing/Navbar'

export default function Home() {
  return (
    <main className="min-h-screen animated-bg">
      <Navbar />
      <Hero />
      <TokenStats />
      <HowItWorks />
      <PlatformMetrics />
      <FeaturedStories />
      <Footer />
    </main>
  )
}
