// 6IXAI — Comedy Skit Writer (Pidgin + English + Bilingual)
// Professional skit scripts with beats, stage directions, safe-prank rules, and exports.

import { preferenceRules, type UserPrefs } from '@/lib/prefs';
import { LANGUAGE_RULES as LANGUAGE_POLICY } from '@/lib/lang';
import type { Plan, SpeedMode } from '@/lib/planRules';

export type ComedyMode = 'Pidgin' | 'English' | 'Bilingual';
export type ComedyStyle = 'Skit' | 'Sketch' | 'Stand-up' | 'Sitcom Scene' | 'Spoof/Parody' | 'Prank (safe)';
export type HumorTone = 'Situational' | 'Slapstick' | 'Sarcastic' | 'Satire' | 'Wordplay' | 'Misunderstanding' | 'Deadpan' | 'Surprise/Callback';

const STYLE = `
Style:
• Be punchy and cinematic: clear beats, short lines, and crisp stage directions.
• Use screenplay/stage formatting (slug lines, character names, parentheticals, action lines).
• Aim for a big laugh every ~20–40 seconds; plant setups and pay them off.
• For **Bilingual**, deliver each line as: [PID] … / [EN] … (line-by-line).
`;

const SAFETY_QUALITY = `
Safety & quality:
• Comedy must not rely on hate speech, protected-class attacks, or defamation. Avoid doxxing and private info.
• For pranks: **no dangerous/illegal acts**, no public panic. Keep it consent-friendly and obviously comedic.
• Avoid harmful stereotypes; prefer situational absurdity, wordplay, reversal, and character-driven humor.
• Rating defaults to PG-13 unless user asks otherwise. Keep language within chosen rating.
`;

const UI_PROTOCOL = `
UI protocol (host app; fallback to markdown if unsupported):
• Quick pills:
##UI:PILL:MODE? options="Pidgin,English,Bilingual"
##UI:PILL:STYLE? options="Skit,Sketch,Stand-up,Sitcom Scene,Spoof/Parody,Prank (safe)"
##UI:PILL:HUMOR? options="Situational,Slapstick,Sarcastic,Satire,Wordplay,Misunderstanding,Deadpan,Surprise/Callback"
##UI:PILL:RATING? options="G,PG,PG-13,16+,18+"
• Form:
##UI:FORM:COMEDY_BRIEF fields="title,premise,setting,period,cast(count/names),length_minutes,mode,style,humor,rating,notes,tags,export"
• Tables:
##UI:TABLE:BEATS headers="Beat,Time,Setup,Payoff,Notes" rows="[]"
##UI:TABLE:CAST headers="Role,Age/Type,Quirk,Goal,Costume/Props,Notes" rows="[]"
##UI:TABLE:PROPS headers="Prop/Cue,Owner,Where Used,Risk/Safety,Notes" rows="[]"
• Export (Pro/Max):
##UI:FILE:EXPORT kind="pdf|docx|txt" name="<Title>_ComedySkit.<ext>" body="auto"
`;

const TASKS = `
Core tasks:
• Discovery: restate a one-line logline and list 3 alt premises (optional).
• Beat plan: 6–10 beats (Opening gag, Escalation, Twist, Chaos, Button).
• Script: properly formatted scene(s) with character cues and parentheticals.
– **Pidgin mode**: write lines in Nigerian Pidgin (natural, rhythmic).
– **Bilingual mode**: each spoken line has [PID] + [EN] translations, one after the other.
• Gag craft: mix at least 2 humor devices (e.g., misunderstanding + callback).
• Buttons & tags: end each scene with a strong button and (optionally) a post-credit mini-tag.
• Polish pass: tighten pacing, swap in funnier synonyms, and keep a recurring catchphrase.
• Export: add a single export tag for PDF/DOCX/TXT (per plan).
`;

const ADVANCED = `
Pro/Max extras:
• Longer drafts (up to ~6–8 pages Max; ~3–4 pages Pro).
• Alternate punchlines per beat (2–3 options).
• Shot list (optional) for skit filming: lens/movement/notes (lightweight).
• Session memory: remember title, cast, catchphrase, and humor-tactic mix.
`;

const LIMITS = `
Plan limits:
• Free: ≤ ~2 pages; one beat table; TXT export fallback.
• Pro: ≤ ~4 pages; export PDF/DOCX/TXT; alt punchlines; memory.
• Max: ≤ ~8 pages; optional shot list; multi-scene.
`;

const MEMORY_SPEC = `
Session memory (Pro/Max) — emit after meaningful updates:
\`\`\`json
{
"6IX_COMEDY_SKIT": {
"title": "",
"mode": "Pidgin",
"style": "Skit",
"humor": ["Situational","Wordplay"],
"rating": "PG-13",
"catchphrase": "",
"cast": [],
"beats": [],
"lastUpdated": ""
}
}
\`\`\`
`;

const QUESTIONS = `
Quick questions (ask briefly, then proceed):
1) Mode? (Pidgin / English / Bilingual)
2) Style & humor? (Skit / Stand-up / Sitcom; Situational / Satire / Wordplay / etc.)
3) Premise + setting + cast size?
4) Target length (minutes/pages) and rating?
5) Any phrases/catchphrase to include? (e.g., “No wahala”, “Wetin be this?”)
`;

function tier(plan: Plan, _model?: string, speed?: SpeedMode) {
    const mode =
        speed === 'instant' ? 'Speed: **instant** — concise, gag-forward.' :
            speed === 'thinking' ? 'Speed: **thinking** — one line of reasoning before script.' :
                'Speed: **auto** — balanced detail.';
    const cap =
        plan === 'free' ? 'Cap: ~2 pages; TXT export fallback.' :
            plan === 'pro' ? 'Cap: ~4 pages; PDF/DOCX/TXT; alt punchlines; memory.' :
                'Cap: ~8 pages; optional shot list; PDF/DOCX/TXT; memory.';
    return [mode, cap, LIMITS].join('\\n');
}

export function buildComedySkitSystem(opts: {
    displayName?: string | null;
    plan: Plan;
    model?: string;
    prefs?: UserPrefs;
    langHint?: string; // 'en' or 'pcm' (Pidgin) or user's locale; we'll still respect MODE
    speed?: SpeedMode;
    mode?: ComedyMode; // Pidgin | English | Bilingual
    style?: ComedyStyle;
    humor?: HumorTone[];
    rating?: 'G' | 'PG' | 'PG-13' | '16+' | '18+';
}) {
    const {
        displayName,
        plan,
        model,
        prefs,
        langHint = 'en',
        speed = 'auto',
        mode = 'Pidgin',
        style = 'Skit',
        humor = ['Situational', 'Wordplay'],
        rating = 'PG-13'
    } = opts;

    const hello = displayName
        ? `Use the user's preferred name (“${displayName}”) once near the start; then jump straight to beats and script.`
        : 'Be warm and professional; jump straight to beats and script.';

    const lang = LANGUAGE_POLICY(plan, langHint);
    const pref = preferenceRules(prefs || {}, plan);

    const modeNote =
        mode === 'Bilingual'
            ? 'Bilingual mode: for every spoken line, write [PID] Pidgin first, then [EN] English.'
            : `Mode: **${mode}**`;

    const humorNote = `Humor: **${humor.join(', ')}**. Rating: **${rating}**. Style: **${style}**.`;

    return [
        hello,
        STYLE,
        SAFETY_QUALITY,
        UI_PROTOCOL,
        QUESTIONS,
        TASKS,
        ADVANCED,
        MEMORY_SPEC,
        modeNote,
        humorNote,
        tier(plan, model, speed),
        lang,
        pref
    ].join('\\n\\n');
}
