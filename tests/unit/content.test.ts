import { describe, expect, it } from 'vitest';
import sw from '../../src/content/courses/sw';
import ki from '../../src/content/courses/ki';
import luo from '../../src/content/courses/luo';
import kln from '../../src/content/courses/kln';
import mas from '../../src/content/courses/mas';
import sheng from '../../src/content/courses/sheng';
import so from '../../src/content/courses/so';
import { buildCommunityCourse, sourceItems, translationProgress } from '../../src/content/community';
import { LANGUAGES, languageById } from '../../src/content/languages';
import { readWorksheet, worksheetCsv } from '../../src/lib/worksheet';
import { COURSE_META } from '../../src/content';
import { allItems, lexiconFor } from '../../src/lib/lexicon';
import { lessonSession, masterySession, placementSession, reviewSession, testSession, type Exercise } from '../../src/lib/exercises';
import { grade } from '../../src/lib/grade';
import { seeded } from '../../src/lib/rng';
import { review } from '../../src/lib/srs';
import { normTarget, tokenize } from '../../src/lib/answer';

// A community course built from a few pretend translations, so the engine is tested end to end.
const fakeTr = Object.fromEntries(sourceItems(sw).slice(0, 60).map(({ item }, i) => [item.id, { t: `neno${i} ${item.kind === 'sentence' ? 'sana' : ''}`.trim() }]));
const community = buildCommunityCourse(languageById('kam')!, sw, fakeTr);
const courses = [sw, ki, luo, kln, mas, sheng, so, community];

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
    if (course.status === 'community') return;
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

describe('all Kenyan languages', () => {
  it('lists every language once, with built-in courses linked', () => {
    expect(new Set(LANGUAGES.map((l) => l.id)).size).toBe(LANGUAGES.length);
    expect(LANGUAGES.length).toBeGreaterThanOrEqual(40);
    for (const l of LANGUAGES.filter((x) => x.course)) expect(COURSE_META.some((m) => m.id === l.course)).toBe(true);
    for (const l of LANGUAGES) expect(l.id).toMatch(/^[a-z]{2,6}$/);
  });
  it('builds community courses from translations, skipping thin lessons', () => {
    expect(community.status).toBe('community');
    expect(community.units.length).toBeGreaterThan(0);
    for (const u of community.units) for (const l of u.lessons) expect(l.words.length + l.sentences.length).toBeGreaterThanOrEqual(4);
    expect(buildCommunityCourse(languageById('guz')!, sw, {}).units).toHaveLength(0);
    expect(translationProgress(sw, fakeTr).done).toBe(60);
  });
  it('round-trips the translator worksheet', () => {
    const csv = worksheetCsv(sw, { 'sw.w.maji': { t: 'kiwu, "pure"', note: 'Kitui' } });
    const tr = readWorksheet(csv.replace('jambo,"', 'jambo,"').replace(/(sw\.w\.asante,[^\r]*?),,\r/, '$1,nĩ wega | nĩ mũvea,\r'));
    expect(tr['sw.w.maji']).toEqual({ t: 'kiwu, "pure"', note: 'Kitui' });
    expect(Object.keys(tr).length).toBeGreaterThanOrEqual(1);
    expect(() => readWorksheet('a,b\n1,2')).toThrow();
  });
});

describe('room for improvement', () => {
  it('appends approved community additions to a beta course without duplicating what it teaches', async () => {
    const { coveredBy, extendWithCommunity } = await import('../../src/content/community');
    const covered = coveredBy(ki, sw);
    expect(covered.has('sw.w.maji')).toBe(true); // Gĩkũyũ already teaches maaĩ = maji
    const tr = Object.fromEntries(sourceItems(sw).slice(0, 80).map(({ item }, i) => [item.id, { t: `ki${i}` }]));
    const extended = extendWithCommunity(ki, languageById('ki')!, sw, tr);
    expect(extended.units.length).toBeGreaterThan(ki.units.length);
    const extra = extended.units.slice(ki.units.length);
    expect(extra.every((u, i) => u.id.startsWith('ki.cu') && u.index === ki.units.length + i)).toBe(true);
    const ids = new Set(extended.units.flatMap((u) => u.lessons.map((l) => l.id)));
    expect(ids.size).toBe(extended.units.reduce((a, u) => a + u.lessons.length, 0));
    for (const u of extra) for (const l of u.lessons) for (const it of [...l.words, ...l.sentences]) expect(covered.has(`sw.${it.kind === 'word' ? 'w' : 's'}.x`)).toBe(false);
    expect(extendWithCommunity(ki, languageById('ki')!, sw, {})).toBe(ki);
  });
});
