export async function prewarmAudioAndMic() {
    try {
        const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
        const ctx = new Ctx(); await ctx.resume().catch(() => { }); await ctx.close().catch(() => { });
    } catch { }
    if (navigator.mediaDevices?.getUserMedia) {
        const s = await navigator.mediaDevices.getUserMedia({ audio: true });
        s.getTracks().forEach(t => t.stop());
    }
}