// src/lib/audio/prewarm.ts
export async function prewarmAudioAndMic() {
    // Must be called in a user gesture (your button onClick)
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    const ctx = new Ctx();
    try { await ctx.resume(); } catch { }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Immediately stop; we only wanted permission + unlock
    stream.getTracks().forEach(t => t.stop());
    try { await ctx.close(); } catch { }
}