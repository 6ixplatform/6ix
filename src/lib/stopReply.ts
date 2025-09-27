// /lib/stopReply.ts
import type { Plan } from '@/lib/planRules';

export type StopKind = 'text' | 'image';

// --- targets ---
const TARGETS: Record<Plan, number> = { free: 20, pro: 100, max: 300 };

// --- tiny language phrasebook (short, safe lines) ---
type Lang =
    | 'en' | 'es' | 'fr' | 'pt' | 'de' | 'it' | 'hi' | 'id' | 'sw' | 'yo'
    | 'ar' | 'zh' | 'ja' | 'ko' | 'ru' | 'tr' | 'nl' | 'pl' | 'vi' | 'th'
    | 'bn' | 'ur' | 'fa'
    | 'ha' | 'ig' | 'efi'; // ← ADDED

const localizedText: Partial<Record<Lang, ((first: string) => string)[]>> = {
    es: [
        (f) => `Listo, ${f}. He detenido la respuesta. ¿Quieres un resumen rápido o empezar de nuevo?`,
        (f) => `${f}, pausa hecha. Puedo convertir lo que hay en viñetas o continuar más tarde.`,
    ],
    fr: [
        (f) => `D’accord, ${f}. J’ai arrêté. Tu veux un bref résumé ou repartir sur une autre piste ?`,
        (f) => `${f}, c’est en pause. Je peux faire un TL;DR ou reprendre plus tard.`,
    ],
    pt: [
        (f) => `Beleza, ${f}. Parei aqui. Quer um resumo rápido ou começar do zero?`,
        (f) => `${f}, interrompi a resposta. Posso transformar em tópicos ou continuar depois.`,
    ],
    de: [
        (f) => `Okay, ${f}. Ich habe gestoppt. Soll ich kurz zusammenfassen oder neu starten?`,
        (f) => `${f}, pausiert. Ich kann Stichpunkte machen oder später fortsetzen.`,
    ],
    it: [
        (f) => `Ok, ${f}. Ho messo in pausa. Vuoi un breve riassunto o ripartire da capo?`,
        (f) => `${f}, fermato. Posso fare punti elenco o riprendere dopo.`,
    ],
    hi: [
        (f) => `ठीक है, ${f}. मैंने उत्तर रोक दिया है। चाहें तो छोटा सा सार दे दूँ या फिर से शुरू करें?`,
        (f) => `${f}, रोक दिया गया। मैं इसे बुलेट्स में बदल सकता हूँ या बाद में जारी रख सकते हैं।`,
    ],
    id: [
        (f) => `Baik, ${f}. Aku hentikan dulu. Mau ringkasan singkat atau mulai ulang?`,
        (f) => `${f}, sudah dihentikan. Bisa kubuat poin-poin atau lanjut nanti.`,
    ],
    sw: [
        (f) => `Sawa, ${f}. Nimesitisha. Unataka muhtasari mfupi au tuanze upya?`,
        (f) => `${f}, imesimama. Naweza kuiweka kwenye orodha ya hatua au tuendelee baadaye.`,
    ],
    yo: [
        (f) => `Ó dáa, ${f}. Mo dá a dúró. Ṣe kí n ṣe akopọ kékeré tàbí bẹ̀rẹ̀ tuntun?`,
        (f) => `${f}, mo dá a dúró. Lè ṣe amójútó ní àwọn búlẹ́ẹ̀tì tàbí kí a bá a lọ nígbà míì.`,
    ],
};
Object.assign(localizedText, {
    ar: [
        (f) => `حسنًا يا ${f}، أوقفت الرد. هل تريد ملخصًا سريعًا أم نبدأ من جديد؟`,
        (f) => `${f}، تم الإيقاف مؤقتًا. أستطيع تحويله إلى نقاط أو نكمل لاحقًا.`,
    ],
    zh: [
        (f) => `好的，${f}。我先停在这里。要不要来个简要总结，还是重新开始？`,
        (f) => `${f}，已暂停。我可以把目前内容整理成要点，或稍后继续。`,
    ],
    ja: [
        (f) => `了解しました、${f}。いったん停止しました。簡単に要約しますか？それともやり直しますか？`,
        (f) => `${f}、停止しました。今ある内容を箇条書きにしますか？`,
    ],
    ko: [
        (f) => `알겠어요, ${f}. 잠시 멈췄어요. 간단 요약할까요, 아니면 처음부터 다시 할까요?`,
        (f) => `${f}, 일시정지했어요. 지금까지 내용을 핵심만 정리해 드릴게요.`,
    ],
    ru: [
        (f) => `Окей, ${f}. Остановил. Сделать краткое резюме или начать заново?`,
        (f) => `${f}, поставил на паузу. Могу оформить тезисами или продолжить позже.`,
    ],
    tr: [
        (f) => `Tamam, ${f}. Durdurdum. Kısa bir özet mi, yoksa en baştan mı?`,
        (f) => `${f}, şu an duraklattım. Mevcut kısmı maddelere dökebilirim.`,
    ],
    nl: [
        (f) => `Oké, ${f}. Ik heb gestopt. Wil je een korte samenvatting of opnieuw beginnen?`,
        (f) => `${f}, gepauzeerd. Ik kan het in bullets zetten of later doorgaan.`,
    ],
    pl: [
        (f) => `OK, ${f}. Zatrzymałem. Chcesz krótki skrót czy zacząć od nowa?`,
        (f) => `${f}, wstrzymałem odpowiedź. Mogę zrobić listę punktów albo wrócimy później.`,
    ],
    vi: [
        (f) => `Được rồi, ${f}. Mình tạm dừng nhé. Muốn tóm tắt nhanh hay làm lại từ đầu?`,
        (f) => `${f}, mình đã tạm dừng. Có thể chuyển thành gạch đầu dòng hoặc tiếp tục sau.`,
    ],
    th: [
        (f) => `โอเค ${f} หยุดไว้ก่อนนะ ต้องการสรุปสั้น ๆ หรือเริ่มใหม่ไหม`,
        (f) => `${f} หยุดชั่วคราวแล้ว เดี๋ยวผมทำเป็นหัวข้อย่อยให้ได้`,
    ],
    bn: [
        (f) => `ঠিক আছে, ${f}। আমি থামিয়েছি। ছোট করে সারাংশ দেব, নাকি আবার শুরু করব?`,
        (f) => `${f}, থামিয়ে রাখা হয়েছে। এখন পর্যন্তটুকু পয়েন্ট আকারে দিতে পারি।`,
    ],
    ur: [
        (f) => `ٹھیک ہے، ${f}۔ میں نے جواب روک دیا ہے۔ مختصر خلاصہ چاہیے یا دوبارہ شروع کریں؟`,
        (f) => `${f}، عارضی طور پر روکا ہے۔ میں اسے نکات کی شکل میں بھیج سکتا ہوں۔`,
    ],
    fa: [
        (f) => `باشه ${f}. فعلاً متوقف کردم. خلاصه کوتاه می‌خوای یا از نو شروع کنیم؟`,
        (f) => `${f}، مکث کردم. می‌تونم تا اینجا رو به نکته‌ها تبدیل کنم.`,
    ],
} as Partial<Record<Lang, ((first: string) => string)[]>>);

Object.assign(localizedText, {
    ha: [
        (f) => `To, ${f}, na dakatar da amsar. So kake/kike na yi taƙaice ko mu fara sabo?`,
        (f) => `${f}, na tsayar. Zan iya juya abin da ya fito zuwa maki ko mu ci gaba daga nan.`,
    ],
    ig: [
        (f) => `Ọ dị mma, ${f}. E kwụsịla. Chọọ m mee nchịkọwa mkpirikpi ma ọ bụ ka anyị bido ọhụrụ?`,
        (f) => `${f}, akwụsịla m. Enwere m ike gbanwee ihe ruo ugbu a ka ọ bụrụ isiokwu ma ọ bụ ka anyị gaa n’ihu.`,
    ],
    yo: [
        (f) => `Ó dáa, ${f}, mo ti dá a dúró. Kí n ṣe àkótán kékeré tàbí kí a bẹ̀rẹ̀ tuntun?`,
        (f) => `${f}, mo dá a dúró. Mo lè yí i sí àkọsílẹ̀ kúkúrú tàbí tẹ̀síwájú nígbà míì.`,
    ],
    efi: [
        // Efik: wired & safe for now—falls back to simple English until you provide native phrasing
        (f) => `Okay ${f}, I’ve paused. Want a short summary or should we start fresh?`,
        (f) => `Got it, ${f}—stopped. I can turn what we had so far into bullet points or continue later.`,
    ],
} as Partial<Record<Lang, ((first: string) => string)[]>>);


const localizedImage: Partial<Record<Lang, ((first: string) => string)[]>> = {
    es: [
        (f) => `${f}, he cancelado la imagen. ¿Reintento en HD o te describo la idea en tu idioma?`,
        (f) => `Imagen detenida, ${f}. Puedo probar retrato/paisaje o narrarlo para ti.`,
    ],
    fr: [
        (f) => `${f}, image arrêtée. Je peux relancer en HD ou te décrire l’idée en ta langue.`,
        (f) => `Image annulée, ${f}. Portrait/paysage, nouvelle graine, ou narration : tu choisis.`,
    ],
    pt: [
        (f) => `${f}, imagem interrompida. Posso refazer em HD ou descrever a ideia no seu idioma.`,
        (f) => `Cancelei a imagem, ${f}. Tenta retrato/paisagem ou quer uma narração?`,
    ],
    de: [
        (f) => `${f}, Bild gestoppt. Ich kann in HD neu rendern oder die Idee beschreiben.`,
        (f) => `Bild abgebrochen, ${f}. Porträt/Landscape, neue Seed oder kurze Beschreibung?`,
    ],
};
Object.assign(localizedImage, {
    ar: [
        (f) => `${f}، تم إيقاف الصورة. هل أعيد المحاولة بدقة عالية أو أصف الفكرة بلغتك؟`,
        (f) => `أوقفت التوليد، ${f}. بورتريه/أفقي أم وصف سريع؟`,
    ],
    zh: [
        (f) => `${f}，已停止生成图片。要不要高清重试，或用你的语言描述一下想法？`,
        (f) => `已取消图片生成，${f}。要不要试试纵向/横向，或者先给你口述？`,
    ],
    ja: [
        (f) => `${f}、画像生成を停止しました。HDで再試行しますか？それとも日本語でアイデアを説明しましょうか？`,
        (f) => `生成を中断しました、${f}。縦/横で作り直すか、短く説明もできます。`,
    ],
    ko: [
        (f) => `${f}, 이미지 생성을 중단했어요. HD로 다시 시도하거나 한국어로 설명해 드릴까요?`,
        (f) => `렌더링을 멈췄어요, ${f}. 세로/가로로 다시 하거나 짧게 설명해 드릴게요.`,
    ],
    ru: [
        (f) => `${f}, генерацию изображения остановил. Перезапустить в HD или описать идею по-русски?`,
        (f) => `Рендер отменён, ${f}. Портрет/альбомная или короткое описание?`,
    ],
    tr: [
        (f) => `${f}, görsel üretimini durdurdum. HD yeniden deneyelim mi, yoksa fikri Türkçe anlatayım mı?`,
        (f) => `Render iptal edildi, ${f}. Dikey/yatay mı, yoksa kısa bir açıklama mı?`,
    ],
    nl: [
        (f) => `${f}, beeldgeneratie gestopt. HD opnieuw proberen of het idee in jouw taal beschrijven?`,
        (f) => `Render geannuleerd, ${f}. Portret/landschap of korte beschrijving?`,
    ],
    pl: [
        (f) => `${f}, zatrzymałem generowanie obrazu. Spróbować w HD czy opisać pomysł po polsku?`,
        (f) => `Render anulowany, ${f}. Pion/poziom czy krótki opis?`,
    ],
    vi: [
        (f) => `${f}, đã dừng tạo ảnh. Muốn thử lại HD hay mình mô tả ý tưởng bằng tiếng Việt?`,
        (f) => `Đã hủy render, ${f}. Dọc/ngang hay mô tả ngắn?`,
    ],
    th: [
        (f) => `${f} หยุดสร้างรูปแล้ว จะลองแบบ HD อีกครั้งหรือให้ผมอธิบายเป็นภาษาไทยดีไหม`,
        (f) => `ยกเลิกรูปแล้ว ${f} เอาแนวตั้ง/แนวนอน หรือสรุปสั้น ๆ ดี?`,
    ],
    bn: [
        (f) => `${f}, ছবি তৈরি থামানো হয়েছে। HD-তে আবার চেষ্টা করব, নাকি বাংলায় ধারণা বুঝিয়ে বলব?`,
        (f) => `রেন্ডার বাতিল, ${f}। উল্লম্ব/আনুভূমিক নাকি সংক্ষিপ্ত বর্ণনা?`,
    ],
    ur: [
        (f) => `${f}، تصویر بنانا روک دیا ہے۔ HD میں دوبارہ آزماؤں یا خیال کو اردو میں بیان کروں؟`,
        (f) => `رینڈر منسوخ، ${f}۔ پورٹریٹ/لینڈ اسکیپ یا مختصر وضاحت؟`,
    ],
    fa: [
        (f) => `${f}، تولید تصویر متوقف شد. دوباره با کیفیت بالا امتحان کنم یا ایده را به فارسی توضیح بدهم؟`,
        (f) => `رندر لغو شد، ${f}. عمودی/افقی یا توضیح کوتاه؟`,
    ],
} as Partial<Record<Lang, ((first: string) => string)[]>>);

Object.assign(localizedImage, {
    ha: [
        (f) => `${f}, na dakatar da hoton. Mu sake gwadawa a HD ko in bayyana ra’ayin nan?`,
        (f) => `An soke ƙirƙirar hoto, ${f}. Tsaye/kwance ko taƙaitaccen bayani?`,
    ],
    ig: [
        (f) => `Kwusịrị m onyonyo ahụ, ${f}. Ka m nwalee ọzọ na HD ma ọ bụ kọwaa echiche ahụ?`,
        (f) => `A kagbụrụ ime onyonyo, ${f}. Vetikal/Mpaghara ma ọ bụ nkọwa mkpirikpi?`,
    ],
    yo: [
        (f) => `Mo dá ẹ̀dá àwòrán dúró, ${f}. Ṣe kí n tún gbìyànjú ní HD tàbí kí n ṣàlàyé erò náà?`,
        (f) => `A fagilé àwòrán, ${f}. Ináro/inágbélé tàbí àlàyé kékeré?`,
    ],

} as Partial<Record<Lang, ((first: string) => string)[]>>);

// ——— English building blocks (combinatoric = thousands of uniques) ———
type LineT = (first: string) => string;

const STARTERS: LineT[] = [
    (f) => `Okay ${f}`,
    (f) => `Got it, ${f}`,
    (f) => `${f}, no problem`,
    (f) => `All set, ${f}`,
    (f) => `Understood, ${f}`,
];
const VERBS_TEXT = [
    'I’ve paused.',
    'stopped the reply.',
    'halted here.',
    'paused the run.',
    'put this on hold.',
];

const VERBS_IMG = [
    'I stopped the image.',
    'image generation halted.',
    'cancelled the render.',
    'stopped that render.',
    'paused the image run.',
];

const OFFERS_FREE_TEXT = [
    'Want me to pick this up later or start fresh?',
    'I can summarize what we had so far.',
    'We can restart when you’re ready.',
    'Shall I turn it into a short note?',
    'Prefer a quick recap?',
];

const OFFERS_PRO_TEXT = [
    'Want a quick TL;DR of what streamed so far, or a new angle?',
    'I can turn the partial into bullets or a checklist.',
    'Prefer a tighter summary or to continue where we left off?',
    'I can restructure it and cut fluff.',
    'Want me to outline steps next?',
    'I can rewrite in your tone or simplify.',
];

const OFFERS_MAX_TEXT = [
    'Prefer a TL;DR, a different style, or to resume with deeper reasoning?',
    'I can make an action plan (dates, owners) or a crisp summary.',
    'Want a contrasted take, then a recommendation?',
    'I can compress to 5 bullets or expand with extra context.',
    'Shall I produce a table or a short brief?',
    'I can continue in your language if you like.',
];

const OFFERS_FREE_IMG = [
    'Want me to try again or tweak the prompt?',
    'I can help rewrite the prompt for a better result.',
    'We can retry with a simpler description.',
    'Prefer I suggest 3 prompt variations?',
    'Want tips to get the style you have in mind?',
];

const OFFERS_PRO_IMG = [
    'I can retry in a different style or aspect (portrait/landscape).',
    'Prefer an HD retry or a quick description in your language?',
    'Want me to propose 3 refined prompts?',
    'I can adjust lighting, mood, or composition on the next try.',
    'We can switch seed for a fresh layout.',
];

const OFFERS_MAX_IMG = [
    'I can regenerate in HD/wide, iterate with refinements, or narrate it in your language.',
    'Prefer a new seed, cinematic framing, or stylized look?',
    'Want 3 high-quality variations with different moods?',
    'I can guide you with visual prompt tips before we retry.',
    'We can lock aspect ratio and push quality.',
];

// Utility to build a large template pool from blocks
function combine(
    starters: ((f: string) => string)[],
    verbs: string[],
    offers: string[],
): ((f: string) => string)[] {
    const out: ((f: string) => string)[] = [];
    for (const s of starters) {
        for (const v of verbs) {
            for (const o of offers) {
                out.push((f) => `${s(f)}, ${v} ${o}`);
            }
        }
    }
    return out;
}

// Pick unique templates up to target, then render with name/L
function sampleFromPool<T>(
    pool: T[],
    target: number,
): T[] {
    const need = Math.min(target, pool.length);
    const picked: T[] = [];
    const seen = new Set<number>();
    while (picked.length < need) {
        const idx = Math.floor(Math.random() * pool.length);
        if (!seen.has(idx)) { seen.add(idx); picked.push(pool[idx]); }
    }
    return picked;
}

// If Pro/Max and locale != en, sometimes respond in that language
function maybeLocalized(
    plan: Plan,
    kind: StopKind,
    first: string,
    locale: string,
): string | null {
    const lc = (locale || 'en').toLowerCase();
    const lang = (lc.split('-')[0] as Lang) || 'en';
    if (lang === 'en') return null;
    const chance = plan === 'max' ? 0.4 : plan === 'pro' ? 0.25 : 0;
    if (Math.random() > chance) return null;

    const bank = kind === 'image' ? localizedImage[lang] : localizedText[lang];
    if (!bank || bank.length === 0) return null;

    const fn = bank[Math.floor(Math.random() * bank.length)];
    return fn(first);
}

export function buildStopReply(
    {
        displayName,
        plan = 'free',
        kind,
        langName,
        locale: localePref, // ← NEW
    }: {
        displayName?: string | null;
        plan: Plan;
        kind: StopKind;
        langName?: string;
        locale?: string; // ← NEW
    }
): string {
    const first = (displayName || 'Friend').split(' ')[0];
    const L = langName || 'your language';

    // detect user locale if available (client only)
    const detectedLocale =
        localePref ||
        ((typeof navigator !== 'undefined' && (navigator.language || navigator.languages?.[0])) || 'en');
    // Try localized line sometimes for Pro/Max
    const loc = maybeLocalized(plan, kind, first, detectedLocale);
    if (loc) return loc;

    // Build (or reuse) big template pools per kind + plan
    const textPools: Record<Plan, ((f: string) => string)[]> = {
        free: combine(STARTERS, VERBS_TEXT, OFFERS_FREE_TEXT), // 5*5*5 = 125
        pro: combine(STARTERS, VERBS_TEXT, [...OFFERS_FREE_TEXT, ...OFFERS_PRO_TEXT]), // 5*5*11 = 275
        max: combine(STARTERS, VERBS_TEXT, [...OFFERS_FREE_TEXT, ...OFFERS_PRO_TEXT, ...OFFERS_MAX_TEXT]), // 5*5*17 = 425
    };

    const imgPools: Record<Plan, ((f: string) => string)[]> = {
        free: combine(STARTERS, VERBS_IMG, OFFERS_FREE_IMG), // 5*5*5 = 125
        pro: combine(STARTERS, VERBS_IMG, [...OFFERS_FREE_IMG, ...OFFERS_PRO_IMG]), // 5*5*10 = 250
        max: combine(STARTERS, VERBS_IMG, [...OFFERS_FREE_IMG, ...OFFERS_PRO_IMG, ...OFFERS_MAX_IMG]), // 5*5*15 = 375
    };

    const pool = (kind === 'image' ? imgPools : textPools)[plan];
    // down-select to target size so randomness feels fresh & controlled
    const target = TARGETS[plan];
    const choices = sampleFromPool(pool, target);

    // render one template with name + (rare) language hint where applicable
    const line = choices[Math.floor(Math.random() * choices.length)](first);

    // Light hint about language only when English was used but user asked about L (keeps your “in L” promise)
    if (plan !== 'free' && /your language/i.test(line)) {
        // already contains “your language” marker—replace with the actual name:
        return line.replace(/your language/gi, L);
    }

    return line;
}
