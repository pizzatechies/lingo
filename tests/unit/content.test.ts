import { describe, expect, it } from 'vitest';
import sw from '../../src/content/courses/sw';
import ki from '../../src/content/courses/ki';
import luo from '../../src/content/courses/luo';
import kln from '../../src/content/courses/kln';
import mas from '../../src/content/courses/mas';
import sheng from '../../src/content/courses/sheng';
import { COURSE_META } from '../../src/content';
import { allItems, lexiconFor } from '../../src/lib/lexicon';
import { lessonSession, masterySession, placementSession, reviewSession, testSession, type Exercise } from '../../src/lib/exercises';
import { grade } from '../../src/lib/grade';
import { seeded } from '../../src/lib/rng';
import { review } from '../../src/lib/srs';
import { normTarget, tokenize } from '../../src/lib/answer';

const courses = [sw, ki, luo, kln, mas, sheng];

/** Produce the correct answer for any exercise, proving it is solvable. */
function solve(ex: Exercise) {
  switch (ex.type) {
    case 'choice': case 'picture': case 'fill': case 'chat': return ex.correct;
    case 'type': return ex.answers[0];
    case 'build': return ex.answers[0];
    case 'speak': return { self: true };
    default: return null;
  }
}

describe.each(courses.map((c) => [c.id, c] as const))('course %s', (_id, course) => {
  it('matches the registry metadata', () => {
    const meta = COURSE_META.find((m) => m.id === course.id)!;
    expect(meta).toBeTruthy();
    expect(meta.status).toBe(course.status);
  });
  it('has well-formed items with unique ids', () => {
    const byId = new Map<string, string>();
    for (const u of course.units) {
      expect(u.lessons.length).toBeGreaterThan(0);
      for (const l of u.lessons) {
        expect(l.words.length + l.sentences.length).toBeGreaterThanOrEqual(4);
        for (const it of [...l.words, ...l.sentences]) {
          expect(it.t.trim()).not.toBe('');
          expect(it.en.trim()).not.toBe('');
          if (course.learnFrom.includes('sw')) expect(it.sw, `${it.t} needs a Kiswahili gloss`).toBeTruthy();
          const prev = byId.get(it.id);
          if (prev) expect(prev, `id clash ${it.id}`).toBe(it.t + it.en);
          byId.set(it.id, it.t + it.en);
        }
        for (const c of l.chats) expect(c.wrong.map((x) => normTarget(x))).not.toContain(normTarget(c.reply));
      }
    }
  });
  it('generates solvable sessions for every lesson, in both base languages', () => {
    for (const base of course.learnFrom) {
      const rng = seeded(42);
      const srs: Record<string, ReturnType<typeof review>> = {};
      for (const u of course.units) {
        for (const l of u.lessons) {
          for (const audio of [false, true]) {
            const ex = lessonSession(l, u, { course, base, srs, audio, speak: audio, level: audio ? 0.9 : 0.3, rng });
            expect(ex.length).toBeGreaterThan(3);
            for (const e of ex) {
              if (e.type === 'intro' || e.type === 'match') continue;
              if (e.type === 'build') {
                // every token of the main answer must be available as a tile
                const tiles = e.tiles.map((t) => t.toLowerCase());
                for (const n of tokenize(e.answers[0])) expect(tiles, `${e.answers[0]} tiles ${e.tiles}`).toContain(n.toLowerCase());
              }
              if ("options" in e) expect(new Set(e.options.map((o) => (typeof o === "string" ? o : o.text))).size, JSON.stringify(e.options)).toBe(e.options.length);
              expect(grade(e, solve(e)!).correct, JSON.stringify(e)).toBe(true);
            }
          }
          for (const it of [...l.words, ...l.sentences]) srs[it.id] = review(srs[it.id], true);
        }
      }
      for (const e of [...testSession(course.units, { course, base, srs, audio: false, speak: false, level: 0.5, rng }), ...reviewSession({ course, base, srs, audio: true, speak: true, level: 0.5, rng }, 'smart'), ...masterySession(course.units[0], { course, base, srs, audio: false, speak: false, level: 0.5, rng }), ...placementSession(course, { course, base, srs, audio: false, speak: false, level: 0.5, rng }).exercises]) {
        if (e.type === 'intro' || e.type === 'match') continue;
        expect(grade(e, solve(e)!).correct).toBe(true);
      }
    }
  });
});

describe('hints', () => {
  it('breaks down Swahili verbs automatically', () => {
    const lex = lexiconFor(sw, 'en');
    expect(lex.target('ninakula')?.parts?.map((p) => p[0])).toEqual(['ni', 'na', 'kula']);
    expect(lex.target('tutapika')?.gloss).toContain('we');
    expect(lex.target('hapiki')?.gloss).toContain('not');
    expect(lex.target('maji')?.gloss).toBe('water');
  });
  it('has a substantial Kiswahili course', () => {
    expect(sw.units.length).toBeGreaterThanOrEqual(12);
    expect(allItems(sw).length).toBeGreaterThan(400);
  });
});
