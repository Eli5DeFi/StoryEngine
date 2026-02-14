import { Metadata } from 'next';
import { NVIDashboard } from '@/components/betting/NVIDashboard';

export const metadata: Metadata = {
  title: 'NVI Terminal | Voidborne',
  description: 'Trade narrative volatility - The Bloomberg Terminal for stories',
  openGraph: {
    title: 'NVI Terminal - Professional Story Trading',
    description: 'Real-time volatility index for interactive stories. Trade options on narrative unpredictability.',
    images: ['/og-nvi-terminal.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NVI Terminal | Voidborne',
    description: 'The Bloomberg Terminal for stories - trade narrative volatility',
    images: ['/og-nvi-terminal.png'],
  },
};

export default function NVIPage() {
  return (
    <main className="min-h-screen bg-black">
      <NVIDashboard />
    </main>
  );
}
