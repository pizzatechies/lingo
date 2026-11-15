import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import type { DatabaseSync as DB } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Server } from 'node:http';
import { createApp, weekOf } from '../server/app';

// Vite's resolver does not know node:sqlite yet, so load it through require.
const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite') as { DatabaseSync: typeof DB };
let server: Server, base = '', dir = '';
let clock = Date.UTC(2026, 10, 10, 12); // a Tuesday
const call = async (path: string, opts: { method?: string; body?: unknown; token?: string } = {}) => {
  const r = await fetch(base + '/api' + path, { method: opts.method ?? (opts.body ? 'POST' : 'GET'), headers: { 'Content-Type': 'application/json', ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}) }, body: opts.body ? JSON.stringify(opts.body) : undefined });
  return { status: r.status, body: await r.json() };
};
const register = async (username: string) => (await call('/auth/register', { body: { username, password: 'password123', displayName: username } })).body.token as string;

beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), 'lugha-'));
  const app = createApp({ db: new DatabaseSync(':memory:'), dataDir: dir, moderators: ['mod'], approvalVotes: 2, now: () => clock });
  await new Promise<void>((r) => { server = app.listen(0, () => r()); });
  base = `http://localhost:${(server.address() as { port: number }).port}`;
});
afterAll(() => { server.close(); rmSync(dir, { recursive: true, force: true }); });

describe('server', () => {
  it('reports health', async () => expect((await call('/health')).body.ok).toBe(true));

  it('registers, logs in and rejects bad credentials', async () => {
    const t = await register('amina');
    expect(t).toBeTruthy();
    expect((await call('/auth/register', { body: { username: 'amina', password: 'password123' } })).status).toBe(409);
    expect((await call('/auth/register', { body: { username: 'x', password: 'password123' } })).status).toBe(400);
    expect((await call('/auth/login', { body: { username: 'amina', password: 'nope-nope' } })).status).toBe(401);
    const ok = await call('/auth/login', { body: { username: 'AMINA', password: 'password123' } });
    expect(ok.status).toBe(200);
    expect((await call('/me', { token: ok.body.token })).body.user.username).toBe('amina');
    expect((await call('/me')).status).toBe(401);
  });

  it('syncs progress with last-write-wins', async () => {
    const t = await register('juma');
    await call('/progress', { method: 'PUT', token: t, body: { state: { a: 1 }, updatedAt: 100, totalXp: 0, streak: 1 } });
    const stale = await call('/progress', { method: 'PUT', token: t, body: { state: { a: 0 }, updatedAt: 50, totalXp: 0, streak: 1 } });
    expect(stale.body.state).toEqual({ a: 1 });
    const fresh = await call('/progress', { method: 'PUT', token: t, body: { state: { a: 2 }, updatedAt: 200, totalXp: 0, streak: 1 } });
    expect(fresh.body.state).toBeNull();
  });

  it('ranks the weekly league and promotes at week end', async () => {
    const tokens = await Promise.all(['pl1', 'pl2', 'pl3'].map(register));
    for (const [i, t] of tokens.entries()) await call('/progress', { method: 'PUT', token: t, body: { state: {}, updatedAt: 1, totalXp: (i + 1) * 30, streak: 2 } });
    const lg = await call('/league', { token: tokens[0] });
    expect(lg.body.tierName).toBe('Dikidiki');
    const names = lg.body.standings.map((s: { username: string }) => s.username);
    expect(names.slice(0, 3)).toEqual(['pl3', 'pl2', 'pl1']);
    clock += 7 * 86400000; // next week
    const next = await call('/league', { token: tokens[0] });
    expect(next.body.tier).toBe(2);
    expect(next.body.lastResult).toContain('moved up');
    expect(weekOf(clock)).toBeGreaterThan(0);
  });

  it('follows friends and runs Harambee teams', async () => {
    const a = await register('wanjiru'), b = await register('otieno');
    expect((await call('/friends', { token: a, body: { username: 'otieno' } })).status).toBe(201);
    expect((await call('/friends', { token: a, body: { username: 'ghost' } })).status).toBe(404);
    const f = await call('/friends', { token: a });
    expect(f.body.map((x: { username: string }) => x.username)).toContain('otieno');
    const team = await call('/team', { token: a, body: { name: 'Timu Moto' } });
    expect(team.body.code).toHaveLength(6);
    expect((await call('/team/join', { token: b, body: { code: team.body.code } })).status).toBe(200);
    await call('/progress', { method: 'PUT', token: b, body: { state: {}, updatedAt: 1, totalXp: 40, streak: 1 } });
    const t = await call('/team', { token: a });
    expect(t.body.members).toHaveLength(2);
    expect(t.body.weekXp).toBe(40);
  });

  it('approves community answers by vote and by moderator', async () => {
    const author = await register('author'), v1 = await register('voter1'), v2 = await register('voter2'), mod = await register('mod');
    await call('/community/suggestions/bulk', { token: author, body: { items: [{ courseId: 'sw', itemId: 'sw.s.x', kind: 'alternative', text: 'Hujambo?', note: '' }, { courseId: 'sw', itemId: 'sw.s.y', kind: 'correction', text: 'Fix', note: '' }, { courseId: 'BAD!', itemId: 'z', kind: 'alternative', text: 'x' }] } });
    const list = (await call('/community/suggestions?course=sw', { token: v1 })).body;
    expect(list).toHaveLength(2);
    const alt = list.find((s: { kind: string }) => s.kind === 'alternative');
    expect((await call(`/community/suggestions/${alt.id}/vote`, { token: author, body: { value: 1 } })).status).toBe(400);
    await call(`/community/suggestions/${alt.id}/vote`, { token: v1, body: { value: 1 } });
    const r = await call(`/community/suggestions/${alt.id}/vote`, { token: v2, body: { value: 1 } });
    expect(r.body.status).toBe('approved');
    const corr = list.find((s: { kind: string }) => s.kind === 'correction');
    expect((await call(`/community/suggestions/${corr.id}/decision`, { token: v1, body: { status: 'approved' } })).status).toBe(403);
    expect((await call(`/community/suggestions/${corr.id}/decision`, { token: mod, body: { status: 'approved' } })).body.status).toBe('approved');
    const approved = (await call('/community/approved?course=sw')).body;
    expect(approved.alternatives.map((a: { text: string }) => a.text)).toContain('Hujambo?');
  });

  it('accepts and serves audio recordings', async () => {
    const t = await register('sauti'), v = await register('sikia');
    const data = Buffer.alloc(500, 1).toString('base64');
    const up = await call('/audio', { token: t, body: { courseId: 'luo', itemId: 'luo.s.erokamano', text: 'Erokamano.', mime: 'audio/webm;codecs=opus', data } });
    expect(up.status).toBe(201);
    expect((await call('/audio', { token: t, body: { courseId: 'luo', itemId: 'x', text: 'x', mime: 'text/html', data } })).status).toBe(400);
    const pending = (await call('/audio?course=luo', { token: v })).body;
    expect(pending[0].text).toBe('Erokamano.');
    const file = await fetch(base + pending[0].url);
    expect(file.headers.get('content-type')).toContain('audio/webm');
  });
});
