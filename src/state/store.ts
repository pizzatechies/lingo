import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import type { BaseLang, CourseId } from '../content/types';
import { dayKey } from '../lib/dates';
import { review, type SrsRecord } from '../lib/srs';
import { emptyStreak, practise, reconcile, MAX_REST_DAYS, type StreakState } from '../lib/streak';
import { questsFor, type Quest, type QuestDay } from '../lib/quests';
import { ACHIEVEMENTS, type Achievement, type Stats } from '../lib/achievements';

export interface CourseProgress {
  base: BaseLang;
  startedAt: number;
  done: Record<string, { at: number; best: number; times: number; lastDay: string }>;
  /** Units below this index are unlocked by a placement or jump-ahead test. */
  unlockedThrough: number;
  gold: string[];
  checkpoints: string[];
  stories: string[];
  xp: number;
  /** Last answers (1 = correct) used for adaptive difficulty. */
  recent: number[];
}

export interface Settings {
  dailyGoal: number;
  sound: boolean;
  haptics: boolean;
  listening: boolean;
  speaking: boolean;
  hardcore: boolean;
  theme: 'system' | 'light' | 'dark';
  /** Weekdays (0 = Sunday) that never break the streak. */
  daysOff: number[];
  reduceMotion: boolean;
  bigText: boolean;
  showLeagues: boolean;
}

export interface Report { id: string; courseId: string; itemId: string; kind: 'correction' | 'alternative' | 'audio' | 'other'; text: string; note: string; at: number; synced: boolean }

export type SessionKind = 'lesson' | 'test' | 'mastery' | 'review' | 'story' | 'speed' | 'placement' | 'roleplay';
export interface SessionResult {
  kind: SessionKind;
  courseId: CourseId;
  lessonId?: string;
  unitIndex?: number;
  storyId?: string;
  correct: number;
  total: number;
  maxCombo: number;
  newWords: number;
  listens: number;
  passed?: boolean;
  /** For placement: number of units to unlock. */
  unlockUnits?: number;
  speedPairs?: number;
  minutes?: number;
}
export interface Summary {
  xp: number;
  beads: number;
  streak: number;
  streakExtended: boolean;
  restEarned: boolean;
  goalJustMet: boolean;
  quests: Quest[];
  achievements: Achievement[];
  passed?: boolean;
}

export const SHOP = [
  { id: 'rest', icon: '🛌', name: 'Rest day', desc: `Protects your streak for one missed day (max ${MAX_REST_DAYS}).`, price: 60, kind: 'consumable' },
  { id: 'boost', icon: '⚡', name: 'Double XP · 15 min', desc: 'Earn twice the XP for 15 minutes.', price: 50, kind: 'consumable' },
  { id: 'hearts', icon: '❤️', name: 'Refill hearts', desc: 'Only used in Hardcore mode.', price: 30, kind: 'consumable' },
  { id: 'kikoi', icon: '🧣', name: 'Kikoi scarf', desc: 'A striped coastal kikoi for Twiga.', price: 40, kind: 'outfit' },
  { id: 'kofia', icon: '🧢', name: 'Kofia', desc: 'An embroidered cap.', price: 40, kind: 'outfit' },
  { id: 'beads', icon: '📿', name: 'Beaded collar', desc: 'A colourful beaded collar.', price: 80, kind: 'outfit' },
  { id: 'shades', icon: '🕶️', name: 'Shades', desc: 'For bright savanna afternoons.', price: 60, kind: 'outfit' },
  { id: 'grad', icon: '🎓', name: 'Graduation cap', desc: 'For serious scholars.', price: 120, kind: 'outfit' },
] as const;

const emptyStats = () => ({ lessons: 0, perfect: 0, stories: 0, reviews: 0, correct: 0, answered: 0, contributions: 0, recordings: 0, mastered: 0, nightOwl: false, earlyBird: false, speed: 0, listens: 0, minutes: 0 });

export interface AppState {
  onboarded: boolean;
  profile: { name: string; createdAt: number };
  settings: Settings;
  active: CourseId | null;
  courses: Partial<Record<CourseId, CourseProgress>>;
  srs: Record<string, SrsRecord>;
  mistakes: string[];
  saved: string[];
  xpLog: Record<string, number>;
  streak: StreakState;
  beads: number;
  hearts: { n: number; at: number };
  questDay: QuestDay | null;
  goalPaidOn: string | null;
  achievements: Record<string, number>;
  stats: ReturnType<typeof emptyStats>;
  inventory: { owned: string[]; outfit: string | null; boostUntil: number };
  reports: Report[];
  auth: { token: string; username: string; displayName: string } | null;
  updatedAt: number;

  finishOnboarding: (p: { course: CourseId; base: BaseLang; goal: number; name: string }) => void;
  startCourse: (id: CourseId, base: BaseLang) => void;
  setActive: (id: CourseId) => void;
  setBase: (id: CourseId, base: BaseLang) => void;
  updateSettings: (s: Partial<Settings>) => void;
  setName: (name: string) => void;
  answer: (courseId: CourseId, itemId: string, correct: boolean) => void;
  completeSession: (r: SessionResult) => Summary;
  dailyTick: (audio: boolean) => void;
  loseHeart: () => void;
  gainHeart: (n?: number) => void;
  buy: (id: string) => boolean;
  equip: (id: string | null) => void;
  claimQuest: (id: string) => void;
  toggleSaved: (itemId: string) => void;
  addReport: (r: Omit<Report, 'id' | 'at' | 'synced'>) => void;
  markReportsSynced: (ids: string[]) => void;
  setAuth: (a: AppState['auth']) => void;
  replaceState: (s: Partial<AppState>) => void;
  reset: () => void;
}

/** localStorage can be unavailable (private mode, sandboxed previews) — fall back to memory. */
const memory = new Map<string, string>();
const safeStorage: StateStorage = {
  getItem: (k) => { try { return localStorage.getItem(k); } catch { return memory.get(k) ?? null; } },
  setItem: (k, v) => { try { localStorage.setItem(k, v); } catch { memory.set(k, v); } },
  removeItem: (k) => { try { localStorage.removeItem(k); } catch { memory.delete(k); } },
};

const defaults = () => ({
  onboarded: false,
  profile: { name: '', createdAt: Date.now() },
  settings: { dailyGoal: 20, sound: true, haptics: true, listening: true, speaking: true, hardcore: false, theme: 'system', daysOff: [], reduceMotion: false, bigText: false, showLeagues: true } as Settings,
  active: null as CourseId | null,
  courses: {},
  srs: {},
  mistakes: [] as string[],
  saved: [] as string[],
  xpLog: {},
  streak: emptyStreak(),
  beads: 50,
  hearts: { n: 5, at: Date.now() },
  questDay: null,
  goalPaidOn: null,
  achievements: {},
  stats: emptyStats(),
  inventory: { owned: [] as string[], outfit: null as string | null, boostUntil: 0 },
  reports: [] as Report[],
  auth: null,
  updatedAt: Date.now(),
});

const newCourse = (base: BaseLang): CourseProgress => ({ base, startedAt: Date.now(), done: {}, unlockedThrough: 0, gold: [], checkpoints: [], stories: [], xp: 0, recent: [] });
const HEART_MS = 30 * 60 * 1000;

export function wordsLearned(srs: Record<string, SrsRecord>, courseId?: string) {
  return Object.keys(srs).filter((k) => k.includes('.w.') && (!courseId || k.startsWith(courseId + '.'))).length;
}
export const totalXp = (s: Pick<AppState, 'xpLog'>) => Object.values(s.xpLog).reduce((a, b) => a + b, 0);
export const level = (p?: CourseProgress) => (p && p.recent.length >= 8 ? p.recent.reduce((a, b) => a + b, 0) / p.recent.length : 0.5);

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      ...defaults(),

      finishOnboarding: ({ course, base, goal, name }) => set((s) => ({
        onboarded: true, active: course, profile: { ...s.profile, name },
        settings: { ...s.settings, dailyGoal: goal },
        courses: { ...s.courses, [course]: s.courses[course] ?? newCourse(base) }, updatedAt: Date.now(),
      })),
      startCourse: (id, base) => set((s) => ({ active: id, courses: { ...s.courses, [id]: s.courses[id] ?? newCourse(base) }, updatedAt: Date.now() })),
      setActive: (id) => set({ active: id }),
      setBase: (id, base) => set((s) => (s.courses[id] ? { courses: { ...s.courses, [id]: { ...s.courses[id]!, base } } } : {})),
      updateSettings: (p) => set((s) => ({ settings: { ...s.settings, ...p }, updatedAt: Date.now() })),
      setName: (name) => set((s) => ({ profile: { ...s.profile, name } })),

      answer: (courseId, itemId, correct) => set((s) => {
        const cp = s.courses[courseId];
        const mistakes = correct ? s.mistakes.filter((m) => m !== itemId || (s.srs[itemId]?.streak ?? 0) < 1) : [...new Set([itemId, ...s.mistakes])].slice(0, 200);
        return {
          srs: { ...s.srs, [itemId]: review(s.srs[itemId], correct) },
          mistakes,
          stats: { ...s.stats, correct: s.stats.correct + (correct ? 1 : 0), answered: s.stats.answered + 1 },
          courses: cp ? { ...s.courses, [courseId]: { ...cp, recent: [...cp.recent, correct ? 1 : 0].slice(-40) } } : s.courses,
        };
      }),

      completeSession: (r) => {
        const s = get();
        const today = dayKey();
        const hour = new Date().getHours();
        const cp = s.courses[r.courseId] ?? newCourse('en');
        const perfect = r.total > 0 && r.correct === r.total;
        let xp = 0;
        const course: CourseProgress = { ...cp, done: { ...cp.done }, gold: [...cp.gold], checkpoints: [...cp.checkpoints], stories: [...cp.stories] };
        const stats = { ...s.stats };
        switch (r.kind) {
          case 'lesson': {
            const prev = course.done[r.lessonId!];
            xp = 10 + (perfect ? 5 : 0) + Math.floor(r.maxCombo / 5);
            if (prev && prev.lastDay === today) xp = Math.ceil(xp / 2); // diminishing returns for same-day replays
            course.done[r.lessonId!] = { at: Date.now(), best: Math.max(prev?.best ?? 0, r.correct / Math.max(1, r.total)), times: (prev?.times ?? 0) + 1, lastDay: today };
            stats.lessons++;
            if (perfect) stats.perfect++;
            break;
          }
          case 'test':
            xp = r.passed ? 15 : 5;
            if (r.passed && r.unitIndex !== undefined) {
              course.unlockedThrough = Math.max(course.unlockedThrough, r.unitIndex + 1);
              course.checkpoints = [...new Set([...course.checkpoints, `u${r.unitIndex}`])];
            }
            break;
          case 'mastery':
            xp = r.passed ? 20 : 5;
            if (r.passed && r.unitIndex !== undefined) { course.gold = [...new Set([...course.gold, `u${r.unitIndex}`])]; stats.mastered++; }
            break;
          case 'review': xp = 10; stats.reviews++; break;
          case 'story': xp = 15; if (r.storyId && !course.stories.includes(r.storyId)) { course.stories.push(r.storyId); stats.stories++; } break;
          case 'speed': xp = Math.min(20, r.speedPairs ?? 0); stats.speed = Math.max(stats.speed, r.speedPairs ?? 0); break;
          case 'roleplay': xp = 5; break;
          case 'placement': xp = 0; course.unlockedThrough = Math.max(course.unlockedThrough, r.unlockUnits ?? 0); break;
        }
        if (s.inventory.boostUntil > Date.now()) xp *= 2;
        course.xp += xp;
        stats.listens += r.listens;
        stats.minutes += r.minutes ?? 0;
        if (hour >= 22) stats.nightOwl = true;
        if (hour < 7) stats.earlyBird = true;

        const xpLog = { ...s.xpLog, [today]: (s.xpLog[today] ?? 0) + xp };
        const goalJustMet = (s.xpLog[today] ?? 0) < s.settings.dailyGoal && xpLog[today] >= s.settings.dailyGoal && s.goalPaidOn !== today;
        let beads = s.beads + (xp > 0 ? 2 : 0) + (goalJustMet ? 5 : 0);

        const st = r.kind === 'placement' ? { state: s.streak, extended: false, earnedRestDay: false } : practise(reconcile(s.streak, today, s.settings.daysOff), today);

        // Quests
        const qd = s.questDay && s.questDay.date === today ? s.questDay : questsFor(today, s.settings.dailyGoal, true);
        const finished: Quest[] = [];
        const quests = qd.quests.map((q) => {
          const inc = { xp, lessons: r.kind === 'lesson' ? 1 : 0, perfect: r.kind === 'lesson' && perfect ? 1 : 0, combo: 0, review: r.kind === 'review' ? r.total : 0, story: r.kind === 'story' ? 1 : 0, newWords: r.newWords, listen: r.listens }[q.kind];
          const progress = q.kind === 'combo' ? Math.max(q.progress, r.maxCombo) : q.progress + inc;
          const nq = { ...q, progress: Math.min(q.target, progress) };
          if (q.progress < q.target && nq.progress >= q.target) finished.push(nq);
          return nq;
        });

        // Achievements
        const courses = { ...s.courses, [r.courseId]: course };
        const srsWords = wordsLearned(s.srs);
        const astats: Stats = {
          lessons: stats.lessons, perfect: stats.perfect, xp: totalXp({ xpLog }), stories: stats.stories, reviews: stats.reviews, words: srsWords,
          correct: stats.correct, answered: stats.answered, courses: Object.keys(courses).length, longestStreak: st.state.longest,
          contributions: stats.contributions, recordings: stats.recordings, mastered: stats.mastered, nightOwl: stats.nightOwl, earlyBird: stats.earlyBird, speed: stats.speed,
        };
        const unlocked = ACHIEVEMENTS.filter((a) => !s.achievements[a.id] && a.test(astats));
        const achievements = { ...s.achievements };
        for (const a of unlocked) { achievements[a.id] = Date.now(); beads += a.reward; }

        set({
          courses, stats, xpLog, beads, streak: st.state, questDay: { date: today, quests }, achievements,
          goalPaidOn: goalJustMet ? today : s.goalPaidOn, updatedAt: Date.now(),
        });
        return { xp, beads: beads - s.beads, streak: st.state.current, streakExtended: st.extended, restEarned: st.earnedRestDay, goalJustMet, quests: finished, achievements: unlocked, passed: r.passed };
      },

      dailyTick: (audio) => set((s) => {
        const today = dayKey();
        const streak = reconcile(s.streak, today, s.settings.daysOff);
        const questDay = s.questDay?.date === today ? s.questDay : questsFor(today, s.settings.dailyGoal, audio);
        let hearts = s.hearts;
        if (hearts.n < 5) {
          const gained = Math.floor((Date.now() - hearts.at) / HEART_MS);
          if (gained > 0) hearts = { n: Math.min(5, hearts.n + gained), at: hearts.at + gained * HEART_MS };
        }
        return { streak, questDay, hearts };
      }),
      loseHeart: () => set((s) => ({ hearts: { n: Math.max(0, s.hearts.n - 1), at: s.hearts.n === 5 ? Date.now() : s.hearts.at } })),
      gainHeart: (n = 1) => set((s) => ({ hearts: { n: Math.min(5, s.hearts.n + n), at: Date.now() } })),

      buy: (id) => {
        const s = get();
        const item = SHOP.find((i) => i.id === id);
        if (!item || s.beads < item.price) return false;
        if (item.kind === 'outfit' && s.inventory.owned.includes(id)) return false;
        if (id === 'rest' && s.streak.restDays >= MAX_REST_DAYS) return false;
        if (id === 'hearts' && s.hearts.n >= 5) return false;
        const patch: Partial<AppState> = { beads: s.beads - item.price };
        if (id === 'rest') patch.streak = { ...s.streak, restDays: s.streak.restDays + 1 };
        else if (id === 'boost') patch.inventory = { ...s.inventory, boostUntil: Math.max(Date.now(), s.inventory.boostUntil) + 15 * 60 * 1000 };
        else if (id === 'hearts') patch.hearts = { n: 5, at: Date.now() };
        else patch.inventory = { ...s.inventory, owned: [...s.inventory.owned, id], outfit: id };
        set(patch);
        return true;
      },
      equip: (id) => set((s) => ({ inventory: { ...s.inventory, outfit: id } })),
      claimQuest: (id) => set((s) => {
        if (!s.questDay) return {};
        const q = s.questDay.quests.find((x) => x.id === id);
        if (!q || q.claimed || q.progress < q.target) return {};
        return { beads: s.beads + q.reward, questDay: { ...s.questDay, quests: s.questDay.quests.map((x) => (x.id === id ? { ...x, claimed: true } : x)) } };
      }),
      toggleSaved: (itemId) => set((s) => ({ saved: s.saved.includes(itemId) ? s.saved.filter((x) => x !== itemId) : [...s.saved, itemId] })),
      addReport: (r) => set((s) => ({
        reports: [{ ...r, id: Math.random().toString(36).slice(2), at: Date.now(), synced: false }, ...s.reports].slice(0, 300),
        stats: { ...s.stats, contributions: s.stats.contributions + (r.kind === 'audio' ? 0 : 1), recordings: s.stats.recordings + (r.kind === 'audio' ? 1 : 0) },
      })),
      markReportsSynced: (ids) => set((s) => ({ reports: s.reports.map((r) => (ids.includes(r.id) ? { ...r, synced: true } : r)) })),
      setAuth: (auth) => set({ auth }),
      replaceState: (p) => set(p),
      reset: () => set({ ...defaults() }),
    }),
    { name: 'lugha-state', version: 1, storage: createJSONStorage(() => safeStorage) },
  ),
);

/** Fields that make up a learner's progress (used for export/import and cloud sync). */
export const PROGRESS_KEYS = ['onboarded', 'profile', 'settings', 'active', 'courses', 'srs', 'mistakes', 'saved', 'xpLog', 'streak', 'beads', 'hearts', 'questDay', 'goalPaidOn', 'achievements', 'stats', 'inventory', 'reports', 'updatedAt'] as const;
export function progressSnapshot(s: AppState) {
  const out: Record<string, unknown> = {};
  for (const k of PROGRESS_KEYS) out[k] = s[k];
  return out;
}
