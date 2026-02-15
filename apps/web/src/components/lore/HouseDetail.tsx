import type { House } from '@/content/lore';

interface HouseDetailProps {
  house: House;
}

export function HouseDetail({ house }: HouseDetailProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-l-4 pl-6" style={{ borderColor: house.color }}>
        <div className="mb-2 flex items-center gap-3">
          <span className="text-5xl">{house.icon}</span>
          <div>
            <h1 className="text-4xl font-bold">{house.name}</h1>
            <p className="text-xl text-muted-foreground">{house.title}</p>
          </div>
        </div>
      </div>

      {/* Description */}
      <section>
        <h2 className="mb-4 text-2xl font-bold">Overview</h2>
        <p className="text-lg leading-relaxed text-muted-foreground">
          {house.description}
        </p>
      </section>

      {/* Governance */}
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-2xl font-bold">Governance</h2>
        <p className="leading-relaxed text-muted-foreground">
          {house.governance}
        </p>
      </section>

      {/* Strengths & Weaknesses */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Strengths */}
        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-2xl font-bold text-green-500">Strengths</h2>
          <ul className="space-y-2">
            {house.strengths.map((strength, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1 text-green-500">✓</span>
                <span className="text-muted-foreground">{strength}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Weaknesses */}
        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-2xl font-bold text-red-500">Weaknesses</h2>
          <ul className="space-y-2">
            {house.weaknesses.map((weakness, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1 text-red-500">✗</span>
                <span className="text-muted-foreground">{weakness}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Culture */}
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-2xl font-bold">Culture & Identity</h2>
        <div className="whitespace-pre-line leading-relaxed text-muted-foreground">
          {house.culture}
        </div>
      </section>
    </div>
  );
}
