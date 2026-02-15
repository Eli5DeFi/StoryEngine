import { PROTOCOLS, getHardSpectrumProtocols, getSoftSpectrumProtocols, getHybridSpectrumProtocols } from '@/content/lore';
import { ProtocolCard } from '@/components/lore/ProtocolCard';

export const metadata = {
  title: 'The Fourteen Protocols - Voidborne Lore',
  description: 'The disciplines of Resonance',
};

export default function ProtocolsPage() {
  const hardSpectrum = getHardSpectrumProtocols();
  const softSpectrum = getSoftSpectrumProtocols();
  const hybridSpectrum = getHybridSpectrumProtocols();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-4 text-4xl font-bold">The Fourteen Protocols</h1>
        <p className="max-w-3xl text-lg text-muted-foreground">
          Humans cannot naturally perceive Strands. But through a combination of genetic modification, 
          neural augmentation, and a substance called <strong>Lumenase</strong>, certain individuals develop 
          the ability to sense and manipulate local Lattice structures. These individuals are called{' '}
          <strong>Resonants</strong>, and their abilities are categorized into fourteen distinct Protocols.
        </p>
      </div>

      {/* Hard Spectrum */}
      <section className="mb-12">
        <div className="mb-6">
          <h2 className="mb-2 text-3xl font-bold">
            Hard Spectrum <span className="text-red-500">(Structural)</span>
          </h2>
          <p className="text-muted-foreground">
            Protocols that manipulate physical reality: space, matter, gravity, and energy.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {hardSpectrum.map(protocol => (
            <ProtocolCard key={protocol.id} protocol={protocol} />
          ))}
        </div>
      </section>

      {/* Soft Spectrum */}
      <section className="mb-12">
        <div className="mb-6">
          <h2 className="mb-2 text-3xl font-bold">
            Soft Spectrum <span className="text-blue-500">(Information)</span>
          </h2>
          <p className="text-muted-foreground">
            Protocols that work with information, consciousness, probability, and temporal patterns.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {softSpectrum.map(protocol => (
            <ProtocolCard key={protocol.id} protocol={protocol} />
          ))}
        </div>
      </section>

      {/* Hybrid Spectrum */}
      <section>
        <div className="mb-6">
          <h2 className="mb-2 text-3xl font-bold">
            Hybrid Spectrum <span className="text-purple-500">(Complex Systems)</span>
          </h2>
          <p className="text-muted-foreground">
            Protocols that integrate multiple Strand-types: biological systems, networks, and exotic phenomena.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {hybridSpectrum.map(protocol => (
            <ProtocolCard key={protocol.id} protocol={protocol} />
          ))}
        </div>
      </section>
    </div>
  );
}
