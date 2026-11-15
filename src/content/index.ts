import type { Course, CourseId, CourseMeta } from './types';

export const COURSE_META: CourseMeta[] = [
  { id: 'sw', name: 'Kiswahili', nativeName: 'Kiswahili', tagline: "Kenya's national language", region: 'All of Kenya', community: '100M+ speakers', status: 'stable', icon: '🌍', color: '#D9541E', learnFrom: ['en'], ttsLang: 'sw' },
  { id: 'ki', name: 'Gĩkũyũ', nativeName: 'Gĩkũyũ', tagline: 'Central Kenya, around Mount Kenya', region: 'Central Kenya', community: '~8.1M people', status: 'beta', icon: '⛰️', color: '#2E8B57', learnFrom: ['en', 'sw'] },
  { id: 'luo', name: 'Dholuo', nativeName: 'Dholuo', tagline: 'Around Lake Victoria', region: 'Western Kenya', community: '~5.1M people', status: 'beta', icon: '🐟', color: '#1B6CA8', learnFrom: ['en', 'sw'] },
  { id: 'kln', name: 'Kalenjin', nativeName: 'Kalenjin', tagline: 'The Rift Valley highlands', region: 'Rift Valley', community: '~6.3M people', status: 'beta', icon: '🏃', color: '#7B4BA0', learnFrom: ['en', 'sw'] },
  { id: 'mas', name: 'Maa', nativeName: 'ɔl Maa', tagline: 'Maasai and Samburu', region: 'Narok · Kajiado · Samburu', community: '~1.2M people', status: 'beta', icon: '🐄', color: '#C2302E', learnFrom: ['en', 'sw'] },
  { id: 'sheng', name: 'Sheng', nativeName: 'Sheng', tagline: "Nairobi's street slang", region: 'Urban Kenya', community: 'Millions of young Kenyans', status: 'beta', icon: '🎧', color: '#0F7C80', learnFrom: ['en', 'sw'], ttsLang: 'sw' },
];

/** Languages waiting for native speakers to help build a course. */
export const INCUBATOR = [
  { id: 'luy', name: 'Oluluhya', region: 'Western Kenya', community: '~6.8M people' },
  { id: 'kam', name: 'Kikamba', region: 'Machakos · Kitui · Makueni', community: '~4.7M people' },
  { id: 'so', name: 'Somali', region: 'North Eastern Kenya', community: '~2.8M people' },
  { id: 'guz', name: 'Ekegusii', region: 'Kisii · Nyamira', community: '~2.7M people' },
  { id: 'nyf', name: 'Mijikenda (Kigiryama)', region: 'Coast', community: '~2.5M people' },
  { id: 'mer', name: 'Kimeru', region: 'Meru · Tharaka-Nithi', community: '~2.0M people' },
  { id: 'tuv', name: 'Ng\'aturkana', region: 'Turkana', community: '~1.0M people' },
  { id: 'ebu', name: 'Kiembu', region: 'Embu', community: '~0.4M people' },
];

const loaders: Record<CourseId, () => Promise<{ default: Course }>> = {
  sw: () => import('./courses/sw'),
  ki: () => import('./courses/ki'),
  luo: () => import('./courses/luo'),
  kln: () => import('./courses/kln'),
  mas: () => import('./courses/mas'),
  sheng: () => import('./courses/sheng'),
};

const cache = new Map<CourseId, Course>();
export async function loadCourse(id: CourseId): Promise<Course> {
  const hit = cache.get(id);
  if (hit) return hit;
  const course = (await loaders[id]()).default;
  cache.set(id, course);
  return course;
}
export const getLoadedCourse = (id: CourseId) => cache.get(id);
export const metaOf = (id: CourseId) => COURSE_META.find((m) => m.id === id)!;
