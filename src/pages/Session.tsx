import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { feedback } from '../lib/feedback';
import { useNavigate, useParams } from 'react-router-dom';
import { useAudioAvailable, useCourse, speakingAvailable } from '../hooks';
import type { Course } from '../content/types';
import { lessonSession, masterySession, placementSession, reviewSession, roleplaySession, testSession, pickPraise, type Exercise, type GenContext, type GradedExercise, type ReviewMode } from '../lib/exercises';
import { grade, type AnswerValue, type Grade } from '../lib/grade';
import { lexiconFor } from '../lib/lexicon';
import { level, useApp, type SessionKind, type Summary } from '../state/store';
import { BuildEx, ChatEx, ChoiceEx, FillEx, IntroEx, MatchEx, PictureEx, SpeakEx, TypeEx } from '../components/Exercises';
import { Bar, Confetti, Modal } from '../components/ui';
import { Mascot } from '../components/Mascot';
import { questLabel } from '../lib/quests';
import { communityAnswers } from '../lib/api';

interface Built { exercises: Exercise[]; kind: SessionKind; title: string; unitIndex?: number; lessonId?: string; unitOf?: number[]; maxMistakes?: number; passMark?: number; noHints?: boolean }

function build(course: Course, kind: string, ref: string | undefined, ctx: GenContext, mistakes: string[]): Built | null {
  if (kind === 'lesson') {
    for (const u of course.units) for (const l of u.lessons) if (l.id === ref) return { exercises: lessonSession(l, u, ctx), kind: 'lesson', title: l.title, unitIndex: u.index, lessonId: l.id };
    return null;
  }
  if (kind === 'test') {
    const ui = Number(ref);
    return { exercises: testSession(course.units.slice(0, ui + 1).slice(-3), ctx), kind: 'test', title: `Unit ${ui + 1} checkpoint`, unitIndex: ui, passMark: 0.8 };
  }
  if (kind === 'mastery') {
    const ui = Number(ref);
    return { exercises: masterySession(course.units[ui], ctx), kind: 'mastery', title: 'Gold challenge', unitIndex: ui, maxMistakes: 3, noHints: true };
  }
  if (kind === 'review') return { exercises: reviewSession(ctx, (ref as ReviewMode) ?? 'smart', mistakes), kind: 'review', title: 'Practice' };
  if (kind === 'roleplay') return { exercises: roleplaySession(course.units.slice(0, Number(ref ?? course.units.length)), ctx), kind: 'roleplay', title: 'Conversations' };
  if (kind === 'placement') { const p = placementSession(course, ctx); return { exercises: p.exercises, unitOf: p.unitOf, kind: 'placement', title: 'Placement test' }; }
  return null;
}

export default function Session() {
  const { kind = 'lesson', ref } = useParams();
  const course = useCourse();
  const audioOk = useAudioAvailable(course);
  const nav = useNavigate();
  const app = useApp();
  const cp = course ? app.courses[course.id] : undefined;
  const audio = audioOk && app.settings.listening;
  const [built, setBuilt] = useState<Built | null>(null);

  useEffect(() => {
    if (!course || !cp || built) return;
    const ctx: GenContext = { course, base: cp.base, srs: app.srs, audio, speak: app.settings.speaking && speakingAvailable(), level: level(cp), rng: Math.random, extraAnswers: communityAnswers(course.id) };
    setBuilt(build(course, kind, ref, ctx, app.mistakes));
  }, [course, cp, built]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!course || !cp) return <div className="spinner" />;
  if (!built) return <div className="spinner" />;
  if (!built.exercises.length) {
    return (
      <div className="session"><div className="empty"><Mascot mood="think" /><h2>Nothing to practise yet</h2><p>Complete a few lessons first, then come back.</p><button className="btn" onClick={() => nav('/')}>Back to learning</button></div></div>
    );
  }
  return <Player key={built.title} built={built} course={course} audio={audio} onExit={() => nav(kind === 'review' || kind === 'roleplay' ? '/practice' : '/')} />;
}

function Player({ built, course, audio, onExit }: { built: Built; course: Course; audio: boolean; onExit: () => void }) {
  const app = useApp();
  const cp = app.courses[course.id]!;
  const lex = useMemo(() => lexiconFor(course, cp.base), [course, cp.base]);
  const [queue, setQueue] = useState<Exercise[]>(built.exercises);
  const [idx, setIdx] = useState(0);
  const [value, setValue] = useState<AnswerValue | null>(null);
  const [result, setResult] = useState<Grade | null>(null);
  const [explain, setExplain] = useState(false);
  const [stats, setStats] = useState({ correct: 0, total: 0, combo: 0, maxCombo: 0, mistakes: 0, listens: 0 });
  const [summary, setSummary] = useState<Summary | null>(null);
  const [failed, setFailed] = useState(false);
  const [quit, setQuit] = useState(false);
  const [report, setReport] = useState(false);
  const retried = useRef(new Set<string>());
  const unitScores = useRef<Record<number, { c: number; n: number }>>({});
  const newWords = useRef(new Set<string>());
  const start = useRef(Date.now());
  const ex = queue[idx];
  const hardcore = app.settings.hardcore && (built.kind === 'lesson' || built.kind === 'test');

  const finish = useCallback((final: typeof stats, override?: Partial<{ passed: boolean; unlockUnits: number }>) => {
    const passed = built.passMark !== undefined ? final.correct / Math.max(1, final.total) >= built.passMark : built.maxMistakes !== undefined ? final.mistakes <= built.maxMistakes : true;
    if (passed) feedback.complete(); else feedback.failed();
    const s = app.completeSession({
      kind: built.kind, courseId: course.id, lessonId: built.lessonId, unitIndex: built.unitIndex, correct: final.correct, total: final.total,
      maxCombo: final.maxCombo, newWords: newWords.current.size, listens: final.listens, passed, minutes: Math.round((Date.now() - start.current) / 60000), ...override,
    });
    if (built.kind === 'review' && app.settings.hardcore) app.gainHeart(1);
    setSummary(s);
  }, [app, built, course.id]);

  const advance = useCallback((nextStats = stats) => {
    setValue(null); setResult(null); setExplain(false);
    // Placement: stop after the first failed unit.
    if (built.kind === 'placement' && built.unitOf) {
      const u = built.unitOf[idx];
      const nextU = built.unitOf[idx + 1];
      if (nextU !== u) {
        const sc = unitScores.current[u];
        if (sc && sc.c < 2) return finish(nextStats, { unlockUnits: u, passed: true });
      }
      if (idx + 1 >= queue.length) return finish(nextStats, { unlockUnits: built.unitOf[built.unitOf.length - 1] + 1, passed: true });
    }
    if (idx + 1 >= queue.length) return finish(nextStats);
    setIdx(idx + 1);
  }, [built, finish, idx, queue.length, stats]);

  const check = useCallback(() => {
    if (!ex || ex.type === 'intro' || ex.type === 'match' || value === null || result) return;
    const g = grade(ex as GradedExercise, value);
    setResult(g);
    if (g.correct) feedback.correct(stats.combo + 1); else feedback.wrong();
    const itemId = (ex as GradedExercise).itemId;
    if (!itemId.includes('.c.')) {
      if (!app.srs[itemId]) newWords.current.add(itemId);
      app.answer(course.id, itemId, g.correct);
    }
    const combo = g.correct ? stats.combo + 1 : 0;
    const listen = 'listen' in ex && ex.listen ? 1 : 0;
    setStats((s) => ({ correct: s.correct + (g.correct ? 1 : 0), total: s.total + 1, combo, maxCombo: Math.max(s.maxCombo, combo), mistakes: s.mistakes + (g.correct ? 0 : 1), listens: s.listens + (g.correct ? listen : 0) }));
    if (built.unitOf) { const u = built.unitOf[idx]; const sc = unitScores.current[u] ?? { c: 0, n: 0 }; unitScores.current[u] = { c: sc.c + (g.correct ? 1 : 0), n: sc.n + 1 }; }
    if (!g.correct) {
      // Mistakes come back at the end of the lesson (once) instead of costing anything.
      if ((built.kind === 'lesson' || built.kind === 'review') && !retried.current.has(ex.key)) { retried.current.add(ex.key); setQueue((q) => [...q, { ...ex, key: ex.key + '-r' }]); }
      if (hardcore) { app.loseHeart(); if (useApp.getState().hearts.n <= 0) setFailed(true); }
      if (built.maxMistakes !== undefined && stats.mistakes + 1 > built.maxMistakes) setFailed(true);
    }
  }, [app, built, course.id, ex, hardcore, idx, result, stats, value]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || summary || quit || report) return;
      e.preventDefault();
      if (ex?.type === 'intro') return advance();
      if (result) return advance();
      check();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [advance, check, ex, quit, report, result, summary]);

  useEffect(() => {
    (window as unknown as { __lughaDebug?: unknown }).__lughaDebug = import.meta.env.PROD ? undefined : { ex, value };
  }, [ex, value]);

  if (summary) return <Complete summary={summary} built={built} stats={stats} onDone={onExit} course={course} />;
  if (failed) {
    return (
      <div className="session"><div className="done-screen">
        <Mascot mood="sad" size={140} />
        <h1>{hardcore ? 'Out of hearts' : 'So close!'}</h1>
        <p className="muted">{hardcore ? 'Practise to earn hearts back, refill them with beads, or turn Hardcore mode off in Settings. Learning is never locked.' : `The gold challenge allows ${built.maxMistakes} mistakes. Review the unit and try again.`}</p>
        {hardcore && <button className="btn accent" onClick={() => { if (app.buy('hearts')) setFailed(false); }} disabled={app.beads < 30}>Refill for 30 beads 📿</button>}
        {hardcore && <button className="btn soft" onClick={() => { app.updateSettings({ hardcore: false }); setFailed(false); }}>Turn off Hardcore and continue</button>}
        <button className="btn ghost" onClick={onExit}>Leave</button>
      </div></div>
    );
  }

  const graded = ex.type !== 'intro' && ex.type !== 'match';
  const props = { course, lex, value, onChange: setValue, locked: !!result, audio, noHints: built.noHints };
  return (
    <div className="session">
      <div className="session-top">
        <button className="icon-btn" aria-label="Quit" onClick={() => setQuit(true)}>✕</button>
        <Bar value={idx / queue.length} />
        {hardcore ? <span className="stat heart">❤️ {app.hearts.n}</span> : <span className="combo" aria-live="polite">{stats.combo >= 3 ? `🔥 ${stats.combo}` : ''}</span>}
      </div>
      <div className="session-body">
        {ex.type === 'intro' && <IntroEx ex={ex} course={course} audio={audio} />}
        {ex.type === 'match' && <MatchEx ex={ex} course={course} audio={audio} onDone={(m) => { for (const p of ex.pairs) app.answer(course.id, p.itemId, !m.includes(p.itemId)); advance(); }} />}
        {ex.type === 'choice' && <ChoiceEx ex={ex} {...props} />}
        {ex.type === 'picture' && <PictureEx ex={ex} {...props} />}
        {ex.type === 'build' && <BuildEx ex={ex} {...props} />}
        {ex.type === 'type' && <TypeEx ex={ex} {...props} />}
        {ex.type === 'fill' && <FillEx ex={ex} {...props} />}
        {ex.type === 'chat' && <ChatEx ex={ex} {...props} />}
        {ex.type === 'speak' && <SpeakEx ex={ex} {...props} />}
      </div>
      {ex.type !== 'match' && (
        <div className={`footer ${result ? (result.correct ? 'ok' : 'bad') : ''}`}>
          <div className="inner">
            {result ? (
              <Feedback ex={ex as GradedExercise} result={result} lex={lex} explain={explain} setExplain={setExplain} onReport={() => setReport(true)} />
            ) : graded ? (
              <button className="btn ghost" onClick={() => { setResult({ correct: false, expected: expectedOf(ex as GradedExercise) }); setStats((s) => ({ ...s, total: s.total + 1, combo: 0, mistakes: s.mistakes + 1 })); app.answer(course.id, (ex as GradedExercise).itemId, false); }}>Skip</button>
            ) : <span />}
            {ex.type === 'intro' ? <button className="btn" onClick={() => advance()}>Got it</button>
              : result ? <button className={`btn ${result.correct ? 'success' : 'danger'}`} onClick={() => advance()} autoFocus>Continue</button>
              : <button className="btn" onClick={check} disabled={value === null}>Check</button>}
          </div>
        </div>
      )}
      <Modal open={quit} onClose={() => setQuit(false)} label="Quit lesson">
        <div className="center stack">
          <Mascot mood="sad" size={100} />
          <h2>Leave now?</h2>
          <p className="muted">You won't get XP for this session, but every word you practised is still saved to your memory model.</p>
          <button className="btn" onClick={() => setQuit(false)}>Keep learning</button>
          <button className="btn ghost" onClick={onExit}>Leave</button>
        </div>
      </Modal>
      {graded && <ReportModal open={report} onClose={() => setReport(false)} ex={ex as GradedExercise} course={course} given={result?.given} />}
    </div>
  );
}

function expectedOf(ex: GradedExercise) {
  return grade(ex, ex.type === 'type' || ex.type === 'build' ? '' : ex.type === 'speak' ? { self: false } : -1).expected;
}

function Feedback({ ex, result, lex, explain, setExplain, onReport }: { ex: GradedExercise; result: Grade; lex: ReturnType<typeof lexiconFor>; explain: boolean; setExplain: (b: boolean) => void; onReport: () => void }) {
  const praise = useMemo(() => pickPraise(), []);
  const targetText = ex.type === 'chat' ? ex.options[ex.correct] : ex.type === 'fill' ? ex.full : ex.type === 'speak' ? ex.text
    : 'answerTarget' in ex && ex.answerTarget ? result.expected : ex.type === 'picture' ? ex.options[ex.correct].text : 'promptTarget' in ex && ex.promptTarget ? ex.prompt : result.expected;
  const parts = lex.breakdown(targetText).filter((p) => p.hint);
  return (
    <div style={{ flex: 1 }}>
      <div className="fb-title">{result.correct ? (result.near === 'typo' ? 'Almost — watch the spelling' : result.near === 'accent' ? 'Correct — mind the accents' : praise) : 'Correct answer:'}</div>
      {(!result.correct || result.near) && <div style={{ fontWeight: 700 }}>{result.expected}</div>}
      {ex.type === 'chat' && <div className="small">{ex.why}</div>}
      <div className="row small" style={{ marginTop: '.3rem' }}>
        {parts.length > 0 && <button className="icon-btn small" onClick={() => setExplain(!explain)}>💡 {explain ? 'Hide' : 'Explain'}</button>}
        <button className="icon-btn small" onClick={onReport} aria-label="Report a problem or suggest an answer">⚑ Report</button>
      </div>
      {explain && (
        <div className="explain">
          <table><tbody>{parts.map((p, i) => <tr key={i}><td><b>{p.token}</b></td><td>{p.hint!.parts ? p.hint!.parts.map(([a, b]) => `${a} (${b})`).join(' + ') : p.hint!.gloss}</td></tr>)}</tbody></table>
        </div>
      )}
    </div>
  );
}

function ReportModal({ open, onClose, ex, course, given }: { open: boolean; onClose: () => void; ex: GradedExercise; course: Course; given?: string }) {
  const add = useApp((s) => s.addReport);
  const [kind, setKind] = useState<'alternative' | 'correction' | 'audio' | 'other'>('alternative');
  const [text, setText] = useState(given ?? '');
  const [note, setNote] = useState('');
  const [sent, setSent] = useState(false);
  useEffect(() => { if (open) { setText(given ?? ''); setSent(false); } }, [open, given]);
  return (
    <Modal open={open} onClose={onClose} label="Report a problem">
      {sent ? (
        <div className="center stack"><Mascot mood="cheer" size={90} /><h2>Asante!</h2><p className="muted">Your suggestion is queued for community review. Approved fixes reach every learner.</p><button className="btn" onClick={onClose}>Close</button></div>
      ) : (
        <div className="stack">
          <h2>Help improve this course</h2>
          <div className="options">
            {([['alternative', 'My answer should be accepted'], ['correction', 'The translation or spelling is wrong'], ['audio', 'The audio is wrong'], ['other', 'Something else']] as const).map(([k, l]) => (
              <button key={k} type="button" className="option" aria-pressed={kind === k} onClick={() => setKind(k)}>{l}</button>
            ))}
          </div>
          <input className="input" placeholder={kind === 'alternative' ? 'The answer you think is right' : 'Your suggested fix'} value={text} onChange={(e) => setText(e.target.value)} />
          <input className="input" placeholder="Note (optional) — e.g. region or dialect" value={note} onChange={(e) => setNote(e.target.value)} />
          <button className="btn" disabled={!text.trim() && kind !== 'audio'} onClick={() => { add({ courseId: course.id, itemId: ex.itemId, kind, text: text.trim(), note: note.trim() }); setSent(true); }}>Send</button>
        </div>
      )}
    </Modal>
  );
}

function Complete({ summary, built, stats, onDone, course }: { summary: Summary; built: Built; stats: { correct: number; total: number }; onDone: () => void; course: Course }) {
  const app = useApp();
  const acc = stats.total ? Math.round((stats.correct / stats.total) * 100) : 100;
  const isTest = built.kind === 'test' || built.kind === 'mastery';
  const passed = summary.passed !== false;
  return (
    <div className="session">
      {passed && !app.settings.reduceMotion && <Confetti />}
      <div className="done-screen">
        <Mascot mood={passed ? 'cheer' : 'think'} size={150} outfit={app.inventory.outfit} />
        <h1>{built.kind === 'placement' ? `You can start at unit ${(app.courses[course.id]?.unlockedThrough ?? 0) + 1}` : isTest ? (passed ? (built.kind === 'mastery' ? 'Gold earned! 👑' : 'Checkpoint passed!') : 'Not quite yet') : 'Lesson complete!'}</h1>
        {isTest && !passed && <p className="muted">You need {built.kind === 'test' ? '80% correct' : `at most ${built.maxMistakes} mistakes`}. Practise and try again — no penalty.</p>}
        <div className="tiles3">
          <div className="tile-stat" style={{ ['--c' as string]: 'var(--gold)' }}><div className="lbl">XP</div><div className="val">+{summary.xp}</div></div>
          <div className="tile-stat" style={{ ['--c' as string]: 'var(--success)' }}><div className="lbl">Accuracy</div><div className="val">{acc}%</div></div>
          <div className="tile-stat" style={{ ['--c' as string]: 'var(--accent)' }}><div className="lbl">Beads</div><div className="val">+{summary.beads}</div></div>
        </div>
        {summary.streakExtended && <div className="card flat" style={{ width: '100%' }}>🔥 <b>{summary.streak}-day streak!</b>{summary.restEarned && ' You earned a rest day 🛌'}</div>}
        {summary.goalJustMet && <div className="card flat" style={{ width: '100%' }}>🎯 Daily goal reached! +5 beads</div>}
        {summary.quests.map((q) => <div key={q.id} className="card flat" style={{ width: '100%' }}>✅ Quest done: {questLabel(q)} — claim it in Quests</div>)}
        {summary.achievements.map((a) => <div key={a.id} className="card flat" style={{ width: '100%' }}>{a.icon} Achievement: <b>{a.name}</b> — {a.desc} (+{a.reward} beads)</div>)}
        <button className="btn block" onClick={onDone} autoFocus>Continue</button>
      </div>
    </div>
  );
}
