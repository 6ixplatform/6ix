// hooks/useSpeech.ts
'use client';

import { useCallback, useRef, useState } from 'react';

export function useSpeech() {
    const [speaking, setSpeaking] = useState(false);
    const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

    const speak = useCallback((text: string, lang?: string) => {
        if (!('speechSynthesis' in window)) return false;
        try {
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            u.rate = 1.0;
            u.pitch = 1.0;
            if (lang) u.lang = lang;
            u.onend = () => setSpeaking(false);
            u.onerror = () => setSpeaking(false);
            utterRef.current = u;
            setSpeaking(true);
            window.speechSynthesis.speak(u);
            return true;
        } catch {
            setSpeaking(false);
            return false;
        }
    }, []);

    const stop = useCallback(() => {
        try { window.speechSynthesis.cancel(); } catch { }
        setSpeaking(false);
    }, []);

    return { speak, stop, speaking };
}
