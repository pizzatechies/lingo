import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { INCUBATOR, metaOf } from '../content';
import { useCourse } from '../hooks';
import { api, ApiError, sync, useServer } from '../lib/api';
import { allItems, gloss } from '../lib/lexicon';
import { recordingSupported, startRecording } from '../lib/audio';
import { useApp } from '../state/store';
import { AccountForm } from './Account';
import { Mascot } from '../components/Mascot';
import { shuffle } from '../lib/rng';

interface Suggestion { id: number; courseId: string; itemId: string; kind: string; text: string; note: string; score: number; author: string; myVote: number; status: string }
interface Clip { id: number; itemId: string; text: string; url: string; author: string; score: number; myVote: number }
interface Incubator { lang: string; speakers: number; learners: number; words: number }

const blobToBase64 = (b: Blob) => new Promise<string>((res) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.readAsDataURL(b); });

function Review({ courseId, isMod }: { courseId: string; isMod: boolean }) {
  const [list, setList] = useState<Suggestion[] | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const load = useCallback(() => {
    api<Suggestion[]>(`/community/suggestions?course=${courseId}&status=pending`).then(setList).catch(() => setList([]));
    api<Clip[]>(`/audio?course=${courseId}&status=pending`).then(setClips).catch(() => setClips([]));
  }, [courseId]);
  useEffect(load, [load]);
  const course = useCourse();
  const items = useMemo(() => new Map(course ? allItems(course).map((i) => [i.id, i]) : []), [course]);
  const vote = async (path: string, value: number) => { await api(path, { body: { value } }).catch(() => {}); load(); };
  if (!list) return <div className="spinner" />;
  return (
    <div className="stack">
      <p className="small muted">Native speakers vote on suggestions. Enough 👍 votes approve a change for every learner{isMod ? '; as a moderator you can also decide directly' : ''}.</p>
      {list.length === 0 && clips.length === 0 && <div className="empty">No pending suggestions for this course. 🎉</div>}
      {list.map((s) => {
        const it = items.get(s.itemId);
        return (
          <div key={s.id} className="card">
            <div className="small muted">{s.kind === 'alternative' ? 'Should also be accepted' : s.kind === 'correction' ? 'Suggested correction' : s.kind === 'new' ? 'New content' : 'Report'} · by {s.author}</div>
            {it && <div><b>{it.t}</b> — <span className="muted">{it.en}</span></div>}
            <div style={{ fontSize: '1.1rem', margin: '.3rem 0' }}>➡️ {s.text}</div>
            {s.note && <div className="small muted">“{s.note}”</div>}
            <div className="row" style={{ marginTop: '.5rem' }}>
              <button className="btn small soft" aria-pressed={s.myVote === 1} onClick={() => vote(`/community/suggestions/${s.id}/vote`, 1)}>👍</button>
              <button className="btn small soft" aria-pressed={s.myVote === -1} onClick={() => vote(`/community/suggestions/${s.id}/vote`, -1)}>👎</button>
              <span className="small muted grow">score {s.score}</span>
              {isMod && <><button className="btn small success" onClick={() => api(`/community/suggestions/${s.id}/decision`, { body: { status: 'approved' } }).then(load)}>Approve</button><button className="btn small danger" onClick={() => api(`/community/suggestions/${s.id}/decision`, { body: { status: 'rejected' } }).then(load)}>Reject</button></>}
            </div>
          </div>
        );
      })}
      {clips.map((c) => (
        <div key={c.id} className="card">
          <div className="small muted">Recording by {c.author}</div>
          <b>{c.text}</b>
          <audio src={c.url} controls style={{ width: '100%', marginTop: '.4rem' }} />
          <div className="row" style={{ marginTop: '.4rem' }}>
            <button className="btn small soft" aria-pressed={c.myVote === 1} onClick={() => vote(`/audio/${c.id}/vote`, 1)}>👍 Sounds right</button>
            <button className="btn small soft" aria-pressed={c.myVote === -1} onClick={() => vote(`/audio/${c.id}/vote`, -1)}>👎</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Record({ courseId }: { courseId: string }) {
  const course = useCourse();
  const base = useApp((s) => s.courses[courseId as 'sw']?.base ?? 'en');
  const addReport = useApp((s) => s.addReport);
  const queue = useMemo(() => (course ? shuffle(allItems(course)).slice(0, 30) : []), [course]);
  const [i, setI] = useState(0);
  const [state, setState] = useState<'idle' | 'rec' | 'done' | 'sent' | 'error'>('idle');
  const [blob, setBlob] = useState<Blob | null>(null);
  const rec = useRef<{ stop: () => Promise<Blob> } | null>(null);
  if (!recordingSupported()) return <div className="empty">Your browser can't record audio.</div>;
  const it = queue[i];
  if (!it) return <div className="spinner" />;
  const toggle = async () => {
    if (state === 'rec') { const b = await rec.current!.stop(); setBlob(b); setState('done'); return; }
    try { rec.current = await startRecording(); setState('rec'); } catch { setState('error'); }
  };
  const send = async () => {
    if (!blob) return;
    try {
      await api('/audio', { body: { courseId, itemId: it.id, text: it.t, mime: blob.type || 'audio/webm', data: await blobToBase64(blob) } });
      addReport({ courseId, itemId: it.id, kind: 'audio', text: it.t, note: 'recording' });
      useApp.getState().markReportsSynced(useApp.getState().reports.slice(0, 1).map((r) => r.id));
      setState('sent');
    } catch { setState('error'); }
  };
  return (
    <div className="card center stack">
      <p className="small muted">Are you a native speaker? Record natural pronunciations — approved clips replace robotic voices for everyone.</p>
      <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>{it.t}</div>
      <div className="muted">{gloss(it, base)}</div>
      <button className="btn accent" onClick={toggle}>{state === 'rec' ? '⏹ Stop' : '🎙️ Record'}</button>
      {blob && state !== 'rec' && <audio src={URL.createObjectURL(blob)} controls style={{ width: '100%' }} />}
      {state === 'done' && <button className="btn success" onClick={send}>Submit for review</button>}
      {state === 'sent' && <p>✅ Asante! Submitted.</p>}
      {state === 'error' && <p className="notice">Microphone or upload failed — check permissions and connection.</p>}
      <button className="btn ghost small" onClick={() => { setI(i + 1); setBlob(null); setState('idle'); }}>Next phrase →</button>
    </div>
  );
}

function IncubatorTab({ online }: { online: boolean }) {
  const [stats, setStats] = useState<Incubator[]>([]);
  const [lang, setLang] = useState(INCUBATOR[0].id);
  const [words, setWords] = useState('');
  const [msg, setMsg] = useState('');
  useEffect(() => { if (online) api<Incubator[]>('/incubator').then(setStats).catch(() => {}); }, [online]);
  const st = (id: string) => stats.find((s) => s.lang === id);
  const join = async (role: 'speaker' | 'learner') => { try { await api(`/incubator/${lang}`, { body: { role } }); setMsg(role === 'speaker' ? 'Thank you! You are registered as a contributor.' : "We'll count you in — courses launch sooner with more interest."); api<Incubator[]>('/incubator').then(setStats); } catch (e) { setMsg(e instanceof ApiError ? e.message : 'Sign in first.'); } };
  const submitWords = async () => {
    const items = words.split('\n').map((l) => l.trim()).filter((l) => l.includes('=')).map((l) => ({ courseId: lang, itemId: 'new', kind: 'new', text: l, note: '' }));
    if (!items.length) return setMsg('Use one "word = meaning" per line.');
    try { await api('/community/suggestions/bulk', { body: { items } }); setWords(''); setMsg(`Submitted ${items.length} entries for review. Asante!`); } catch { setMsg('Sign in first.'); }
  };
  return (
    <div className="stack">
      <p className="small muted">These languages don't have a course yet. When enough native speakers contribute vocabulary and recordings, a beta course launches.</p>
      {INCUBATOR.map((l) => (
        <button key={l.id} className="card tap row" aria-pressed={lang === l.id} onClick={() => setLang(l.id)} style={{ borderColor: lang === l.id ? 'var(--primary)' : undefined }}>
          <span className="grow"><b>{l.name}</b><div className="small muted">{l.region} · {l.community}</div></span>
          <span className="small muted">{st(l.id) ? `${st(l.id)!.speakers} speakers · ${st(l.id)!.learners} waiting · ${st(l.id)!.words} entries` : ''}</span>
        </button>
      ))}
      {online && (
        <div className="card stack">
          <b>{INCUBATOR.find((l) => l.id === lang)?.name}</b>
          <div className="row wrap"><button className="btn small" onClick={() => join('speaker')}>I speak it — I'll help</button><button className="btn small soft" onClick={() => join('learner')}>I want to learn it</button></div>
          <textarea className="input" rows={4} placeholder={'Submit words, one per line:\nword = meaning'} value={words} onChange={(e) => setWords(e.target.value)} />
          <button className="btn accent small" onClick={submitWords}>Submit words</button>
          {msg && <div className="notice info">{msg}</div>}
        </div>
      )}
    </div>
  );
}

export default function Community() {
  const course = useCourse();
  const { status, user } = useServer();
  const reports = useApp((s) => s.reports);
  const [me, setMe] = useState<{ role: string } | null>(null);
  const [tab, setTab] = useState<'review' | 'record' | 'mine' | 'incubator'>('mine');
  useEffect(() => { if (user) { api<{ user: { role: string } }>('/me').then((r) => setMe(r.user)).catch(() => {}); setTab('review'); } }, [user]);
  if (!course) return <div className="spinner" />;
  const online = status === 'online';
  return (
    <>
      <div className="row" style={{ marginTop: '1rem' }}><Mascot mood="cheer" size={80} /><div><h1 style={{ margin: 0 }}>Community</h1><div className="small muted">Kenyan languages, built by Kenyans. {metaOf(course.id).name} · {course.status === 'beta' ? 'beta course' : 'full course'}</div></div></div>
      <div className="tabs" role="tablist" style={{ marginTop: '1rem' }}>
        {online && user && <button role="tab" aria-selected={tab === 'review'} onClick={() => setTab('review')}>🗳️ Review</button>}
        {online && user && <button role="tab" aria-selected={tab === 'record'} onClick={() => setTab('record')}>🎙️ Record</button>}
        <button role="tab" aria-selected={tab === 'mine'} onClick={() => setTab('mine')}>📝 Mine</button>
        <button role="tab" aria-selected={tab === 'incubator'} onClick={() => setTab('incubator')}>🌱 New languages</button>
      </div>
      {tab === 'review' && user && <Review courseId={course.id} isMod={me?.role === 'moderator'} />}
      {tab === 'record' && user && <Record courseId={course.id} />}
      {tab === 'mine' && (
        <div className="stack">
          {!online && <div className="notice">Offline — your reports are saved on this device and will be sent when you connect to the Lugha server.</div>}
          {online && !user && <div className="card"><p className="small">Sign in to vote on fixes, record audio and send your reports.</p><AccountForm /></div>}
          {online && user && reports.some((r) => !r.synced) && <button className="btn soft small" onClick={() => sync().catch(() => {})}>Send {reports.filter((r) => !r.synced).length} pending reports</button>}
          {reports.length === 0 ? <div className="empty">Tap ⚑ Report during any exercise to suggest a better answer or correction.</div> : reports.map((r) => (
            <div key={r.id} className="list-item"><span>{r.synced ? '✅' : '⏳'}</span><div className="grow"><b>{r.text || r.kind}</b><div className="small muted">{r.kind} · {r.itemId} · {new Date(r.at).toLocaleDateString()}</div></div></div>
          ))}
        </div>
      )}
      {tab === 'incubator' && <IncubatorTab online={online && !!user} />}
    </>
  );
}
