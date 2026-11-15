import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useAudioAvailable, useCourse, speakingAvailable } from '../hooks';
import { useApp } from '../state/store';
import { allItems, gloss } from '../lib/lexicon';
import { bars, dueAt, isDue } from '../lib/srs';
import { Strength } from '../components/ui';
import { speak } from '../lib/audio';

export default function Practice() {
  const course = useCourse();
  const s = useApp();
  const audio = useAudioAvailable(course);
  const [showWords, setShowWords] = useState(false);
  const items = useMemo(() => (course ? allItems(course).filter((i) => s.srs[i.id]) : []), [course, s.srs]);
  if (!course) return <div className="spinner" />;
  const p = s.courses[course.id]!;
  const due = items.filter((i) => isDue(s.srs[i.id])).length;
  const mistakes = s.mistakes.filter((m) => m.startsWith(course.id + '.')).length;
  const unitsReached = course.units.filter((_, i) => i <= Math.max(p.unlockedThrough, ...course.units.map((u, ui) => (u.lessons.some((l) => p.done[l.id]) ? ui : 0)))).length;
  const cards = [
    { to: '/session/review/smart', icon: '🧠', title: 'Smart review', desc: due ? `${due} items are fading from memory — refresh them now.` : 'Everything is fresh! Review your weakest items anyway.', hot: due > 0, ok: items.length > 0 },
    { to: '/session/review/mistakes', icon: '🎯', title: 'Fix my mistakes', desc: `${mistakes} item${mistakes === 1 ? '' : 's'} you recently got wrong.`, ok: mistakes > 0 },
    { to: '/session/review/listen', icon: '🎧', title: 'Listening', desc: audio ? 'Train your ear with words you know.' : 'Needs a voice for this language on your device (or community recordings).', ok: audio && items.length > 0 },
    { to: '/session/review/speak', icon: '🎤', title: 'Speaking', desc: speakingAvailable() ? 'Say phrases out loud. Kiswahili uses speech recognition; other languages record & compare.' : 'Your browser does not support the microphone.', ok: speakingAvailable() && items.length > 0 },
    { to: '/speed', icon: '⚡', title: 'Speed round', desc: 'Match as many pairs as you can in 60 seconds.', ok: true },
    { to: `/session/roleplay/${unitsReached}`, icon: '💬', title: 'Conversations', desc: 'Roleplay everyday exchanges from the units you have reached.', ok: true },
  ];
  return (
    <>
      <h1 style={{ marginTop: '1rem' }}>Practice</h1>
      <p className="muted">Free, unlimited, and driven by a memory model that knows what you are about to forget.</p>
      <div className="stack">
        {cards.map((c) => c.ok ? (
          <Link key={c.title} to={c.to} className="card tap row" style={{ textDecoration: 'none', color: 'inherit', borderColor: c.hot ? 'var(--primary)' : undefined }}>
            <span style={{ fontSize: '2rem' }}>{c.icon}</span><span><b>{c.title}</b><br /><span className="small muted">{c.desc}</span></span>
          </Link>
        ) : (
          <div key={c.title} className="card row flat" style={{ opacity: .6 }}><span style={{ fontSize: '2rem' }}>{c.icon}</span><span><b>{c.title}</b><br /><span className="small muted">{c.desc}</span></span></div>
        ))}
      </div>
      <div className="row between" style={{ marginTop: '1.5rem' }}>
        <h2>My words ({items.length})</h2>
        <button className="btn soft small" onClick={() => setShowWords(!showWords)}>{showWords ? 'Hide' : 'Show'}</button>
      </div>
      {showWords && (
        <div className="list">
          {items.length === 0 && <div className="empty">Words you learn appear here with their memory strength.</div>}
          {[...items].sort((a, b) => dueAt(s.srs[a.id]) - dueAt(s.srs[b.id])).map((it) => (
            <div key={it.id} className="list-item">
              <button className="icon-btn" onClick={() => speak(it.t, course.ttsLang)} aria-label="Play">🔊</button>
              <div className="grow"><b>{it.t}</b><div className="small muted">{gloss(it, p.base)}</div></div>
              <div className="center"><Strength n={bars(s.srs[it.id])} /><div className="small muted">{isDue(s.srs[it.id]) ? 'due' : `in ${Math.max(1, Math.round((dueAt(s.srs[it.id]) - Date.now()) / 3600000))}h`}</div></div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
