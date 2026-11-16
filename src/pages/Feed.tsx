import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '../lib/api';
import { progressData, progressText, postProgress, shareOutside, timeAgo, type ProgressData } from '../lib/share';
import { feedback } from '../lib/feedback';
import { Avatar } from '../components/ui';
import { Mascot } from '../components/Mascot';

interface Post {
  id: number; kind: string; body: string; data: Partial<ProgressData>; createdAt: number; mine: boolean;
  author: { username: string; displayName: string; streak: number };
  reactions: { emoji: string; count: number; mine: boolean }[];
}

export function ProgressCard({ d }: { d: Partial<ProgressData> }) {
  return (
    <div className="progress-card">
      <div className="pc-head">{d.icon ?? d.courseIcon ?? '🌍'} <b>{d.title ?? (d.course ? `Learning ${d.course}` : 'My progress')}</b></div>
      <div className="pc-stats">
        {d.streak !== undefined && <span><b>🔥 {d.streak}</b><small>day streak</small></span>}
        {d.xp !== undefined && <span><b>⚡ {d.xp}</b><small>XP</small></span>}
        {d.words !== undefined && <span><b>📚 {d.words}</b><small>words</small></span>}
        {d.accuracy !== undefined && <span><b>🎯 {d.accuracy}%</b><small>accuracy</small></span>}
      </div>
    </div>
  );
}

function Composer({ onPosted }: { onPosted: (p: Post) => void }) {
  const [text, setText] = useState('');
  const [attach, setAttach] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const data = progressData();
  const post = async () => {
    setBusy(true); setErr('');
    try { const p = await postProgress(text.trim(), attach ? data : null) as Post; feedback.reward(); setText(''); onPosted(p); }
    catch (e) { setErr(e instanceof ApiError ? e.message : 'Could not post — check your connection.'); }
    finally { setBusy(false); }
  };
  return (
    <div className="card stack">
      <label htmlFor="feed-text" className="sr-only">Share an update</label>
      <textarea id="feed-text" className="input" rows={2} maxLength={280} placeholder="Share a win, a new word, or ask for help… (Kiswahili, Sheng, any language!)" value={text} onChange={(e) => setText(e.target.value)} />
      {attach && <ProgressCard d={data} />}
      <div className="row between wrap">
        <label className="row small" style={{ gap: '.4rem' }}><input type="checkbox" checked={attach} onChange={(e) => setAttach(e.target.checked)} /> Attach my progress</label>
        <span className="small muted">{280 - text.length}</span>
      </div>
      {err && <div className="notice" role="alert">{err}</div>}
      <div className="row">
        <button className="btn soft small" onClick={async () => { const r = await shareOutside(progressText(data, text.trim())); setErr(r === 'copied' ? 'Copied — paste it into WhatsApp or anywhere.' : ''); }}>📤 Share outside</button>
        <button className="btn small grow" onClick={post} disabled={busy || (!text.trim() && !attach)}>Post to Jamii</button>
      </div>
    </div>
  );
}

function PostItem({ p, onChange, onRemove }: { p: Post; onChange: (p: Post) => void; onRemove: (id: number) => void }) {
  const [menu, setMenu] = useState(false);
  const react = async (emoji: string) => {
    feedback.select();
    const reactions = p.reactions.map((r) => (r.emoji === emoji ? { ...r, mine: !r.mine, count: r.count + (r.mine ? -1 : 1) } : r));
    onChange({ ...p, reactions });
    api(`/feed/${p.id}/react`, { body: { emoji } }).catch(() => onChange(p));
  };
  return (
    <article className="card post">
      <header className="row">
        <Avatar name={p.author.displayName} />
        <div className="grow"><b>{p.author.displayName}</b> <span className="small muted">@{p.author.username} · {timeAgo(p.createdAt)}</span>
          <div className="small muted">🔥 {p.author.streak}-day streak</div></div>
        <div style={{ position: 'relative' }}>
          <button className="icon-btn" aria-label="Post options" aria-expanded={menu} onClick={() => setMenu(!menu)}>⋯</button>
          {menu && (
            <div className="menu" role="menu">
              {p.mine ? <button role="menuitem" onClick={async () => { await api(`/feed/${p.id}`, { method: 'DELETE' }).catch(() => {}); onRemove(p.id); }}>Delete post</button>
                : <button role="menuitem" onClick={async () => { await api(`/feed/${p.id}/report`, { body: {} }).catch(() => {}); onRemove(p.id); }}>Report & hide</button>}
            </div>
          )}
        </div>
      </header>
      {p.body && <p className="post-body">{p.body}</p>}
      {Object.keys(p.data).length > 0 && <ProgressCard d={p.data} />}
      <footer className="reactions">
        {p.reactions.map((r) => (
          <button key={r.emoji} className="reaction" aria-pressed={r.mine} aria-label={`React ${r.emoji}`} onClick={() => react(r.emoji)}>{r.emoji}{r.count > 0 && <span>{r.count}</span>}</button>
        ))}
      </footer>
    </article>
  );
}

export default function Feed() {
  const [scope, setScope] = useState<'all' | 'friends'>('all');
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [more, setMore] = useState(true);
  const [err, setErr] = useState('');
  const load = useCallback(async (before?: number) => {
    try {
      const page = await api<Post[]>(`/feed?scope=${scope}${before ? `&before=${before}` : ''}`);
      setPosts((cur) => (before && cur ? [...cur, ...page] : page));
      setMore(page.length === 30);
    } catch (e) { setErr(e instanceof ApiError ? e.message : 'Could not load the feed.'); setPosts((c) => c ?? []); }
  }, [scope]);
  useEffect(() => { setPosts(null); load(); }, [load]);
  return (
    <div className="stack">
      <Composer onPosted={(p) => setPosts((c) => [p, ...(c ?? [])])} />
      <div className="tabs" role="tablist" style={{ marginBottom: 0 }}>
        <button role="tab" aria-selected={scope === 'all'} onClick={() => setScope('all')}>🌍 Everyone</button>
        <button role="tab" aria-selected={scope === 'friends'} onClick={() => setScope('friends')}>👥 Friends</button>
      </div>
      {err && <div className="notice">{err}</div>}
      {!posts ? <div className="spinner" /> : posts.length === 0 ? (
        <div className="empty"><Mascot mood="wave" size={90} /><p>{scope === 'friends' ? 'No posts from friends yet. Follow people in the Friends tab.' : 'Be the first to share your progress!'}</p></div>
      ) : posts.map((p) => <PostItem key={p.id} p={p} onChange={(np) => setPosts((c) => c!.map((x) => (x.id === np.id ? np : x)))} onRemove={(id) => setPosts((c) => c!.filter((x) => x.id !== id))} />)}
      {posts && posts.length > 0 && more && <button className="btn soft" onClick={() => load(posts[posts.length - 1].id)}>Load more</button>}
      <p className="small muted center">Be kind — posts that get reported by 3 people are hidden. Harambee! 🤝</p>
    </div>
  );
}
