import { Navbar } from '@/components/landing/Navbar'
import { Hero } from '@/components/landing/Hero'
import { Story } from '@/components/landing/Story'
import { Mechanics } from '@/components/landing/Mechanics'
import { CTA } from '@/components/landing/CTA'
import { Footer } from '@/components/landing/Footer'
import { Starfield } from '@/components/effects/Starfield'
import { DustParticles } from '@/components/effects/DustParticles'

export default function Home() {
  return (
    <>
      {/* Ambient effects */}
      <Starfield />
      <DustParticles />
      
      {/* Navigation */}
      <Navbar />
      
      {/* Main content */}
      <main className="relative z-10">
        <Hero />
        <Story />
        <Mechanics />
        <CTA />
        <Footer />
      </main>
    </>
  )
}
