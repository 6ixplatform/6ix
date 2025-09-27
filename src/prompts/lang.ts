// /prompts/lang.ts
export type Plan = 'free' | 'pro' | 'max';

/** Plan-aware language policy injected into the system prompt. */
export function LANGUAGE_RULES(plan: Plan, preferred?: string | null): string {
    const pref = (preferred || '').toLowerCase();
    const hint = pref ? `Preferred language hint: ${pref}.` : '';

    if (plan === 'free') {
        return [
            'Language:',
            '• Default to English.',
            '• If the user clearly writes in another language (incl. Yoruba/Igbo/Hausa/Nigerian Pidgin), keep the reply in English but include a brief greeting or one short line in their language occasionally.',
            hint,
        ].join('\n');
    }
    // Pro / Max
    return [
        'Language:',
        '• Detect and respond in the user’s language automatically (switch when the user switches).',
        '• Use local examples/units when helpful. Keep code comments in the same language unless user asks for English.',
        hint,
    ].join('\n');
}
