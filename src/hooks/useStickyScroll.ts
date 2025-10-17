// /src/hooks/useStickyScroll.ts
'use client';
import * as React from 'react';

type ScrollMode = ScrollBehavior | 'instant';

export function useStickyScroll(dep: any) {
    const scrollRef = React.useRef<HTMLDivElement | null>(null); // the scrolling container
    const endRef = React.useRef<HTMLDivElement | null>(null); // an empty anchor at the end
    const stickRef = React.useRef(true); // should we stick to bottom?

    const isNearBottom = (el: HTMLElement) =>
        el.scrollHeight - (el.scrollTop + el.clientHeight) < 64;

    const scrollToBottom = (mode: ScrollMode = 'smooth') => {
        const el = scrollRef.current;
        if (!el) return;
        if (mode === 'instant') el.scrollTop = el.scrollHeight;
        else el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    };

    // Track whether the user is near the bottom (only then we autoscroll)
    React.useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const onScroll = () => (stickRef.current = isNearBottom(el));
        el.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        return () => el.removeEventListener('scroll', onScroll);
    }, []);

    // When messages change, scroll if we’re sticking
    React.useEffect(() => {
        if (stickRef.current) {
            // anchor avoids iOS scroll-jank better than manual .scrollTop
            endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
        }
    }, [dep]); // pass messages.length as dep

    // If the viewport height changes (mobile keyboard), keep bottom in view
    React.useEffect(() => {
        const vv = (typeof window !== 'undefined' && window.visualViewport) || null;
        if (!vv) return;
        const onResize = () => { if (stickRef.current) endRef.current?.scrollIntoView({ block: 'end' }); };
        vv.addEventListener('resize', onResize);
        return () => vv.removeEventListener('resize', onResize);
    }, []);

    // If content grows (images loading), nudge bottom
    React.useEffect(() => {
        const el = scrollRef.current;
        if (!el || !('ResizeObserver' in window)) return;
        const ro = new ResizeObserver(() => { if (stickRef.current) scrollToBottom('instant'); });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    return { scrollRef, endRef, scrollToBottom };
}
