/**
 * Voidborne Lore Seed - Houses & Protocols
 * Seeds the database with the complete Voidborne universe lore
 */

import { PrismaClient, ProtocolRarity } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🏛️  Seeding Voidborne Lore System...')

  // ============================================================================
  // HOUSES
  // ============================================================================

  const houses = [
    {
      slug: 'valdris',
      name: 'House Valdris',
      description: 'Architects of the Silent Throne. Masters of spatial manipulation through Gravity Strands.',
      lore: `**House Valdris** sits at the apex of the Grand Conclave, holding the Silent Throne—a seat empty for three generations after their ancestors abandoned the forbidden art of Stitching new Threads.

**Territory:** The Geodesic—a Cathedral-Ship of impossible geometry, folding space within itself.

**Philosophy:** "Every Thread pulled changes the pattern. Choose carefully."

**Power:** Masters of Gravity Strands (G-Strand), bending space-time to create gateways, slow projectiles, or crush starships.

**Weakness:** Their reluctance to push beyond known limits has left them vulnerable to houses willing to innovate—or break rules.`,
      primaryColor: '#8b7355',
      secondaryColor: '#d4af37',
      icon: '👑',
      strandType: 'G',
      strandDescription: 'Gravity Strand - Bend space-time, create wormholes, crush or slow matter.',
      territory: 'The Geodesic Cathedral-Ship',
      population: 2400000,
      influence: 900,
    },
    {
      slug: 'meridian',
      name: 'House Meridian',
      description: 'Navigators and Diplomats. Masters of the Lattice that connects all worlds.',
      lore: `**House Meridian** controls the Web—the quantum network connecting every inhabited world in the known galaxy. Information is their currency, and they broker it ruthlessly.

**Territory:** The Lattice Nexus—a space station at the center of every FTL route.

**Philosophy:** "The shortest path between two points is the one I allow."

**Power:** Masters of Lattice Strands (L-Strand), reading probabilities, seeing potential futures, and rerouting quantum pathways.

**Strength:** Control over FTL communication and travel makes them indispensable. No war starts without their notice.

**Weakness:** Over-reliance on seeing futures makes them hesitant to act in the present.`,
      primaryColor: '#4a90e2',
      secondaryColor: '#7dd3fc',
      icon: '🌐',
      strandType: 'L',
      strandDescription: 'Lattice Strand - Navigate probability, predict futures, control quantum networks.',
      territory: 'The Lattice Nexus',
      population: 1800000,
      influence: 850,
    },
    {
      slug: 'thuun',
      name: 'House Kael-Thuun',
      description: 'Warriors and Void Commanders. Undefeated in three galactic wars.',
      lore: `**House Kael-Thuun** commands the Void Fleets—warships that move through the dark between stars, striking from nowhere. They are pragmatists, believing strength is the only universal language.

**Territory:** The Crucible—a fortress moon orbiting a dying star, where every heir is forged in zero-gravity combat.

**Philosophy:** "The void does not negotiate."

**Power:** Masters of Stitch Strands (S-Strand), seamlessly repairing hulls, resurrecting the dying, and binding wounds impossible to close.

**Strength:** Unmatched military might. When Kael-Thuun speaks, systems listen—or burn.

**Weakness:** They value honor over flexibility, making them predictable to cunning opponents.`,
      primaryColor: '#dc2626',
      secondaryColor: '#fb923c',
      icon: '⚔️',
      strandType: 'S',
      strandDescription: 'Stitch Strand - Repair matter, heal the dying, bind the broken.',
      territory: 'The Crucible Fortress Moon',
      population: 3200000,
      influence: 950,
    },
    {
      slug: 'proof',
      name: 'House Proof',
      description: 'Scientists and Engineers. They built the engines that power the galaxy.',
      lore: `**House Proof** doesn't believe in magic—they believe in math. While others pull Threads, Proof engineers them, turning esoteric arts into reproducible technology.

**Territory:** The Forge—an orbital shipyard where Radiance Engines are born.

**Philosophy:** "If you can't measure it, it doesn't exist."

**Power:** Masters of Radiance Strands (R-Strand), converting energy into matter, creating light-based shields, and powering FTL drives.

**Strength:** Their engines make interstellar civilization possible. Without Proof, the galaxy goes dark.

**Weakness:** Obsession with measurement blinds them to forces beyond quantification.`,
      primaryColor: '#f59e0b',
      secondaryColor: '#fbbf24',
      icon: '⚙️',
      strandType: 'R',
      strandDescription: 'Radiance Strand - Convert energy to matter, create light constructs, power FTL.',
      territory: 'The Forge Orbital Shipyard',
      population: 2900000,
      influence: 880,
    },
    {
      slug: 'drift',
      name: 'House Drift',
      description: 'Monks and Mystics. They speak to the Code beneath reality.',
      lore: `**House Drift** has no warships, no trade routes, no territory—only the Temple at the Edge, a monastery on the rim of a black hole where time itself fractures.

**Territory:** The Temporal Monastery—where past, present, and future bleed together.

**Philosophy:** "The universe is a program. We merely debug it."

**Power:** Masters of Code Strands (C-Strand), rewriting fundamental laws, altering causality, and editing events retroactively.

**Strength:** They see time nonlinearly. To them, battles are already won or lost before they begin.

**Weakness:** Their detachment from linear time makes them unreliable allies—and incomprehensible enemies.`,
      primaryColor: '#8b5cf6',
      secondaryColor: '#c084fc',
      icon: '🕉️',
      strandType: 'C',
      strandDescription: 'Code Strand - Rewrite reality, alter causality, edit the universe's source code.',
      territory: 'Temple at the Edge (Black Hole Monastery)',
      population: 120000,
      influence: 750,
    },
    {
      slug: 'weave',
      name: 'House Weave',
      description: 'Traders and Spies. They know every secret worth selling.',
      lore: `**House Weave** owns nothing—and profits from everything. They broker information, smuggle forbidden artifacts, and trade in secrets that topple empires.

**Territory:** The Shadow Market—a mobile station that never docks in the same system twice.

**Philosophy:** "Everything has a price. Even silence."

**Power:** Masters of hybrid Strands, blending multiple arts to create unpredictable effects.

**Strength:** They know more than they should, see more than they admit, and sell just enough to stay essential—but never enough to be trusted.

**Weakness:** No one trusts them, but everyone needs them.`,
      primaryColor: '#10b981',
      secondaryColor: '#34d399',
      icon: '🕸️',
      strandType: 'L',
      strandDescription: 'Hybrid Strands - Combine multiple Strand types for unpredictable effects.',
      territory: 'The Shadow Market (Mobile Station)',
      population: 890000,
      influence: 720,
    },
    {
      slug: 'null',
      name: 'House Null',
      description: 'Heretics and Outcasts. They erase what should not exist.',
      lore: `**House Null** does not appear in official records. They have no territory, no ambassadors, no place in the Conclave—because they reject the Threads entirely.

**Territory:** The Void Between—places where reality ends.

**Philosophy:** "All Strands corrupt. Only the Null is pure."

**Power:** Masters of Null Strands (Ø-Strand), unmaking reality, erasing matter, and severing Threads others have woven.

**Strength:** They can negate any Thread, making them the ultimate counter to any power.

**Weakness:** Their philosophy isolates them. By rejecting creation, they embrace entropy.`,
      primaryColor: '#1f2937',
      secondaryColor: '#6b7280',
      icon: '∅',
      strandType: 'Ø',
      strandDescription: 'Null Strand - Unmake reality, erase matter, sever all other Strands.',
      territory: 'The Void Between (Nowhere)',
      population: 50000,
      influence: 400,
    },
  ]

  console.log('  📍 Creating Houses...')
  for (const houseData of houses) {
    await prisma.house.upsert({
      where: { slug: houseData.slug },
      update: houseData,
      create: houseData,
    })
    console.log(`    ✅ ${houseData.name}`)
  }

  // ============================================================================
  // PROTOCOLS
  // ============================================================================

  // Get house IDs for relations
  const valdris = await prisma.house.findUnique({ where: { slug: 'valdris' } })
  const meridian = await prisma.house.findUnique({ where: { slug: 'meridian' } })
  const thuun = await prisma.house.findUnique({ where: { slug: 'thuun' } })
  const proof = await prisma.house.findUnique({ where: { slug: 'proof' } })
  const drift = await prisma.house.findUnique({ where: { slug: 'drift' } })
  const nullHouse = await prisma.house.findUnique({ where: { slug: 'null' } })

  if (!valdris || !meridian || !thuun || !proof || !drift || !nullHouse) {
    throw new Error('Houses not created properly!')
  }

  const protocols = [
    // VALDRIS PROTOCOLS (G-Strand)
    {
      slug: 'stellar-return',
      code: 'SR-01',
      name: 'Stellar Return',
      description: 'Escape certain death by folding space around yourself.',
      lore: `The signature survival Protocol of House Valdris. When executed correctly, the user folds a pocket of space-time around themselves, creating a temporary bubble that exists outside normal causality.

**How it works:** The Thread-wielder identifies their exact coordinates, then inverts the Gravity Strand inward, collapsing space into a singularity no larger than a fist. From outside, they vanish. Inside the bubble, time dilates—seconds feel like hours.

**Cost:** Extreme disorientation. The user emerges light-years away, often in the nearest stable gravity well. Veterans report "time sickness"—memories bleeding between their departure and arrival.

**Limitations:** Can only be used once per solar cycle. Overuse fractures the user's connection to linear time.`,
      houseId: valdris.id,
      strandType: 'G',
      spectrum: 'SOFT',
      orderRange: '7-9',
      cost: 'Extreme disorientation, temporal displacement, time sickness',
      effects: 'Instant escape. Folds space-time into pocket dimension. Emerges light-years away.',
      risks: 'Overuse fractures linear time connection. One use per solar cycle limit.',
      rarity: ProtocolRarity.UNCOMMON,
      powerLevel: 8,
    },
    {
      slug: 'event-horizon-anchor',
      code: 'EH-02',
      name: 'Event Horizon Anchor',
      description: 'Lock a target in place using localized gravitational collapse.',
      lore: `A combat Protocol that weaponizes gravity itself. The wielder creates a micro-singularity beneath a target, pinning them in place as space-time curves around them.

**How it works:** Focus on a point in space, then pull the Gravity Strand until it curves back on itself. The result is a temporary "gravity well" that holds the target immobile.

**Cost:** Physical strain. The wielder must maintain concentration while gravity pulls at their own mass.

**Applications:** Ship immobilization, crowd control, defensive barriers.`,
      houseId: valdris.id,
      strandType: 'G',
      spectrum: 'HARD',
      orderRange: '5-7',
      cost: 'Physical strain, continuous concentration required',
      effects: 'Creates micro-singularity. Immobilizes target. Defensive barrier.',
      risks: 'Backlash if concentration breaks. Can affect wielder if not careful.',
      rarity: ProtocolRarity.COMMON,
      powerLevel: 6,
    },
    // MERIDIAN PROTOCOLS (L-Strand)
    {
      slug: 'probability-map',
      code: 'PM-01',
      name: 'Probability Map',
      description: 'See all possible futures branching from the present.',
      lore: `The foundational Protocol of House Meridian diplomacy. By tracing the Lattice Strand forward through probability space, the wielder perceives potential futures as overlapping realities.

**How it works:** Enter a meditative state, then "pull" the Lattice forward. Futures appear as translucent threads—some bright (likely), some dim (improbable), some blood-red (catastrophic).

**Cost:** Mental fatigue. Prolonged use causes "future blindness"—inability to focus on the present.

**Strategic value:** Invaluable for negotiation, battle tactics, and avoiding assassination attempts.`,
      houseId: meridian.id,
      strandType: 'L',
      spectrum: 'SOFT',
      orderRange: '6-8',
      cost: 'Mental fatigue, future blindness with prolonged use',
      effects: 'Perceive branching futures. Strategic foresight. Avoid catastrophes.',
      risks: 'Present-blindness. Overwhelming information. Paralysis by infinite choice.',
      rarity: ProtocolRarity.RARE,
      powerLevel: 7,
    },
    {
      slug: 'lattice-echo',
      code: 'LE-02',
      name: 'Lattice Echo',
      description: 'Send a message instantaneously across any distance.',
      lore: `FTL communication without machines. The wielder imprints a thought onto the Lattice Strand, which carries it to the recipient instantly—regardless of distance.

**How it works:** Focus on the recipient's "quantum signature" (unique to each person), then imprint the message onto the Lattice. The recipient feels it as a whisper in their mind.

**Limitations:** Short messages only (1-10 words). Longer messages degrade into noise.

**Military use:** Coordinating fleets across star systems without risk of signal interception.`,
      houseId: meridian.id,
      strandType: 'L',
      spectrum: 'HYBRID',
      orderRange: '4-6',
      cost: 'Energy drain. Longer messages require exponentially more focus.',
      effects: 'Instant FTL communication. Uninterceptable. Mind-to-mind.',
      risks: 'Message corruption over extreme distances. Mental intrusion vulnerability.',
      rarity: ProtocolRarity.COMMON,
      powerLevel: 5,
    },
    // KAEL-THUUN PROTOCOLS (S-Strand)
    {
      slug: 'seamless-mend',
      code: 'SM-01',
      name: 'Seamless Mend',
      description: 'Repair catastrophic damage as if it never happened.',
      lore: `The medic's miracle. By weaving Stitch Strands through torn matter, the wielder can repair anything—flesh, metal, even quantum fabric.

**How it works:** Identify the "break" in the pattern (wound, crack, tear), then weave new Threads to bind it. The repaired area is often stronger than the original.

**Cost:** The wielder absorbs some of the damage as "Thread fatigue"—phantom pain where the mend occurred.

**Legendary uses:** Resurrecting the clinically dead (if performed within 60 seconds of death).`,
      houseId: thuun.id,
      strandType: 'S',
      spectrum: 'SOFT',
      orderRange: '5-8',
      cost: 'Thread fatigue. Phantom pain. Risk of absorbing target's injuries.',
      effects: 'Repair anything. Heal catastrophic wounds. Resurrect the recently dead.',
      risks: 'Absorbing target's damage. Overuse causes permanent scarring.',
      rarity: ProtocolRarity.UNCOMMON,
      powerLevel: 7,
    },
    {
      slug: 'void-cloak',
      code: 'VC-02',
      name: 'Void Cloak',
      description: 'Wrap yourself in the dark between stars, becoming undetectable.',
      lore: `A stealth Protocol that bends Stitch Strands around the user, creating a "bubble" of void—a space where light, heat, and radiation cannot penetrate.

**How it works:** Pull the Stitch Strand outward, creating a shell of nothingness. Inside, you exist. Outside, sensors read empty space.

**Cost:** Sensory deprivation. The user cannot see, hear, or sense anything while cloaked.

**Military use:** Infiltration, ambushes, escape. House Kael-Thuun's fleets use it for "ghost strikes."`,
      houseId: thuun.id,
      strandType: 'S',
      spectrum: 'HARD',
      orderRange: '6-8',
      cost: 'Sensory deprivation. Cannot perceive surroundings while active.',
      effects: 'Total invisibility. Undetectable by sensors. Perfect stealth.',
      risks: 'Blind while cloaked. Vulnerable if discovered. Limited duration.',
      rarity: ProtocolRarity.RARE,
      powerLevel: 8,
    },
    // PROOF PROTOCOLS (R-Strand)
    {
      slug: 'light-forge',
      code: 'LF-01',
      name: 'Light Forge',
      description: 'Convert pure energy into solid matter.',
      lore: `The engineering marvel that powers civilization. By concentrating Radiance Strands, the wielder can transmute energy into physical objects—tools, weapons, even temporary structures.

**How it works:** Channel ambient energy (stellar radiation, heat, kinetic motion) into a focal point, then "print" matter using Radiance Strands as the blueprint.

**Cost:** Energy debt. The wielder must repay the borrowed energy—usually through exhaustion or hunger.

**Applications:** Emergency repairs, weapon fabrication, shelter creation in hostile environments.`,
      houseId: proof.id,
      strandType: 'R',
      spectrum: 'HYBRID',
      orderRange: '4-7',
      cost: 'Energy debt. Physical exhaustion. Hunger.',
      effects: 'Create matter from energy. Fabricate tools/weapons. Construct shelter.',
      risks: 'Energy bankruptcy. Collapse from over-exertion.',
      rarity: ProtocolRarity.COMMON,
      powerLevel: 6,
    },
    {
      slug: 'radiance-shield',
      code: 'RS-02',
      name: 'Radiance Shield',
      description: 'Project a barrier of solidified light.',
      lore: `A defensive Protocol that weaves Radiance Strands into a lattice of hardened photons. The result is a translucent barrier capable of deflecting projectiles, energy weapons, and even nuclear blasts.

**How it works:** Focus on a point in space, then weave Radiance Strands into overlapping layers. The shield strength increases with concentration.

**Cost:** Mental and physical drain. Larger shields require exponentially more focus.

**Strategic use:** Ship deflector shields, planetary defense grids, personal armor.`,
      houseId: proof.id,
      strandType: 'R',
      spectrum: 'HARD',
      orderRange: '5-7',
      cost: 'Mental and physical drain. Exponential cost for larger shields.',
      effects: 'Deflects projectiles. Blocks energy weapons. Withstands nuclear blasts.',
      risks: 'Shield collapse if overwhelmed. Backlash damage to wielder.',
      rarity: ProtocolRarity.COMMON,
      powerLevel: 6,
    },
    // DRIFT PROTOCOLS (C-Strand)
    {
      slug: 'causality-edit',
      code: 'CE-01',
      name: 'Causality Edit',
      description: 'Rewrite a recent event in the timeline.',
      lore: `The most feared Protocol in the galaxy. By manipulating Code Strands, the wielder can retroactively alter events—changing outcomes that already happened.

**How it works:** Identify the event in the timeline, then "debug" it by rewriting its cause-effect relationship. The universe ripples as reality adjusts.

**Cost:** Memory fragmentation. The wielder's memory splits between the original and edited timelines.

**Limitations:** Can only edit events within the last 10 minutes. Larger edits risk paradoxes.`,
      houseId: drift.id,
      strandType: 'C',
      spectrum: 'SOFT',
      orderRange: '8-10',
      cost: 'Memory fragmentation. Timeline confusion. Paradox risk.',
      effects: 'Retroactively alter recent events. Change outcomes. Rewrite cause-effect.',
      risks: 'Paradox collapse. Memory schizophrenia. Reality rejection.',
      rarity: ProtocolRarity.LEGENDARY,
      powerLevel: 10,
    },
    {
      slug: 'quantum-debug',
      code: 'QD-02',
      name: 'Quantum Debug',
      description: 'Detect and repair errors in the fabric of reality.',
      lore: `A diagnostic Protocol that scans the surrounding space-time for "bugs"—inconsistencies, paradoxes, or corrupted Threads.

**How it works:** Enter a meditative state, then "read" the Code Strands in a region. Errors appear as glitches—stuttering time, flickering matter, or impossible geometries.

**Cost:** Mental strain. Prolonged debugging causes "reality dissociation"—the wielder loses touch with consensus reality.

**Applications:** Detecting sabotage, identifying rogue Thread-wielders, preventing paradoxes.`,
      houseId: drift.id,
      strandType: 'C',
      spectrum: 'SOFT',
      orderRange: '6-8',
      cost: 'Mental strain. Reality dissociation with prolonged use.',
      effects: 'Detect reality errors. Identify paradoxes. Find corrupted Threads.',
      risks: 'Losing touch with consensus reality. Information overload.',
      rarity: ProtocolRarity.RARE,
      powerLevel: 7,
    },
    // NULL PROTOCOLS (Ø-Strand)
    {
      slug: 'null-genesis',
      code: 'NL-∅',
      name: 'Null Genesis',
      description: 'Erase matter from existence.',
      lore: `The ultimate negation. By invoking the Null Strand, the wielder can unmake reality—erasing objects, people, or even concepts from the timeline.

**How it works:** Focus on the target, then pull the Null Strand through it. The target doesn't explode or dissolve—it simply ceases to have ever existed.

**Cost:** Existential horror. The wielder experiences the target's nonexistence as a void in their own memory.

**Why it's forbidden:** Overuse causes "cascade erasure"—the wielder starts erasing themselves.`,
      houseId: nullHouse.id,
      strandType: 'Ø',
      spectrum: 'HARD',
      orderRange: '9-10',
      cost: 'Existential horror. Memory voids. Risk of self-erasure.',
      effects: 'Erase matter from existence. Remove targets from timeline.',
      risks: 'Cascade erasure. Erasing yourself. Irreversible damage.',
      rarity: ProtocolRarity.LEGENDARY,
      powerLevel: 10,
    },
    {
      slug: 'thread-sever',
      code: 'TS-∅',
      name: 'Thread Sever',
      description: 'Cut all active Threads in a region, nullifying powers.',
      lore: `A tactical Protocol that creates an "anti-magic field" by severing all Threads in a localized area. No Protocols can be used within the zone.

**How it works:** Pull the Null Strand through the target area, cutting every Thread like a blade through silk. The zone becomes "dead space"—no Strand manipulation possible.

**Cost:** Indiscriminate. The wielder also loses access to Threads while inside.

**Military use:** Disabling enemy Thread-wielders, securing negotiation zones, preventing sabotage.`,
      houseId: nullHouse.id,
      strandType: 'Ø',
      spectrum: 'HARD',
      orderRange: '7-9',
      cost: 'Affects wielder too. No Strand powers in zone.',
      effects: 'Create anti-Thread field. Nullify all powers. Dead space.',
      risks: 'Self-disablement. Friendly fire. Permanent damage to Lattice.',
      rarity: ProtocolRarity.EPIC,
      powerLevel: 9,
    },
  ]

  console.log('  ⚡ Creating Protocols...')
  for (const protocolData of protocols) {
    await prisma.protocol.upsert({
      where: { slug: protocolData.slug },
      update: protocolData,
      create: protocolData,
    })
    console.log(`    ✅ ${protocolData.code}: ${protocolData.name}`)
  }

  console.log('\n✅ Lore system seeded successfully!')
  console.log(`   📊 ${houses.length} Houses created`)
  console.log(`   ⚡ ${protocols.length} Protocols created`)
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
