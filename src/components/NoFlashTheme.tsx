'use client';
import Script from 'next/script';

export default function NoFlashTheme() {
    const code = `(function () {
try {
var KEY='6ix:themeMode';
var saved = localStorage.getItem(KEY) || 'system';
var palette = localStorage.getItem('6ix:palette'); // optional override
var sysDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

var dark = (saved === 'dark') || (saved === 'system' && sysDark);
if (palette === 'dark' || palette === 'black') dark = true;
if (palette === 'light') dark = false;

var d = document.documentElement;
d.classList.toggle('theme-dark', dark);
d.classList.toggle('theme-light', !dark);
d.style.colorScheme = dark ? 'dark' : 'light';

var bg = dark ? '#0b0b0b' : '#ffffff';
var text = dark ? '#ffffff' : '#0b0c10';

// minimal tokens used by your pages & spinners/icons
d.style.setProperty('--th-bg', bg);
d.style.setProperty('--th-text', text);
d.style.setProperty('--spinner-stroke', dark ? 'rgba(255,255,255,.72)' : 'rgba(0,0,0,.72)');

// keep browser UI in sync
var meta = document.querySelector('meta[name="theme-color"]');
if (meta) meta.setAttribute('content', bg);

// prevent first-paint flash
var s = document.createElement('style');
s.id = '__no_flash_theme__';
s.textContent = 'html,body{background:'+bg+'!important;color:'+text+'!important}';
document.head.appendChild(s);
} catch(_) {}
})();`;

    return (
        <Script id="no-flash-theme" strategy="beforeInteractive"
            dangerouslySetInnerHTML={{ __html: code }} />
    );
}
