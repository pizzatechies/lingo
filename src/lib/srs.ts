/**
 * Spaced repetition based on memory half-life (like half-life regression):
 * strength = 2^(-elapsed / halfLife). An item is due once strength drops below 50%.
 */
export interface SrsRecord { seen: number; correct: number; wrong: number; streak: number; halfLife: number; last: number }
const DAY = 86400000;
const MIN_HL = 0.25 * DAY;
const MAX_HL = 180 * DAY;

export function review(rec: SrsRecord | undefined, correct: boolean, now = Date.now()): SrsRecord {
  const r: SrsRecord = rec ? { ...rec } : { seen: 0, correct: 0, wrong: 0, streak: 0, halfLife: MIN_HL, last: now };
  const elapsed = rec ? now - rec.last : 0;
  r.seen++;
  if (correct) {
    r.correct++;
    r.streak++;
    // Recalling after a long gap is stronger evidence of memory than recalling right away.
    const bonus = rec ? Math.min(2, 1 + elapsed / Math.max(r.halfLife, 1)) : 1;
    r.halfLife = rec ? Math.min(MAX_HL, r.halfLife * (1.6 + 0.4 * bonus)) : 0.5 * DAY;
  } else {
    r.wrong++;
    r.streak = 0;
    r.halfLife = Math.max(MIN_HL, r.halfLife * 0.4);
  }
  r.last = now;
  return r;
}

export const strength = (r: SrsRecord, now = Date.now()) => Math.pow(2, -(now - r.last) / r.halfLife);
export const isDue = (r: SrsRecord, now = Date.now()) => strength(r, now) < 0.5;
export const dueAt = (r: SrsRecord) => r.last + r.halfLife;
/** 0–4 bars for display. */
export const bars = (r: SrsRecord, now = Date.now()) => Math.max(1, Math.min(4, Math.ceil(strength(r, now) * 4)));
