// src/app/checkout/page.tsx
import { Suspense } from 'react';
import CheckoutClient from './CheckoutClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default function Page() {
    return (
        <Suspense fallback={<main className="px-4 py-10"><h1>Checkout</h1><p>Loading…</p></main>}>
            <CheckoutClient />
        </Suspense>
    );
}