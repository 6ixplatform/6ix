// /src/lib/ads.ts
// Simple list of your ads. Files live in /public/ads (or wherever you prefer).

export const AD_PILL_ART = '/splash.png';

/** Common, optional metadata shared by all ad types */
type AdMeta = {
    title?: string;
    caption?: string;
    description?: string;
    /** Destination URL (https://…, http://…, or mailto:…) */
    link?: string;
    /** The clickable text to display for the link (e.g., “let’s play”). */
    linkText?: string;
};

/** Audio ad (static artwork + audio track) */
export type AdAudio = AdMeta & {
    id: string;
    kind: 'audio';
    /** PNG/JPG used in pill, overlay, media session art */
    artwork: string;
    /** Audio file (mp3/aac/etc.) */
    audio: string;
};

/** Image ad (static artwork only) */
export type AdImage = AdMeta & {
    id: string;
    kind: 'image';
    /** PNG/JPG used in pill, overlay, media session art */
    artwork: string;
};

/** Video ad (mp4/webm + optional poster image) */
export type AdVideo = AdMeta & {
    id: string;
    kind: 'video';
    /** Video file placed under /public/ads */
    video: string;
    /** Optional poster used before playback + for media session artwork */
    poster?: string;
};

export type AdUnit = AdAudio | AdImage | AdVideo;

/**
* Add/arrange items here; they will be shown one-by-one and, after all finish,
* the rotation loops (your MusicPill handles the cadence & shuffle).
*/
export const ADS: AdUnit[] = [
    // ------ audio / image examples ------
    {
        id: '6ix-ad-01',
        kind: 'audio',
        audio: '/ads/6ix-ad-01.mp3',
        artwork: '/ads/6ix-ad-01.png',
        title: '6IX Fashion',
        caption: 'Luxury On Its Own',
    },
    {
        id: '6ix-ad-02',
        kind: 'image',
        artwork: '/ads/6ix-ad-02.png',
        title: 'Genres for your entertainment',
        caption: 'Elixir of Music',
    },
    {
        id: '6ix-ad-03',
        kind: 'image',
        artwork: '/ads/6ix-ad-03.png',
        title: 'Weekend Sale',
        caption: 'Up to 50% off when you visit',
    },
    {
        id: '6ix-ad-04',
        kind: 'image',
        artwork: '/ads/6ix-ad-04.png',
        title: 'Tour in',
        caption: 'THE DESTINATION',
    },

    // ------ video examples ------
    {
        id: '6ix-ad-v01',
        kind: 'video',
        video: '/ads/6ix-ad-v01.mp4',
        poster: '/ads/6ix-ad-v01.png',
        title: 'Pro Dancers',
        caption: '6IX • DANCERS • 2025'
    },
    {
        id: '6ix-ad-v02',
        kind: 'video',
        video: '/ads/6ix-ad-v02.mp4',
        poster: '/ads/6ix-ad-v02.png',
        title: 'Spring Drop',
        caption: 'ELIXIR OF THIRST'
    },
];

// (Optional) Type guards if you want them elsewhere.
export const isVideoAd = (a: AdUnit): a is AdVideo => a.kind === 'video';
export const isImageAd = (a: AdUnit): a is AdImage => a.kind === 'image';
export const isAudioAd = (a: AdUnit): a is AdAudio => a.kind === 'audio';
