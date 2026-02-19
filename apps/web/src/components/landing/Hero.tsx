'use client'

import Link from 'next/link'

/**
 * Hero section for Voidborne landing page.
 * Static content — no client-side data fetching needed.
 * Removed mounted guard to prevent SSR flash and improve LCP.
 */
export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Primary Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A] via-[#1E1B3A] to-[#0F172A]" style={{ backgroundSize: '200% 200%' }} />
      
      {/* Ambient Strand Glow - Mesh Gradients */}
      <div className="absolute inset-0 opacity-40">
        <div 
          className="absolute w-[800px] h-[800px] top-1/4 left-1/4 animate-drift"
          style={{
            background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 60%)',
            animation: 'drift 25s ease-in-out infinite',
          }}
        />
        <div 
          className="absolute w-[600px] h-[600px] bottom-1/3 right-1/3 animate-drift"
          style={{
            background: 'radial-gradient(ellipse, rgba(167,139,250,0.08) 0%, transparent 60%)',
            animation: 'drift 20s ease-in-out infinite',
            animationDelay: '5s',
          }}
        />
        <div 
          className="absolute w-[700px] h-[700px] top-1/2 right-1/4 animate-drift"
          style={{
            background: 'radial-gradient(ellipse, rgba(245,158,11,0.06) 0%, transparent 50%)',
            animation: 'drift 22s ease-in-out infinite',
            animationDelay: '10s',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-24 text-center">
        {/* Section Marker - Institutional */}
        <div className="mb-12 animate-fadeIn" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '4px' }}>
          <div className="text-[10px] uppercase text-[#64748B] tracking-[4px] mb-6">
            The Grand Conclave
          </div>
          <div className="w-24 h-px mx-auto bg-gradient-to-r from-transparent via-[#64748B]/20 to-transparent" />
        </div>

        {/* Main Headline - Geometric Display Font */}
        <h1 className="font-display font-extrabold tracking-tight mb-8 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
          <span className="block text-[56px] sm:text-[72px] lg:text-[92px] text-[#F1F5F9]" style={{ letterSpacing: '-1px' }}>
            VØ<span className="text-[#64748B]">I</span>DBORNE
          </span>
          <span className="block text-[20px] sm:text-[24px] text-[#64748B] mt-4" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '6px' }}>
            THE SILENT THRONE
          </span>
        </h1>

        {/* Tagline */}
        <p className="text-lg sm:text-xl text-[#E2E8F0] max-w-3xl mx-auto mb-6 leading-relaxed animate-fadeIn" style={{ animationDelay: '0.2s' }}>
          Navigate deadly succession politics.
        </p>
        <p className="text-base sm:text-lg text-[#94A3B8] max-w-2xl mx-auto mb-12 leading-relaxed animate-fadeIn" style={{ animationDelay: '0.3s' }}>
          <span className="text-[#6366F1]">Bet USDC on which path shapes the narrative.</span><br />
          Five houses. Five agendas. <span className="text-[#F59E0B]">One choice.</span>
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
          <Link 
            href="/lore"
            className="group relative px-10 py-4 rounded-lg overflow-hidden transition-all duration-200 hover:scale-[1.02]"
            style={{
              background: 'rgba(30, 41, 59, 0.5)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              boxShadow: '0 0 30px rgba(99,102,241,0.15)',
            }}
          >
            <span className="relative text-lg font-semibold text-[#F1F5F9]">
              Explore the Lore
            </span>
          </Link>
          
          <Link 
            href="/story/voidborne-story"
            className="group relative px-10 py-4 rounded-lg overflow-hidden transition-all duration-200 hover:scale-[1.02]"
            style={{
              background: 'rgba(30, 41, 59, 0.5)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <span className="relative text-lg font-semibold text-[#E2E8F0]">
              Read the Story
            </span>
          </Link>
        </div>

        {/* Stats Grid - Glassmorphism Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto animate-fadeIn" style={{ animationDelay: '0.5s' }}>
          <StatsCard
            value="$127K"
            label="Total Wagered"
            strandColor="rgba(99,102,241,0.2)"
          />
          <StatsCard
            value="1,247"
            label="Active Bettors"
            strandColor="rgba(245,158,11,0.2)"
          />
          <StatsCard
            value="89%"
            label="Avg. Payout Rate"
            strandColor="rgba(167,139,250,0.2)"
          />
        </div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0F172A] to-transparent z-10" />
      
      <style jsx>{`
        @keyframes drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(20px, -10px) scale(1.05); }
          66% { transform: translate(-15px, 10px) scale(0.95); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
          opacity: 0;
        }
        
        .animate-drift {
          will-change: transform;
        }
      `}</style>
    </section>
  )
}

interface StatsCardProps {
  value: string
  label: string
  strandColor: string
}

function StatsCard({ value, label, strandColor }: StatsCardProps) {
  return (
    <div 
      className="group p-6 rounded-[14px] transition-all duration-200 hover:scale-[1.01]"
      style={{
        background: 'rgba(30, 41, 59, 0.5)',
        backdropFilter: 'blur(16px)',
        border: `1px solid ${strandColor}`,
        boxShadow: `0 0 20px ${strandColor.replace('0.2', '0.08')}`,
      }}
    >
      <div className="text-4xl font-display font-bold mb-2 tabular-nums text-[#F1F5F9]">
        {value}
      </div>
      <div 
        className="text-[10px] uppercase tracking-[3px] text-[#64748B]"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {label}
      </div>
    </div>
  )
}
