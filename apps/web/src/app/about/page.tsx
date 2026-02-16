export const metadata = {
  title: 'About Voidborne - The Future of Interactive Fiction',
  description: 'Learn about Voidborne, the first narrative prediction market where readers bet on story outcomes',
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#0F172A]">
      {/* Ambient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A] via-[#1E1B3A] to-[#0F172A]" />
        <div 
          className="absolute w-[800px] h-[800px] top-1/4 right-1/4 opacity-20"
          style={{
            background: 'radial-gradient(ellipse, rgba(245,158,11,0.15) 0%, transparent 60%)',
            animation: 'drift 25s ease-in-out infinite',
          }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8 py-24">
        {/* Header */}
        <div className="text-center mb-16 animate-fadeIn">
          <div className="mb-8" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '4px' }}>
            <div className="text-[10px] uppercase text-[#64748B] tracking-[4px] mb-6">
              About
            </div>
            <div className="w-24 h-px mx-auto bg-gradient-to-r from-transparent via-[#64748B]/20 to-transparent" />
          </div>

          <h1 className="font-display font-extrabold text-[56px] sm:text-[64px] text-[#F1F5F9] mb-6" style={{ letterSpacing: '-1px' }}>
            The Future of<br />Interactive Fiction
          </h1>

          <p className="text-lg text-[#94A3B8] max-w-2xl mx-auto">
            Voidborne is the world's first <span className="text-[#6366F1] font-semibold">narrative prediction market</span> — 
            where readers don't just read the story, they control it.
          </p>
        </div>

        {/* What is Voidborne */}
        <section 
          className="mb-16 rounded-[20px] p-8 sm:p-12 animate-fadeIn"
          style={{
            background: 'rgba(30, 41, 59, 0.5)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            animationDelay: '0.1s',
          }}
        >
          <h2 className="font-display text-3xl font-bold text-[#F1F5F9] mb-6">
            What is Voidborne?
          </h2>

          <div className="space-y-4 text-[#E2E8F0] leading-relaxed">
            <p>
              Voidborne is a <strong className="text-[#F1F5F9]">space political thriller</strong> set in a fractured 
              human civilization. Seven Great Houses compete for power in the aftermath of catastrophic wars. 
              You play as a Resonant — someone who can manipulate the Lattice, an invisible fabric underlying reality itself.
            </p>

            <p>
              But here's the twist: <span className="text-[#6366F1] font-semibold">you don't just make choices — you bet on them</span>.
            </p>

            <p>
              Every chapter presents multiple story branches. You use <strong className="text-[#F59E0B]">USDC</strong> to 
              bet on which path the AI will choose. If you're right, you win. If the majority chooses differently, 
              the story goes another way.
            </p>

            <p className="text-[#94A3B8] border-l-2 border-[#6366F1] pl-4">
              It's <span className="text-[#F1F5F9]">Choose Your Own Adventure</span> meets <span className="text-[#F1F5F9]">prediction markets</span> meets <span className="text-[#F1F5F9]">DeFi</span>.
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section 
          className="mb-16 rounded-[20px] p-8 sm:p-12 animate-fadeIn"
          style={{
            background: 'rgba(30, 41, 59, 0.5)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(167, 139, 250, 0.3)',
            animationDelay: '0.2s',
          }}
        >
          <h2 className="font-display text-3xl font-bold text-[#F1F5F9] mb-6">
            How It Works
          </h2>

          <div className="space-y-6">
            <StepCard
              number="1"
              title="Read the Chapter"
              description="Immerse yourself in the story. Political intrigue, cosmic mysteries, impossible choices."
              color="#6366F1"
            />

            <StepCard
              number="2"
              title="Explore Outcomes"
              description="At the end of each chapter, you see 2-5 possible story branches. Each has different consequences."
              color="#A78BFA"
            />

            <StepCard
              number="3"
              title="Place Your Bets"
              description="Use USDC to bet on which outcome(s) will happen. You can bet on multiple outcomes for bigger payouts."
              color="#F59E0B"
            />

            <StepCard
              number="4"
              title="AI Decides (Weighted by Bets)"
              description="The AI generates the next chapter, influenced by betting patterns. Popular choices are more likely, but surprises happen."
              color="#22C55E"
            />

            <StepCard
              number="5"
              title="Winners Get Paid"
              description="If your bets were correct, you receive USDC based on parimutuel odds. Then the cycle continues."
              color="#6366F1"
            />
          </div>
        </section>

        {/* Why Blockchain */}
        <section 
          className="mb-16 rounded-[20px] p-8 sm:p-12 animate-fadeIn"
          style={{
            background: 'rgba(30, 41, 59, 0.5)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            animationDelay: '0.3s',
          }}
        >
          <h2 className="font-display text-3xl font-bold text-[#F1F5F9] mb-6">
            Why Blockchain?
          </h2>

          <div className="space-y-4 text-[#E2E8F0] leading-relaxed">
            <p>
              <strong className="text-[#F1F5F9]">Transparency.</strong> All bets, outcomes, and payouts are on-chain. 
              No hidden algorithms, no rigged results. You can verify everything yourself.
            </p>

            <p>
              <strong className="text-[#F1F5F9]">Real Stakes.</strong> When readers have money on the line, 
              they care deeply about the story. It's not just entertainment — it's investment.
            </p>

            <p>
              <strong className="text-[#F1F5F9]">Provably Fair.</strong> Smart contracts ensure payouts are 
              automatic and tamper-proof. No platform can steal your winnings.
            </p>

            <p>
              <strong className="text-[#F1F5F9]">Global Access.</strong> Anyone with a wallet can participate. 
              No credit cards, no KYC, no geographic restrictions.
            </p>
          </div>
        </section>

        {/* Vision */}
        <section 
          className="mb-16 rounded-[20px] p-8 sm:p-12 animate-fadeIn"
          style={{
            background: 'rgba(30, 41, 59, 0.5)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            animationDelay: '0.4s',
          }}
        >
          <h2 className="font-display text-3xl font-bold text-[#F1F5F9] mb-6">
            Our Vision
          </h2>

          <div className="space-y-4 text-[#E2E8F0] leading-relaxed">
            <p>
              We believe stories are more powerful when they're <span className="text-[#6366F1] font-semibold">collaborative</span>.
            </p>

            <p>
              Traditional books are static. Video games give you choices, but they're pre-scripted. 
              AI can generate infinite stories, but without structure, they lack meaning.
            </p>

            <p>
              Voidborne combines the best of all three: <strong className="text-[#F1F5F9]">human-crafted narrative structure</strong>, 
              <strong className="text-[#F59E0B]"> AI-generated prose</strong>, and <strong className="text-[#22C55E]">reader-driven decisions</strong>.
            </p>

            <p className="text-lg text-[#6366F1] font-semibold">
              The result? Stories that surprise even the author.
            </p>
          </div>
        </section>

        {/* Team (Placeholder) */}
        <section 
          className="mb-16 rounded-[20px] p-8 sm:p-12 text-center animate-fadeIn"
          style={{
            background: 'rgba(30, 41, 59, 0.5)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(100, 116, 139, 0.2)',
            animationDelay: '0.5s',
          }}
        >
          <h2 className="font-display text-3xl font-bold text-[#F1F5F9] mb-6">
            Built by Storytellers & Technologists
          </h2>

          <p className="text-[#94A3B8] mb-6 max-w-2xl mx-auto">
            Voidborne is created by a team passionate about pushing the boundaries of interactive fiction. 
            We're writers, developers, and dreamers who believe the future of storytelling is decentralized.
          </p>

          <p className="text-sm text-[#64748B]">
            Team page coming soon.
          </p>
        </section>

        {/* CTA */}
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
            Ready to Participate?
          </h2>
          <p className="text-[#94A3B8] mb-6">
            The story begins now. Your choices matter.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-lg font-bold text-white transition-all hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            }}
          >
            Enter Voidborne →
          </a>
        </section>
      </div>
    </main>
  );
}

interface StepCardProps {
  number: string;
  title: string;
  description: string;
  color: string;
}

function StepCard({ number, title, description, color }: StepCardProps) {
  return (
    <div className="flex gap-4">
      <div 
        className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-display font-bold text-xl"
        style={{
          background: `${color}20`,
          color: color,
          border: `2px solid ${color}40`,
        }}
      >
        {number}
      </div>
      <div className="flex-1">
        <h3 className="font-display text-xl font-bold text-[#F1F5F9] mb-2">
          {title}
        </h3>
        <p className="text-[#94A3B8] leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
