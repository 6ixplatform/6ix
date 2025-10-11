export type Song = {
    id: string;
    title: string;
    artist: string;
    album?: string | null;
    year?: number | null;
    label?: string | null;
    artwork_url?: string | null;
    audio_url: string;
    category: string; // 'afrobeat', ...
    sort_order: number;
};