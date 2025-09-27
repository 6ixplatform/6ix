'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

/**
* Blocks back navigation (prevents users from going back to onboarding, etc).
* Mount this once at the top of any page where “back” should be disabled.
*/
export default function BackStopper() {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Push a state so the first back goes here, then immediately push forward again.
        const push = () => {
            try { history.pushState(null, '', document.URL); } catch { }
        };

        // Initial double-push makes iOS Safari respect the block.
        push();
        push();

        const onPop = (e: PopStateEvent) => {
            // Immediately “cancel” back by pushing forward to current route.
            e.preventDefault?.();
            // Replace to current path so there is nothing behind us.
            router.replace(pathname);
            // Re-push the guard state.
            push();
        };

        window.addEventListener('popstate', onPop);
        return () => window.removeEventListener('popstate', onPop);
    }, [router, pathname]);

    return null;
}
