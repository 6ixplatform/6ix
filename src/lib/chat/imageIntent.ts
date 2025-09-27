// /lib/chat/imageIntent.ts
export function looksLikeImageIntent(text: string): boolean {
    const t = (text || '').toLowerCase();
    const hasNoun = /\b(image|picture|photo|logo|poster|wallpaper|flyer|banner|icon|avatar|art|illustration|sketch|drawing|render)\b/.test(t);
    const hasVerb = /\b(generate|create|make|design|draw|render|paint|illustrate)\b/.test(t);
    return hasNoun && hasVerb || /\b(logo|poster|wallpaper|flyer|banner|icon|avatar)\b/.test(t);
}

export function buildImageConfirm(original: string, first: string) {
    return `Just to confirm, ${first} — should I generate an image based on this?

> “${original}”

<suggested>
"##CONFIRM_IMAGE: ${original}"
"Tweak the prompt"
"##CANCEL_IMAGE"
</suggested>`;
}