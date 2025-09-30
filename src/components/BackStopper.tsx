'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function BackStopper({
    flowKey = 'auth',
    firstStep = false, // true only on /auth/signup
    lockBack = true,
}: {
    flowKey?: string;
    firstStep?: boolean;
    lockBack?: boolean;
}) {
    const path = usePathname();
    const router = useRouter();

    useEffect(() => {
        if (!lockBack) return;

        // Was the previous page off-site?
        const ref = document.referrer;
        let fromExternal = false;
        try { fromExternal = !!ref && new URL(ref).origin !== location.origin; } catch { }

        // Remember the current step (used for refresh restore)
        try { localStorage.setItem(`6ix:${flowKey}:currentPath`, path || location.pathname); } catch { }

        // Mark our state and optionally create a "trap" entry
        history.replaceState({ ...(history.state || {}), __6ixLock: true }, '');
        const shouldTrap = !firstStep || !fromExternal; // trap everywhere except first step with external referrer
        if (shouldTrap) history.pushState({ __6ixTrap: true }, '');

        const onPop = () => {
            if (!shouldTrap) return; // let them leave to external on the very first step
            history.pushState({ __6ixTrap: true }, ''); // bounce forward (stay here)
        };
        window.addEventListener('popstate', onPop);
        return () => window.removeEventListener('popstate', onPop);
    }, [path, flowKey, firstStep, lockBack]);

    // Hard-refresh safety: if CSR path mismatches the saved step, put them back
    useEffect(() => {
        try {
            const want = localStorage.getItem(`6ix:${flowKey}:currentPath`);
            if (want && want !== path) router.replace(want);
        } catch { }
        // run once
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
}
