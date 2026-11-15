import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCourse } from '../hooks';
import type { Course, Unit } from '../content/types';
import { useApp, type CourseProgress } from '../state/store';
import { TopBar } from './TopBar';
import { Modal, Ring } from '../components/ui';
import { Mascot } from '../components/Mascot';
import { dayKey } from '../lib/dates';
import { hashString } from '../lib/rng';
import { speak } from '../lib/audio';

type NodeKind = 'lesson' | 'story' | 'test' | 'gold';
interface PathNode { kind: NodeKind; id: string; title: string; icon: string; state: 'locked' | 'open' | 'done'; to: string; sub: string; gold?: boolean }

export const unitUnlocked = (c: Course, p: CourseProgress, ui: number) =>
  ui === 0 || p.unlockedThrough >= ui || c.units[ui - 1].lessons.every((l) => p.done[l.id]);

function nodesFor(c: Course, p: CourseProgress, u: Unit): PathNode[] {
  const open = unitUnlocked(c, p, u.index);
  const out: PathNode[] = u.lessons.map((l, li) => {
    const done = !!p.done[l.id];
    const avail = open && (li === 0 || !!p.done[u.lessons[li - 1].id] || p.unlockedThrough > u.index);
    return { kind: 'lesson', id: l.id, title: l.title, icon: ['⭐', '🗣️', '✍️', '🎧', '💬', '🌟'][li % 6], state: done ? 'done' : avail ? 'open' : 'locked', to: `/session/lesson/${l.id}`, sub: `Lesson ${li + 1} of ${u.lessons.length} · ${l.words.length} words · ${l.sentences.length} phrases` };
  });
  const allDone = u.lessons.every((l) => p.done[l.id]);
  for (const st of c.stories.filter((s) => s.afterUnit === u.index)) {
    out.push({ kind: 'story', id: st.id, title: st.titleEn, icon: '📖', state: p.stories.includes(st.id) ? 'done' : allDone ? 'open' : 'locked', to: `/story/${st.id}`, sub: `Story · ${st.title}` });
  }
  out.push({ kind: 'test', id: `${u.id}.test`, title: 'Unit checkpoint', icon: '🏆', state: p.checkpoints.includes(`u${u.index}`) ? 'done' : allDone ? 'open' : 'locked', to: `/session/test/${u.index}`, sub: 'Mixed review of this unit · pass with 80%' });
  out.push({ kind: 'gold', id: `${u.id}.gold`, title: 'Gold challenge', icon: '👑', state: p.gold.includes(`u${u.index}`) ? 'done' : allDone ? 'open' : 'locked', to: `/session/mastery/${u.index}`, sub: 'Type everything, no hints, max 3 mistakes', gold: p.gold.includes(`u${u.index}`) });
  return out;
}

function DailyCard({ course }: { course: Course }) {
  const s = useApp();
  const today = dayKey();
  const xp = s.xpLog[today] ?? 0;
  const pv = course.proverbs.length ? course.proverbs[hashString(today) % course.proverbs.length] : null;
  const words = course.units.flatMap((u) => u.lessons.flatMap((l) => l.words));
  const wotd = words[hashString(today + course.id) % words.length];
  return (
    <div className="card row" style={{ alignItems: 'flex-start' }}>
      <Ring value={xp / s.settings.dailyGoal}>{xp >= s.settings.dailyGoal ? '✓' : xp}</Ring>
      <div className="grow">
        <div className="small muted"><b>Daily goal</b> · {xp}/{s.settings.dailyGoal} XP</div>
        {pv ? (
          <div style={{ marginTop: '.3rem' }}><b>Methali ya leo:</b> <button className="hintword" onClick={() => speak(pv.t, course.ttsLang)}>{pv.t}</button><div className="small muted">“{pv.literal}” — {pv.meaning}</div></div>
        ) : wotd ? (
          <div style={{ marginTop: '.3rem' }}><b>Word of the day:</b> {wotd.emoji} {wotd.t} — <span className="muted">{wotd.en}</span></div>
        ) : null}
      </div>
    </div>
  );
}

export default function Learn() {
  const course = useCourse();
  const p = useApp((s) => (course ? s.courses[course.id] : undefined));
  const nav = useNavigate();
  const [open, setOpen] = useState<string | null>(null);
  const [guide, setGuide] = useState<Unit | null>(null);
  const units = useMemo(() => (course && p ? course.units.map((u) => ({ u, nodes: nodesFor(course, p, u) })) : []), [course, p]);
  if (!course || !p) return <div className="spinner" />;
  const current = units.flatMap((x) => x.nodes).find((n) => n.state === 'open' && n.kind === 'lesson')?.id;
  const W = 340, STEP = 96;

  return (
    <>
      <TopBar />
      {course.status === 'beta' && <div className="notice" style={{ marginBottom: '.8rem' }}>🧪 <b>Beta course.</b> Content is being reviewed by native speakers and may contain mistakes. Tap ⚑ Report in any exercise to suggest a fix — or <Link to="/community">help review</Link>.</div>}
      <DailyCard course={course} />
      {units.map(({ u, nodes }) => {
        const unlocked = unitUnlocked(course, p, u.index);
        const done = u.lessons.filter((l) => p.done[l.id]).length;
        return (
          <section key={u.id} style={{ ['--unit' as string]: u.color }}>
            <div className={`unit-head ${unlocked ? '' : 'locked'}`}>
              <div className="kicker">Unit {u.index + 1} · {done}/{u.lessons.length} lessons</div>
              <div className="row between" style={{ alignItems: 'flex-start' }}>
                <div><h2>{u.icon} {u.title}</h2><div style={{ opacity: .9 }}>{u.titleEn} — {u.description}</div></div>
              </div>
              <div className="row wrap" style={{ marginTop: '.7rem' }}>
                <button className="btn small" onClick={() => setGuide(u)}>📘 Guidebook</button>
                {!unlocked && <button className="btn small" onClick={() => nav(`/session/test/${u.index - 1}`)}>⏩ Jump here</button>}
              </div>
            </div>
            <div className="path" style={{ width: W, height: nodes.length * STEP + 50 }}>
              <svg className="string" width={W} height={nodes.length * STEP + 50} aria-hidden>
                <path d={nodes.map((_, i) => `${i ? 'L' : 'M'}${W / 2 + Math.sin(i * 0.9) * 90} ${i * STEP + 80}`).join(' ')} stroke="var(--border)" strokeWidth="5" fill="none" strokeDasharray="2 9" strokeLinecap="round" />
              </svg>
              {nodes.map((n, i) => {
                const x = W / 2 + Math.sin(i * 0.9) * 90, y = i * STEP + 80;
                return (
                  <div key={n.id}>
                    <button className={`bead ${n.state === 'locked' ? 'locked' : ''} ${n.state === 'done' ? 'done' : ''} ${n.gold ? 'gold' : ''} ${n.id === current ? 'current' : ''}`} data-label="Start" style={{ left: x, top: y }}
                      onClick={() => setOpen(open === n.id ? null : n.id)} aria-label={`${n.title} (${n.state})`}>
                      {n.state === 'locked' ? '🔒' : n.icon}
                    </button>
                    {open === n.id && (
                      <div className="pop" style={{ left: Math.min(Math.max(x, 150), W - 150), top: y + 44 }}>
                        <h3>{n.title}</h3>
                        <p className="small muted">{n.sub}</p>
                        {n.state === 'locked' ? <p className="small">🔒 Finish the steps above to unlock this.</p>
                          : <button className="btn block" onClick={() => nav(n.to)}>{n.state === 'done' ? (n.kind === 'lesson' ? 'Practise again (+XP)' : 'Do it again') : n.kind === 'lesson' ? 'Start +10 XP' : 'Start'}</button>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
      <div className="card center" style={{ margin: '1rem 0' }}>
        <Mascot mood="happy" size={90} />
        <p><b>More units are on the way.</b><br /><span className="muted small">Help build them with the community.</span></p>
        <Link className="btn soft small" to="/community">Contribute</Link>
      </div>
      <Modal open={!!guide} onClose={() => setGuide(null)} label="Guidebook">
        {guide && <Guide course={course} unit={guide} base={p.base} />}
      </Modal>
    </>
  );
}

export function Guide({ course, unit, base }: { course: Course; unit: Unit; base: 'en' | 'sw' }) {
  return (
    <div className="stack">
      <div className="kikoi" style={{ ['--stripe' as string]: unit.color }} />
      <h2>📘 Unit {unit.index + 1}: {unit.title}</h2>
      {unit.guide.map((g) => <div key={g.title}><h3>{g.title}</h3><p>{g.body}</p></div>)}
      <h3>Key phrases</h3>
      <div className="list">
        {unit.lessons.flatMap((l) => l.sentences).slice(0, 14).map((s) => (
          <div key={s.id} className="list-item"><button className="icon-btn" onClick={() => speak(s.t, course.ttsLang)} aria-label="Play">🔊</button><div><b>{s.t}</b><div className="small muted">{base === 'sw' && s.sw ? s.sw : s.en}</div></div></div>
        ))}
      </div>
      <h3>Vocabulary</h3>
      <p className="small">{unit.lessons.flatMap((l) => l.words).map((w) => `${w.t} = ${base === 'sw' && w.sw ? w.sw : w.en}`).join(' · ')}</p>
    </div>
  );
}
