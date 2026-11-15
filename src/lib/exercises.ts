import type { BaseLang, Chat, Course, Item, Lesson, Sentence, Unit, Word } from '../content/types';
import { normBase, normTarget, tokenize } from './answer';
import { allItems, gloss, glossAnswers, targetAnswers } from './lexicon';
import { pick, sample, shuffle, type Rng } from './rng';
import { isDue, strength, type SrsRecord } from './srs';

export type Exercise =
  | { type: 'intro'; key: string; itemId: string; word: Word }
  | { type: 'choice'; key: string; itemId: string; prompt: string; promptTarget: boolean; options: string[]; correct: number; speak?: string }
  | { type: 'picture'; key: string; itemId: string; prompt: string; options: { text: string; emoji: string }[]; correct: number }
  | { type: 'match'; key: string; pairs: { itemId: string; left: string; right: string }[] }
  | { type: 'build'; key: string; itemId: string; prompt: string; promptTarget: boolean; tiles: string[]; answers: string[]; answerTarget: boolean; listen?: boolean; speak?: string }
  | { type: 'type'; key: string; itemId: string; prompt: string; promptTarget: boolean; answers: string[]; answerTarget: boolean; listen?: boolean; speak?: string }
  | { type: 'fill'; key: string; itemId: string; before: string; after: string; options: string[]; correct: number; translation: string; full: string }
  | { type: 'speak'; key: string; itemId: string; text: string; translation: string }
  | { type: 'chat'; key: string; itemId: string; say: string; sayGloss: string; options: string[]; correct: number; why: string; replyGloss: string };

export type GradedExercise = Exclude<Exercise, { type: 'intro' } | { type: 'match' }>;

export interface GenContext {
  course: Course;
  base: BaseLang;
  srs: Record<string, SrsRecord>;
  /** Can we play target-language audio? */
  audio: boolean;
  /** Can we run speech recognition / recording for speaking exercises? */
  speak: boolean;
  /** Rolling accuracy 0–1: higher means harder exercise types. */
  level: number;
  rng: Rng;
  /** Extra accepted answers approved by the community: itemId -> answers. */
  extraAnswers?: Record<string, string[]>;
  /** Units the learner has reached (for review sampling). */
  unlockedUnits?: number;
}

let counter = 0;
const key = (t: string) => `${t}-${++counter}`;

/** Lowercase tiles unless the token is a proper noun (or English "I"). */
function tile(tok: string, idx: number, properNouns: Set<string>): string {
  if (tok === 'I' || properNouns.has(tok)) return tok;
  if (idx === 0) return tok.charAt(0).toLowerCase() + tok.slice(1);
  return tok;
}

class Gen {
  items: Item[];
  words: Word[];
  sentences: Sentence[];
  proper = new Set<string>();
  constructor(public ctx: GenContext) {
    this.items = allItems(ctx.course);
    this.words = this.items.filter((i): i is Word => i.kind === 'word');
    this.sentences = this.items.filter((i): i is Sentence => i.kind === 'sentence');
    for (const it of this.items) {
      tokenize(it.t).forEach((t, i) => { if (i > 0 && /^\p{Lu}/u.test(t)) this.proper.add(t); });
      tokenize(it.en).forEach((t, i) => { if (i > 0 && /^\p{Lu}/u.test(t)) this.proper.add(t); });
      if (it.kind === 'word' && /^\p{Lu}/u.test(it.t)) this.proper.add(it.t);
    }
  }
  get rng() { return this.ctx.rng; }
  g(it: Item) { return gloss(it, this.ctx.base); }
  tAnswers(it: Item) { return [...targetAnswers(it), ...(this.ctx.extraAnswers?.[it.id] ?? [])]; }
  gAnswers(it: Item) { return [...glossAnswers(it, this.ctx.base), ...(this.ctx.extraAnswers?.[it.id + ':base'] ?? [])]; }

  distractors(it: Item, n: number, side: 'target' | 'base', pool?: Item[]): string[] {
    const norm = side === 'target' ? (x: string) => normTarget(x) : normBase;
    const taken = new Set((side === 'target' ? this.tAnswers(it) : this.gAnswers(it)).map(norm));
    const same = (pool ?? (it.kind === 'word' ? this.words : this.sentences)).filter((o) => o.id !== it.id);
    const out: string[] = [];
    for (const o of shuffle(same, this.rng)) {
      const v = side === 'target' ? o.t : this.g(o);
      if (taken.has(norm(v))) continue;
      taken.add(norm(v));
      out.push(v);
      if (out.length >= n) break;
    }
    return out;
  }

  choice(it: Item, forward = this.rng() < 0.6): Exercise {
    const answer = forward ? this.g(it) : it.t;
    const opts = shuffle([answer, ...this.distractors(it, 3, forward ? 'base' : 'target')], this.rng);
    return { type: 'choice', key: key('choice'), itemId: it.id, prompt: forward ? it.t : this.g(it), promptTarget: forward, options: opts, correct: opts.indexOf(answer), speak: forward ? it.t : undefined };
  }

  picture(w: Word): Exercise | null {
    if (!w.emoji) return null;
    const pool = this.words.filter((o) => o.emoji && o.id !== w.id && o.emoji !== w.emoji && normBase(this.g(o)) !== normBase(this.g(w)));
    if (pool.length < 2) return null;
    const others = sample(pool, 3, this.rng);
    const opts = shuffle([w, ...others], this.rng);
    return { type: 'picture', key: key('pic'), itemId: w.id, prompt: this.g(w), options: opts.map((o) => ({ text: o.t, emoji: o.emoji! })), correct: opts.indexOf(w) };
  }

  recognise(w: Word): Exercise { return (this.rng() < 0.45 && this.picture(w)) || this.choice(w); }

  produceWord(w: Word): Exercise {
    if (this.ctx.audio && this.rng() < 0.35) return { type: 'type', key: key('type'), itemId: w.id, prompt: w.t, promptTarget: true, answers: this.tAnswers(w), answerTarget: true, listen: true, speak: w.t };
    return { type: 'type', key: key('type'), itemId: w.id, prompt: this.g(w), promptTarget: false, answers: this.tAnswers(w), answerTarget: true };
  }

  match(words: Word[]): Exercise | null {
    const seenT = new Set<string>(), seenG = new Set<string>();
    const pairs: { itemId: string; left: string; right: string }[] = [];
    for (const w of words) {
      const t = normTarget(w.t), gl = normBase(this.g(w));
      if (seenT.has(t) || seenG.has(gl)) continue;
      seenT.add(t); seenG.add(gl);
      pairs.push({ itemId: w.id, left: w.t, right: this.g(w) });
      if (pairs.length === 5) break;
    }
    return pairs.length >= 3 ? { type: 'match', key: key('match'), pairs } : null;
  }

  build(it: Item, toTarget: boolean, listen = false): Exercise {
    const answer = toTarget ? it.t : this.g(it);
    const toks = tokenize(answer).map((t, i) => tile(t, i, this.proper));
    const norm = toTarget ? (x: string) => normTarget(x) : normBase;
    const have = new Set(toks.map((t) => norm(t)));
    const pool = toTarget ? this.sentences.map((s) => s.t) : this.sentences.map((s) => this.g(s));
    const extra: string[] = [];
    for (const src of shuffle(pool, this.rng)) {
      for (const [i, t] of tokenize(src).entries()) {
        const n = norm(t);
        if (!n || have.has(n)) continue;
        have.add(n);
        extra.push(tile(t, i, this.proper));
        break;
      }
      if (extra.length >= Math.min(4, Math.max(2, Math.ceil(toks.length / 2)))) break;
    }
    return {
      type: 'build', key: key('build'), itemId: it.id, prompt: toTarget ? this.g(it) : it.t, promptTarget: !toTarget,
      tiles: shuffle([...toks, ...extra], this.rng), answers: toTarget ? this.tAnswers(it) : this.gAnswers(it), answerTarget: toTarget,
      listen, speak: toTarget ? (listen ? it.t : undefined) : it.t,
    };
  }

  typeSentence(it: Item, listen = false): Exercise {
    return { type: 'type', key: key('type'), itemId: it.id, prompt: listen ? it.t : this.g(it), promptTarget: listen, answers: this.tAnswers(it), answerTarget: true, listen, speak: listen ? it.t : undefined };
  }

  fill(s: Sentence): Exercise | null {
    const toks = tokenize(s.t);
    if (toks.length < 3) return null;
    const idx = toks.map((t, i) => [t, i] as const).filter(([t]) => t.length > 2).sort((a, b) => b[0].length - a[0].length)[0]?.[1];
    if (idx === undefined) return null;
    const target = toks[idx];
    const words = s.t.split(/\s+/);
    const wi = words.findIndex((w) => w.includes(target));
    if (wi < 0) return null;
    const pre = words[wi].slice(0, words[wi].indexOf(target));
    const post = words[wi].slice(words[wi].indexOf(target) + target.length);
    const before = [...words.slice(0, wi), pre].join(' ').trim();
    const after = [post, ...words.slice(wi + 1)].join(' ').trim();
    const others = new Set<string>([normTarget(target)]);
    const opts = [target];
    for (const src of shuffle(this.sentences, this.rng)) {
      for (const t of tokenize(src.t)) {
        if (t.length > 2 && !others.has(normTarget(t))) { others.add(normTarget(t)); opts.push(idx === 0 ? t.charAt(0).toUpperCase() + t.slice(1) : t.toLowerCase()); break; }
      }
      if (opts.length >= 4) break;
    }
    const shuffled = shuffle(opts, this.rng);
    return { type: 'fill', key: key('fill'), itemId: s.id, before, after, options: shuffled, correct: shuffled.indexOf(target), translation: this.g(s), full: s.t };
  }

  speakEx(s: Sentence): Exercise { return { type: 'speak', key: key('speak'), itemId: s.id, text: s.t, translation: this.g(s) }; }

  chat(c: Chat): Exercise {
    const opts = shuffle([c.reply, ...c.wrong.slice(0, 2)], this.rng);
    return { type: 'chat', key: key('chat'), itemId: c.id, say: c.say, sayGloss: c.sayEn, options: opts, correct: opts.indexOf(c.reply), why: c.why, replyGloss: c.replyEn };
  }

  /** Picks a sentence exercise, harder as the learner's level rises. */
  sentence(s: Sentence, fresh: boolean): Exercise {
    const lv = this.ctx.level;
    const opts: [number, () => Exercise | null][] = [
      [fresh ? 4 : 2.5, () => this.build(s, false)],
      [fresh ? 3 : 3, () => this.build(s, true)],
      [fresh ? 0.3 : lv > 0.75 ? 2.5 : 0.8, () => this.typeSentence(s)],
      [fresh ? 0.5 : 1.5, () => this.fill(s)],
      [this.ctx.audio ? (fresh ? 1 : 2) : 0, () => this.build(s, true, true)],
      [this.ctx.audio && !fresh && lv > 0.6 ? 1.2 : 0, () => this.typeSentence(s, true)],
      [this.ctx.speak && !fresh ? 1 : 0, () => this.speakEx(s)],
    ];
    const total = opts.reduce((a, [w]) => a + w, 0);
    let r = this.rng() * total;
    for (const [w, f] of opts) { r -= w; if (r <= 0 && w > 0) { const e = f(); if (e) return e; } }
    return this.build(s, false);
  }

  forItem(it: Item): Exercise {
    if (it.kind === 'word') return this.rng() < 0.5 ? this.recognise(it) : this.produceWord(it);
    return this.sentence(it, false);
  }
}

/** Interleaves exercises while keeping each intro card right before its first practice. */
function arrange(head: Exercise[], body: Exercise[], tail: Exercise[], rng: Rng) { return [...head, ...shuffle(body, rng), ...tail]; }

export function lessonSession(lesson: Lesson, unit: Unit, ctx: GenContext): Exercise[] {
  const gen = new Gen(ctx);
  const head: Exercise[] = [];
  const body: Exercise[] = [];
  const tail: Exercise[] = [];
  const fresh = lesson.words.filter((w) => !ctx.srs[w.id]);
  const known = lesson.words.filter((w) => ctx.srs[w.id]);
  for (const w of fresh) { head.push({ type: 'intro', key: key('intro'), itemId: w.id, word: w }); head.push(gen.recognise(w)); }
  const m = gen.match(shuffle(lesson.words, ctx.rng));
  if (m) head.push(m);
  for (const w of known) body.push(gen.rng() < 0.5 ? gen.recognise(w) : gen.produceWord(w));
  for (const w of fresh.slice(0, 3)) body.push(gen.rng() < 0.5 ? gen.choice(w, false) : gen.produceWord(w));
  for (const s of lesson.sentences) body.push(gen.sentence(s, !ctx.srs[s.id]));
  // Interleave a couple of older items that are due, so earlier lessons stay fresh.
  const lessonIds = new Set([...lesson.words, ...lesson.sentences].map((i) => i.id));
  const due = gen.items.filter((i) => !lessonIds.has(i.id) && ctx.srs[i.id] && isDue(ctx.srs[i.id])).sort((a, b) => strength(ctx.srs[a.id]) - strength(ctx.srs[b.id]));
  for (const it of due.slice(0, 2)) body.push(gen.forItem(it));
  for (const c of lesson.chats) tail.push(gen.chat(c));
  const all = arrange(head, body, tail, ctx.rng);
  return all.slice(0, 18);
}

function itemsOfUnits(units: Unit[]) {
  const words: Word[] = [], sentences: Sentence[] = [], chats: Chat[] = [];
  for (const u of units) for (const l of u.lessons) { words.push(...l.words); sentences.push(...l.sentences); chats.push(...l.chats); }
  return { words, sentences, chats };
}

/** Unit checkpoint / "jump here" test: mixed exercises across the given units. */
export function testSession(units: Unit[], ctx: GenContext, size = 14): Exercise[] {
  const gen = new Gen(ctx);
  const { words, sentences, chats } = itemsOfUnits(units);
  const ex: Exercise[] = [];
  for (const s of sample(sentences, Math.ceil(size * 0.6), ctx.rng)) ex.push(gen.sentence(s, false));
  for (const w of sample(words, Math.ceil(size * 0.3), ctx.rng)) ex.push(gen.rng() < 0.5 ? gen.choice(w) : gen.produceWord(w));
  for (const c of sample(chats, 2, ctx.rng)) ex.push(gen.chat(c));
  return shuffle(ex, ctx.rng).slice(0, size);
}

/** Mastery ("Gold") challenge: production only — typing and listening, no word tiles. */
export function masterySession(unit: Unit, ctx: GenContext): Exercise[] {
  const gen = new Gen(ctx);
  const { words, sentences } = itemsOfUnits([unit]);
  const ex: Exercise[] = [];
  for (const s of sample(sentences, 9, ctx.rng)) ex.push(ctx.audio && gen.rng() < 0.3 ? gen.typeSentence(s, true) : gen.typeSentence(s));
  for (const w of sample(words, 5, ctx.rng)) ex.push(gen.produceWord(w));
  return shuffle(ex, ctx.rng);
}

export type ReviewMode = 'smart' | 'mistakes' | 'listen' | 'speak' | 'words';
/** Practice sessions built from the learner's memory model. */
export function reviewSession(ctx: GenContext, mode: ReviewMode, mistakes: string[] = [], size = 12): Exercise[] {
  const gen = new Gen(ctx);
  const learned = gen.items.filter((i) => ctx.srs[i.id]);
  let pool: Item[];
  if (mode === 'mistakes') pool = learned.filter((i) => mistakes.includes(i.id));
  else pool = [...learned].sort((a, b) => strength(ctx.srs[a.id]) - strength(ctx.srs[b.id]));
  if (mode === 'words') pool = pool.filter((i) => i.kind === 'word');
  if (mode === 'listen' || mode === 'speak') pool = pool.filter((i) => i.kind === 'sentence' || i.t.length > 3);
  const chosen = pool.slice(0, size);
  return shuffle(chosen.map((it) => {
    if (mode === 'listen') return it.kind === 'sentence' ? gen.build(it, true, true) : gen.produceWord(it);
    if (mode === 'speak') return { type: 'speak', key: key('speak'), itemId: it.id, text: it.t, translation: gen.g(it) } as Exercise;
    return gen.forItem(it);
  }), ctx.rng);
}

/** Placement test: three questions per unit, in order. The player stops when a unit is failed. */
export function placementSession(course: Course, ctx: GenContext): { exercises: Exercise[]; unitOf: number[] } {
  const gen = new Gen(ctx);
  const exercises: Exercise[] = [];
  const unitOf: number[] = [];
  course.units.slice(0, 8).forEach((u, ui) => {
    const { sentences, words } = itemsOfUnits([u]);
    const picks: Item[] = sentences.length >= 3 ? sample(sentences, 3, ctx.rng) : sample([...sentences, ...words], 3, ctx.rng);
    for (const it of picks) { exercises.push(it.kind === 'sentence' ? gen.build(it, gen.rng() < 0.5) : gen.choice(it)); unitOf.push(ui); }
  });
  return { exercises, unitOf };
}

/** Pairs for the timed speed round. */
export function speedPairs(ctx: GenContext, n = 40) {
  const gen = new Gen(ctx);
  const learned = gen.words.filter((w) => ctx.srs[w.id]);
  const pool = learned.length >= 8 ? learned : gen.words.slice(0, 30);
  return shuffle(pool, ctx.rng).slice(0, n).map((w) => ({ itemId: w.id, left: w.t, right: gen.g(w) }));
}

/** Free-form roleplay: all chats from unlocked units, in order. */
export function roleplaySession(units: Unit[], ctx: GenContext): Exercise[] {
  const gen = new Gen(ctx);
  return itemsOfUnits(units).chats.map((c) => gen.chat(c));
}

export const pickPraise = (rng: Rng = Math.random) => pick(['Safi!', 'Vizuri sana!', 'Hongera!', 'Kazi nzuri!', 'Bomba!', 'Sawa kabisa!', 'Umeweza!'], rng);
