import { useState } from 'react';
import { api, ApiError, sync } from '../lib/api';
import { useApp } from '../state/store';

export function AccountForm({ onDone }: { onDone?: () => void }) {
  const setAuth = useApp((s) => s.setAuth);
  const name = useApp((s) => s.profile.name);
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState(name);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const r = await api<{ token: string; user: { username: string; displayName: string } }>(`/auth/${mode}`, { body: { username, password, displayName: displayName || username } });
      setAuth({ token: r.token, username: r.user.username, displayName: r.user.displayName });
      await sync().catch(() => {});
      onDone?.();
    } catch (x) { setErr(x instanceof ApiError ? x.message : 'Could not reach the server.'); } finally { setBusy(false); }
  };
  return (
    <form className="stack" onSubmit={submit}>
      <div className="tabs" role="tablist"><button type="button" role="tab" aria-selected={mode === 'register'} onClick={() => setMode('register')}>Create account</button><button type="button" role="tab" aria-selected={mode === 'login'} onClick={() => setMode('login')}>Sign in</button></div>
      <input className="input" placeholder="Username" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} maxLength={20} pattern="[A-Za-z0-9_]+" />
      {mode === 'register' && <input className="input" placeholder="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={40} />}
      <input className="input" type="password" placeholder="Password (8+ characters)" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
      {err && <div className="notice" role="alert">{err}</div>}
      <button className="btn" disabled={busy}>{mode === 'register' ? 'Create account' : 'Sign in'}</button>
      <p className="small muted">Your current progress is kept and synced. No email needed.</p>
    </form>
  );
}
