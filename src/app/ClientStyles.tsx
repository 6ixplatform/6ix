'use client';




export default function ClientStyles() {
    return (
        <style jsx global>{`
/* keep text size stable on iOS and avoid auto-zoom */
:root { -webkit-text-size-adjust: 100%; }
input, textarea, select { font-size: 16px; }

/* make the page behave like a chat app */
html, body { height: 100%; }
body { overscroll-behavior-y: contain; }

/* any other global styled-jsx you previously put in layout.tsx can live here */
`}</style>
    );
}