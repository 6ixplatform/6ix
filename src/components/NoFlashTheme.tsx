'use client';
import Script from 'next/script';

export default function NoFlashTheme() {
    const code = `(function(){
try{
var p = location.pathname;
var protectedPaths = ${JSON.stringify(['/ai', '/music', '/game', '/premium'])};
var isProtected = protectedPaths.some(function(b){return p===b || p.indexOf(b+'/')===0});
if(!isProtected) return; // don't theme public/onboarding pages

var ls = window.localStorage;
var mode = ls.getItem('6ix:themeMode') || 'system';
var palette = ls.getItem('6ix:palette');
var sysDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

if(!palette){ palette = (mode==='dark'||(mode==='system'&&sysDark)) ? 'dark' : 'light'; }

var isDark = (mode==='dark') || (mode==='system' && sysDark) || palette==='dark' || palette==='black';
var bg = isDark ? '#0b0b0b' : '#ffffff';
var fg = isDark ? '#ffffff' : '#000000';

var root = document.documentElement;
root.classList.toggle('theme-dark', isDark);
root.classList.toggle('theme-light', !isDark);
root.style.setProperty('--th-bg', bg);
root.style.setProperty('--th-text', fg);
root.style.setProperty('--page-bg', bg);

// force correct colors for first paint
var s = document.createElement('style');
s.id='__no_flash_theme__';
s.textContent='html,body{background:'+bg+'!important;color:'+fg+'!important}';
document.head.appendChild(s);
}catch(e){}
})();`;

    return (
        <Script id="no-flash-theme" strategy="beforeInteractive"
            dangerouslySetInnerHTML={{ __html: code }} />
    );
}
