export const profileUrl = (h: string) =>
    `/profile/${String(h).replace(/^@+/, '')}`;