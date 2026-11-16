import { useEffect, useMemo, useState } from 'react';
import { feedback } from '../lib/feedback';
import { useNavigate } from 'react-router-dom';
import { useCourse } from '../hooks';
import { useApp, type Summary } from '../state/store';
import { speedPairs } from '../lib/exercises';
import { shuffle } from '../lib/rng';
import { Bar } from '../components/ui';
import { Mascot } from '../components/Mascot';

export default function Speed() {
  const course = useCourse();
  const app = useApp();
  const nav = useNavigate();
  const pairs = useMemo(() => (course ? speedPairs({ course, base: app.courses[course.id]!.base, srs: app.srs, audio: false, speak: false, level: 0.5, rng: Math.random }) : []), [course]); // eslint-disable-line react-hooks/exhaustive-deps
  const [started, setStarted] = useState(false);
  const [left, setLeft] = useState(60);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [sel, setSel] = useState<{ side: 'l' | 'r'; i: number } | null>(null);
  const [gone, setGone] = useState<number[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const batch = pairs.slice((round * 5) % Math.max(5, pairs.length - 4), ((round * 5) % Math.max(5, pairs.length - 4)) + 5);
  const rights = useMemo(() => shuffle(batch.map((p, i) => ({ ...p, i }))), [round, pairs.length]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!started || summary) return;
    if (left <= 0) { feedback.complete(); setSummary(app.completeSession({ kind: 'speed', courseId: course!.id, correct: score, total: score, maxCombo: 0, newWords: 0, listens: 0, speedPairs: score })); return; }
    const t = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(t);
  }, [started, left, summary]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!course) return <div className="spinner" />;
  const tap = (side: 'l' | 'r', i: number) => {
    if (!sel || sel.side === side) { feedback.select(); return setSel({ side, i }); }
    const l = side === 'l' ? i : sel.i, r = side === 'r' ? i : sel.i;
    setSel(null);
    if (l === r) {
      feedback.pair(score % 8);
      setScore((x) => x + 1);
      const g = [...gone, l];
      if (g.length >= batch.length) { setGone([]); setRound(round + 1); } else setGone(g);
    } else feedback.mismatch();
  };
  if (summary) return (
    <div className="session"><div className="done-screen"><Mascot mood="cheer" size={130} /><h1>{score} pairs!</h1><p className="muted">+{summary.xp} XP · +{summary.beads} beads</p><button className="btn block" onClick={() => nav('/practice')}>Continue</button></div></div>
  );
  return (
    <div className="session">
      <div className="session-top"><button className="icon-btn" onClick={() => nav('/practice')} aria-label="Close">✕</button><Bar value={left / 60} className="accent" /><b>⏱ {left}s</b></div>
      {!started ? (
        <div className="done-screen"><Mascot mood="happy" size={130} /><h1>⚡ Speed round</h1><p className="muted">Match as many pairs as you can in 60 seconds. No hearts, no penalties — just speed.</p><button className="btn block" onClick={() => setStarted(true)}>Start</button></div>
      ) : (
        <div className="session-body">
          <div className="instr">Score: {score}</div>
          <div className="match">
            <div className="stack">{batch.map((p, i) => <button key={round + '-' + i} className={`tile ${gone.includes(i) ? 'gone' : ''}`} aria-pressed={sel?.side === 'l' && sel.i === i} onClick={() => tap('l', i)}>{p.left}</button>)}</div>
            <div className="stack">{rights.map((p) => <button key={round + '-r' + p.i} className={`tile ${gone.includes(p.i) ? 'gone' : ''}`} aria-pressed={sel?.side === 'r' && sel.i === p.i} onClick={() => tap('r', p.i)}>{p.right}</button>)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
