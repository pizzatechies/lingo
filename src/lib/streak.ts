import { addDays, daysBetween, weekday } from './dates';

export type DayMark = 'active' | 'rest' | 'off' | 'repaired';
export interface StreakState {
  current: number;
  longest: number;
  lastActive: string | null;
  /** Last date already reconciled (missed days before it have been handled). */
  checkedThrough: string | null;
  restDays: number;
  history: Record<string, DayMark>;
  lost: { value: number; on: string } | null;
  repair: { done: number; target: number } | null;
}
export const MAX_REST_DAYS = 3;
export const emptyStreak = (): StreakState => ({ current: 0, longest: 0, lastActive: null, checkedThrough: null, restDays: 0, history: {}, lost: null, repair: null });

/**
 * Handles days that passed without practice, up to (not including) today.
 * Scheduled days off (e.g. Sunday) never break the streak; otherwise a banked rest day is used;
 * otherwise the streak is lost (and can be repaired for 3 days by doing extra practice).
 */
export function reconcile(s: StreakState, today: string, daysOff: number[]): StreakState {
  if (!s.lastActive || s.current === 0) return s;
  const start = s.checkedThrough && daysBetween(s.lastActive, s.checkedThrough) > 0 ? s.checkedThrough : s.lastActive;
  if (daysBetween(start, today) <= 1) return s;
  const n: StreakState = { ...s, history: { ...s.history } };
  for (let d = addDays(start, 1); daysBetween(d, today) > 0; d = addDays(d, 1)) {
    if (n.history[d]) continue;
    if (daysOff.includes(weekday(d))) n.history[d] = 'off';
    else if (n.restDays > 0) { n.restDays--; n.history[d] = 'rest'; }
    else { n.lost = { value: n.current, on: d }; n.current = 0; n.repair = null; break; }
    n.checkedThrough = d;
  }
  if (n.current > 0) n.checkedThrough = addDays(today, -1);
  return n;
}

/** Records practice today. Returns new state and whether the streak grew. */
export function practise(s: StreakState, today: string): { state: StreakState; extended: boolean; earnedRestDay: boolean } {
  const n: StreakState = { ...s, history: { ...s.history } };
  let extended = false, earnedRestDay = false;
  if (n.history[today] !== 'active') {
    n.current += 1;
    n.history[today] = 'active';
    extended = true;
    if (n.current % 7 === 0 && n.restDays < MAX_REST_DAYS) { n.restDays++; earnedRestDay = true; }
  }
  n.lastActive = today;
  n.checkedThrough = today;
  n.longest = Math.max(n.longest, n.current);
  // Repair challenge: after losing a streak, 3 sessions today restore it.
  if (n.lost && daysBetween(n.lost.on, today) <= 3) {
    n.repair = n.repair ?? { done: 0, target: 3 };
    n.repair.done += 1;
    if (n.repair.done >= n.repair.target) {
      for (let d = n.lost.on; daysBetween(d, today) > 0; d = addDays(d, 1)) if (!n.history[d]) n.history[d] = 'repaired';
      n.current = n.lost.value + n.current;
      n.longest = Math.max(n.longest, n.current);
      n.lost = null;
      n.repair = null;
    }
  } else if (n.lost) { n.lost = null; n.repair = null; }
  return { state: n, extended, earnedRestDay };
}
