// Simple list of your four ads (audio + artwork). Keep names in /public/ads.
export type AdUnit = { id: string; audio: string; artwork: string; };

export const ADS: AdUnit[] = [
    { id: '6ix-ad-01', audio: '/ads/6ix-ad-01.mp3', artwork: '/ads/6ix-ad-01.png' },
    { id: '6ix-ad-02', audio: '/ads/6ix-ad-02.mp3', artwork: '/ads/6ix-ad-02.png' },
    { id: '6ix-ad-03', audio: '/ads/6ix-ad-03.mp3', artwork: '/ads/6ix-ad-03.png' },
    { id: '6ix-ad-04', audio: '/ads/6ix-ad-04.mp3', artwork: '/ads/6ix-ad-04.png' },
];