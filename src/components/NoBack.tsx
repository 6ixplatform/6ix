'use client';
import { useEffect } from 'react';

export default function NoBack() {
    useEffect(() => {
        // make a forward entry so going "back" bounces forward
        window.history.pushState(null, '', window.location.href);
        const onPop = () => window.history.go(1); // cancel back
        window.addEventListener('popstate', onPop);
        return () => window.removeEventListener('popstate', onPop);
    }, []);
    return null;
}