/**
 * Create Guild Page — /guilds/create
 *
 * Multi-step guild creation flow:
 *   Step 1: Choose House alignment (visual card picker)
 *   Step 2: Name + tag + description
 *   Step 3: Review + confirm (requires wallet connection)
 *
 * Innovation Cycle #52 — "The Faction War Engine"
 */

import { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'

const CreateGuildForm = dynamic(
  () =>
    import('@/components/guilds/CreateGuildForm').then((m) => ({
      default: m.CreateGuildForm,
    })),
  {
    loading: () => (
      <div className="max-w-2xl mx-auto px-4 py-24 flex items-center justify-center">
        <div className="text-void-400 font-ui text-sm animate-pulse">
          Loading guild creator...
        </div>
      </div>
    ),
    ssr: false,
  }
)

export const metadata: Metadata = {
  title: 'Found a Guild | Voidborne',
  description:
    'Create a Narrative Guild. Choose your House. Set your banner. Recruit members. Claim territory.',
  openGraph: {
    title: 'Found a Guild | Voidborne',
    description: 'Unite bettors under one banner. Control the story.',
  },
}

export default function CreateGuildPage() {
  return (
    <main className="min-h-screen bg-[#05060b]">
      <Navbar />
      <CreateGuildForm />
      <Footer />
    </main>
  )
}
