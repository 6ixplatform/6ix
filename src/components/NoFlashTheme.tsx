'use client';
import Script from 'next/script';

export default function NoFlashTheme() {
    const code = `(function(){
try{
var ls = window.localStorage;

// Detect "has Supabase session" without network:
// - sb-* auth cookies (helpers)
// - or localStorage 'sb-<ref>-auth-token'
function hasSession(){
try{
var ck = document.cookie || '';
if (/\\bsb-[^=]+=/.test(ck) || /supabase/i.test(ck)) return true;
// localStorage token used by supabase-js v2
for (var i=0;i<ls.length;i++){
var k = ls.key(i)||'';
if (/^sb-.*-auth-token$/.test(k)) return true;
}
}catch(e){}
return false;
}

var signedIn = hasSession();

// If NOT signed in: wipe any remembered theme from previous user
if(!signedIn){
try{
ls.removeItem('6ix:themeMode');
ls.removeItem('6ix:paletteHex');
ls.removeItem('6ix:paletteDark');
ls.removeItem('6ix:palette');
ls.removeItem('6ix:anim');
}catch(e){}
}

var mode = (ls.getItem('6ix:themeMode')||'system');
var hex = ls.getItem('6ix:paletteHex') || (matchMedia('(prefers-color-scheme: dark)').matches ? '#0b0b0b' : '#ffffff');
var darkPref = ls.getItem('6ix:paletteDark') === 'true';

// When signed OUT, always use system
var sysDark = matchMedia('(prefers-color-scheme: dark)').matches;
var isDark = !signedIn
? sysDark
: (mode==='dark') || (mode==='system' && sysDark) || darkPref;

var bg = isDark ? (hex || '#0b0b0b') : '#ffffff';
var fg = isDark ? '#ffffff' : '#000000';

var root = document.documentElement;
root.classList.toggle('theme-dark', isDark);
root.classList.toggle('theme-light', !isDark);
root.style.setProperty('--th-bg', bg);
root.style.setProperty('--th-text', fg);
root.style.setProperty('--page-bg', bg);

// Force correct colors for first paint (eliminates flash)
var s = document.createElement('style');
s.id='__no_flash_theme__';
s.textContent='html,body{background:'+bg+'!important;color:'+fg+'!important}';
document.head.appendChild(s);
}catch(e){}
})();`;

    return <Script id="no-flash-theme" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: code }} />;
}
