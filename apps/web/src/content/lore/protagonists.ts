// The Five Protagonists
// Source: VOIDBORNE_SETTING_BIBLE_v1.1.md Section IV

export interface Protagonist {
  id: string;
  name: string;
  title: string;
  houseId: string;
  protocolId?: string;
  order?: number;
  background: string;
  greyArea: string;
  centralQuestion: string;
  quote?: string;
  traits: string[];
}

export const PROTAGONISTS: Protagonist[] = [
  {
    id: 'sera-valdris',
    name: 'Sera Valdris',
    title: 'The Heir Who Doesn\'t Want the Throne',
    houseId: 'valdris',
    protocolId: 'geodesist',
    order: 6, // Sixth Order - Navigator
    background: `Third-born daughter of the Valdris ruling family. She was never supposed to matter — her two older brothers were groomed for succession. Then her eldest brother was assassinated, and the second defected to House Solvane (or was kidnapped — the truth is unclear). Now Sera is the heir, and she is not ready.
    
Sera was trained at the Axiom before being recalled for succession. She is an exceptional navigator, which makes her dangerous in ways her court doesn't expect. Her ability to perceive spatial geometry extends beyond simple Geodesic navigation — she sees the political landscape the same way she sees Strand-corridors: as pathways with stable routes and dangerous branches.`,
    greyArea: `Sera is compassionate and reformist in a House that runs on controlled violence. She wants to change Valdris from within — end the succession blood-rites, share Lumenase production more equitably, and reduce military spending. But every concession she makes is read as weakness by the Blade-Peers, and her reforms keep getting people killed through unintended consequences.
    
She's learning that good intentions are a luxury the powerful can't always afford. Her attempts to be merciful create power vacuums that others exploit. Her efforts to build consensus are seen as indecision. And every time she hesitates to use the tools of power her House respects — force, intimidation, calculated cruelty — someone dies because she wasn't ruthless enough.`,
    centralQuestion: 'Can you reform a system of power without becoming the thing you\'re trying to change?',
    quote: '"My father told me the Iron Throne is built on corpses. I thought he was speaking metaphorically. He wasn\'t."',
    traits: [
      'Compassionate reformist',
      'Exceptional Geodesist',
      'Reluctant heir',
      'Idealistic but learning hard lessons',
      'Sees political strategy spatially',
      'Struggles with necessary cruelty'
    ]
  },
  {
    id: 'rael-thorn',
    name: 'Rael Thorn',
    title: 'The Axiom\'s Sharpest Blade',
    houseId: 'meridian', // Born in Meridian, but raised by the Axiom
    protocolId: 'fracturer',
    order: 5, // Fifth Order - Annihilator (rumored)
    background: `A Fracturer of extraordinary talent, born in the slums of Meridian's industrial core. The Axiom took him at six. He remembers nothing of his family. He is the Proof's most trusted operative — their assassin, their problem-solver, their weapon pointed at whoever threatens the Axiom's neutrality.
    
Rael believes in the Axiom's mission with religious intensity. The Covenant survives because the Axiom keeps the balance. He's killed good people to maintain that balance, and he sleeps fine. His emotional architecture processes destruction as problem-solving, not violence. His heartrate doesn't change during combat. The Proof's psychological conditioning made this possible — and made him slightly terrifying to work alongside.`,
    greyArea: `Rael's faith in the Axiom is absolute. He believes neutrality is sacred, that the balance of power must be preserved, that the Proof's orders serve peace even when they require bloodshed. But he's starting to notice that those orders don't always serve neutrality — they serve the Proof's own power.
    
When he's ordered to eliminate someone who might be the first Inscriber in history, he has to decide: is he a soldier of peace, or just another powerful faction's weapon? Does the Axiom serve the Covenant, or does the Covenant serve the Axiom? And if the institution that made him everything he is has been lying about its purpose, what does he owe it?`,
    centralQuestion: 'What do you owe an institution that made you everything you are, when you discover it\'s becoming the thing it was created to prevent?',
    quote: '"I\'ve killed sixteen people to preserve the peace. Not one of them deserved it. Not one of them could be allowed to live."',
    traits: [
      'Emotionally flat in combat',
      'Absolute faith (beginning to crack)',
      'Fifth Order Fracturer (strategic threat)',
      'The Proof\'s most trusted operative',
      'Processes killing as problem-solving',
      'Starting to question orders'
    ]
  },
  {
    id: 'lienne-sol-ashura',
    name: 'Lienne Sol-Ashura',
    title: 'The Heretic Priestess',
    houseId: 'ashura',
    protocolId: 'tensor',
    order: 7, // Seventh Order - Artificer (hidden)
    background: `A high-ranking priestess of the Ashura Atonement faith — the religion built on guilt over the Node Fractures. She preaches that Resonance is humanity's original sin, that the Nodes are sacred wounds, and that the only path forward is renunciation of Lattice manipulation.
    
She is also, secretly, a Tensor. One of the most talented the Axiom has ever produced. She hid her abilities during childhood testing. She has been practicing in secret for twenty years. Her Tensor work is more precise than academy-trained Artificers because she learned from Ashura engineering texts that emphasize understanding *why* materials respond, not just how to make them respond.`,
    greyArea: `Lienne isn't a hypocrite — she genuinely believes Resonance is dangerous and that humanity needs to find another path. But she also knows that unilateral disarmament is suicide. She uses her hidden Tensoring abilities to protect Ashura's humanitarian missions in places where prayer isn't enough.
    
Every time she runs a Resonance, she feels like she's proving her own faith wrong. And she's starting to wonder if the Atonement religion itself is being used as a tool of political control by the Tribunal. Does her faith teach that Resonance is sin because it's true? Or because the Tribunal benefits from Ashura's voluntary weakness? Can faith survive the discovery that everything it taught you was built on a political lie?`,
    centralQuestion: 'Can faith survive the discovery that everything it taught you was built on a political lie?',
    quote: '"I pray for forgiveness every time I touch the Strands. Not because I think I\'m wrong. Because I know I\'m right."',
    traits: [
      'High-ranking Atonement priestess',
      'Secret Seventh Order Tensor',
      'Self-taught (Ashura engineering texts)',
      'Genuinely believes Resonance is dangerous',
      'Uses forbidden power to save lives',
      'Questioning religious authority'
    ]
  },
  {
    id: 'daekon-yen-kai',
    name: 'Daekon Yen-Kai',
    title: 'The Navigator Who Found Something He Shouldn\'t Have',
    houseId: 'yen-kai',
    protocolId: 'geodesist',
    order: 7, // Seventh Order - Pilot (with anomalous abilities)
    background: `A Fleet-Father's son, born on a Yen-Kai deep-range exploration vessel. Daekon has spent his entire life in Geodesics — the spaces between systems, where reality gets thin and strange. He's the finest navigator of his generation.
    
During a routine deep-range survey, he found something in the Lattice that shouldn't exist: a structure. Artificial. Ancient. And it was *Inscribing new Strands in real time.* He reported his finding to the Yen-Kai council. They told him to forget it. When he pushed, his ship was reassigned to a garbage route. When he pushed harder, people around him started dying in "accidents." Now Daekon is on the run.`,
    greyArea: `Daekon is carrying data that could either save or destroy the Covenant. He knows where the Inscriber structure is. He has sensor logs proving it exists. He's begun experiencing anomalous perceptions since his encounter — reading Strands that other Resonants can't detect, hearing something he describes as "the sound the universe makes when it breathes."
    
Every House would kill for this information. Every intelligence service is hunting him. He's trying to figure out who to trust with a truth that could end civilization. Does he give it to the Axiom? To his own House? Does he destroy the data and pretend he never found it? And can he trust his own perceptions anymore, or is the Inscriber structure changing him in ways he doesn't understand?`,
    centralQuestion: 'When you discover a truth that could end a civilization, who has the right to decide what to do with it?',
    quote: '"I can hear it. The Builder\'s voice, still echoing in the deep Geodesics. And it\'s saying something. I just don\'t know if it\'s a warning or an invitation."',
    traits: [
      'Finest navigator of his generation',
      'Found the Inscriber structure',
      'On the run from multiple Houses',
      'Experiencing anomalous Resonance',
      'Carrying civilization-ending data',
      'Yen-Kai nomad (no fixed loyalty)'
    ]
  },
  {
    id: 'vaelith-solvane',
    name: 'Vaelith Solvane',
    title: 'The Spymaster\'s Daughter',
    houseId: 'solvane',
    protocolId: undefined, // Lattice-null (cannot Resonate)
    order: undefined,
    background: `Heir to one of the secret seats on Solvane's Whisper Court. Vaelith was raised in information warfare from birth — she learned to lie before she learned to read. She runs Solvane's most sensitive operations: the ones that manipulate other Houses' internal politics to maintain the balance of power that keeps Solvane safe.
    
She is also the handler of Sera Valdris's defected (or kidnapped) brother. She knows exactly what happened to him. And she's the one who arranged it. Vaelith is Lattice-null — she cannot Resonate at all. In a civilization that revolves around Resonants, she has clawed her way to power through pure intellect, manipulation, and an utter refusal to be irrelevant.`,
    greyArea: `Vaelith isn't cruel. She's pragmatic. She genuinely believes that information asymmetry keeps the peace — that if every House knew what every other House was doing, the paranoia would trigger the war they're all trying to prevent. She lies, manipulates, and destroys lives because she believes the alternative is 40 billion more corpses.
    
But she's starting to realize that her information network has been compromised by something she can't identify — an intelligence source that seems to know things before they happen. Some of her oldest, most trusted operations are producing results that benefit someone she can't see. She's the person who sees everything, and someone is operating in her blind spot. That terrifies her more than any Resonant power ever could.`,
    centralQuestion: 'In a world where power flows from abilities you don\'t have, how far will you go to stay at the table?',
    quote: '"I can\'t move mountains. I can\'t fold space. I can\'t see the future. So I make sure the people who can are too busy fighting each other to notice me pulling the strings."',
    traits: [
      'Lattice-null (no Resonance ability)',
      'Whisper Court heir',
      'Master manipulator',
      'Genuinely believes in information control for peace',
      'Handler of Sera\'s brother',
      'Compromised intelligence network'
    ]
  }
];

export function getProtagonistById(id: string): Protagonist | undefined {
  return PROTAGONISTS.find(p => p.id === id);
}

export function getProtagonistsByHouse(houseId: string): Protagonist[] {
  return PROTAGONISTS.filter(p => p.houseId === houseId);
}

export function getProtagonistsByProtocol(protocolId: string): Protagonist[] {
  return PROTAGONISTS.filter(p => p.protocolId === protocolId);
}

export function getResonantProtagonists(): Protagonist[] {
  return PROTAGONISTS.filter(p => p.protocolId !== undefined);
}

export function getNonResonantProtagonists(): Protagonist[] {
  return PROTAGONISTS.filter(p => p.protocolId === undefined);
}
