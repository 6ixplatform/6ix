'use client';
import { useEffect } from 'react';

const BYTES = 1024 * 1024; // 1 MB

export default function VideoWarmup({ urls = [] as string[] }) {
    useEffect(() => {
        let aborted = false;

        (async () => {
            for (const u of urls) {
                try {
                    // Posters / images: just cache them
                    if (/\.(avif|webp|jpg|jpeg|png)$/i.test(u)) {
                        await fetch(u, { mode: 'no-cors' as any, cache: 'force-cache' });
                        continue;
                    }
                    // Videos: fetch first chunk to warm TCP/TLS & browser cache
                    await fetch(u, {
                        headers: { Range: `bytes=0-${BYTES - 1}` },
                        cache: 'reload',
                        mode: 'cors',
                        credentials: 'omit',
                    }).catch(() => { });
                } catch { }
                if (aborted) break;
            }
        })();

        return () => { aborted = true; };
    }, [urls.join('|')]);

    return null;
}
