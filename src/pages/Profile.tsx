import { Link } from 'react-router-dom';
import { useState } from 'react';
import { COURSE_META } from '../content';
import { ACHIEVEMENTS } from '../lib/achievements';
import { addDays, dayKey, parseDay } from '../lib/dates';
import { totalXp, useApp, wordsLearned } from '../state/store';
import { Avatar } from '../components/ui';
import { Mascot } from '../components/Mascot';

export function StreakCalendar() {
  const s = useApp();
  const [offset, setOffset] = useState(0);
  const today = dayKey();
  const ref = parseDay(today); ref.setDate(1); ref.setMonth(ref.getMonth() + offset);
  const first = dayKey(ref);
  const lead = ref.getDay();
  const daysIn = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();
  return (
    <div>
      <div className="row between"><button className="icon-btn" onClick={() => setOffset(offset - 1)} aria-label="Previous month">‹</button><b>{ref.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</b><button className="icon-btn" onClick={() => setOffset(Math.min(0, offset + 1))} aria-label="Next month">›</button></div>
      <div className="cal" style={{ marginTop: '.4rem' }}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <b key={i} className="muted">{d}</b>)}
        {Array.from({ length: lead }, (_, i) => <span key={'x' + i} />)}
        {Array.from({ length: daysIn }, (_, i) => { const k = addDays(first, i); const m = s.streak.history[k]; return <span key={k} className={`${m ?? ''} ${k === today ? 'today' : ''}`} title={m ?? ''}>{i + 1}</span>; })}
      </div>
      <div className="small muted" style={{ marginTop: '.4rem' }}>🔥 practised · 🛌 <span style={{ background: 'var(--accent-soft)', padding: '0 4px', borderRadius: 4 }}>rest day</span> · <span style={{ background: 'var(--surface-3)', padding: '0 4px', borderRadius: 4 }}>day off</span></div>
    </div>
  );
}

export default function Profile() {
  const s = useApp();
  const days = Array.from({ length: 14 }, (_, i) => addDays(dayKey(), i - 13));
  const max = Math.max(10, ...days.map((d) => s.xpLog[d] ?? 0));
  const acc = s.stats.answered ? Math.round((s.stats.correct / s.stats.answered) * 100) : 0;
  const name = s.auth?.displayName || s.profile.name || 'Learner';
  return (
    <>
      <div className="card row" style={{ marginTop: '1rem' }}>
        <Avatar name={name} size={64} />
        <div className="grow"><h1 style={{ margin: 0 }}>{name}</h1><div className="muted small">{s.auth ? `@${s.auth.username}` : 'Guest — progress saved on this device'} · joined {new Date(s.profile.createdAt).toLocaleDateString()}</div></div>
        <Mascot size={70} outfit={s.inventory.outfit} />
      </div>
      <div className="grid2" style={{ marginTop: '1rem' }}>
        {[['🔥', s.streak.current, 'Day streak'], ['🏅', s.streak.longest, 'Longest streak'], ['⚡', totalXp(s), 'Total XP'], ['📚', wordsLearned(s.srs), 'Words learned'], ['🎯', `${acc}%`, 'Accuracy'], ['📿', s.beads, 'Beads']].map(([i, v, l]) => (
          <div key={String(l)} className="card flat"><div style={{ fontSize: '1.4rem', fontWeight: 900 }}>{i} {v}</div><div className="small muted">{l}</div></div>
        ))}
      </div>
      <div className="card" style={{ marginTop: '1rem' }}>
        <h3>XP — last 14 days</h3>
        <div className="chart">{days.map((d) => <div key={d} className={(s.xpLog[d] ?? 0) ? '' : 'zero'} style={{ height: `${((s.xpLog[d] ?? 0) / max) * 100}%` }} title={`${d}: ${s.xpLog[d] ?? 0} XP`} />)}</div>
      </div>
      <div className="card" style={{ marginTop: '1rem' }}><StreakCalendar /></div>
      <h2 style={{ marginTop: '1.4rem' }}>My courses</h2>
      <div className="stack">
        {COURSE_META.filter((c) => s.courses[c.id]).map((c) => {
          const p = s.courses[c.id]!;
          return <div key={c.id} className="card flat row"><span style={{ fontSize: '1.8rem' }}>{c.icon}</span><div className="grow"><b>{c.name}</b><div className="small muted">{Object.keys(p.done).length} lessons · {p.xp} XP · {wordsLearned(s.srs, c.id)} words · 👑 {p.gold.length}</div></div></div>;
        })}
        <Link to="/courses" className="btn soft">+ Add a language</Link>
      </div>
      <h2 style={{ marginTop: '1.4rem' }}>Achievements ({Object.keys(s.achievements).length}/{ACHIEVEMENTS.length})</h2>
      <div className="grid2">
        {ACHIEVEMENTS.map((a) => (
          <div key={a.id} className="card flat" style={{ opacity: s.achievements[a.id] ? 1 : .45 }}><div style={{ fontSize: '1.8rem' }}>{a.icon}</div><b>{a.name}</b><div className="small muted">{a.desc}</div></div>
        ))}
      </div>
      <div className="stack" style={{ margin: '1.4rem 0' }}>
        <Link to="/quests" className="btn soft">🎯 Quests</Link>
        <Link to="/shop" className="btn soft">📿 Shop</Link>
        <Link to="/community" className="btn soft">🤝 Community & contributions</Link>
        <Link to="/settings" className="btn soft">⚙️ Settings</Link>
      </div>
    </>
  );
}
