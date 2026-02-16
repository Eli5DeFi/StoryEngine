import Link from 'next/link';
import { HOUSES, PROTOCOLS, PROTAGONISTS } from '@/content/lore';
import { HouseCard } from '@/components/lore/HouseCard';
import { ProtocolCard } from '@/components/lore/ProtocolCard';

export const metadata = {
  title: 'Voidborne: The Silent Throne - Lore',
  description: 'Explore the universe, houses, protocols, and characters of Voidborne',
};

export default function LorePage() {
  return (
    <main className="min-h-screen bg-[#0F172A]">
      {/* Ambient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A] via-[#1E1B3A] to-[#0F172A]" />
        <div 
          className="absolute w-[800px] h-[800px] top-1/4 left-1/4 opacity-20"
          style={{
            background: 'radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, transparent 60%)',
            animation: 'drift 25s ease-in-out infinite',
          }}
        />
        <div 
          className="absolute w-[600px] h-[600px] bottom-1/3 right-1/3 opacity-20"
          style={{
            background: 'radial-gradient(ellipse, rgba(167,139,250,0.1) 0%, transparent 60%)',
            animation: 'drift 20s ease-in-out infinite',
            animationDelay: '5s',
          }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-6 sm:px-8 lg:px-12 py-24">
        {/* Hero Section */}
        <div className="mb-16 text-center animate-fadeIn">
          <div className="mb-8" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '4px' }}>
            <div className="text-[10px] uppercase text-[#64748B] tracking-[4px] mb-6">
              The Grand Conclave
            </div>
            <div className="w-24 h-px mx-auto bg-gradient-to-r from-transparent via-[#64748B]/20 to-transparent" />
          </div>
          
          <h1 className="font-display font-extrabold text-[56px] sm:text-[72px] text-[#F1F5F9] mb-6" style={{ letterSpacing: '-1px' }}>
            VØ<span className="text-[#64748B]">I</span>DBORNE
          </h1>
          
          <p className="max-w-3xl mx-auto text-lg sm:text-xl text-[#E2E8F0] leading-relaxed mb-4">
            A space political sci-fi visual novel where humanity has fractured across seven sovereign Houses.
          </p>
          
          <p className="max-w-2xl mx-auto text-base text-[#94A3B8] leading-relaxed">
            Those who manipulate the Lattice gain powers that look like magic but operate through a deeper physics 
            no one fully understands.
          </p>
        </div>

        {/* Story Background Section */}
        <section 
          className="mb-16 rounded-[20px] p-8 sm:p-12 animate-fadeIn"
          style={{
            background: 'rgba(30, 41, 59, 0.5)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            boxShadow: '0 0 40px rgba(99,102,241,0.15)',
            animationDelay: '0.1s',
          }}
        >
          <div className="mb-8">
            <h2 
              className="text-[12px] uppercase tracking-[3px] text-[#64748B] mb-4"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              The Story
            </h2>
            <h3 className="font-display text-4xl font-bold text-[#F1F5F9] mb-6">
              The Silent Throne
            </h3>
          </div>

          <div className="space-y-6 text-[#E2E8F0] leading-relaxed">
            <p className="text-lg">
              <span className="text-[#6366F1] font-bold">The Fracturing</span> — a series of catastrophic interstellar wars — 
              ended 247 years ago when three Nodes were deliberately destroyed, killing 40 billion people in an instant. 
              The surviving human civilizations, scattered across dozens of star systems, formed the{' '}
              <span className="text-[#F59E0B] font-semibold">Covenant</span>: a fragile treaty enforced by mutual terror.
            </p>

            <p>
              Seven Great Houses emerged from the ashes, each controlling key sectors of space and mastering different 
              aspects of <span className="text-[#A78BFA] font-semibold">Resonance</span> — the manipulation of the Lattice, 
              an invisible fabric underlying reality itself. To most, Resonance appears as sorcery. To practitioners, 
              it's a science no one fully comprehends.
            </p>

            <div 
              className="my-8 p-6 rounded-lg"
              style={{
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
              }}
            >
              <p className="text-[#6366F1] italic text-center text-lg">
                "No House shall Fracture a Node, and no House shall monopolize the Resonants."
              </p>
              <p className="text-[#64748B] text-center text-sm mt-2" style={{ fontFamily: 'var(--font-mono)' }}>
                — THE COVENANT, ARTICLE I
              </p>
            </div>

            <p>
              For two centuries, the Covenant held. But the{' '}
              <span className="text-[#22C55E] font-semibold">Regent of the Silent Throne</span> — humanity's nominal ruler — 
              has died without a clear successor. The throne sits empty. The Houses circle like predators.
            </p>

            <p>
              You are a <span className="font-semibold">Resonant</span>, one of the rare few who can touch the Lattice. 
              Your choices will determine which House rises, which alliances form, and whether the Covenant survives — 
              or whether humanity tears itself apart in a second Fracturing.
            </p>

            <p className="text-[#94A3B8] border-l-2 border-[#6366F1] pl-4">
              Every decision you make shapes the narrative. Every bet you place determines which path the story follows. 
              In Voidborne, <span className="text-[#F1F5F9] font-semibold">you don't just read the story — you control it</span>.
            </p>
          </div>
        </section>

        {/* Key Concepts Section */}
        <section className="mb-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <ConceptCard
            icon="🌌"
            title="The Lattice"
            description="An invisible quantum field permeating all of space. Resonants can manipulate it to achieve seemingly impossible feats — teleportation, matter transmutation, precognition."
            color="rgba(99, 102, 241, 0.2)"
            delay="0.2s"
          />
          <ConceptCard
            icon="⚡"
            title="Resonance"
            description="The art and science of Lattice manipulation. Fourteen known Protocols exist, each a different approach to harnessing the same underlying force."
            color="rgba(167, 139, 250, 0.2)"
            delay="0.3s"
          />
          <ConceptCard
            icon="💎"
            title="Nodes"
            description="Massive Lattice concentrations anchoring human civilization. Three were destroyed in the Fracturing. The remaining Nodes are the most valuable — and dangerous — assets in known space."
            color="rgba(245, 158, 11, 0.2)"
            delay="0.4s"
          />
        </section>
        
        {/* Houses Section */}
        <section className="mb-16">
          <div className="mb-8">
            <h2 
              className="text-[12px] uppercase tracking-[3px] text-[#64748B] mb-2"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              The Powers
            </h2>
            <h3 className="font-display text-3xl font-bold text-[#F1F5F9]">The Seven Houses</h3>
            <p className="mt-2 text-[#94A3B8]">
              The political powers of the Covenant
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-6">
            {HOUSES.slice(0, 6).map(house => (
              <HouseCard key={house.id} house={house} />
            ))}
          </div>
          {HOUSES.length > 6 && (
            <div className="text-center">
              <Link
                href="/lore/houses-dynamic"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all hover:scale-[1.02]"
                style={{
                  background: 'rgba(99, 102, 241, 0.2)',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                  color: '#6366F1',
                }}
              >
                View All {HOUSES.length} Houses →
              </Link>
            </div>
          )}
        </section>
        
        {/* Protocols Section */}
        <section className="mb-16">
          <div className="mb-8">
            <h2 
              className="text-[12px] uppercase tracking-[3px] text-[#64748B] mb-2"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              The Disciplines
            </h2>
            <h3 className="font-display text-3xl font-bold text-[#F1F5F9]">The Fourteen Protocols</h3>
            <p className="mt-2 text-[#94A3B8]">
              The ways of Resonance
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-6">
            {PROTOCOLS.slice(0, 6).map(protocol => (
              <ProtocolCard key={protocol.id} protocol={protocol} />
            ))}
          </div>
          {PROTOCOLS.length > 6 && (
            <div className="text-center">
              <Link
                href="/lore/protocols-dynamic"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all hover:scale-[1.02]"
                style={{
                  background: 'rgba(167, 139, 250, 0.2)',
                  border: '1px solid rgba(167, 139, 250, 0.4)',
                  color: '#A78BFA',
                }}
              >
                View All {PROTOCOLS.length} Protocols →
              </Link>
            </div>
          )}
        </section>
        
        {/* Characters Section */}
        <section className="mb-16">
          <div className="mb-8">
            <h2 
              className="text-[12px] uppercase tracking-[3px] text-[#64748B] mb-2"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              The Players
            </h2>
            <h3 className="font-display text-3xl font-bold text-[#F1F5F9]">The Five Protagonists</h3>
            <p className="mt-2 text-[#94A3B8]">
              Five perspectives on one crisis
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {PROTAGONISTS.map(protagonist => (
              <Link
                key={protagonist.id}
                href={`/lore/characters/${protagonist.id}`}
                className="group rounded-[14px] p-6 transition-all hover:scale-[1.02]"
                style={{
                  background: 'rgba(30, 41, 59, 0.5)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(100, 116, 139, 0.2)',
                }}
              >
                <div className="mb-3">
                  <h3 className="text-xl font-bold text-[#F1F5F9] group-hover:text-[#6366F1] transition-colors">
                    {protagonist.name}
                  </h3>
                  <p className="text-sm text-[#64748B]" style={{ fontFamily: 'var(--font-mono)' }}>
                    {protagonist.title}
                  </p>
                </div>
                <p className="line-clamp-3 text-sm text-[#94A3B8] leading-relaxed">
                  {protagonist.background.split('\n')[0]}
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs">
                  <span 
                    className="rounded-full px-2 py-1"
                    style={{
                      background: 'rgba(100, 116, 139, 0.3)',
                      color: '#94A3B8',
                    }}
                  >
                    House {protagonist.houseId}
                  </span>
                  {protagonist.protocolId && (
                    <span 
                      className="rounded-full px-2 py-1"
                      style={{
                        background: 'rgba(99, 102, 241, 0.2)',
                        color: '#6366F1',
                      }}
                    >
                      {protagonist.protocolId}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
        
        {/* Call to Action */}
        <section 
          className="rounded-[20px] p-8 sm:p-12 text-center"
          style={{
            background: 'rgba(30, 41, 59, 0.5)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            boxShadow: '0 0 30px rgba(99,102,241,0.2)',
          }}
        >
          <h2 className="font-display text-3xl font-bold text-[#F1F5F9] mb-4">
            Ready to Experience the Story?
          </h2>
          <p className="text-[#94A3B8] mb-6 max-w-2xl mx-auto">
            Every choice shapes the narrative. Every bet determines the future. 
            Enter a universe where your decisions have real consequences.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-lg font-bold text-white transition-all hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            }}
          >
            Start Reading →
          </Link>
        </section>
      </div>

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
      `}</style>
    </main>
  );
}

interface ConceptCardProps {
  icon: string;
  title: string;
  description: string;
  color: string;
  delay: string;
}

function ConceptCard({ icon, title, description, color, delay }: ConceptCardProps) {
  return (
    <div 
      className="rounded-[14px] p-6 animate-fadeIn"
      style={{
        background: 'rgba(30, 41, 59, 0.5)',
        backdropFilter: 'blur(16px)',
        border: `1px solid ${color.replace('0.2', '0.4')}`,
        animationDelay: delay,
      }}
    >
      <div className="text-4xl mb-3">{icon}</div>
      <h4 className="font-display text-xl font-bold text-[#F1F5F9] mb-2">
        {title}
      </h4>
      <p className="text-sm text-[#94A3B8] leading-relaxed">
        {description}
      </p>
    </div>
  );
}
