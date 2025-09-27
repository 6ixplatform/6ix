import { Suspense } from 'react';
import VerifyClient from './VerifyClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export default function Page() {
    return (
        <Suspense fallback={<div />}>
            <VerifyClient />
        </Suspense>
    );
}