/** Answer normalisation and forgiving comparison. */

const CONTRACTIONS: [RegExp, string][] = [
  [/\bi'm\b/g, 'i am'], [/\byou're\b/g, 'you are'], [/\bwe're\b/g, 'we are'], [/\bthey're\b/g, 'they are'],
  [/\b(he|she|it|that|what|where|who|there|here)'s\b/g, '$1 is'], [/\blet's\b/g, 'let us'],
  [/\b(i|you|we|they)'ve\b/g, '$1 have'], [/\b(i|you|he|she|we|they)'ll\b/g, '$1 will'], [/\b(i|you|he|she|we|they)'d\b/g, '$1 would'],
  [/\bcan't\b/g, 'cannot'], [/\bwon't\b/g, 'will not'], [/\b(\w+)n't\b/g, '$1 not'], [/\bwanna\b/g, 'want to'],
];
const BRITISH: Record<string, string> = { colour: 'color', colours: 'colors', favourite: 'favorite', favourites: 'favorites', neighbour: 'neighbor', mum: 'mom', centre: 'center', travelling: 'traveling', okay: 'ok', grey: 'gray' };
const ARTICLES = new Set(['a', 'an', 'the']);

export const stripDiacritics = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC');

/** Normalises target-language text: case, apostrophes, punctuation, spacing. */
export function normTarget(s: string, loose = false): string {
  let out = s.toLowerCase().replace(/[’‘`´]/g, "'").replace(/[^\p{L}\p{N}' ]+/gu, ' ').replace(/\s+/g, ' ').trim();
  if (loose) out = stripDiacritics(out);
  return out;
}

/** Normalises English/Swahili glosses: also expands contractions and drops articles. */
export function normBase(s: string): string {
  let out = stripDiacritics(s.toLowerCase()).replace(/[’‘`´]/g, "'");
  for (const [re, rep] of CONTRACTIONS) out = out.replace(re, rep);
  out = out.replace(/(\d)[:.](\d)/g, '$1$2').replace(/[^\p{L}\p{N} ]+/gu, ' ');
  return out.split(/\s+/).filter((t) => t && !ARTICLES.has(t)).map((t) => BRITISH[t] ?? t).join(' ');
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
}

export type Verdict = { correct: boolean; near?: 'typo' | 'accent'; matched: string };

/**
 * Compare a learner's answer with all accepted answers.
 * Exact (normalised) match → correct. Missing accents → correct with an accent note.
 * One small typo per ~8 characters → correct with a typo note.
 */
export function check(input: string, accepted: string[], side: 'target' | 'base'): Verdict {
  const norm = side === 'target' ? (x: string) => normTarget(x) : normBase;
  const n = norm(input);
  if (!n) return { correct: false, matched: accepted[0] };
  for (const a of accepted) if (norm(a) === n) return { correct: true, matched: a };
  if (side === 'target') {
    const loose = normTarget(input, true);
    for (const a of accepted) if (normTarget(a, true) === loose) return { correct: true, near: 'accent', matched: a };
  }
  let best: { d: number; a: string } | null = null;
  for (const a of accepted) {
    const na = norm(a);
    const d = levenshtein(side === 'target' ? stripDiacritics(n) : n, side === 'target' ? stripDiacritics(na) : na);
    if (!best || d < best.d) best = { d, a };
  }
  if (best) {
    const allowed = Math.max(1, Math.floor(norm(best.a).length / 8));
    if (best.d <= allowed && norm(best.a).length >= 4) return { correct: true, near: 'typo', matched: best.a };
  }
  return { correct: false, matched: accepted[0] };
}

/** Splits text into word tokens, trimming surrounding punctuation but keeping inner apostrophes and hyphens. */
export function tokenize(text: string): string[] {
  return text.split(/\s+/).map((t) => t.replace(/^[^\p{L}\p{N}']+|[^\p{L}\p{N}']+$/gu, '')).filter(Boolean);
}

/** Word-overlap similarity (0–1) used for speech recognition results. */
export function similarity(a: string, b: string): number {
  const ta = normTarget(a, true).split(' ').filter(Boolean);
  const tb = normTarget(b, true).split(' ').filter(Boolean);
  if (!ta.length || !tb.length) return 0;
  let hits = 0;
  const pool = [...tb];
  for (const t of ta) {
    const i = pool.findIndex((p) => p === t || (p.length > 3 && levenshtein(p, t) <= 1));
    if (i >= 0) { hits++; pool.splice(i, 1); }
  }
  return hits / Math.max(ta.length, tb.length);
}
