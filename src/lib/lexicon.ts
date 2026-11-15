import type { BaseLang, Course, Item } from '../content/types';
import { normTarget, normBase, tokenize } from './answer';

export interface Hint { gloss: string; parts?: [string, string][] }
export const gloss = (item: Pick<Item, 'en' | 'sw'>, base: BaseLang) => (base === 'sw' && item.sw ? item.sw : item.en);
export const glossAnswers = (item: Item, base: BaseLang) =>
  base === 'sw' && item.sw ? [item.sw, ...(item.swAlts ?? [])] : [item.en, ...(item.enAlts ?? [])];
export const targetAnswers = (item: Item) => [item.t, ...(item.alts ?? [])];

export const allItems = (c: Course): Item[] => {
  const seen = new Map<string, Item>();
  for (const u of c.units) for (const l of u.lessons) for (const it of [...l.words, ...l.sentences]) if (!seen.has(it.id)) seen.set(it.id, it);
  return [...seen.values()];
};

const SUBJ: Record<string, [string, string]> = { ni: ['I', 'mimi'], u: ['you', 'wewe'], a: ['he/she', 'yeye'], tu: ['we', 'sisi'], m: ['you all', 'ninyi'], wa: ['they', 'wao'] };
const TENSE: Record<string, [string, string]> = { na: ['present (-ing)', 'wakati uliopo'], li: ['past', 'wakati uliopita'], ta: ['future (will)', 'wakati ujao'], me: ['perfect (have …)', 'timilifu'] };
const NEG: Record<string, [string, string]> = { si: ['I … not', 'mimi … si'], hu: ['you … not', 'wewe … si'], ha: ['he/she … not', 'yeye … si'], hatu: ['we … not', 'sisi … si'], ham: ['you all … not', 'ninyi … si'], hawa: ['they … not', 'wao … si'] };

/** Breaks Swahili verbs into subject + tense + root when the root is in the course vocabulary. */
function swahiliVerb(token: string, verbs: Map<string, string>, base: BaseLang): Hint | null {
  const b = base === 'sw' ? 1 : 0;
  const m = token.match(/^(ni|tu|wa|u|a|m)(na|li|ta|me)(.+)$/);
  if (m) {
    const [, sp, tp, root] = m;
    for (const cand of [root, 'ku' + root, 'kw' + root, root.replace(/^ku/, '')]) {
      const g = verbs.get(cand);
      if (g) {
        const meaning = g.replace(/^to /, '');
        return { gloss: `${SUBJ[sp][b]} + ${TENSE[tp][b]} + ${meaning}`, parts: [[sp, SUBJ[sp][b]], [tp, TENSE[tp][b]], [root, meaning]] };
      }
    }
  }
  const n = token.match(/^(hatu|hawa|ham|si|hu|ha)(.+)i$/);
  if (n) {
    const [, np, stem] = n;
    const g = verbs.get('ku' + stem + 'a') ?? verbs.get('kw' + stem + 'a');
    if (g) return { gloss: `${NEG[np][b]} ${g.replace(/^to /, '')}`, parts: [[np, NEG[np][b]], [stem + 'i', `${g.replace(/^to /, '')} (negative ending -i)`]] };
  }
  return null;
}

export interface Lexicon { target: (token: string) => Hint | null; base: (phrase: string) => string | null; breakdown: (text: string) => { token: string; hint: Hint | null }[] }

const lexCache = new Map<string, Lexicon>();
export function lexiconFor(course: Course, base: BaseLang): Lexicon {
  const key = course.id + base;
  const hit = lexCache.get(key);
  if (hit) return hit;
  const tmap = new Map<string, Hint>();
  const bmap = new Map<string, string>();
  const verbs = new Map<string, string>();
  for (const it of allItems(course)) {
    if (it.kind !== 'word') continue;
    const g = gloss(it, base);
    tmap.set(normTarget(it.t), { gloss: g });
    for (const a of it.alts ?? []) tmap.set(normTarget(a), { gloss: g });
    if (/^k[uw]/.test(it.t) && it.en.startsWith('to ')) verbs.set(normTarget(it.t), base === 'sw' && it.sw ? it.sw : it.en);
    for (const ga of [g, ...(base === 'en' ? it.enAlts ?? [] : it.swAlts ?? [])]) {
      const k = normBase(ga);
      if (k && !bmap.has(k)) bmap.set(k, it.t);
    }
  }
  for (const [k, v] of Object.entries(course.hints)) {
    const g = Array.isArray(v) ? (base === 'sw' ? v[1] : v[0]) : v;
    if (!tmap.has(normTarget(k))) tmap.set(normTarget(k), { gloss: g });
  }
  const target = (token: string): Hint | null => {
    const k = normTarget(token);
    const direct = tmap.get(k);
    if (direct) return direct;
    if (course.morphology === 'swahili') return swahiliVerb(k, verbs, base);
    return null;
  };
  const lex: Lexicon = {
    target,
    base: (phrase) => bmap.get(normBase(phrase)) ?? null,
    breakdown: (text) => {
      const toks = tokenize(text);
      const out: { token: string; hint: Hint | null }[] = [];
      for (let i = 0; i < toks.length; i++) {
        const pair = i + 1 < toks.length ? `${toks[i]} ${toks[i + 1]}` : null;
        const triple = i + 2 < toks.length ? `${toks[i]} ${toks[i + 1]} ${toks[i + 2]}` : null;
        if (triple && tmap.get(normTarget(triple))) { out.push({ token: triple, hint: tmap.get(normTarget(triple))! }); i += 2; continue; }
        if (pair && tmap.get(normTarget(pair))) { out.push({ token: pair, hint: tmap.get(normTarget(pair))! }); i += 1; continue; }
        out.push({ token: toks[i], hint: target(toks[i]) });
      }
      return out;
    },
  };
  lexCache.set(key, lex);
  return lex;
}
