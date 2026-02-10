import { Navbar } from '@/components/landing/Navbar'
import { Hero } from '@/components/landing/Hero'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { FeaturedStories } from '@/components/landing/FeaturedStories'
import { AgentIntegration } from '@/components/landing/AgentIntegration'
import { Footer } from '@/components/landing/Footer'

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
