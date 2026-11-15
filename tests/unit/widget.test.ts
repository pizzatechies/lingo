import { describe, expect, it } from 'vitest';
import sw from '../../src/content/courses/sw';
import luo from '../../src/content/courses/luo';
import { widgetPayload } from '../../src/lib/widget';
import { useApp } from '../../src/state/store';

describe('widget payload', () => {
  it('covers a week of words and proverbs', () => {
    useApp.getState().startCourse('sw', 'en');
    const p = widgetPayload(sw);
    expect(p.words).toHaveLength(7);
    expect(new Set(p.words.map((w) => w.date)).size).toBe(7);
    expect(p.words.every((w) => w.t && w.gloss && w.emoji)).toBe(true);
    expect(p.proverbs).toHaveLength(7);
    expect(p.course).toBe('Kiswahili');
  });
  it('uses Kiswahili glosses when learning from Kiswahili', () => {
    useApp.getState().startCourse('luo', 'sw');
    const p = widgetPayload(luo);
    const all = luo.units.flatMap((u) => u.lessons.flatMap((l) => l.words));
    for (const w of p.words) expect(all.find((x) => x.t === w.t)?.sw).toBe(w.gloss);
    expect(p.proverbs).toEqual([]);
  });
});
