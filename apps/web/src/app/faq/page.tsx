'use client'

import { useState } from 'react';

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-[#0F172A]">
      {/* Ambient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A] via-[#1E1B3A] to-[#0F172A]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8 py-24">
        {/* Header */}
        <div className="text-center mb-16 animate-fadeIn">
          <div className="mb-8" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '4px' }}>
            <div className="text-[10px] uppercase text-[#64748B] tracking-[4px] mb-6">
              Help Center
            </div>
            <div className="w-24 h-px mx-auto bg-gradient-to-r from-transparent via-[#64748B]/20 to-transparent" />
          </div>

          <h1 className="font-display font-extrabold text-[56px] sm:text-[64px] text-[#F1F5F9] mb-6" style={{ letterSpacing: '-1px' }}>
            Frequently Asked<br />Questions
          </h1>

          <p className="text-lg text-[#94A3B8]">
            Everything you need to know about Voidborne
          </p>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-6">
          <FAQSection title="Getting Started" delay="0.1s">
            <FAQItem
              question="What is Voidborne?"
              answer="Voidborne is an interactive narrative prediction market. You read a space political thriller and bet USDC on which story branches will happen. If you predict correctly, you win money. Your bets also influence which path the AI generates."
            />
            <FAQItem
              question="How do I start reading?"
              answer="Click 'Start Reading' on the homepage. You can read the first chapter for free without connecting a wallet. To place bets, you'll need to connect a Web3 wallet (MetaMask, Rainbow, etc.) and have some USDC on Base."
            />
            <FAQItem
              question="Do I need crypto to read the story?"
              answer="No! You can read all chapters for free. Betting is optional. But if you want to influence the story and potentially earn money, you'll need USDC (a stablecoin) on the Base blockchain."
            />
          </FAQSection>

          <FAQSection title="Betting & Payments" delay="0.2s">
            <FAQItem
              question="How does betting work?"
              answer="At the end of each chapter, you'll see 2-5 possible outcomes (story branches). You bet USDC on which outcome(s) you think will happen. When the next chapter is generated, winners split the betting pool proportionally. We use a parimutuel system like horse racing."
            />
            <FAQItem
              question="What's the minimum bet?"
              answer="The minimum bet is $1 USDC. Maximum is $10,000 USDC per bet (subject to change based on liquidity)."
            />
            <FAQItem
              question="What fees do you charge?"
              answer="We take a 5% platform fee from gross payouts. For example: if you bet $100 and win $500 gross, you receive $475 after fees. The story author receives 70% of fees, and 30% goes to operational costs."
            />
            <FAQItem
              question="When do I get paid if I win?"
              answer="Payouts are automatic via smart contract. As soon as the chapter is published and outcomes are resolved (usually within 24 hours), you can claim your winnings. They appear in your wallet instantly."
            />
            <FAQItem
              question="What if I bet on multiple outcomes?"
              answer="You can! This is called a combinatorial bet. For example: 'Outcome A AND Outcome B.' The odds multiply, giving you higher payouts if you're right — but ALL your predictions must be correct."
            />
          </FAQSection>

          <FAQSection title="Technical & Security" delay="0.3s">
            <FAQItem
              question="Which blockchain does Voidborne use?"
              answer="We're launching on Base (Coinbase's Layer 2). It's fast, cheap (~$0.01 per transaction), and compatible with Ethereum wallets. We plan to launch on MegaETH in Q2 2026 for even faster transactions."
            />
            <FAQItem
              question="Is my money safe?"
              answer="Yes. All funds are held in audited smart contracts. The contract is non-custodial: we can't access your money. Only you can withdraw your winnings. We recommend starting with small bets until you're comfortable."
            />
            <FAQItem
              question="What if the contract gets hacked?"
              answer="We've implemented multiple security measures: OpenZeppelin standards, reentrancy guards, professional audit (Trail of Bits), bug bounty program ($50K), and an emergency pause mechanism. However, as with all DeFi, there's always some risk."
            />
            <FAQItem
              question="Can you manipulate the story outcomes?"
              answer="No. All bets are recorded on-chain before the chapter is generated. Outcomes are resolved by the admin (provably), and the smart contract automatically distributes winnings. Everything is transparent and auditable."
            />
          </FAQSection>

          <FAQSection title="Story & Gameplay" delay="0.4s">
            <FAQItem
              question="How does the AI decide which outcome happens?"
              answer="The AI (Claude Sonnet 4.5) generates the next chapter based on: (1) Betting patterns (popular choices are more likely), (2) Narrative coherence (the story must make sense), (3) Strategic randomness (to keep things unpredictable). It's not purely democratic — the AI can choose dark horse options for dramatic effect."
            />
            <FAQItem
              question="Can I influence the story without betting?"
              answer="Not directly. Betting is the primary way readers influence the narrative. However, we're exploring features like 'discussion threads' where readers can share theories, and the AI might consider popular fan ideas."
            />
            <FAQItem
              question="How long is Voidborne?"
              answer="The full story is planned for 100+ chapters across 5 seasons. Each season follows a major story arc. Chapters release weekly (initially), with betting closing 1 hour before the next chapter generates."
            />
            <FAQItem
              question="What if I miss a chapter?"
              answer="You can always go back and read previous chapters. However, you can only bet on upcoming chapters (before they're generated). Past chapters are locked — you can't change history!"
            />
          </FAQSection>

          <FAQSection title="Wallet & USDC" delay="0.5s">
            <FAQItem
              question="How do I get USDC?"
              answer="USDC is a stablecoin (1 USDC = $1 USD). You can buy it on Coinbase, Binance, or any major exchange, then bridge it to Base using the official Base Bridge. Or use on-ramps like MoonPay to buy USDC directly on Base."
            />
            <FAQItem
              question="What wallet should I use?"
              answer="We support any Ethereum-compatible wallet: MetaMask (most popular), Rainbow, WalletConnect, Coinbase Wallet, etc. Make sure to connect to the Base network."
            />
            <FAQItem
              question="Do I need ETH for gas?"
              answer="Yes, but very little. Base transactions cost ~$0.01 in ETH. You can get a small amount of ETH from Coinbase or bridge from Ethereum mainnet."
            />
          </FAQSection>

          <FAQSection title="Anti-Botting & Fair Play" delay="0.6s">
            <FAQItem
              question="How do you prevent bots from gaming the system?"
              answer="We have a 1-hour betting deadline before each chapter generates. This prevents bots from seeing the transaction in the mempool and placing last-second bets. All bets must be placed with genuine uncertainty."
            />
            <FAQItem
              question="Can whales manipulate the story?"
              answer="We have a $10,000 max bet per outcome to prevent single users from dominating. We're also exploring quadratic voting mechanisms for future seasons."
            />
          </FAQSection>

          <FAQSection title="Community & Support" delay="0.7s">
            <FAQItem
              question="Where can I discuss the story with other readers?"
              answer="Join our Discord community (link in footer). We have channels for theories, lore discussions, betting strategies, and general chat. Be respectful — spoilers are strictly moderated!"
            />
            <FAQItem
              question="I found a bug. How do I report it?"
              answer="Email support@voidborne.io or report it in our Discord #bug-reports channel. Critical bugs (security issues) should be reported privately to security@voidborne.io. We have a $50K bug bounty program."
            />
            <FAQItem
              question="Can I create fan art / fan fiction?"
              answer="Absolutely! We love fan creations. Share them on Twitter/X with #Voidborne. The best ones might become canon (with your permission)."
            />
          </FAQSection>
        </div>

        {/* Still Have Questions */}
        <section 
          className="mt-16 rounded-[20px] p-8 sm:p-12 text-center"
          style={{
            background: 'rgba(30, 41, 59, 0.5)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(99, 102, 241, 0.4)',
          }}
        >
          <h2 className="font-display text-2xl font-bold text-[#F1F5F9] mb-4">
            Still Have Questions?
          </h2>
          <p className="text-[#94A3B8] mb-6">
            Join our Discord community or email us directly
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://discord.gg/voidborne"
              className="px-6 py-3 rounded-lg font-medium transition-all hover:scale-[1.02]"
              style={{
                background: 'rgba(99, 102, 241, 0.2)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                color: '#6366F1',
              }}
            >
              Join Discord
            </a>
            <a
              href="mailto:support@voidborne.io"
              className="px-6 py-3 rounded-lg font-medium transition-all hover:scale-[1.02]"
              style={{
                background: 'rgba(100, 116, 139, 0.2)',
                border: '1px solid rgba(100, 116, 139, 0.4)',
                color: '#94A3B8',
              }}
            >
              Email Support
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}

interface FAQSectionProps {
  title: string;
  delay: string;
  children: React.ReactNode;
}

function FAQSection({ title, delay, children }: FAQSectionProps) {
  return (
    <div 
      className="rounded-[14px] p-6 animate-fadeIn"
      style={{
        background: 'rgba(30, 41, 59, 0.5)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(100, 116, 139, 0.2)',
        animationDelay: delay,
      }}
    >
      <h2 
        className="text-[12px] uppercase tracking-[2px] text-[#64748B] mb-6"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {title}
      </h2>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

interface FAQItemProps {
  question: string;
  answer: string;
}

function FAQItem({ question, answer }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      className="rounded-lg overflow-hidden transition-all"
      style={{
        background: isOpen ? 'rgba(15, 23, 42, 0.5)' : 'transparent',
        border: `1px solid ${isOpen ? 'rgba(99, 102, 241, 0.3)' : 'rgba(100, 116, 139, 0.1)'}`,
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-4 text-left flex items-center justify-between hover:bg-[#0F172A]/30 transition-colors"
      >
        <span className="font-medium text-[#F1F5F9] pr-4">
          {question}
        </span>
        <span 
          className="text-[#6366F1] text-xl flex-shrink-0 transition-transform"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}
        >
          ▼
        </span>
      </button>
      {isOpen && (
        <div className="px-4 pb-4 text-[#94A3B8] leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
}
