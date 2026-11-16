import { defineCourse, g, lesson, unit, type SentenceIn, type WordIn } from './builder';
import { normTarget } from '../lib/answer';
import type { Course } from './types';
import type { KenyanLanguage } from './languages';

/** One native-speaker translation of an item from the Kiswahili course. */
export interface Translation { t: string; alts?: string[]; note?: string }
export type Translations = Record<string, Translation>;

const FAMILY_ICON: Record<string, string> = { Bantu: '🌿', Nilotic: '🐂', Cushitic: '🐪', Other: '🗣️' };
/** A lesson needs this many translated items to be playable. */
export const MIN_LESSON_ITEMS = 4;

/**
 * Builds a playable course for any Kenyan language from translations of the Kiswahili course.
 * Every item keeps its English and Kiswahili meanings and emoji, so the course can be learned from either.
 */
export function buildCommunityCourse(lang: KenyanLanguage, sw: Course, tr: Translations, opts: { skip?: Set<string>; unitPrefix?: string } = {}): Course {
  const usable = (id: string) => !!tr[id]?.t.trim() && !opts.skip?.has(id);
  const units = sw.units.map((u) => {
    const lessons = u.lessons.map((l) => {
      const items: (WordIn | SentenceIn)[] = [];
      for (const w of l.words) {
        const x = tr[w.id];
        if (x && usable(w.id)) items.push({ kind: 'word', t: x.t.trim(), alts: x.alts, en: w.en, enAlts: w.enAlts, sw: w.t, swAlts: w.alts, emoji: w.emoji, note: x.note });
      }
      for (const s of l.sentences) {
        const x = tr[s.id];
        if (x && usable(s.id)) items.push({ kind: 'sentence', t: x.t.trim(), alts: x.alts, en: s.en, enAlts: s.enAlts, sw: s.t, swAlts: s.alts, note: x.note });
      }
      return items.length >= MIN_LESSON_ITEMS ? lesson(l.title, items) : null;
    }).filter((l): l is NonNullable<typeof l> => !!l);
    return lessons.length ? unit(u.titleEn, u.titleEn, u.icon, u.description, [g('Built by the community', `This unit was translated by ${lang.name} speakers from the Kiswahili course. Tap ⚑ Report to suggest improvements.`)], lessons) : null;
  }).filter((u): u is NonNullable<typeof u> => !!u);
  return defineCourse({
    meta: {
      id: lang.id, name: lang.name, nativeName: lang.name, tagline: `${lang.family} language · ${lang.region}`, region: lang.region,
      community: lang.community ?? 'Built by native speakers', status: 'community', icon: FAMILY_ICON[lang.family], color: '#5E7F1F',
      learnFrom: ['en', 'sw'], specialChars: ["'"],
    },
    units,
    culture: lang.note ? [g(`About ${lang.name}`, lang.note)] : [],
  }, { unitPrefix: opts.unitPrefix });
}

/** Kiswahili items a hand-written course already teaches (matched by its Kiswahili glosses). */
export function coveredBy(course: Course, sw: Course): Set<string> {
  const glosses = new Set<string>();
  for (const u of course.units) for (const l of u.lessons) for (const it of [...l.words, ...l.sentences]) {
    for (const g of [it.sw, ...(it.swAlts ?? [])]) if (g) glosses.add(normTarget(g));
  }
  const out = new Set<string>();
  for (const { item } of sourceItems(sw)) if (glosses.has(normTarget(item.t))) out.add(item.id);
  return out;
}

/**
 * Leaves room for improvement: approved community translations are appended to a hand-written beta course
 * as extra units, skipping anything the course already teaches.
 */
export function extendWithCommunity(course: Course, lang: KenyanLanguage, sw: Course, tr: Translations): Course {
  if (!Object.keys(tr).length) return course;
  const extra = buildCommunityCourse(lang, sw, tr, { skip: coveredBy(course, sw), unitPrefix: 'cu' });
  if (!extra.units.length) return course;
  const base = course.units.length;
  const units = extra.units.map((u, i) => ({ ...u, index: base + i, title: `${u.titleEn}`, titleEn: `${u.titleEn} · community`, color: '#5E7F1F' }));
  return { ...course, units: [...course.units, ...units] };
}

/** Every translatable item of the Kiswahili course, in course order (the translator's worksheet). */
export function sourceItems(sw: Course) {
  return sw.units.flatMap((u) => u.lessons.flatMap((l) => [...l.words, ...l.sentences].map((it) => ({ unit: u, lesson: l, item: it }))));
}

export function translationProgress(sw: Course, tr: Translations) {
  const all = sourceItems(sw);
  const done = all.filter((x) => tr[x.item.id]?.t.trim()).length;
  return { done, total: all.length };
}
