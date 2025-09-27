'use client';
import { useEffect } from 'react';

export default function BackStopper() {
    useEffect(() => {
        const here = window.location.pathname + window.location.search;
        history.pushState(null, '', here);
        const onPop = () => history.pushState(null, '', here); // cancel back
        window.addEventListener('popstate', onPop);
        return () => window.removeEventListener('popstate', onPop);
    }, []);
    return null;
}
