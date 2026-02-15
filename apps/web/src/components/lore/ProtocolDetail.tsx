import type { Protocol } from '@/content/lore';

interface ProtocolDetailProps {
  protocol: Protocol;
}

function getSpectrumColor(spectrum: string): string {
  switch (spectrum) {
    case 'HARD':
      return 'text-red-500';
    case 'SOFT':
      return 'text-blue-500';
    case 'HYBRID':
      return 'text-purple-500';
    default:
      return 'text-muted-foreground';
  }
}

export function ProtocolDetail({ protocol }: ProtocolDetailProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-l-4 pl-6" style={{ borderColor: protocol.color }}>
        <div className="mb-2 flex items-start gap-4">
          <span className="text-5xl">{protocol.icon}</span>
          <div className="flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-muted px-3 py-1 text-sm font-mono">
                {protocol.code}
              </span>
              <span className={`font-bold ${getSpectrumColor(protocol.spectrum)}`}>
                {protocol.spectrum} SPECTRUM
              </span>
            </div>
            <h1 className="text-4xl font-bold">{protocol.name}</h1>
            <p className="mt-1 text-xl text-muted-foreground">{protocol.shortDesc}</p>
          </div>
        </div>
      </div>

      {/* Strand Information */}
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-2xl font-bold">Strand Configuration</h2>
        <div className="flex flex-wrap gap-4">
          <div>
            <p className="mb-1 text-sm text-muted-foreground">Primary Strand</p>
            <span className="inline-block rounded-full bg-primary/20 px-4 py-2 font-bold text-primary">
              {protocol.primaryStrand}
            </span>
          </div>
          {protocol.secondaryStrand && (
            <div>
              <p className="mb-1 text-sm text-muted-foreground">Secondary Strand</p>
              <span className="inline-block rounded-full bg-muted px-4 py-2 font-medium">
                {protocol.secondaryStrand}
              </span>
            </div>
          )}
          <div>
            <p className="mb-1 text-sm text-muted-foreground">Domain</p>
            <span className="inline-block rounded-full bg-muted px-4 py-2 font-medium">
              {protocol.domain}
            </span>
          </div>
        </div>
      </section>

      {/* Description */}
      <section>
        <h2 className="mb-4 text-2xl font-bold">Overview</h2>
        <p className="text-lg leading-relaxed text-muted-foreground">
          {protocol.description}
        </p>
      </section>

      {/* Tier Progression */}
      <section>
        <h2 className="mb-6 text-2xl font-bold">Power Progression</h2>
        <div className="space-y-4">
          {/* Tier 1: Foundational */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="mb-3 flex items-center gap-3">
              <div 
                className="flex h-10 w-10 items-center justify-center rounded-full font-bold text-white"
                style={{ backgroundColor: protocol.color }}
              >
                1
              </div>
              <div>
                <h3 className="text-lg font-bold">Tier 1: Foundational</h3>
                <p className="text-sm text-muted-foreground">9th–8th Order (Initiate)</p>
              </div>
            </div>
            <p className="leading-relaxed text-muted-foreground">
              {protocol.tiers.foundational}
            </p>
          </div>

          {/* Tier 2: Professional */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="mb-3 flex items-center gap-3">
              <div 
                className="flex h-10 w-10 items-center justify-center rounded-full font-bold text-white"
                style={{ backgroundColor: protocol.color }}
              >
                2
              </div>
              <div>
                <h3 className="text-lg font-bold">Tier 2: Professional</h3>
                <p className="text-sm text-muted-foreground">7th–6th Order (Practitioner)</p>
              </div>
            </div>
            <p className="leading-relaxed text-muted-foreground">
              {protocol.tiers.professional}
            </p>
          </div>

          {/* Tier 3: Strategic */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="mb-3 flex items-center gap-3">
              <div 
                className="flex h-10 w-10 items-center justify-center rounded-full font-bold text-white"
                style={{ backgroundColor: protocol.color }}
              >
                3
              </div>
              <div>
                <h3 className="text-lg font-bold">Tier 3: Strategic</h3>
                <p className="text-sm text-muted-foreground">5th Order (Master)</p>
              </div>
            </div>
            <p className="leading-relaxed text-muted-foreground">
              {protocol.tiers.strategic}
            </p>
          </div>

          {/* Tier 4: Schema */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="mb-3 flex items-center gap-3">
              <div 
                className="flex h-10 w-10 items-center justify-center rounded-full font-bold text-white"
                style={{ backgroundColor: protocol.color }}
              >
                4
              </div>
              <div>
                <h3 className="text-lg font-bold">Tier 4: Schema</h3>
                <p className="text-sm text-muted-foreground">4th Order (Transcendent)</p>
              </div>
            </div>
            <p className="leading-relaxed text-muted-foreground">
              {protocol.tiers.schema}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
