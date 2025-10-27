let prewarmed = false;

export function isPrewarmed() {
    return prewarmed;
}

export async function prewarmAudioAndMic() {
    if (prewarmed) return;
    // 1) Unlock audio on iOS
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (AC) {
        const ctx = new AC();
        try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            gain.gain.value = 0.0001;
            osc.connect(gain).connect(ctx.destination);
            osc.start();
            await ctx.resume();
            osc.stop();
        } catch { }
    }
    // 2) Prompt mic permission then stop immediately
    const md: any = (navigator as any).mediaDevices;
    if (md?.getUserMedia) {
        try {
            const s: MediaStream = await md.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                } as MediaTrackConstraints
            });
            s.getTracks().forEach(t => t.stop());
        } catch { }
    }
    prewarmed = true;
}
