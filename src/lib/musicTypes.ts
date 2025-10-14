export type Song = {
    id: string;
    title: string;
    artist: string;
    album?: string;
    year?: number;
    label?: string;
    artwork_url?: string;
    audio_url: string;
    lyrics_url?: string;
    category: string;
    bio?: string;
    sort_order: number;
    verified_badge?: 'gold' | 'blue' | null;
};