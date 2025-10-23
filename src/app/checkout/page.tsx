import { Suspense } from 'react';
import CheckoutClient from './CheckoutClient';

export const runtime = 'nodejs'; // optional, but avoids edge quirks
export const dynamic = 'force-dynamic'; // no prerender; fixes prerender error

export default function Page() {
    return (
        <Suspense fallback={
            <main className="mx-auto max-w-[720px] px-4 py-10">
                <h1 className="text-3xl font-semibold text-white/95 mb-2">Checkout</h1>
                <p className="text-white/70">Loading…</p>
            </main>
        }>
            <CheckoutClient />
        </Suspense>
    );
}