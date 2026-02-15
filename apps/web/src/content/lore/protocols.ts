// The Fourteen Protocols
// Source: VOIDBORNE_RESONANT_POWERS_CODEX_v1.md

export type ProtocolSpectrum = 'HARD' | 'SOFT' | 'HYBRID';

export interface Protocol {
  id: string;
  code: string;
  name: string;
  spectrum: ProtocolSpectrum;
  primaryStrand: string;
  secondaryStrand?: string;
  domain: string;
  description: string;
  shortDesc: string;
  tiers: {
    foundational: string; // 9th-8th Order
    professional: string; // 7th-6th Order
    strategic: string;    // 5th Order
    schema: string;       // 4th Order
  };
  color: string;
  icon: string;
}

export const PROTOCOLS: Protocol[] = [
  // HARD SPECTRUM (Structural Protocols)
  {
    id: 'geodesist',
    code: 'SR-01',
    name: 'Geodesist Protocol',
    spectrum: 'HARD',
    primaryStrand: 'L-Strand',
    secondaryStrand: 'G-Strand',
    domain: 'Space, Navigation, Spatial Geometry',
    description: `Reading Strand-lines to calculate faster-than-light transit routes through Lattice corridors called Geodesics. Every interstellar ship requires a Resonant navigator — a Geodesist. Without them, you travel at sub-light. With them, you cross sectors in days. This makes Geodesists the single most strategically important human resource in existence.`,
    shortDesc: 'FTL navigation and spatial manipulation',
    tiers: {
      foundational: 'Perceive Geodesic corridors, sense nearby Nodes within ~50km, assist with FTL navigation',
      professional: 'Independent ship navigation, corridor manipulation, multi-jump routing across dozens of systems',
      strategic: 'Create new Geodesic corridors, spatial folding (short-range teleportation), planetary-scale perception',
      schema: 'Rewrite local spatial geometry, create pocket dimensions, perceive non-spatial Strand-types'
    },
    color: '#4169E1',
    icon: '🧭'
  },
  {
    id: 'tensor',
    code: 'SR-02',
    name: 'Tensor Protocol',
    spectrum: 'HARD',
    primaryStrand: 'R-Strand',
    secondaryStrand: 'G-Strand',
    domain: 'Matter, Engineering, Physical Constants',
    description: `Manipulating local Strand-density to alter physical constants in contained areas called Tensor fields. A Tensor can create rooms where gravity is ten times stronger, or where electromagnetic interactions behave differently. This is the basis of advanced manufacturing, architecture, and defense technology. Tensoring is how the great fortress-stations were built.`,
    shortDesc: 'Material engineering and physics manipulation',
    tiers: {
      foundational: 'Perceive material R-Strand structure, minor property modifications within arm\'s reach, surface shaping',
      professional: 'Create persistent Eigenforms, architectural-scale work, Tensor Fields (altered physics zones)',
      strategic: 'Molecular-level control, phase state authority, create materials with impossible properties',
      schema: 'Material Inscription (permanent novel materials), define physical rules within Existence Fields'
    },
    color: '#FF6347',
    icon: '🔨'
  },
  {
    id: 'fracturer',
    code: 'SR-03',
    name: 'Fracturer Protocol',
    spectrum: 'HARD',
    primaryStrand: 'R-Strand',
    secondaryStrand: 'S-Strand',
    domain: 'Destruction, Energy Release, Entropy',
    description: `Destabilizing Strands to release energy or disrupt physical structures at a distance. Fracturing is the weapon-art. A skilled Fracturer can collapse molecular bonds in a ship's hull from the inside, stop a heart by disrupting bioelectric Strands, or (at the extreme end) trigger localized Node Fractures. Fracturing is the reason Resonants are both revered and feared.`,
    shortDesc: 'Controlled destruction and entropy manipulation',
    tiers: {
      foundational: 'Perceive structural stress points, sever individual Strands (localized destruction within ~10m)',
      professional: 'Multi-Strand severance at range (~100m), entropy channeling, shield disruption',
      strategic: 'Selective annihilation, entropic tide (area-wide accelerated aging), Node destabilization',
      schema: 'Existence Severance (remove targets from reality), perfect entropy control, convergence perception'
    },
    color: '#DC143C',
    icon: '💥'
  },
  {
    id: 'kinetic',
    code: 'SR-04',
    name: 'Kinetic Protocol',
    spectrum: 'HARD',
    primaryStrand: 'G-Strand',
    secondaryStrand: 'L-Strand',
    domain: 'Gravity, Motion, Force',
    description: `Direct manipulation of gravitational fields and kinetic energy. Kinetics can create localized gravity wells, redirect momentum, or generate crushing force at a distance. They're the difference between being pinned to a deck by invisible pressure and floating free in zero-g combat.`,
    shortDesc: 'Gravity and momentum control',
    tiers: {
      foundational: 'Sense gravitational fields, minor gravity adjustments (personal levitation), momentum redirection',
      professional: 'Create localized gravity wells, kinetic barriers, momentum theft from targets',
      strategic: 'Gravitational singularities, orbital mechanics manipulation, planet-scale force projection',
      schema: 'Rewrite gravitational laws, create impossible orbital configurations, mass-energy equivalence'
    },
    color: '#4B0082',
    icon: '🌀'
  },
  
  // SOFT SPECTRUM (Information & Consciousness)
  {
    id: 'oracle',
    code: 'SS-01',
    name: 'Oracle Protocol',
    spectrum: 'SOFT',
    primaryStrand: 'S-Strand',
    secondaryStrand: 'C-Strand',
    domain: 'Probability, Prediction, Temporal Threads',
    description: `Reading S-Strand probability flows to perceive potential futures. Oracles don't see one future — they see probability distributions, branching timelines, decision-trees that haven't been traversed yet. Every choice creates ripples in the S-Strand substrate, and Oracles read those ripples.`,
    shortDesc: 'Probability perception and future prediction',
    tiers: {
      foundational: 'Perceive immediate probability branches (next few seconds), danger sense, lucky intuition',
      professional: 'Multiple-timeline perception (hours ahead), probability manipulation (nudge outcomes)',
      strategic: 'Days-ahead perception, causal editing (alter probability weights), convergence sight',
      schema: 'Timeline navigation, temporal inscription, perceive all possible futures simultaneously'
    },
    color: '#9370DB',
    icon: '🔮'
  },
  {
    id: 'cipher',
    code: 'SS-02',
    name: 'Cipher Protocol',
    spectrum: 'SOFT',
    primaryStrand: 'C-Strand',
    secondaryStrand: 'S-Strand',
    domain: 'Information, Communication, Mental Networks',
    description: `Perceiving and manipulating information encoded in C-Strand structures. Ciphers can read encrypted data, communicate mind-to-mind, detect lies by reading cognitive patterns, or create mental firewalls against intrusion. They are the Covenant's cryptographers, interrogators, and network security experts.`,
    shortDesc: 'Information manipulation and mental networking',
    tiers: {
      foundational: 'Detect lies, read surface emotions, basic encrypted communication',
      professional: 'Mind-to-mind communication networks, memory reading, information encryption/decryption',
      strategic: 'Mass cognition networks (telepathic battlefield coordination), thought-pattern analysis',
      schema: 'Consciousness editing, memory Inscription, create artificial minds in C-Strand substrate'
    },
    color: '#00CED1',
    icon: '🔐'
  },
  {
    id: 'archivist',
    code: 'SS-03',
    name: 'Archivist Protocol',
    spectrum: 'SOFT',
    primaryStrand: 'S-Strand',
    secondaryStrand: 'R-Strand',
    domain: 'History, Memory, Temporal Records',
    description: `Reading historical S-Strand records — the information-shadows that past events leave in the Lattice. Archivists can perceive what happened in a location days, years, or centuries ago by reading the residual Strand-patterns. They are living forensic tools, historians, and witnesses to things no one alive remembers.`,
    shortDesc: 'Historical perception and temporal memory',
    tiers: {
      foundational: 'Read recent history (past few hours) from objects and locations, detect Strand-memory traces',
      professional: 'Days-to-weeks historical reading, reconstruct past events with high fidelity',
      strategic: 'Centuries of history readable, historical editing (alter Strand-records), timeline archaeology',
      schema: 'Read the entire history of an object back to its creation, rewrite historical records in Lattice'
    },
    color: '#8B4513',
    icon: '📜'
  },
  {
    id: 'harmonic',
    code: 'SS-04',
    name: 'Harmonic Protocol',
    spectrum: 'SOFT',
    primaryStrand: 'C-Strand',
    secondaryStrand: 'S-Strand',
    domain: 'Emotion, Empathy, Group Consciousness',
    description: `Perceiving and modulating emotional C-Strand patterns. Harmonics can sense the emotional state of everyone in a room, calm a panicking crowd, amplify courage in soldiers, or create localized zones of euphoria or dread. They are therapists, diplomats, crowd controllers, and — when weaponized — psychological warfare specialists.`,
    shortDesc: 'Emotional perception and group synchronization',
    tiers: {
      foundational: 'Sense emotions within ~10m, emotional resonance (share feelings), calm/agitate individuals',
      professional: 'Room-scale emotional control, group emotional synchronization, mass morale effects',
      strategic: 'City-scale emotional influence, create persistent emotional Eigenforms (haunted locations)',
      schema: 'Rewrite emotional architecture, create artificial emotional experiences, consciousness harmonization'
    },
    color: '#FF69B4',
    icon: '💫'
  },
  
  // HYBRID SPECTRUM (Biological & Complex Systems)
  {
    id: 'vitalist',
    code: 'HS-01',
    name: 'Vitalist Protocol',
    spectrum: 'HYBRID',
    primaryStrand: 'S-Strand',
    secondaryStrand: 'R-Strand',
    domain: 'Biology, Medicine, Life Processes',
    description: `Perceiving and manipulating biological S-Strand patterns — the information-structures that define living processes. Vitalists are the Covenant's doctors, combat medics, and bio-engineers. They can accelerate healing, diagnose disease by Strand-perception, perform surgery at the cellular level, or (at higher Orders) create entirely new biological forms.`,
    shortDesc: 'Biological manipulation and medical arts',
    tiers: {
      foundational: 'Diagnose illness via S-Strand perception, accelerate natural healing, pain management',
      professional: 'Cellular-level surgery, disease eradication, biological enhancement, life-extension',
      strategic: 'Organ regeneration, species modification, biological Eigenforms (permanent enhancements)',
      schema: 'Create new life forms, biological Inscription, rewrite genetic code in living tissue'
    },
    color: '#32CD32',
    icon: '🧬'
  },
  {
    id: 'weaver',
    code: 'HS-02',
    name: 'Weaver Protocol',
    spectrum: 'HYBRID',
    primaryStrand: 'L-Strand',
    secondaryStrand: 'C-Strand',
    domain: 'Connection, Networks, System Integration',
    description: `Perceiving and creating connections between disparate Strand-structures. Weavers link systems that shouldn't connect: ship computers to Resonant minds, Geodesic paths to communication networks, multiple Resonants into synchronized action. They are system integrators, network architects, and the reason complex Covenant technology functions.`,
    shortDesc: 'Network creation and system integration',
    tiers: {
      foundational: 'Perceive existing Strand-connections, create temporary links between simple systems',
      professional: 'Build persistent connection networks, link multiple Resonants, system-wide integration',
      strategic: 'Lattice-scale networks (connect star systems), create self-sustaining connection Eigenforms',
      schema: 'Rewrite connection rules, create impossible integrations, universal network perception'
    },
    color: '#FFD700',
    icon: '🕸️'
  },
  {
    id: 'synthesist',
    code: 'HS-03',
    name: 'Synthesist Protocol',
    spectrum: 'HYBRID',
    primaryStrand: 'R-Strand',
    secondaryStrand: 'C-Strand',
    domain: 'Hybrid Systems, Resonant Technology',
    description: `Integrating Resonant abilities with conventional technology. Synthesists build the artifacts, the Schema Interfaces, the Conduit Matrices — the hybrid devices that allow Resonants to exceed their natural limitations. They understand both conventional engineering and Strand-manipulation, bridging the gap between mundane and Resonant tech.`,
    shortDesc: 'Resonant artifact creation and hybrid engineering',
    tiers: {
      foundational: 'Understand Resonant artifact function, minor artifact repair, basic hybrid device creation',
      professional: 'Create Conduit Matrices (Class III artifacts), design Resonant-augmented equipment',
      strategic: 'Manufacture Schema Interfaces (Class V artifacts), create novel hybrid technologies',
      schema: 'Artifact Inscription (self-improving devices), create autonomous Resonant systems'
    },
    color: '#FF8C00',
    icon: '⚙️'
  },
  
  // EXOTIC SPECTRUM (Rare & Dangerous)
  {
    id: 'voidwalker',
    code: 'EX-01',
    name: 'Voidwalker Protocol',
    spectrum: 'HYBRID',
    primaryStrand: 'Ø-Strand',
    secondaryStrand: 'L-Strand',
    domain: 'The Void, Null-Space, Absence',
    description: `The rarest and most poorly understood Protocol. Voidwalkers perceive and manipulate Ø-Strand — the null-space between Strands, the absence that defines presence. They can create zones where Strand-structures cease to exist, step outside the Lattice entirely, or perceive the spaces between realities. Fewer than ten Voidwalkers have ever existed.`,
    shortDesc: 'Void manipulation and existence/non-existence boundary work',
    tiers: {
      foundational: 'Perceive Ø-Strand gaps, create small null-zones (Strand-dead areas)',
      professional: 'Step into null-space (temporary invisibility to Strand-perception), larger null-zones',
      strategic: 'Void-walking (exist partially outside the Lattice), create persistent absence',
      schema: 'Rewrite existence/non-existence boundaries, perceive what lies beyond the Lattice'
    },
    color: '#000000',
    icon: '🌑'
  },
  {
    id: 'paradigm',
    code: 'EX-02',
    name: 'Paradigm Protocol',
    spectrum: 'HYBRID',
    primaryStrand: 'All Strand-types',
    domain: 'Universal Integration, Protocol Convergence',
    description: `Not truly a distinct Protocol — it's what happens when a Resonant reaches Schema-level understanding across multiple Protocols. Paradigm practitioners perceive the Lattice as a unified whole rather than discrete Strand-types. They begin operating at the level of fundamental reality manipulation. Only two have ever existed: the Eldest, and the Builder.`,
    shortDesc: 'Multi-Protocol mastery and universal Strand manipulation',
    tiers: {
      foundational: 'N/A - requires Fourth Order minimum in at least two Protocols',
      professional: 'N/A',
      strategic: 'N/A',
      schema: 'Perceive all Strand-types simultaneously, manipulate multiple Protocols at once, Inscription capability'
    },
    color: '#FFFFFF',
    icon: '✨'
  },
  {
    id: 'inscriber',
    code: 'EX-03',
    name: 'Inscriber Protocol',
    spectrum: 'HYBRID',
    primaryStrand: 'Unknown',
    domain: 'Lattice Writing, Reality Authorship',
    description: `The forbidden art. Creating new Strand-content — literally writing new physics into reality. This was thought to be impossible until someone proved otherwise. Inscription breaks the fundamental model of how the Lattice works. It implies either a deeper layer nobody understands, or access to something outside the known universe entirely. The existence of even one Inscriber threatens the entire Covenant treaty system.`,
    shortDesc: 'Reality authorship and fundamental physics modification',
    tiers: {
      foundational: 'Unknown - no documented cases below Schema level',
      professional: 'Unknown',
      strategic: 'Unknown',
      schema: 'Write new Strand-structures, create novel physics, add information to universe\'s substrate'
    },
    color: '#FF00FF',
    icon: '✍️'
  }
];

export function getProtocolById(id: string): Protocol | undefined {
  return PROTOCOLS.find(p => p.id === id);
}

export function getProtocolsBySpectrum(spectrum: ProtocolSpectrum): Protocol[] {
  return PROTOCOLS.filter(p => p.spectrum === spectrum);
}

export function getHardSpectrumProtocols(): Protocol[] {
  return getProtocolsBySpectrum('HARD');
}

export function getSoftSpectrumProtocols(): Protocol[] {
  return getProtocolsBySpectrum('SOFT');
}

export function getHybridSpectrumProtocols(): Protocol[] {
  return getProtocolsBySpectrum('HYBRID');
}
