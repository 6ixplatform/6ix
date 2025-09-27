export async function fetchWeather(lat: number, lon: number): Promise<any | null> {
    const r = await fetch(`/api/tools/weather?lat=${lat}&lon=${lon}`, { cache: 'no-store' });
    return r.ok ? r.json() : null;
}