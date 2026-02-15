// The Seven Houses of the Covenant
// Source: VOIDBORNE_SETTING_BIBLE_v1.1.md

export interface House {
  id: string;
  name: string;
  title: string;
  description: string;
  governance: string;
  strengths: string[];
  weaknesses: string[];
  culture: string;
  color: string;
  icon: string;
}

export const HOUSES: House[] = [
  {
    id: 'valdris',
    name: 'House Valdris',
    title: 'The Iron Throne',
    description: `Controls the densest Node cluster in known space. The wealthiest and most militarily powerful House. They supply 40% of all refined Lumenase. Their culture is one of disciplined hierarchy, aristocratic obligation, and controlled brutality. They believe the strong have a duty to rule — but also a duty to protect. Their weakness: internal succession politics are a bloodbath every generation.`,
    governance: 'Hereditary monarchy with a council of Blade-Peers who can challenge the Throne through ritual combat or economic competition.',
    strengths: [
      'Densest Node cluster in known space',
      'Wealthiest House in the Covenant',
      'Most powerful military force',
      '40% of all refined Lumenase production',
      'Disciplined hierarchical structure',
      'Strong aristocratic traditions'
    ],
    weaknesses: [
      'Brutal succession politics',
      'Internal power struggles',
      'Rigid hierarchy limits innovation',
      'Vulnerable during succession crises',
      'Blade-Peer challenges destabilize leadership'
    ],
    culture: `Valdris culture worships strength, duty, and honor. The strong have obligations — power must be earned and maintained through constant vigilance. Succession is brutal but necessary, ensuring only the capable rule. They believe in controlled violence as a mechanism of order. Aristocratic families train their children from birth in combat, politics, and Resonance. The Blade-Peers are both the House's greatest strength (a meritocratic check on royal power) and its greatest weakness (constant internal competition).`,
    color: '#8B0000',
    icon: '⚔️'
  },
  {
    id: 'meridian',
    name: 'House Meridian',
    title: 'The Republic of Voices',
    description: `The only democratic House. Massive population spread across dozens of systems. Their strength is industrial capacity and sheer numbers. They produce most of the Covenant's manufactured goods and food. Their weakness: decision-making is slow, their politics are rife with populist manipulation, and their intelligence services are compromised by factional infighting.`,
    governance: 'Elected Senate with rotating executive chairs. The reality is that three mega-corporate blocs control most Senate seats.',
    strengths: [
      'Largest population in the Covenant',
      'Massive industrial capacity',
      'Majority of manufactured goods production',
      'Food production dominance',
      'Distributed across dozens of systems',
      'Democratic representation'
    ],
    weaknesses: [
      'Slow decision-making processes',
      'Populist political manipulation',
      'Factional infighting',
      'Compromised intelligence services',
      'Corporate bloc domination',
      'Lack of unified strategic direction'
    ],
    culture: `Meridian prides itself on being the "voice of the people." Every citizen theoretically has a vote, every opinion matters, every grievance can be addressed through the Senate. In practice, mega-corporate lobbying and media manipulation shape public opinion more than any individual vote. The culture values free speech, innovation, and entrepreneurship — but also produces conspiracy theories, demagogues, and corporate oligarchy. Meridians see themselves as the moral center of the Covenant, champions of freedom against aristocratic tyranny. Others see them as naive, manipulable, and dangerously inefficient.`,
    color: '#FFD700',
    icon: '🗳️'
  },
  {
    id: 'solvane',
    name: 'House Solvane',
    title: 'The Quiet Empire',
    description: `Masters of intelligence, espionage, and cultural warfare. Solvane controls the Covenant's communications infrastructure — the Strand-relay network that allows real-time communication across stellar distances. They know everything. They sell information to everyone. They trust no one. Small territory, small military, enormous invisible power.`,
    governance: 'A ruling council called the Whisper Court, whose membership is officially secret. Even most Solvani don\'t know who actually governs them.',
    strengths: [
      'Controls all FTL communications infrastructure',
      'Superior intelligence network',
      'Espionage expertise',
      'Information asymmetry advantage',
      'Cultural warfare mastery',
      'Invisible power projection'
    ],
    weaknesses: [
      'Small territorial holdings',
      'Limited military force',
      'Paranoid internal culture',
      'Dependent on other Houses for resources',
      'Trust deficit with all parties',
      'Vulnerable to infrastructure sabotage'
    ],
    culture: `Solvane culture is built on secrets. Information is currency, knowledge is power, and trust is the rarest commodity. Children learn to lie before they learn to read. Every conversation is a negotiation. Every relationship is transactional. They believe that perfect information prevents war — if everyone knew what everyone else was planning, paranoia would give way to rational cooperation. In practice, they've created a society where no one trusts anyone, even within families. Solvani agents are the best in the Covenant, but they're also the most isolated. The price of knowing everything is being unable to believe anyone.`,
    color: '#9370DB',
    icon: '🕵️'
  },
  {
    id: 'kael-thuun',
    name: 'House Kael-Thuun',
    title: 'The Forge Worlds',
    description: `The technological innovators. Kael-Thuun pushes the boundaries of what Tensoring can achieve. They build the best ships, the most advanced stations, and the most terrifying weapons. Their culture worships engineering as a spiritual practice — they believe the universe is a machine and that understanding it is a form of prayer. Their weakness: technological hubris. They've caused two industrial-scale disasters in the last century by pushing Tensoring experiments too far.`,
    governance: 'Technocratic meritocracy. Leadership is determined by peer-reviewed contribution to the House\'s collective knowledge base. This sounds elegant until you realize it incentivizes sabotaging rivals\' research.',
    strengths: [
      'Most advanced technology in the Covenant',
      'Superior ship construction',
      'Tensoring innovation leadership',
      'Meritocratic excellence',
      'Engineering culture of continuous improvement',
      'Artifact manufacturing capability'
    ],
    weaknesses: [
      'Technological hubris',
      'Two industrial disasters in recent history',
      'Research sabotage culture',
      'Overconfidence in solutions',
      'Poor risk assessment',
      'Ethical flexibility in experimentation'
    ],
    culture: `Kael-Thuun worships at the altar of understanding. They believe the universe is an elegant machine, and that comprehending its mechanisms is the highest form of devotion. Engineering is prayer. Mathematics is theology. A perfectly optimized design is transcendent. This produces a culture of relentless innovation and breathtaking arrogance. Kael-Thuun engineers will attempt things that should be impossible, because they believe nothing is beyond comprehension if you understand the underlying principles. Sometimes they're right, and the result is revolutionary. Sometimes they're wrong, and entire stations explode. Their unofficial motto: "The first version always fails. That's why we build a second."`,
    color: '#FF8C00',
    icon: '🔧'
  },
  {
    id: 'ashura',
    name: 'House Ashura',
    title: 'The Penitent',
    description: `Born from the survivors of the worst Node Fracture during the Fracturing — the one that destroyed the Ran-Vel system and its 12 billion inhabitants. House Ashura is defined by guilt. They maintain the largest fleet of humanitarian vessels, they operate refugee corridors, and they fund Node-stability research. They also harbor a fanatical religious movement that believes the Nodes are wounds in God's body and that all Resonance is sin.`,
    governance: 'Theocratic council led by the Atonement Tribunal. Secular and religious authority are theoretically separate. In practice, the Tribunal controls both.',
    strengths: [
      'Largest humanitarian fleet',
      'Refugee corridor operations',
      'Node-stability research leadership',
      'Moral authority in the Covenant',
      'Strong cultural cohesion through shared guilt',
      'Sophisticated medical/Vitalist expertise'
    ],
    weaknesses: [
      'Defined by collective trauma',
      'Religious fanaticism',
      'Anti-Resonance ideology conflicts with reality',
      'Political manipulation via guilt',
      'Limited military power',
      'Internal theological conflicts'
    ],
    culture: `Ashura culture is built on remembrance and penance. They will never forget Ran-Vel. They will never stop atoning. Every Ashuran child learns the names of the lost systems, the casualty counts, the mistakes that led to Fracture. They are taught that Resonance is humanity's original sin — the arrogance of manipulating forces we don't fully understand. This produces a culture of careful conservatism, deep ethical consideration, and profound guilt. The Atonement faith teaches that the Nodes are sacred wounds, that touching them is blasphemy, yet the House requires Resonants to survive. This contradiction tears at their identity. Some Ashurans resolve it through service — using sinful power for righteous ends. Others cannot resolve it and suffer in silence.`,
    color: '#4B0082',
    icon: '🕊️'
  },
  {
    id: 'yen-kai',
    name: 'House Yen-Kai',
    title: 'The Nomads',
    description: `No home system. Yen-Kai is a fleet — thousands of ships moving through Geodesics in an endless migration. They are the finest navigators in the Covenant, producing more Geodesist Resonants per capita than any other House. They trade, they smuggle, they explore. They claim no territory and answer to no fixed authority. The other Houses tolerate them because Yen-Kai navigators are indispensable, and because their fleet is large enough to be a genuine military threat if provoked.`,
    governance: 'Council of Fleet-Mothers and Fleet-Fathers, elected by ship captains. Decisions require two-thirds majority. Dissenting ships can leave the fleet, but few do — isolation in deep space is a death sentence.',
    strengths: [
      'Most skilled navigators in the Covenant',
      'Highest Geodesist Resonant production per capita',
      'Complete spatial independence',
      'Trade and smuggling networks',
      'Exploration expertise',
      'Large mobile fleet (military deterrent)'
    ],
    weaknesses: [
      'No permanent territory',
      'Dependent on other Houses for supplies',
      'Limited industrial capacity',
      'Vulnerable to supply chain disruption',
      'Fleet fragmentation risk',
      'Perpetual migration strain'
    ],
    culture: `Yen-Kai culture is one of perpetual motion. They were born in the void between stars, and they will die there. Home is not a place — it's the fleet, the family, the ship you were born on. They navigate by instinct, by feel, by a connection to the Lattice that other Geodesists envy and cannot replicate. Yen-Kai children learn to walk on moving decks. They learn stellar navigation before they learn to read. They trust their family and their fleet-mates absolutely, and everyone else not at all. The culture values freedom, adaptability, and loyalty to crew over ideology. A Yen-Kai navigator will smuggle for anyone, fight for anyone, explore anywhere — as long as their fleet approves and the contract is honored. Breaking a contract with Yen-Kai means you will never hire one of their navigators again. And in a galaxy where FTL travel requires Geodesists, that's a death sentence for your trade routes.`,
    color: '#00CED1',
    icon: '🚀'
  },
  {
    id: 'obsidia',
    name: 'House Obsidia',
    title: 'The Watchers',
    description: `Guardians of the Dead Nodes — the sites of the three Fractures from the Fracturing. They study the aftermath, monitor for signs of instability, and maintain the Covenant's early warning network. Obsidia is small, austere, and grim. Their people live on stations orbiting the scars of annihilated systems. They are the Covenant's conscience and its memory. Their weakness: they are so fixated on preventing the past from repeating that they often fail to see new threats.`,
    governance: 'Military chain of command. The Sentinel-Commander serves for life. The culture is monastic and disciplined.',
    strengths: [
      'Guardians of Dead Node sites',
      'Node-stability monitoring expertise',
      'Early warning network',
      'Historical memory preservation',
      'Disciplined military structure',
      'Austere focus and dedication'
    ],
    weaknesses: [
      'Small population',
      'Limited resources',
      'Fixated on past threats',
      'Blind to novel dangers',
      'Isolation from Covenant politics',
      'Grim, fatalistic culture'
    ],
    culture: `Obsidia culture is built on vigilance and memory. They live at the sites of humanity's greatest failures, surrounded by the evidence of what happens when power is wielded recklessly. Every Obsidian child grows up watching the dead stars where billions once lived, seeing the Lattice-scars that will never heal. They are taught that the price of peace is eternal watchfulness, that the past must never be forgotten, and that their duty is to ensure the Fracturing never happens again. This produces a culture of stoic discipline, profound seriousness, and unshakeable commitment to duty. Obsidians do not joke about the Nodes. They do not take risks with Resonance. They do not forgive those who do. The rest of the Covenant sees them as grim, humorless, obsessed with the past. Obsidians see themselves as the only ones who remember what's at stake.`,
    color: '#696969',
    icon: '🛡️'
  }
];

export function getHouseById(id: string): House | undefined {
  return HOUSES.find(house => house.id === id);
}

export function getHouseByName(name: string): House | undefined {
  return HOUSES.find(house => house.name === name);
}
