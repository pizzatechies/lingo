import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError, useServer } from '../lib/api';
import { useApp } from '../state/store';
import { AccountForm } from './Account';
import { Avatar, Bar } from '../components/ui';
import { Mascot } from '../components/Mascot';
import Feed from './Feed';

interface Standing { username: string; displayName: string; xp: number; me: boolean; streak: number }
interface League { tier: number; tierName: string; tiers: string[]; endsAt: number; standings: Standing[]; promote: number; demote: number; lastResult: string | null }
interface Friend { username: string; displayName: string; weekXp: number; streak: number; totalXp: number }
interface Team { team: { name: string; code: string; goal: number } | null; members: { username: string; displayName: string; weekXp: number }[]; weekXp: number }

function useLoad<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [err, setErr] = useState('');
  const reload = useCallback(() => { if (path) api<T>(path).then(setData).catch((e) => setErr(e instanceof ApiError ? e.message : 'Network error')); }, [path]);
  useEffect(reload, [reload]);
  return { data, err, reload };
}

function LeagueTab() {
  const { data, err } = useLoad<League>('/league');
  if (err) return <div className="notice">{err}</div>;
  if (!data) return <div className="spinner" />;
  const days = Math.max(0, Math.ceil((data.endsAt - Date.now()) / 86400000));
  const n = data.standings.length;
  return (
    <>
      <div className="card center">
        <div style={{ fontSize: '2.4rem' }}>🏅</div>
        <h2>{data.tierName} League</h2>
        <div className="small muted">Tier {data.tier} of {data.tiers.length} · ends in {days} day{days === 1 ? '' : 's'} · top {data.promote} move up</div>
        {data.lastResult && <div className="notice info" style={{ marginTop: '.6rem' }}>{data.lastResult}</div>}
      </div>
      {n === 0 ? <div className="empty">Earn XP this week to join the league.</div> : (
        <div className="card" style={{ marginTop: '1rem' }}>
          {data.standings.map((s, i) => (
            <div key={s.username}>
              {i === data.promote && n > data.promote && <div className="zone up">▲ Promotion zone above</div>}
              {n >= 10 && i === n - data.demote && <div className="zone down">▼ Demotion zone below</div>}
              <div className={`lb-row ${s.me ? 'me' : ''}`}><span className="rank">{i + 1}</span><Avatar name={s.displayName} /><span className="grow"><b>{s.displayName}</b><div className="small muted">🔥 {s.streak}</div></span><b>{s.xp} XP</b></div>
            </div>
          ))}
        </div>
      )}
      <p className="small muted" style={{ marginTop: '.6rem' }}>Same-day lesson replays earn half XP, so leagues reward real learning rather than grinding.</p>
    </>
  );
}

function FriendsTab() {
  const { data, err, reload } = useLoad<Friend[]>('/friends');
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState('');
  const add = async () => { try { await api('/friends', { body: { username: q.trim() } }); setQ(''); setMsg(''); reload(); } catch (e) { setMsg(e instanceof ApiError ? e.message : 'Error'); } };
  return (
    <>
      <div className="row"><input className="input" placeholder="Add a friend by username" value={q} onChange={(e) => setQ(e.target.value)} /><button className="btn" onClick={add} disabled={!q.trim()}>Follow</button></div>
      {(msg || err) && <div className="notice" style={{ marginTop: '.6rem' }}>{msg || err}</div>}
      <div className="card" style={{ marginTop: '1rem' }}>
        {!data ? <div className="spinner" /> : data.length === 0 ? <div className="empty">Follow friends to compare weekly progress and cheer each other on.</div> : data.map((f, i) => (
          <div key={f.username} className="lb-row"><span className="rank">{i + 1}</span><Avatar name={f.displayName} /><span className="grow"><b>{f.displayName}</b><div className="small muted">@{f.username} · 🔥 {f.streak} · {f.totalXp} XP total</div></span><b>{f.weekXp} XP</b>
            <button className="icon-btn" aria-label={`Unfollow ${f.username}`} onClick={async () => { await api(`/friends/${f.username}`, { method: 'DELETE' }); reload(); }}>✕</button></div>
        ))}
      </div>
    </>
  );
}

function TeamTab() {
  const { data, err, reload } = useLoad<Team>('/team');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const act = async (path: string, body: unknown) => { try { await api(path, { body }); setMsg(''); reload(); } catch (e) { setMsg(e instanceof ApiError ? e.message : 'Error'); } };
  if (err) return <div className="notice">{err}</div>;
  if (!data) return <div className="spinner" />;
  if (!data.team) return (
    <div className="stack">
      <div className="card"><h3>🤝 Harambee teams</h3><p className="small muted">Team up with family, classmates or your chama. Everyone's XP counts towards one weekly goal — learning together, not just competing.</p></div>
      <div className="card stack"><b>Create a team</b><input className="input" placeholder="Team name, e.g. Wanafunzi wa Nakuru" value={name} onChange={(e) => setName(e.target.value)} maxLength={30} /><button className="btn" disabled={!name.trim()} onClick={() => act('/team', { name })}>Create</button></div>
      <div className="card stack"><b>Join with a code</b><input className="input" placeholder="ABC123" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={6} /><button className="btn accent" disabled={code.length < 6} onClick={() => act('/team/join', { code })}>Join</button></div>
      {msg && <div className="notice">{msg}</div>}
    </div>
  );
  return (
    <>
      <div className="card">
        <div className="row between"><h2>{data.team.name}</h2><span className="chip">Code: {data.team.code}</span></div>
        <div className="small muted">Weekly team goal</div>
        <div className="row"><Bar value={data.weekXp / data.team.goal} className="accent" /><b>{data.weekXp}/{data.team.goal}</b></div>
        {data.weekXp >= data.team.goal && <p>🎉 Goal reached this week — hongera, timu!</p>}
      </div>
      <div className="card" style={{ marginTop: '1rem' }}>
        {data.members.map((m, i) => <div key={m.username} className="lb-row"><span className="rank">{i + 1}</span><Avatar name={m.displayName} /><span className="grow"><b>{m.displayName}</b></span><b>{m.weekXp} XP</b></div>)}
      </div>
      <button className="btn ghost small" style={{ marginTop: '1rem' }} onClick={() => act('/team/leave', {})}>Leave team</button>
    </>
  );
}

export default function Social() {
  const { status, user } = useServer();
  const show = useApp((s) => s.settings.showLeagues);
  const [tab, setTab] = useState<'feed' | 'league' | 'friends' | 'team'>('feed');
  if (status === 'unknown') return <div className="spinner" />;
  if (status === 'offline') return (
    <div className="hero"><Mascot mood="think" size={130} /><h1>You're learning offline</h1><p className="muted">Leagues, friends and Harambee teams need the Lugha Zetu server. Everything else — lessons, practice, stories, streaks — works without a connection.</p></div>
  );
  if (!user) return (
    <>
      <div className="hero"><Mascot mood="wave" size={110} /><h1>Join the community</h1><p className="muted">Create a free account to share your progress in Jamii, the Lugha Zetu community, join weekly leagues, follow friends and learn in Harambee teams.</p></div>
      <div className="card"><AccountForm /></div>
    </>
  );
  return (
    <>
      <div className="row between wrap" style={{ marginTop: '1rem' }}><h1 style={{ margin: 0 }}>Community</h1><span className="small muted">@{user.username} · <button className="hintword" onClick={() => useApp.getState().setAuth(null)}>Sign out</button></span></div>
      {!show && <div className="notice info" style={{ margin: '.8rem 0' }}>Leagues are hidden in <Link to="/settings">Settings</Link>. Friends and teams are still here.</div>}
      <div className="tabs" role="tablist" style={{ marginTop: '1rem' }}>
        <button role="tab" aria-selected={tab === 'feed'} onClick={() => setTab('feed')}>🌍 Jamii</button>
        {show && <button role="tab" aria-selected={tab === 'league'} onClick={() => setTab('league')}>🏅 League</button>}
        <button role="tab" aria-selected={tab === 'friends'} onClick={() => setTab('friends')}>👥 Friends</button>
        <button role="tab" aria-selected={tab === 'team'} onClick={() => setTab('team')}>🤝 Harambee</button>
      </div>
      {tab === 'feed' && <Feed />}
      {tab === 'league' && show && <LeagueTab />}
      {(tab === 'friends' || (tab === 'league' && !show)) && <FriendsTab />}
      {tab === 'team' && <TeamTab />}
    </>
  );
}
