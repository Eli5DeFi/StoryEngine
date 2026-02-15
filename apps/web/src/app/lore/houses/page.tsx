import { HOUSES } from '@/content/lore';
import { HouseCard } from '@/components/lore/HouseCard';

export const metadata = {
  title: 'The Seven Houses - Voidborne Lore',
  description: 'The political powers of the Covenant',
};

export default function HousesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-4 text-4xl font-bold">The Seven Houses</h1>
        <p className="max-w-3xl text-lg text-muted-foreground">
          After the Fracturing — a period of catastrophic interstellar wars that ended with three Node 
          Fractures and the deaths of 40 billion people — the surviving human civilizations formed the 
          Covenant. Seven Houses. One treaty. One rule: <em>No House shall Fracture a Node, and no House 
          shall monopolize the Resonants.</em>
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {HOUSES.map(house => (
          <HouseCard key={house.id} house={house} />
        ))}
      </div>
    </div>
  );
}
