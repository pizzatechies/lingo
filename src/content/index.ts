import type { Course, CourseId, CourseMeta } from './types';
import { LANGUAGES, languageById } from './languages';
import { buildCommunityCourse, type Translations } from './community';

export const COURSE_META: CourseMeta[] = [
  { id: 'sw', name: 'Kiswahili', nativeName: 'Kiswahili', tagline: "Kenya's national language", region: 'All of Kenya', community: '100M+ speakers', status: 'stable', icon: '🌍', color: '#D9541E', learnFrom: ['en'], ttsLang: 'sw' },
  { id: 'ki', name: 'Gĩkũyũ', nativeName: 'Gĩkũyũ', tagline: 'Central Kenya, around Mount Kenya', region: 'Central Kenya', community: '~8.1M people', status: 'beta', icon: '⛰️', color: '#2E8B57', learnFrom: ['en', 'sw'] },
  { id: 'luo', name: 'Dholuo', nativeName: 'Dholuo', tagline: 'Around Lake Victoria', region: 'Western Kenya', community: '~5.1M people', status: 'beta', icon: '🐟', color: '#1B6CA8', learnFrom: ['en', 'sw'] },
  { id: 'kln', name: 'Kalenjin', nativeName: 'Kalenjin', tagline: 'The Rift Valley highlands', region: 'Rift Valley', community: '~6.3M people', status: 'beta', icon: '🏃', color: '#7B4BA0', learnFrom: ['en', 'sw'] },
  { id: 'mas', name: 'Maa', nativeName: 'ɔl Maa', tagline: 'Maasai and Samburu', region: 'Narok · Kajiado · Samburu', community: '~1.2M people', status: 'beta', icon: '🐄', color: '#C2302E', learnFrom: ['en', 'sw'] },
  { id: 'so', name: 'Af-Soomaali', nativeName: 'Af-Soomaali', tagline: 'Somali, spoken across North Eastern Kenya', region: 'North Eastern Kenya', community: '~2.8M people', status: 'beta', icon: '🐪', color: '#1B6CA8', learnFrom: ['en', 'sw'] },
  { id: 'sheng', name: 'Sheng', nativeName: 'Sheng', tagline: "Nairobi's street slang", region: 'Urban Kenya', community: 'Millions of young Kenyans', status: 'beta', icon: '🎧', color: '#0F7C80', learnFrom: ['en', 'sw'], ttsLang: 'sw' },
];

const loaders: Record<CourseId, () => Promise<{ default: Course }>> = {
  sw: () => import('./courses/sw'),
  ki: () => import('./courses/ki'),
  luo: () => import('./courses/luo'),
  kln: () => import('./courses/kln'),
  mas: () => import('./courses/mas'),
  sheng: () => import('./courses/sheng'),
  so: () => import('./courses/so'),
};

/** Translations approved by the Lugha Zetu team and bundled with the app (src/content/community/<lang>.json). */
const bundled = import.meta.glob<Translations>('./community/*.json', { import: 'default' });
const TR_KEY = 'lugha-tr-';
/** Server-approved translations, cached so community courses work offline. */
export function cachedTranslations(id: string): Translations {
  try { return JSON.parse(localStorage.getItem(TR_KEY + id) ?? '{}'); } catch { return {}; }
}
export function storeTranslations(id: string, tr: Translations) {
  try { localStorage.setItem(TR_KEY + id, JSON.stringify(tr)); } catch { /* storage unavailable */ }
  cache.delete(id);
}
/** Local, unsubmitted translations a contributor wants to preview as a course. */
let previewDrafts: Record<string, Translations> = {};
export function setPreviewDrafts(id: string, tr: Translations | null) {
  if (tr) previewDrafts[id] = tr; else delete previewDrafts[id];
  cache.delete(id);
}
export const isBuiltIn = (id: string) => id in loaders;

const cache = new Map<CourseId, Course>();
export async function loadCourse(id: CourseId): Promise<Course> {
  const hit = cache.get(id);
  if (hit) return hit;
  let course: Course;
  if (loaders[id]) course = (await loaders[id]()).default;
  else {
    const lang = languageById(id);
    if (!lang) throw new Error(`Unknown language ${id}`);
    const fromApp = bundled[`./community/${id}.json`] ? await bundled[`./community/${id}.json`]() : {};
    const sw = await loadCourse('sw');
    course = buildCommunityCourse(lang, sw, { ...fromApp, ...cachedTranslations(id), ...(previewDrafts[id] ?? {}) });
  }
  cache.set(id, course);
  return course;
}
export const getLoadedCourse = (id: CourseId) => cache.get(id);
export function metaOf(id: CourseId): CourseMeta {
  const m = COURSE_META.find((x) => x.id === id);
  if (m) return m;
  const l = languageById(id) ?? LANGUAGES[0];
  return { id, name: l.name, nativeName: l.name, tagline: `${l.family} language · ${l.region}`, region: l.region, community: l.community ?? 'Built by native speakers', status: 'community', icon: { Bantu: '🌿', Nilotic: '🐂', Cushitic: '🐪', Other: '🗣️' }[l.family], color: '#5E7F1F', learnFrom: ['en', 'sw'] };
}
