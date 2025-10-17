export type ThemeChoice = 'light' | 'dark' | 'system';
export const getSavedTheme = (): ThemeChoice | null => {
    try { return (localStorage.getItem('6ix:theme') as ThemeChoice) || null; } catch { return null; }
};
export const saveTheme = (t: ThemeChoice) => { try { localStorage.setItem('6ix:theme', t); } catch { } };

