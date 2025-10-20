import type { Metadata } from 'next';
import FeedSoonModal from '@/components/modals/FeedSoonModal';

export const metadata: Metadata = {
    title: '6FEED — coming soon',
    description: 'A safer, culture-rich, creator-first feed. Notify me at launch.',
    openGraph: { images: ['/og.png'], title: '6FEED — coming soon', description: 'A safer, culture-rich, creator-first feed.' },
    twitter: { card: 'summary_large_image', images: ['/og.png'], title: '6FEED — coming soon', description: 'A safer, culture-rich, creator-first feed.' },
};

export default function FeedPage() {
    // Renders the modal UI as the whole page
    return <FeedSoonModal open />;
}