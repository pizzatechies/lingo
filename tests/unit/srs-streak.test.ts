import { describe, expect, it } from 'vitest';
import { isDue, review, strength } from '../../src/lib/srs';
import { emptyStreak, practise, reconcile } from '../../src/lib/streak';

const DAY = 86400000;
describe('spaced repetition', () => {
  it('grows half-life with correct answers and shrinks on mistakes', () => {
    const t0 = 1_700_000_000_000;
    let r = review(undefined, true, t0);
    expect(r.halfLife).toBe(0.5 * DAY);
    r = review(r, true, t0 + DAY);
    expect(r.halfLife).toBeGreaterThan(DAY);
    const before = r.halfLife;
    r = review(r, false, t0 + 2 * DAY);
    expect(r.halfLife).toBeLessThan(before);
  });
  it('becomes due when strength drops under 50%', () => {
    const r = review(undefined, true, 0);
    expect(isDue(r, 0.4 * DAY)).toBe(false);
    expect(isDue(r, 0.6 * DAY)).toBe(true);
    expect(strength(r, 0)).toBe(1);
  });
});

describe('streaks', () => {
  it('extends once per day', () => {
    let s = practise(emptyStreak(), '2026-11-02').state;
    s = practise(s, '2026-11-02').state;
    expect(s.current).toBe(1);
    s = practise(reconcile(s, '2026-11-03', []), '2026-11-03').state;
    expect(s.current).toBe(2);
  });
  it('breaks after a missed day without rest days', () => {
    let s = practise(emptyStreak(), '2026-11-02').state; // Monday
    s = reconcile(s, '2026-11-04', []);
    expect(s.current).toBe(0);
    expect(s.lost?.value).toBe(1);
  });
  it('never breaks on scheduled days off', () => {
    let s = practise(emptyStreak(), '2026-11-07').state; // Saturday
    s = reconcile(s, '2026-11-09', [0]); // Sunday off
    expect(s.current).toBe(1);
    expect(s.history['2026-11-08']).toBe('off');
  });
  it('uses banked rest days', () => {
    let s = { ...practise(emptyStreak(), '2026-11-02').state, restDays: 1 };
    s = reconcile(s, '2026-11-04', []);
    expect(s.current).toBe(1);
    expect(s.restDays).toBe(0);
    expect(s.history['2026-11-03']).toBe('rest');
  });
  it('earns a rest day every 7 days', () => {
    let s = emptyStreak();
    for (let d = 1; d <= 7; d++) s = practise(reconcile(s, `2026-11-0${d}`, []), `2026-11-0${d}`).state;
    expect(s.current).toBe(7);
    expect(s.restDays).toBe(1);
  });
  it('can be repaired with three sessions', () => {
    let s = emptyStreak();
    for (let d = 1; d <= 5; d++) s = practise(reconcile(s, `2026-11-0${d}`, []), `2026-11-0${d}`).state;
    s = { ...s, restDays: 0 };
    s = reconcile(s, '2026-11-08', []);
    expect(s.current).toBe(0);
    for (let i = 0; i < 3; i++) s = practise(s, '2026-11-08').state;
    expect(s.current).toBe(6);
    expect(s.lost).toBeNull();
  });
});
