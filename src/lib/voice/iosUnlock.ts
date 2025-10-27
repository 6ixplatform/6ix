// /lib/voice/iosUnlock.ts
export async function prewarmAudioAndMic(): Promise<void> {
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    const ctx = new Ctx();
    try { await ctx.resume(); } catch { }
    const md = navigator.mediaDevices as MediaDevices | undefined;
    if (!md?.getUserMedia) throw new Error('Microphone not available');
    const stream = await md.getUserMedia({ audio: true });
    stream.getTracks().forEach(t => t.stop());
    try { await ctx.close(); } catch { }
}

export function isPrewarmed(): boolean {
    return typeof (window as any)._sixaiAudioPrewarmed !== 'undefined';
}