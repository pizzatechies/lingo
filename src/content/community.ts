import { defineCourse, g, lesson, unit, type SentenceIn, type WordIn } from './builder';
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
export function buildCommunityCourse(lang: KenyanLanguage, sw: Course, tr: Translations): Course {
  const units = sw.units.map((u) => {
    const lessons = u.lessons.map((l) => {
      const items: (WordIn | SentenceIn)[] = [];
      for (const w of l.words) {
        const x = tr[w.id];
        if (x?.t.trim()) items.push({ kind: 'word', t: x.t.trim(), alts: x.alts, en: w.en, enAlts: w.enAlts, sw: w.t, swAlts: w.alts, emoji: w.emoji, note: x.note });
      }
      for (const s of l.sentences) {
        const x = tr[s.id];
        if (x?.t.trim()) items.push({ kind: 'sentence', t: x.t.trim(), alts: x.alts, en: s.en, enAlts: s.enAlts, sw: s.t, swAlts: s.alts, note: x.note });
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
  });
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
