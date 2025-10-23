import { Suspense } from 'react';
import PremiumClient from './PremiumClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default function Page() {
    return (
        <Suspense fallback={<main className="px-4 py-10 text-white">Loading…</main>}>
            <PremiumClient />
        </Suspense>
    );
}