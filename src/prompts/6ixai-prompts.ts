// 6IXAI prompt router — modular, fast, incremental
// Wire domain builders here. (Kids + Developer + Education enabled)

import { preferenceRules, type UserPrefs } from '@/lib/prefs';
import { LANGUAGE_RULES as LANGUAGE_POLICY } from '@/lib/lang';
import { Plan, SpeedMode } from '@/lib/planRules';

// ---- domain builders ----
import { buildDeveloperSystemV2 } from './systems/developer';
import { buildKidsSystemV2, type KidMode } from './systems/kids';
import { buildEducationSystemV2 } from './systems/education';
import { buildTradingSystemV2 } from './systems/trading';
import { buildCulinarySystemV2 } from './systems/culinary';
import { buildArchitectureSystemV2 } from './systems/architecture';
import { buildCarpentrySystemV2 } from './systems/carpentry';
import { buildMedicalSystemV2 } from './systems/medical';
import { buildSportsSystemV2 } from './systems/sports';
import { buildNewsMediaSystemV2 } from './systems/news';
import { buildGamingSystemV2 } from './systems/gaming';
import { buildReligionSystemV2 } from './systems/religion';
import { buildWellbeingSystem } from './systems/wellbeing';
import { buildFashionSystem } from './systems/fashion';
import { buildEntertainmentSystem } from './systems/entertainment';
import { buildMusicSystem } from './systems/music';
import { buildFarmingSystem } from './systems/farming';
import { buildAutomotiveSystem } from './systems/automotive';
import { buildCivicsSystem } from './systems/civics';
import { buildTravelJobsSystem } from './systems/traveljobs';
import { buildRealEstateSystem } from './systems/realestate';
import { buildJWSystemV1, jwTopicFromText } from './systems/jw';
import { buildDeafSystem } from './systems/deaf';
import { buildConstructionSystem } from './systems/construction';
import { buildPaintingSystem } from './systems/painting';
import { buildGymSystem } from './systems/gym-bouncer';
import { buildBankingSystem } from './systems/banking';
import { buildActingSystem } from './systems/acting';
import { buildPublicSafetySystem } from './systems/publicsafety';
import { buildUniversalSystem } from './systems/universal';
import { buildEmergencyFirstAidSystem } from './systems/firstaid-emergency';
import { buildPoliticsEducationSystem, PoliticsTopic } from './systems/politics-education';
import { buildCrossRiverSystem } from './systems/crossriver';
import { buildNigeriaStateSystem } from './systems/nigeria';
import { buildCRUniversitiesSystem } from './systems/universities-crs';
import { buildNigeriaUniversitiesSystem } from './systems/universities-ng';
import { buildPrimaryEducationSystem } from './systems/primary';
import { buildCrecheSystem } from './systems/creche';
import { buildNigeriaDJsSystem } from './systems/djs-ng';
import { buildArtistsRegionSystem } from './systems/artists-region';

// ----------------------- shared types & helpers -----------------------
export type Mood = 'neutral' | 'stressed' | 'sad' | 'angry' | 'excited';

export type ProfileHints = {
    firstName?: string | null;
    age?: number | null;
    location?: string | null;
    timezone?: string | null;
    language?: string | null;
    bio?: string | null;
    kidMode?: KidMode; // 'unknown' | 'kid' | 'guardian'
    grade?: string | null;
    level?: 'K12' | 'UG' | 'Masters' | 'PhD';
    subjectHint?: string | null;
};

function profileHintLines(h?: ProfileHints): string {
    if (!h) return '';
    const bits: string[] = [];
    if (h.firstName) bits.push(`Preferred name: ${h.firstName}.`);
    if (h.location) bits.push(`Likely location: ${h.location}. Consider local context (units, seasons, examples).`);
    if (h.timezone) bits.push(`Timezone hint: ${h.timezone} (schedule examples accordingly).`);
    if (typeof h.age === 'number') bits.push(`Keep examples age-appropriate (~${h.age}).`);
    if (h.grade) bits.push(`Assume grade band: ${h.grade}.`);
    if (h.level) bits.push(`Academic level: ${h.level}.`);
    if (h.kidMode && h.kidMode !== 'unknown') bits.push(`Kid mode: ${h.kidMode}.`);
    if (h.language) bits.push(`Default to ${h.language.toUpperCase()} unless asked otherwise.`);
    if (h.bio) bits.push(`Bio note: ${h.bio.slice(0, 160)}…`);
    return bits.join('\n');
}

// ---- Nigeria states + capitals (canonical) ----
const NG_STATES: Record<string, string[]> = {
    'Abia': ['Umuahia', 'Aba'],
    'Adamawa': ['Yola', 'Mubi'],
    'Akwa Ibom': ['Uyo', 'Eket', 'Ikot Ekpene'],
    'Anambra': ['Awka', 'Onitsha', 'Nnewi'],
    'Bauchi': ['Bauchi', 'Azare'],
    'Bayelsa': ['Yenagoa'],
    'Benue': ['Makurdi', 'Gboko', 'Otukpo'],
    'Borno': ['Maiduguri', 'Biu'],
    'Cross River': ['Calabar', 'Ikom', 'Obudu', 'Ugep', 'Akamkpa', 'Odukpani', 'Tinapa'],
    'Delta': ['Asaba', 'Warri', 'Sapele', 'Ughelli'],
    'Ebonyi': ['Abakaliki'],
    'Edo': ['Benin City', 'Benin'],
    'Ekiti': ['Ado-Ekiti'],
    'Enugu': ['Enugu', 'Nsukka'],
    'Gombe': ['Gombe'],
    'Imo': ['Owerri', 'Okigwe', 'Orlu'],
    'Jigawa': ['Dutse', 'Hadejia'],
    'Kaduna': ['Kaduna', 'Zaria', 'Kafanchan'],
    'Kano': ['Kano'],
    'Katsina': ['Katsina', 'Daura', 'Funtua'],
    'Kebbi': ['Birnin Kebbi'],
    'Kogi': ['Lokoja', 'Okene', 'Idah'],
    'Kwara': ['Ilorin', 'Offa'],
    'Lagos': ['Ikeja', 'Lagos', 'Lekki', 'Victoria Island', 'Ikorodu', 'Epe', 'Yaba'],
    'Nasarawa': ['Lafia', 'Keffi'],
    'Niger': ['Minna', 'Bida', 'Suleja'],
    'Ogun': ['Abeokuta', 'Ijebu Ode', 'Sagamu'],
    'Ondo': ['Akure', 'Ondo'],
    'Osun': ['Osogbo', 'Oshogbo', 'Ife', 'Ilesa'],
    'Oyo': ['Ibadan', 'Ogbomoso'],
    'Plateau': ['Jos'],
    'Rivers': ['Port Harcourt', 'PH', 'Bonny'],
    'Sokoto': ['Sokoto'],
    'Taraba': ['Jalingo', 'Wukari'],
    'Yobe': ['Damaturu', 'Potiskum'],
    'Zamfara': ['Gusau'],
    'FCT (Abuja)': ['Abuja', 'FCT']
};

// Flatten for regex matching
const NG_STATE_KEYS = Object.keys(NG_STATES);
const NG_CITY_LOOKUP: Record<string, string> = {};
for (const [state, cities] of Object.entries(NG_STATES)) {
    for (const city of cities) NG_CITY_LOOKUP[city.toLowerCase()] = state;
}
const NG_STATE_PATTERN = new RegExp(`\\b(${NG_STATE_KEYS.map(s => s.replace(/[()]/g, '\\$&')).join('|')})\\b`, 'i');
const NG_CITY_PATTERN = new RegExp(`\\b(${Object.keys(NG_CITY_LOOKUP).map(c => c.replace(/[()]/g, '\\$&')).join('|')})\\b`, 'i');

function matchNigeriaRegion(t: string): { state: string; city: string | null } | null {
    if (/\bnigeria\b/i.test(t)) {
        // “Nigeria” mentioned without a more specific state/city
        const s = t.match(NG_STATE_PATTERN)?.[0] || null;
        if (s) return { state: NG_STATE_KEYS.find(k => new RegExp(`^${k}$`, 'i').test(s))!, city: null };
        const c = t.match(NG_CITY_PATTERN)?.[0] || null;
        if (c) return { state: NG_CITY_LOOKUP[c.toLowerCase()], city: c };
        return { state: 'All Nigeria', city: null };
    }
    const s = t.match(NG_STATE_PATTERN)?.[0] || null;
    if (s) return { state: NG_STATE_KEYS.find(k => new RegExp(`^${k}$`, 'i').test(s))!, city: null };
    const c = t.match(NG_CITY_PATTERN)?.[0] || null;
    if (c) return { state: NG_CITY_LOOKUP[c.toLowerCase()], city: c };
    return null;
}

const NG_INSTITUTION_TYPES = [
    'university',
    'polytechnic',
    'college of education',
    'school of nursing',
    'college of health',
    'college of health technology',
    'monotechnic'
];

const INSTITUTION_TYPE_PATTERN = new RegExp(`\\b(${NG_INSTITUTION_TYPES.join('|').replace(/\s+/g, '\\s*')})\\b`, 'i');

// Very light name capture: "University of X", "X University", "Polytechnic X"
const NAME_PATTERNS = [
    /\b(university of\s+([a-z][a-z\s'-]+))\b/i,
    /\b(([a-z][a-z\s'-]+)\s+university)\b/i,
    /\b(polytechnic\s+([a-z][a-z\s'-]+))\b/i,
    /\b(college of (education|health( technology)?|nursing))\s+([a-z][a-z\s'-]+)?\b/i,
];

function guessInstitutionName(t: string): string | null {
    for (const rx of NAME_PATTERNS) {
        const m = t.match(rx);
        if (m) return m[0].replace(/\s+/g, ' ').trim();
    }
    return null;
}

// Small domain hint map for common schools; extend over time.
const NG_DOMAIN_HINTS: Record<string, string> = {
    'university of calabar': 'unical.edu.ng',
    'unical': 'unical.edu.ng',
    'university of cross river state': 'unicross.edu.ng',
    'unicross': 'unicross.edu.ng',
    'crutech': 'crutech.edu.ng'
};
function domainHintFor(name?: string | null): string | null {
    if (!name) return null;
    const key = name.toLowerCase();
    return NG_DOMAIN_HINTS[key] || null;
}


const STYLE_PRIMER = `
Style:
• Use GitHub-flavored Markdown.
• Break long answers with headings (##) and short paragraphs (1–3 sentences).
• Use • bullets for lists; 1. 2. 3. for procedures.
• Put code in fenced blocks; avoid walls of text.
`;

const BRAND_FACTS = `
Brand facts:
• 6IX AI is a 6 Clement Joshua Group service.
• The CEO is Clement Joshua.
Privacy: If asked for private/personal CEO info (home address, private contacts, family),
politely refuse and suggest checking public posts on 6Blog or media coverage instead.
`;

// follow-ups + tool tags (kept light for performance)
const FOLLOWUP_RULES_BASE = `
If the user's request is broad or underspecified, end your reply with ONE short follow-up line.
Format: "Quick check: <concise question>?"
Keep it under 12 words. Skip when the ask is very specific, yes/no, or strictly code-only.
`;

const FOLLOWUP_RULES_ADV = `
When the request is broad, end with ONE smart follow-up:
"Quick check: <question>? Options: <A>, <B>, <C>"
Options ≤ 3 words each. Skip for code-only replies.
`;
const TOOL_TAG_RULES = `
When fresh facts/versions are needed, emit ONE of:

##WEB_SEARCH: <query>
##STOCKS: <comma-separated tickers like AAPL,MSFT,NVDA>
##WEATHER: <lat,lon> (e.g., 5.02,8.33)

Then pause until results arrive.
`;

// tiny personal lines (fast)
function buildPersonalSystem(name?: string | null, mood: Mood = 'neutral'): string {
    const who = (name?.trim() || 'friend');
    const tone =
        mood === 'stressed' ? 'Use calm, steady pacing and short sentences.' :
            mood === 'sad' ? 'Be gentle and validating; offer hopeful, practical next steps.' :
                mood === 'angry' ? 'Stay polite and non-defensive; focus on solutions.' :
                    mood === 'excited' ? 'Match positive energy but keep it concise.' :
                        'Keep a warm, professional tone.';
    return [
        `Use the user's display name (“${who}”) naturally once near the start; prefer direct address (“you”).`,
        'When collaborating on a plan or fix, “we/let’s” is fine but sparing.',
        tone
    ].join('\n');
}

// ---------------------------- domain router ----------------------------

function pickDomainSystem(opts: {
    userText: string;
    displayName?: string | null;
    plan: Plan;
    model?: string;
    speed?: SpeedMode;
    prefs?: UserPrefs;
    hints?: ProfileHints;
}) {
    const { userText, displayName, plan, model, speed, prefs, hints } = opts;
    const t = (userText || '').toLowerCase();

    // --- Kids priority if signaled / young age / kidMode ---
    if (
        (hints?.kidMode && hints.kidMode !== 'unknown') ||
        (typeof hints?.age === 'number' && hints.age <= 12) ||
        /\b(kid|child|children|nursery|cr[eè]che|alphabet|phonics|times table|sight words|story time)\b/.test(t)
    ) {
        return buildKidsSystemV2({
            displayName: hints?.firstName || displayName || null,
            plan,
            model,
            mood: 'playful',
            prefs,
            langHint: hints?.language || 'en',
            speed,
            age: hints?.age || null,
            grade: hints?.grade || null,
            kidMode: hints?.kidMode || 'unknown'
        });
    }

    // --- Developer / coding ---
    if (/\b(code|bug|error|stack|api|function|component|typescript|python|react|node|next\.js|deploy|git|vercel|cloudflare)\b/.test(t)) {
        return buildDeveloperSystemV2({
            displayName,
            plan,
            model,
            mood: 'focused',
            prefs,
            langHint: hints?.language || 'en',
            speed
        });
    }

    // Primary Education (Nigeria-wide & Global) — search-first; house pick
    // Triggers on primary/elementary/grade-year terms + school/curriculum/lesson context
    if (
        /\b(primary|basic\s*[1-6]|elementary|grade\s*[1-6]|year\s*[1-6]|ks1|key\s*stage\s*1|ks2|key\s*stage\s*2|nursery|reception|kg)\b/i.test(t) &&
        /\b(school|curriculum|scheme\s*of\s*work|syllabus|lesson|plan|timetable|calendar|fees?|admission|enrol|enroll|assessment|phonics|reading|numeracy|maths|science|social\s*studies|ict)\b/i.test(t)
    ) {
        // Scope to Nigeria states if present (reuses your matchNigeriaRegion helper if available)
        const ngRegion = typeof matchNigeriaRegion === 'function' ? matchNigeriaRegion(t) : null;

        const region: 'Nigeria' | 'Global' =
            ngRegion || /\bnigeria\b/i.test(t) ? 'Nigeria' : 'Global';

        // Rough curriculum inference from text
        const curriculum =
            /\bubec|subeb|basic\s*[1-6]\b/i.test(t) ? 'UBEC (Nigeria Basic 1–6)' as const :
                /\bks1|ks2|key\s*stage|eyfs|phonics\s*screen/i.test(t) ? 'British (EYFS/KS1/KS2)' as const :
                    /\bcommon\s*core|ngss|k[-\s]?5\b/i.test(t) ? 'US (K–5 Common Core + NGSS)' as const :
                        /\bib\s*pyp\b/i.test(t) ? 'IB PYP' as const :
                            /\bmontessori\b/i.test(t) ? 'Montessori' as const :
                                null;

        // Rough grade inference
        const grade =
            (t.match(/\b(grade|year)\s*([1-6])\b/i)?.[0] ||
                (/\bbasic\s*[1-6]\b/i.test(t) ? t.match(/\bbasic\s*[1-6]\b/i)![0] : null) ||
                (/\bks1|ks2|reception|nursery|kg\b/i.test(t) ? 'KS1/KS2 or Early Years' : null)) || null;

        // Rough subject inference
        const subject =
            /\bphonics|reading|literacy|spelling\b/i.test(t) ? 'Literacy/Phonics' :
                /\bmath(s|ematics)|numeracy|arithmetic\b/i.test(t) ? 'Mathematics' :
                    /\bscience\b/i.test(t) ? 'Science' :
                        /\bsocial\s*studies\b/i.test(t) ? 'Social Studies' :
                            /\bict|comput(er|ing)\b/i.test(t) ? 'ICT' :
                                /\bart|music\b/i.test(t) ? 'Art/Music' :
                                    null;

        return buildPrimaryEducationSystem({
            displayName,
            plan,
            model,
            prefs,
            langHint: hints?.language || 'en',
            speed,
            region,
            country: region === 'Nigeria' ? 'Nigeria' : (hints?.location ?? null),
            state: ngRegion?.state || null,
            city: ngRegion?.city || null,
            curriculum,
            grade,
            subject
        });
    }

    // Crèche / Nursery / Daycare — search-first; house pick
    if (
        /\b(cr[èe]che|creche|day\s*care|daycare|nurser(?:y|ies)|pre[-\s]?school|pre[-\s]?k|early\s*years|eyfs|eccde)\b/i.test(t) &&
        /\b(enrol|enroll|admission|fees?|price|tuition|opening|hours|ratio|staff|qualification|policy|safeguard|safeguarding|menu|meal|allergen|sleep|nap|routine|schedule|calendar|inspection|license|licen[cs]e|registration|curriculum|lesson|activities|supply|supplies|pickup|drop[-\s]?off|transport)\b/i.test(t)
    ) {
        const ngRegion = typeof matchNigeriaRegion === 'function' ? matchNigeriaRegion(t) : null;
        const region: 'Nigeria' | 'Global' = (ngRegion || /\bnigeria\b/i.test(t)) ? 'Nigeria' : 'Global';

        // Age band inference
        const ageBand =
            /\b(0|zero)[-\s]?(to|–|—)?\s*12\s*(months|m)\b/i.test(t) ? '0–12 months (Infant)' as const :
                /\b(1|one)[-\s]?(to|–|—)?\s*2\s*(years|y)\b/i.test(t) ? '1–2 years (Toddler)' as const :
                    /\b(2|two)[-\s]?(to|–|—)?\s*3\s*(years|y)\b/i.test(t) ? '2–3 years (Toddler+)' as const :
                        /\b(3|three)[-\s]?(to|–|—)?\s*5\s*(years|y)|pre[-\s]?k|pre[-\s]?school\b/i.test(t) ? '3–5 years (Pre-K)' as const :
                            null;

        // Curriculum inference
        const curriculum =
            /\beccde|subeb\b/i.test(t) ? 'ECCDE (Nigeria)' as const :
                /\beyfs|ofsted\b/i.test(t) ? 'British EYFS' as const :
                    /\bhead\s*start|pre[-\s]?k|state\s*licensing\b/i.test(t) ? 'US Pre-K / Head Start' as const :
                        /\bmontessori\b/i.test(t) ? 'Montessori' as const :
                            /\breggio\b/i.test(t) ? 'Reggio Emilia' as const :
                                null;

        return buildCrecheSystem({
            displayName,
            plan,
            model,
            prefs,
            langHint: hints?.language || 'en',
            speed,
            region,
            country: region === 'Nigeria' ? 'Nigeria' : (hints?.location ?? null),
            state: ngRegion?.state || null,
            city: ngRegion?.city || null,
            ageBand: ageBand ?? undefined,
            curriculum: curriculum ?? undefined
        });
    }


    // --- Education (general) ---
    if (/\b(lesson|study plan|homework|exam|test|assignment|curriculum|syllabus|practice|physics|chemistry|biology|maths?|government|history|economics|literature|cv|resume|thesis|proposal|lab report)\b/.test(t)) {
        return buildEducationSystemV2({
            displayName,
            plan,
            model,
            mood: 'coach',
            prefs,
            langHint: hints?.language || 'en',
            speed,
            level: hints?.level || null,
            subjectHint: hints?.subjectHint || null
        });
    }
    // Trading trigger (stocks/crypto/FX/TA)
    if (/\b(stock|stocks|ticker|symbol|trade|trading|forex|fx|crypto|btc|eth|nasdaq|spx|s&p|candle(stick)?|chart|rsi|macd|ema|vwap|bollinger|volume|breakout|retest|fvg|liquidity|order(?:\s)?block|support|resistance|fib|fibonacci)\b/i.test(t)) {
        return buildTradingSystemV2({
            displayName,
            plan,
            model,
            mood: 'coach',
            prefs,
            langHint: undefined,
            speed,
        });
    }

    // Culinary trigger
    if (/\b(recipe|cook|cooking|kitchen|bake|roast|grill|smoke|air ?fry|marinat(e|ing)|sous[- ]?vide|menu|catering|shopping list|meal prep|diet|allergen|gluten[- ]?free|vegetarian|vegan)\b/.test(t)) {
        return buildCulinarySystemV2({
            displayName,
            plan,
            model,
            mood: 'friendly',
            prefs,
            langHint: undefined,
            speed
        });
    }

    // Architecture trigger
    if (/\b(architecture|architectural|floor ?plan|site ?plan|mass(ing)?|zoning|setback(s)?|far\b|gfa\b|nfa\b|adjacency|stack(ing)?|core placement|elevation|section|facade|cladding|bim|ifc|revit|rhino|sketchup|autocad|interior design|fit[- ]?out|decor|daylight|shading)\b/.test(t)) {
        return buildArchitectureSystemV2({
            displayName,
            plan,
            model,
            mood: 'studio',
            prefs,
            langHint: undefined,
            speed
        });
    }

    // Carpentry / woodworking trigger
    if (/\b(carpentry|woodworking|cabinet(s|ry)?|millwork|joinery|dovetail|mortise|tenon|domino|veneer|miter|waterfall|router table|bandsaw|planer|jointer|stair|deck|pergola|fence|console|wardrobe|closet|drawer|hinge|slide|blum|hafele)\b/i.test(t)) {
        return buildCarpentrySystemV2({
            displayName,
            plan,
            model,
            mood: 'mentor',
            prefs,
            langHint: undefined,
            speed,
        });
    }

    // Medical / health education trigger
    if (/\b(medical|health|symptom|diagnos(e|is)|fever|cough|rash|pain|injury|vaccine|screening|guideline|lab(s)?|blood test|imaging|x-?ray|ecg|ekg|mri|ct|pregnan|anxiety|depress|first aid|triage)\b/i.test(t)) {
        return buildMedicalSystemV2({
            displayName,
            plan,
            model,
            mood: 'reassuring',
            audience: /clinician|doctor|resident|md|mbbs|gp|er|ed|icu|ward|rounds/i.test(t) ? 'clinician'
                : /student|nurse|medschool|med student|mbbs|residency|exam|usmle|plab|nclex/i.test(t) ? 'student'
                    : /research|study design|meta-?analysis|trial|rct|bias|pico/i.test(t) ? 'researcher'
                        : 'patient',
            prefs,
            langHint: undefined,
            speed,
        });
    }

    // Sports trigger (scores/news/analysis/fitness)
    if (/\b(soccer|football|nba|mlb|nfl|nhl|epl|laliga|serie ?a|bundesliga|ucl|afcon|tennis|atp|wta|f1|formula ?1|ufc|mma|boxing|athletics|marathon|fixture|fixtures|lineup|injur(y|ies)|standings|table|score|scores|result|results|recap|preview|odds|bet|parlay|live)\b/i.test(t)) {
        return buildSportsSystemV2({
            displayName,
            plan,
            model,
            mood: /coach|training|workout|fitness|gym/i.test(t) ? 'fitness'
                : /scout|scouting|prospect|recruit/i.test(t) ? 'scout'
                    : /commentary|commentator|hype|play-by-play/i.test(t) ? 'commentator'
                        : 'analyst',
            prefs,
            langHint: undefined,
            speed,
        });
    }

    // Gaming trigger (play games + game help/dev/meta/pc fixes)
    if (/\b(game|gaming|play|minigame|wordle|anagram|hangman|rebus|emoji quiz|trivia|riddle|puzzle|chess|sudoku|tactic|loadout|deck|build|meta|patch|fps|lag|stutter|controller|keybind|aim|sensitivity|valorant|lol|dota|fortnite|apex|cod|cs2|bg3|genshin|minecraft)\b/i.test(t)) {
        return buildGamingSystemV2({
            displayName,
            plan,
            model,
            mood: /dev|design|unreal|unity|godot|shader|blueprint|gdd|prototype/i.test(t) ? 'dev'
                : /meta|patch|analysis|tier list/i.test(t) ? 'analyst'
                    : /build|loadout|deck|counter/i.test(t) ? 'scout'
                        : /coach|improve|practice|drill|aim/i.test(t) ? 'coach'
                            : 'playful',
            prefs,
            langHint: undefined,
            speed,
        });
    }

    // News / Blog trigger (Nigeria, Cross River, world)
    if (/\b(news|headline|breaking|story|update|happening|press|report|article|blog|seo|newsletter|digest|latest|today)\b/i.test(t)) {
        return buildNewsMediaSystemV2({
            displayName,
            plan,
            model,
            mood: /blog|seo|copy|content|newsletter/i.test(t) ? 'editorial'
                : /explain|why|how|context|background/i.test(t) ? 'explanatory'
                    : /digest|brief|bullet/i.test(t) ? 'digest'
                        : 'neutral',
            prefs,
            speed,
            // Nudge region bias if text mentions Nigeria/Cross River explicitly:
            regionBias: /\bcross\s*river\b/i.test(t) ? 'Cross River'
                : /\bnigeria(n)?\b/i.test(t) ? 'Nigeria'
                    : 'Auto'
        });
    }

    // Religion trigger
    if (/\b(bible|qur'?an|koran|torah|tanakh|talmud|hadith|sunnah|gita|bhagavad|veda|upanishad|tripitaka|sutra|dhamma|guru granth|religion|faith|doctrine|creed|catechism|fatwa|fiqh|halakha|prayer|psalm|surah|ayat|church|mosque|synagogue|temple|monastery|hindu|islam|muslim|christian|catholic|protestant|orthodox|jewish|judaism|buddhist|buddhism|sikh|sikhism|jain|jainism|bahai|taoism|shinto|agnostic|atheis[mt])\b/i.test(t)) {
        return buildReligionSystemV2({
            displayName,
            plan,
            model,
            mood: 'scholar',
            prefs,
            langHint: undefined,
            speed,
        });
    }

    // Wellbeing / non-clinical coaching trigger
    if (/\b(stress|sleep|insomnia|focus|productivity|burnout|mindfulness|meditation|breathing|exercise|workout|stretch|posture|nutrition|diet|hydrate|habit|routine|journal(ing)?|anxious|anxiety)\b/i.test(t)) {
        return buildWellbeingSystem({
            displayName,
            plan,
            model,
            mood: 'coach',
            prefs,
            speed,
        });
    }

    // Fashion / sewing / tech-pack trigger
    if (/\b(fashion|outfit|wardrobe|style|mood\s*board|look\s*book|runway|couture|garment|tech\s*pack|bom|grading|size\s*chart|pattern|block|dart|sew(ing)?|tailor(ing)?|fabric|color\s*palette|palette|sketch|flat\s*cad|dress|shirt|trouser|abaya|kaftan|agbada|ankara|aso\s*ebi|gele|render|design)\b/i.test(t)) {
        return buildFashionSystem({
            displayName,
            plan,
            model,
            mood: 'coach',
            prefs,
            speed,
        });
    }

    // Nigeria DJs & DJ Associations — search-first; social handle extraction
    if (
        /\b(dj|disc\s*jockey|turntabl(?:e|ist)|mixtape|mixcloud|audiomack|soundcloud|setlist|club\s*night|club\s*dj|booking|rider|controller|rekordbox|serato|traktor)\b/i.test(t) ||
        /\b(djan|djs?\s*association\s*of\s*nigeria|nigeria\s*dj\s*association|dj\s*union|chapter|state\s*chapter)\b/i.test(t)
    ) {
        // Light region inference (reuse your Nigeria match helper if present)
        const ngRegion = typeof matchNigeriaRegion === 'function' ? matchNigeriaRegion(t) : null;

        // Topic inference
        const topic =
            /\b(association|chapter|union|djan)\b/i.test(t) ? 'Associations' as const :
                /\b(rate|fee|booking|invoice|contract)\b/i.test(t) ? 'Bookings & Rates' as const :
                    /\b(event|club|lineup|bill|set|residenc(y|ies))\b/i.test(t) ? 'Events & Club Nights' as const :
                        /\b(gear|shop|controller|mixer|headphone|cartridge|needle)\b/i.test(t) ? 'Gear & Shops' as const :
                            /\b(manager|agency|agent|bookings?\s*email)\b/i.test(t) ? 'Managers/Agencies' as const :
                                /\b(chart|award|headies|afrimm?a|neaa?)\b/i.test(t) ? 'Charts & Awards' as const :
                                    /\b(playlist|mixtape|mixcloud|soundcloud|audiomack|youtube)\b/i.test(t) ? 'Mixtapes/Playlists' as const :
                                        /\b(radio|tv|show|programme|schedule)\b/i.test(t) ? 'Radio/TV Shows' as const :
                                            /\b(news|trending|headline|press)\b/i.test(t) ? 'News/Trending' as const :
                                                'DJs Directory' as const;

        // Genre inference
        const genre =
            /\bamapiano\b/i.test(t) ? 'Amapiano' :
                /\bafro(beats?)\b/i.test(t) ? 'Afrobeats' :
                    /\bhip[-\s]?hop|trap\b/i.test(t) ? 'Hip-Hop/Trap' :
                        /\b(edm|house|techno|electro)\b/i.test(t) ? 'House/EDM' :
                            /\balte\b/i.test(t) ? 'Alte' :
                                /\bdancehall|reggae\b/i.test(t) ? 'Dancehall' :
                                    /\bhighlife\b/i.test(t) ? 'Highlife' :
                                        null;

        return buildNigeriaDJsSystem({
            displayName,
            plan,
            model,
            prefs,
            langHint: hints?.language || 'en',
            speed,
            region: ngRegion?.state || 'All Nigeria',
            city: ngRegion?.city || null,
            genre,
            topic
        });
    }

    // Regional Music Artists / Record Labels / Influential / Famous / Rich
    if (
        // artist / label / influence / wealth / roster / "Cross River artists"
        /\b(artist|musician|singer|rapper|vocalist|band|afrobeats|amapiano|afro[-\s]?pop|hip[-\s]?hop|gospel|highlife|alte|street[-\s]?pop|label|record\s*label|imprint|roster|signed|signing|exec|founder|ceo|owner|talent\s*scout|a&r|most\s*influential|famous|biggest|rich|wealthy|highest\s*paid|high\s*fee|headliner|headline\s*act)\b/i.test(t)
        &&
        // avoid pure DJ-only stuff (that's handled by buildNigeriaDJsSystem already)
        !/\b(dj|turntable|turntablist|mixcloud|audiomack\s*mix|club\s*dj|serato|rekordbox|controller)\b/i.test(t)
    ) {
        // Try to infer Nigerian region/state/city using your helper
        const ngRegion = (typeof matchNigeriaRegion === 'function') ? matchNigeriaRegion(t) : null;

        // Very rough global inference for country/city if not Nigeria
        // We'll try to pick up a country keyword like "Ghana", "UK", "United Kingdom", "US", "USA", "America", "South Africa", etc.
        let country: string | null = null;
        if (/\b(nigeria|naija)\b/i.test(t)) country = 'Nigeria';
        else if (/\b(uk|united\s*kingdom|england|london)\b/i.test(t)) country = 'United Kingdom';
        else if (/\b(usa|u\.s\.a\.|united\s*states|america|atlanta|new\s*york|la\b|los\s*angeles)\b/i.test(t)) country = 'United States';
        else if (/\b(ghana|accra|kumasi)\b/i.test(t)) country = 'Ghana';
        else if (/\b(south\s*africa|sa|johannesburg|jozi|cape\s*town|durban)\b/i.test(t)) country = 'South Africa';
        else if (/\b(kenya|nairobi|mombasa)\b/i.test(t)) country = 'Kenya';
        else if (/\b(cameroon|douala|yaound[eé])\b/i.test(t)) country = 'Cameroon';
        else if (/\b(france|paris|marseille)\b/i.test(t)) country = 'France';
        else if (/\b(germany|berlin|hamburg)\b/i.test(t)) country = 'Germany';
        else if (/\b(canada|toronto|montreal|vancouver)\b/i.test(t)) country = 'Canada';
        else if (/\b(brazil|rio\s*de\s*janeiro|sao\s*paulo)\b/i.test(t)) country = 'Brazil';
        else if (/\b(india|mumbai|delhi|lagos? india)\b/i.test(t)) country = 'India'; // loose fallback

        // State and city for Nigeria specifically:
        // If matchNigeriaRegion found something, we trust it for state/city
        const state = ngRegion?.state || (
            /\bcross\s*river\b/i.test(t) ? 'Cross River' :
                /\bcalabar\b/i.test(t) ? 'Cross River' :
                    /\blagos\b/i.test(t) ? 'Lagos' :
                        /\babuja|fct\b/i.test(t) ? 'FCT (Abuja)' :
                            null
        );

        const city = ngRegion?.city || (
            /\bcalabar\b/i.test(t) ? 'Calabar' :
                /\blagos\b/i.test(t) ? 'Lagos' :
                    /\babuja\b/i.test(t) ? 'Abuja' :
                        /\bport\s*harcourt|ph\b/i.test(t) ? 'Port Harcourt' :
                            null
        );

        // Topic inference
        const topic =
            /\b(upcoming|up\s*and\s*coming|underground|next\s*up|emerging|breakout|new\s*artist)\b/i.test(t)
                ? 'Upcoming Artists' as const
                : /\b(influential|influence|impact|culture|most\s*influential|trendsetter|tastemaker)\b/i.test(t)
                    ? 'Influential Artists' as const
                    : /\b(famous|popular|mainstream|biggest\s*artist|household\s*name|superstar)\b/i.test(t)
                        ? 'Famous Artists' as const
                        : /\b(rich|wealthy|richest|highest\s*paid|fee|rate|high\s*fee|billionaire)\b/i.test(t)
                            ? 'Rich/High-Earning Artists' as const
                            : /\b(label|record\s*label|label\s*owner|ceo|sign(?:ed|ing)|roster|imprint|exec|founder)\b/i.test(t)
                                ? 'Record Labels' as const
                                : /\b(owner|ceo|founder|executive|label\s*boss|label\s*head)\b/i.test(t)
                                    ? 'Executives / Owners' as const
                                    : /\b(show|lineup|bill|concert|festival|event|tour|performance|stage|live\s*in)\b/i.test(t)
                                        ? 'Events & Shows' as const
                                        : /\b(award|awards|chart|charts|nominated|won|best\s*artist|best\s*album|headies|afrimm?a|grammy)\b/i.test(t)
                                            ? 'Charts & Awards' as const
                                            : /\b(news|trending|headline|press|blog|gossip|rumor|trend)\b/i.test(t)
                                                ? 'News/Trending' as const
                                                : 'Artists' as const;

        // Genre inference
        const genre =
            /\bamapiano\b/i.test(t) ? 'Amapiano' :
                /\bafro[-\s]?beats?\b/i.test(t) ? 'Afrobeats' :
                    /\bafro[-\s]?pop|afro[-\s]?fusion\b/i.test(t) ? 'Afropop' :
                        /\b(gospel|worship|praise)\b/i.test(t) ? 'Gospel' :
                            /\b(highlife|palm[-\s]?wine)\b/i.test(t) ? 'Highlife' :
                                /\b(alte|alt[eé])\b/i.test(t) ? 'Alte' :
                                    /\b(rap|hip[-\s]?hop|trap|drill)\b/i.test(t) ? 'Rap/Hip-Hop' :
                                        /\b(dancehall|reggae)\b/i.test(t) ? 'Dancehall' :
                                            /\b(band|live\s*band|band\s*set)\b/i.test(t) ? 'Band/Live' :
                                                null;

        return buildArtistsRegionSystem({
            displayName,
            plan,
            model,
            prefs,
            langHint: hints?.language || 'en',
            speed,
            country: country || (ngRegion ? 'Nigeria' : 'Nigeria'),
            state: state || (ngRegion?.state ?? null),
            city: city || (ngRegion?.city ?? null),
            genre,
            topic
        });
    }


    // Entertainment trigger (events, tickets, showtimes, news, creative)
    if (/\b(ticket|tickets|concert|showtime|cinema|movie|series|premiere|festival|gig|event|lineup|setlist|backstage|celebrity|entertainment|red\s*carpet|streaming|ott|box\s*office|afrobeats|nollywood|hollywood|bollywood|k[-\s]?pop|calabar|cross\s*river|lagos|nigeria)\b/i.test(t)) {
        return buildEntertainmentSystem({
            displayName,
            plan,
            model,
            mood: 'host',
            prefs,
            speed,
        });
    }

    // Music trigger (songwriting, cover art, vocals, release)
    if (/\b(music|song|lyrics|hook|chorus|bridge|verse|beat|bpm|key\s*[A-G][#b]?|choir|satb|lead\s*sheet|chords?|nashville|roman\s*numerals|arrange|producer|mix|master|cover\s*art|album\s*art|single\s*cover|release|spotify|apple\s*music|distro|vocal|sing|autotune|sheet\s*music|piano|guitar|tabs?)\b/i.test(t)) {
        return buildMusicSystem({
            displayName,
            plan,
            model,
            mood: 'songwriter',
            prefs,
            speed,
        });
    }

    // Farming / Agriculture trigger
    if (/\b(farm|farmer|farming|agri|agro|agriculture|crop|plant(ing)?|seed(ing)?|nursery|germinat(e|ion)|soil|fertili[sz]er|manure|compost|mulch|irrigat(e|ion)|greenhouse|polytunnel|hydroponic|orchard|vineyard|pruning|pest|blight|rust|aphid|weevil|IPM|harvest|post[-\s]?harvest|storage|silo|livestock|poultry|broiler|layer|goat|sheep|cattle|cow|dairy|swine|pig|rabbit|ruminant|ration|biosecurity|aquaculture|fish|catfish|tilapia|pond|hatchery|beekeep|apiary|honey|agroforestry|windbreak|grazing|pasture|silvopasture)\b/i
        .test(t)) {
        return buildFarmingSystem({
            displayName,
            plan,
            model,
            mood: 'field-guide',
            prefs,
            langHint: undefined,
            speed,
            regionHint: hints?.location || hints?.timezone || null
        });
    }

    // Automotive / Ride-hailing trigger
    if (/\b(car|auto|vehicle|engine|transmission|brake|tire|tyre|obd|p0\d{3}|p2\d{3}|dtc|coolant|radiator|spark|alternator|battery|ev|hybrid|charging|vin|recall|uber|lyft|bolt|indrive|ride[-\s]?hailing|taxi|fleet|alignment|suspension|airbag|abs|esc|traction)\b/i.test(t)) {
        return buildAutomotiveSystem({
            displayName,
            plan,
            model,
            mood: 'mechanic',
            prefs,
            langHint: undefined,
            speed,
            regionHint: hints?.timezone ? (hints.timezone.includes('Africa') ? 'NG' : undefined) : undefined,
            cityHint: hints?.location || null
        });
    }

    // Civics / Government trigger
    if (/\b(vote|election|polling|ballot|register to vote|civic|government|ministry|senate|house|assembly|policy|bill|regulation|visa|immigration|passport|birth certificate|driver.?s? license|tax office|foi|foia|public comment|representative|council|local government|inec|ward|constituency)\b/i.test(t)) {
        return buildCivicsSystem({
            displayName,
            plan,
            model,
            mood: 'helpdesk',
            prefs,
            langHint: undefined,
            speed,
            region: hints?.location || null,
        });
    }

    // Travel + Jobs trigger
    if (/\b(travel|trip|itinerary|vacation|holiday|visa|passport|flight|airline|hotel|hostel|booking|check[-\s]?in|weather|packing|tour|budget|fare|layover|schengen|ukvi|embassy|consulate|train|bus|airport|uber|bolt|indrive)\b/i.test(t)
        || /\b(job|jobs|career|cv|resume|cover\s*letter|interview|ats|recruiter|offer|salary|negotiation|linkedin|jd|role|hiring)\b/i.test(t)) {
        return buildTravelJobsSystem({
            displayName,
            plan,
            model,
            mood: /\b(job|career|cv|resume|cover|interview|ats|recruiter|salary|offer)\b/i.test(t) ? 'coach' : 'concierge',
            prefs,
            speed,
            region: hints?.location ?? null,
        });
    }

    // Real Estate trigger
    if (/\b(real\s*estate|property|realt(or|er)|listing|house|home|apartment|flat|duplex|land|plot|acre|hectare|lease|rent|buy|sell|mortgage|down\s*payment|amortization|closing|escrow|title|survey|comps?|cma|valuation|cap\s*rate|noi|dscr|cash\s*flow|brrrr|flip|offer|inspection|appraisal|hoa|service\s*charge)\b/i.test(t)) {
        return buildRealEstateSystem({
            displayName,
            plan,
            model,
            mood: /\b(valuation|comps?|cap\s*rate|noi|dscr|cash\s*flow|amortization|roi|irr)\b/i.test(t) ? 'analyst' : 'advisor',
            prefs,
            speed,
            region: hints?.location ?? null
        });
    }

    // JW (Jehovah’s Witness) trigger
    if (/\b(jw\.org|jehovah(?:'s)? witnesses?|kingdom hall|watchtower|awake!|nwt|daily\s*text|examined\s*scriptures)\b/i.test(t)) {
        return buildJWSystemV1({
            displayName,
            plan,
            model,
            mood: 'respectful',
            prefs,
            langHint: hints?.language || 'en',
            speed,
            topic: jwTopicFromText(userText),
        });
    }

    // Deaf / Sign-Language trigger
    if (/\b(deaf|hard of hearing|sign\s*language|asl|bsl|fingerspell|hand\s*signs?|gesture\s*language|signer)\b/i.test(t)) {
        return buildDeafSystem({
            displayName,
            plan,
            model,
            prefs,
            speed,
            langHint: hints?.language || 'en',
            region: 'auto'
        });
    }

    // Construction / Civil / Site trigger
    if (/\b(construction|site\s*work|civil\s*work|highway|road(way)?|asphalt|pav(e|ing)|concrete|formwork|shuttering|rebar|bar\s*bending|steel\s*fix|boq|take[-\s]?off|estimat(e|ing)|rfi|method\s*statement|itp|hse|toolbox|traffic\s*management|detour|culvert|bridge|survey(ing)?)\b/i.test(t)) {
        return buildConstructionSystem({
            displayName,
            plan,
            model,
            prefs,
            speed,
            langHint: hints?.language || 'en',
            units: 'auto',
            currency: 'USD',
            region: hints?.location || null,
            discipline: 'civil',
            phase: 'construction'
        });
    }

    // Painting / Color / Finishes trigger
    if (/\b(paint|painting|palette|color\s*(mix|combo|wheel|scheme|theory)|swatch|primer|finish|coats?|coverage|roller|brush|lrv|sheen|eggshell|satin|semi[-\s]?gloss|gloss|accent\s*wall|feature\s*wall)\b/i.test(t)) {
        return buildPaintingSystem({
            displayName,
            plan,
            model,
            prefs,
            speed,
            langHint: hints?.language || 'en',
            context: /exterior|outdoor/i.test(t) ? 'exterior'
                : /furniture|cabinet/i.test(t) ? 'furniture'
                    : /art|canvas/i.test(t) ? 'art'
                        : 'interior',
            scheme: /triadic|analogous|complementary|split|tetradic|mono/i.test(t)
                ? (t.match(/triadic|analogous|complementary|split[-\s]?complementary|tetradic|mono(chrome)?/i)![0].toLowerCase() as any)
                : 'auto',
            finish: /semi[-\s]?gloss/i.test(t) ? 'semi-gloss'
                : /gloss/i.test(t) ? 'gloss'
                    : /satin/i.test(t) ? 'satin'
                        : /matte|flat/i.test(t) ? 'matte'
                            : /eggshell/i.test(t) ? 'eggshell'
                                : 'eggshell',
        });
    }

    // Gym / Bouncer
    if (/\b(gym|workout|work\s*out|sets?|reps?|deadlift|squat|bench|push[-\s]?ups?|plank|cardio|cutting|bulking|rpe|rir|macro|personal\s*trainer|bouncer|security|de[-\s]?escalation|guard shift)\b/i.test(t)) {
        return buildGymSystem({
            displayName,
            plan,
            model,
            prefs,
            langHint: hints?.language || 'en',
            speed,
            region: hints?.location || null,
        });
    }

    // Banking / Treasury / Markets
    if (/\b(bank|banking|treasury|ALM|liquidity|LCR|NSFR|Basel|IFRS9|CECL|PD|LGD|EAD|RAROC|FTP|NIM|credit memo|loan pricing|FX|forex|exchange rate|yield curve|bond|duration|convexity|DV01|VaR|stress test|dcf|valuation|equity research|P&L bridge)\b/i.test(t)) {
        return buildBankingSystem({
            displayName,
            plan,
            model,
            prefs,
            langHint: hints?.language || 'en',
            speed,
            region: hints?.location || null,
            currency: 'USD', // tweak if you map from prefs
            framework: 'IFRS', // or 'US GAAP' per region
        });
    }

    // Acting / Theatre / Screenwriting / Production
    if (/\b(act(ing|or)|theatre|theater|stage|playwright|play\s*script|screenplay|script|scene|dialogue|dialog|monologue|audition|table\s*read|blocking|shot\s*list|storyboard|call\s*sheet|cast(?:ing)?)\b/i.test(t)) {
        return buildActingSystem({
            displayName,
            plan,
            model,
            prefs,
            langHint: hints?.language || 'en',
            speed,
            region: hints?.location || null,
        });
    }

    // Public Safety / Armed Forces (police, military, civil defence, road safety, VIO, customs, immigration)
    if (/\b(police|law\s*enforcement|military|army|navy|air\s*force|soldier|civil\s*defen[cs]e|nscdc|frsc|road\s*safety|vio\b|traffic\s*warden|customs|immigration|border\s*control|gendarmerie|marshal|miranda|pace|police\s*act|stop[-\s]*and[-\s]*search|use\s*of\s*force|checkpoint|ticket|violation|road\s*signs?)\b/i.test(t)) {
        return buildPublicSafetySystem({
            displayName,
            plan,
            model,
            prefs,
            langHint: hints?.language || 'en',
            speed,
            region: hints?.location || null,
            branchHint: /\barmy|soldier|military|navy|air\s*force\b/i.test(t) ? 'Military'
                : /\bfrsc|road\s*safety|traffic|vio\b/i.test(t) ? 'Road Safety'
                    : /\bnscdc|civil\s*defen[cs]e\b/i.test(t) ? 'Civil Defence'
                        : /\bcustoms\b/i.test(t) ? 'Customs'
                            : /\bimmigration|border\b/i.test(t) ? 'Immigration'
                                : /\bpolice|law\s*enforcement|gendarmerie|marshal\b/i.test(t) ? 'Police'
                                    : null,
            roleHint: /\brecruit|exam|academy|fitness|study|syllabus|past\s*questions?\b/i.test(t) ? 'Recruit'
                : /\bofficer|duty|patrol|brief|sop|itp|memo|report\b/i.test(t) ? 'Officer'
                    : /\bpolicy|admin|procurement|rollout|tracker\b/i.test(t) ? 'Admin/Policy'
                        : /\bpress|media|journalist|reporter\b/i.test(t) ? 'Journalist'
                            : /\bcitizen|rights|complaint|ombudsman|traffic\s*stop\b/i.test(t) ? 'Citizen'
                                : null,
        });
    }


    if (/\b(first[-\s]?aid|emergency|cpr|aed|chok(e|ing)|bleed(ing)?|tourniquet|burns?|scald|fracture|sprain|dislocation|concussion|head(?:\s)?injury|stroke|faint|collapse|unresponsive|unconscious|seizure|asthma|attack|anaphylaxis|epi[-\s]?pen|allergy|poison(ing)?|overdose|naloxone|snake|dog\s*bite|rabies|bee|wasp|heat\s*(stroke|exhaustion)|hypothermia|drown(ing)?|electric(al)?\s*shock|pregnan(t|cy)|labou?r|miscarriage)\b/i
        .test(t)) {
        return buildEmergencyFirstAidSystem({
            displayName,
            plan,
            model,
            prefs,
            langHint: hints?.language || 'en',
            speed,
            region: hints?.location || null,
        });
    }

    // Global Politics / Civics / Geopolitics / Elections (education)
    if (/\b(politic(s)?|civics?|geopolitic(s)?|election(s)?|parliament|congress|senate|assembly|manifesto|coalition|policy|bill|act|sanction(s)?|alliance|treaty|constitution|turnout|poll(ing)?|geostrategy|foreign\s*policy|international\s*relations)\b/i.test(t)) {
        const topic: PoliticsTopic | null =
            /\b(election|ballot|turnout|poll(ing)?)\b/i.test(t) ? 'Elections' :
                /\b(policy|bill|act|manifesto)\b/i.test(t) ? 'Policy' :
                    /\b(geopolitic|alliance|sanction|treaty|foreign\s*policy)\b/i.test(t) ? 'Geopolitics' :
                        /\b(civic|constitution|parliament|congress|senate|assembly|court)\b/i.test(t) ? 'Civics' :
                            /\b(growth|inflation|unemployment|trade|industrial|resource|subsidy|privatization)\b/i.test(t) ? 'Political Economy' :
                                /\b(history|independence|revolution|transition|coup|era|regime)\b/i.test(t) ? 'History' :
                                    null;

        return buildPoliticsEducationSystem({
            displayName,
            plan,
            model,
            prefs,
            langHint: hints?.language || 'en',
            speed,
            region: hints?.location || null,
            period: /\b(18|19|20|21)\d{2}\b/.test(t) ? (t.match(/\b(18|19|20|21)\d{2}\b/g) || []).slice(0, 2).join('–') : null,
            topic
        });
    }

    // Cross River / Calabar local guide (search-first; transparent house pick)
    if (/\b(cross\s*river|crs\b|calabar|obudu|tinapa|ikom|ugep|akamkpa|odukpani|calabar\s*carnival|obudu\s*(ranch|mountain|resort))\b/i.test(t)) {
        return buildCrossRiverSystem({
            displayName,
            plan,
            model,
            prefs,
            langHint: hints?.language || 'en',
            speed,
            region: 'Cross River / Calabar'
        });
    }

    const ngRegion = matchNigeriaRegion(t);
    if (ngRegion) {
        return buildNigeriaStateSystem({
            displayName,
            plan,
            model,
            prefs,
            langHint: hints?.language || 'en',
            speed,
            state: ngRegion.state,
            city: ngRegion.city ?? null
        });
    }

    if (/\b(unical|university of calabar|unical\.edu\.ng)\b/i.test(t)) {
        return buildCRUniversitiesSystem({
            displayName,
            plan,
            model,
            prefs,
            langHint: hints?.language || 'en',
            speed,
            uni: 'UNICAL'
        });
    }
    if (/\b(unicross|crutech|university of cross river state|unicross\.edu\.ng|crutech\.edu\.ng)\b/i.test(t)) {
        return buildCRUniversitiesSystem({
            displayName,
            plan,
            model,
            prefs,
            langHint: hints?.language || 'en',
            speed,
            uni: 'UNICROSS'
        });
    }

    // Nigeria-wide Institutions (University/Polytechnic/College) — search-first
    if (INSTITUTION_TYPE_PATTERN.test(t) || /\b(university|polytechnic|college|faculty|department|admissions|cut[-\s]?off|calendar|fees|hostel|timetable|portal)\b/i.test(t)) {
        // Scope region if present (uses helpers you added earlier)
        const ngRegion = typeof matchNigeriaRegion === 'function' ? matchNigeriaRegion(t) : null;

        const inferredName = guessInstitutionName(t);
        const domainHint = domainHintFor(inferredName);

        return buildNigeriaUniversitiesSystem({
            displayName,
            plan,
            model,
            prefs,
            langHint: hints?.language || 'en',
            speed,
            type: (t.match(INSTITUTION_TYPE_PATTERN)?.[0]?.toLowerCase() as any) || null,
            name: inferredName,
            state: ngRegion?.state || (/\bnigeria\b/i.test(t) ? 'All Nigeria' : null),
            city: ngRegion?.city ?? null,
            domainHint
        });
    }


    // Fallback (universal helper)
    return buildUniversalSystem({
        displayName,
        plan,
        model,
        prefs,
        langHint: hints?.language || 'en',
        speed,
        region: hints?.location || null,
    });
}


// --------------------------- public main builder ---------------------------

export function build6IXSystem(opts: {
    displayName?: string | null;
    plan: Plan;
    model?: string;
    userText?: string;
    hints?: ProfileHints;
    prefs?: UserPrefs;
    speed?: SpeedMode;
    mood?: Mood;
}) {
    const {
        displayName,
        plan,
        model,
        userText = '',
        hints,
        prefs,
        speed = 'auto',
        mood = 'neutral'
    } = opts;

    const personal = buildPersonalSystem(displayName, mood);
    const language = LANGUAGE_POLICY(plan, hints?.language || 'en');
    const prefRules = preferenceRules(prefs || {}, plan);
    const followups = plan === 'free' ? FOLLOWUP_RULES_BASE : FOLLOWUP_RULES_ADV;
    const toolTags = plan !== 'free' ? TOOL_TAG_RULES : '';
    const hintLines = profileHintLines(hints);
    const domain = pickDomainSystem({ userText, displayName, plan, model, speed, prefs, hints });

    return [
        personal,
        STYLE_PRIMER,
        hintLines,
        language,
        prefRules,
        followups,
        toolTags,
        domain,
        BRAND_FACTS
    ].filter(Boolean).join('\n\n');
}
