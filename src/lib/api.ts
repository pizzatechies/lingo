import { useEffect, useState } from 'react';
import { progressSnapshot, totalXp, useApp } from '../state/store';

/** Thin client for the optional Lugha server. Everything degrades gracefully when offline. */
const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '';

export class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }

export async function api<T>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = useApp.getState().auth?.token;
  const res = await fetch(`${BASE}/api${path}`, {
    method: opts.method ?? (opts.body ? 'POST' : 'GET'),
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) useApp.getState().setAuth(null);
    throw new ApiError(res.status, (data as { error?: string }).error ?? res.statusText);
  }
  return data as T;
}

let status: 'unknown' | 'online' | 'offline' = 'unknown';
const subs = new Set<(s: typeof status) => void>();
export async function checkServer() {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 3000);
    const r = await fetch(`${BASE}/api/health`, { signal: ctl.signal });
    clearTimeout(t);
    status = r.ok && (await r.json().catch(() => null))?.ok ? 'online' : 'offline';
  } catch { status = 'offline'; }
  subs.forEach((f) => f(status));
  return status;
}
export function useServer() {
  const [s, setS] = useState(status);
  useEffect(() => { subs.add(setS); if (status === 'unknown') checkServer(); return () => { subs.delete(setS); }; }, []);
  const auth = useApp((x) => x.auth);
  return { status: s, online: s === 'online', user: auth };
}

/* Community-approved answers & recordings, cached so they work offline. */
type Approved = { alternatives: { itemId: string; text: string; base: boolean }[]; audio: { itemId: string; text: string; url: string }[] };
const CKEY = 'lugha-community-';
const read = (id: string): Approved | null => { try { return JSON.parse(localStorage.getItem(CKEY + id) ?? 'null'); } catch { return null; } };
export function communityAnswers(courseId: string): Record<string, string[]> {
  const a = read(courseId);
  const out: Record<string, string[]> = {};
  for (const x of a?.alternatives ?? []) (out[x.itemId + (x.base ? ':base' : '')] ??= []).push(x.text);
  return out;
}
export async function refreshCommunity(courseId: string) {
  const data = await api<Approved>(`/community/approved?course=${courseId}`);
  try { localStorage.setItem(CKEY + courseId, JSON.stringify(data)); } catch { /* ignore */ }
  const { registerClip } = await import('./audio');
  for (const c of data.audio) registerClip(c.text, `${BASE}${c.url}`);
  return data;
}

/** Push progress + pending community reports. Weekly league XP is derived server-side from total XP growth. */
export async function sync() {
  const s = useApp.getState();
  if (!s.auth) return;
  const pending = s.reports.filter((r) => !r.synced);
  if (pending.length) {
    await api('/community/suggestions/bulk', { body: { items: pending.map((r) => ({ courseId: r.courseId, itemId: r.itemId, kind: r.kind, text: r.text, note: r.note })) } });
    s.markReportsSynced(pending.map((r) => r.id));
  }
  const remote = await api<{ state: Record<string, unknown> | null; updatedAt: number }>('/progress', {
    method: 'PUT',
    body: { state: progressSnapshot(useApp.getState()), updatedAt: s.updatedAt, totalXp: totalXp(s), streak: s.streak.current, courses: Object.keys(s.courses) },
  });
  // If another device has newer progress, adopt it.
  if (remote.state && remote.updatedAt > useApp.getState().updatedAt) useApp.getState().replaceState(remote.state as never);
}
