import { useMemo, useState } from 'react';
import { Link, Route, Routes, useNavigate } from 'react-router-dom';
import { useCourse } from '../hooks';
import { useApp } from '../state/store';
import { allItems, gloss } from '../lib/lexicon';
import { normBase, normTarget } from '../lib/answer';
import { speak } from '../lib/audio';
import { unitUnlocked, Guide } from './Learn';
import type { Course } from '../content/types';

function Hub({ course }: { course: Course }) {
  const s = useApp();
  const p = s.courses[course.id]!;
  const tiles = [
    { to: 'stories', icon: '📖', title: 'Stories', desc: `${course.stories.length} interactive stories`, show: course.stories.length > 0 },
    { to: 'dictionary', icon: '🔎', title: 'Dictionary', desc: 'Search every word and phrase', show: true },
    { to: 'proverbs', icon: '📜', title: 'Methali', desc: 'Proverbs and their meanings', show: course.proverbs.length > 0 },
    { to: 'sounds', icon: '🔤', title: 'Sounds & letters', desc: 'How to pronounce it', show: course.sounds.length > 0 },
    { to: 'culture', icon: '🌍', title: 'Culture notes', desc: 'Guidebooks for every unit', show: true },
  ];
  return (
    <>
      <h1 style={{ marginTop: '1rem' }}>Explore {course.name}</h1>
      <div className="grid2">
        {tiles.filter((t) => t.show).map((t) => (
          <Link key={t.to} to={t.to} className="card tap" style={{ textDecoration: 'none', color: 'inherit' }}><div style={{ fontSize: '2rem' }}>{t.icon}</div><b>{t.title}</b><div className="small muted">{t.desc}</div></Link>
        ))}
      </div>
      <p className="small muted" style={{ marginTop: '1rem' }}>Saved words: {s.saved.filter((x) => x.startsWith(course.id + '.')).length} · Stories read: {p.stories.length}</p>
    </>
  );
}

function Stories({ course }: { course: Course }) {
  const p = useApp((s) => s.courses[course.id]!);
  const nav = useNavigate();
  return (
    <>
      <Back /><h1>Stories</h1>
      <div className="stack">
        {course.stories.map((st) => {
          const open = unitUnlocked(course, p, st.afterUnit + 1) || course.units[st.afterUnit].lessons.every((l) => p.done[l.id]);
          return (
            <button key={st.id} className="card tap row" disabled={!open} onClick={() => nav(`/story/${st.id}`)} style={{ opacity: open ? 1 : .55 }}>
              <span style={{ fontSize: '2.2rem' }}>{st.icon}</span>
              <span className="grow"><b>{st.title}</b> {p.stories.includes(st.id) && '✅'}<br /><span className="small muted">{st.titleEn} · {open ? '+15 XP' : `Unlocks after unit ${st.afterUnit + 1}`}</span></span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function Dictionary({ course }: { course: Course }) {
  const s = useApp();
  const base = s.courses[course.id]!.base;
  const [q, setQ] = useState('');
  const items = useMemo(() => allItems(course), [course]);
  const res = q.trim() ? items.filter((i) => normTarget(i.t, true).includes(normTarget(q, true)) || normBase(gloss(i, base)).includes(normBase(q))).slice(0, 60) : items.filter((i) => i.kind === 'word').slice(0, 40);
  return (
    <>
      <Back /><h1>Dictionary</h1>
      <input className="input" placeholder={`Search ${course.name} or ${base === 'sw' ? 'Kiswahili' : 'English'}…`} value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
      <div className="list" style={{ marginTop: '1rem' }}>
        {res.map((i) => (
          <div key={i.id} className="list-item">
            <button className="icon-btn" onClick={() => speak(i.t, course.ttsLang)} aria-label="Play">🔊</button>
            {i.kind === 'word' && i.emoji && <span style={{ fontSize: '1.6rem' }}>{i.emoji}</span>}
            <div className="grow"><b>{i.t}</b><div className="small muted">{gloss(i, base)}{i.note ? ` · ${i.note}` : ''}</div></div>
            <button className="icon-btn" aria-pressed={s.saved.includes(i.id)} aria-label="Save word" onClick={() => s.toggleSaved(i.id)}>{s.saved.includes(i.id) ? '★' : '☆'}</button>
          </div>
        ))}
        {res.length === 0 && <div className="empty">No match. Missing a word? <Link to="/community">Suggest it</Link>.</div>}
      </div>
    </>
  );
}

function Proverbs({ course }: { course: Course }) {
  return (
    <>
      <Back /><h1>Methali · Proverbs</h1>
      <div className="stack">
        {course.proverbs.map((p) => (
          <div key={p.t} className="card">
            <div className="row"><button className="icon-btn" onClick={() => speak(p.t, course.ttsLang)} aria-label="Play">🔊</button><b style={{ fontSize: '1.1rem' }}>{p.t}</b></div>
            <div className="muted">“{p.literal}”</div><div className="small">💡 {p.meaning}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function Sounds({ course }: { course: Course }) {
  return (
    <>
      <Back /><h1>Sounds & letters</h1>
      <div className="list">
        {course.sounds.map((x) => (
          <div key={x.sym} className="list-item" style={{ alignItems: 'flex-start' }}>
            <b style={{ minWidth: 70, fontSize: '1.2rem' }}>{x.sym}</b>
            <div className="grow">{x.sound}<div className="small muted">e.g. <button className="hintword" onClick={() => speak(x.example, course.ttsLang)}>{x.example}</button> — {x.exampleEn}</div></div>
          </div>
        ))}
      </div>
    </>
  );
}

function Culture({ course }: { course: Course }) {
  const base = useApp((s) => s.courses[course.id]!.base);
  return (
    <>
      <Back /><h1>Culture notes</h1>
      <div className="stack">
        {course.culture.map((g) => <div key={g.title} className="card"><h3>{g.title}</h3><p>{g.body}</p></div>)}
        {course.units.map((u) => <details key={u.id} className="card"><summary><b>{u.icon} Unit {u.index + 1}: {u.titleEn}</b></summary><div style={{ marginTop: '.8rem' }}><Guide course={course} unit={u} base={base} /></div></details>)}
      </div>
    </>
  );
}

const Back = () => <Link to="/explore" className="icon-btn" style={{ marginTop: '.8rem' }}>← Explore</Link>;

export default function Explore() {
  const course = useCourse();
  if (!course) return <div className="spinner" />;
  return (
    <Routes>
      <Route index element={<Hub course={course} />} />
      <Route path="stories" element={<Stories course={course} />} />
      <Route path="dictionary" element={<Dictionary course={course} />} />
      <Route path="proverbs" element={<Proverbs course={course} />} />
      <Route path="sounds" element={<Sounds course={course} />} />
      <Route path="culture" element={<Culture course={course} />} />
    </Routes>
  );
}
