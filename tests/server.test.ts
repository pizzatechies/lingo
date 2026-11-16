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
  const app = createApp({ db: new DatabaseSync(':memory:'), dataDir: dir, moderators: ['mod'], approvalVotes: 2, authRateLimit: 1000, now: () => clock });
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

describe('community courses', () => {
  it('collects, votes on and publishes translations', async () => {
    const tr = await register('mtafsiri'), v1 = await register('mpigakura1'), v2 = await register('mpigakura2'), mod = await register('mod2');
    const put = await call('/langs/kam/translations', { method: 'PUT', token: tr, body: { items: [
      { sourceId: 'sw.w.maji', t: 'kiwũ', note: 'Machakos' }, { sourceId: 'sw.w.asante', t: 'nĩ wega | nĩ mũvea' }, { sourceId: 'not-an-id', t: 'x' },
    ] } });
    expect(put.body.saved).toBe(2);
    expect((await call('/langs/kam/course')).body.translations).toEqual({});
    const pending = (await call('/langs/kam/translations?status=pending', { token: v1 })).body;
    expect(pending).toHaveLength(2);
    const water = pending.find((x: { sourceId: string }) => x.sourceId === 'sw.w.maji');
    await call(`/translations/${water.id}/vote`, { token: v1, body: { value: 1 } });
    expect((await call(`/translations/${water.id}/vote`, { token: v2, body: { value: 1 } })).body.status).toBe('approved');
    const thanks = pending.find((x: { sourceId: string }) => x.sourceId === 'sw.w.asante');
    expect((await call(`/translations/${thanks.id}/decision`, { token: v1, body: { status: 'approved' } })).status).toBe(403);
    // 'mod2' is not a moderator either; only configured moderators may decide.
    expect((await call(`/translations/${thanks.id}/decision`, { token: mod, body: { status: 'approved' } })).status).toBe(403);
    const course = (await call('/langs/kam/course')).body.translations;
    expect(course['sw.w.maji']).toEqual({ t: 'kiwũ', note: 'Machakos' });
    const progress = (await call('/langs/progress')).body.find((p: { lang: string }) => p.lang === 'kam');
    expect(progress).toMatchObject({ approved: 1, pending: 1, contributors: 1 });
    // Editing an approved translation sends it back for review.
    await call('/langs/kam/translations', { method: 'PUT', token: tr, body: { items: [{ sourceId: 'sw.w.maji', t: 'kiwũ (changed)' }] } });
    expect((await call('/langs/kam/course')).body.translations['sw.w.maji']).toBeUndefined();
  });
});

describe('community feed', () => {
  it('shares progress, reacts, filters by friends and moderates', async () => {
    const a = await register('feedA'), b = await register('feedB'), c = await register('feedC');
    const m = (await call('/auth/login', { body: { username: 'mod', password: 'password123' } })).body.token as string; // moderator from an earlier test
    expect((await call('/feed', { token: a, body: { kind: 'text', body: '' } })).status).toBe(400);
    const p1 = await call('/feed', { token: a, body: { kind: 'progress', body: 'Nimemaliza somo la kwanza!', data: { streak: 3, xp: 40, course: 'Kiswahili', evil: { x: 1 } } } });
    expect(p1.status).toBe(201);
    expect(p1.body.data).toEqual({ streak: 3, xp: 40, course: 'Kiswahili' });
    await call('/feed', { token: c, body: { kind: 'text', body: 'Habari wote' } });
    const feed = (await call('/feed', { token: b })).body;
    expect(feed.map((x: { body: string }) => x.body)).toEqual(expect.arrayContaining(['Nimemaliza somo la kwanza!', 'Habari wote']));
    // Reactions toggle
    expect((await call(`/feed/${p1.body.id}/react`, { token: b, body: { emoji: '🔥' } })).body.reacted).toBe(true);
    expect((await call(`/feed/${p1.body.id}/react`, { token: b, body: { emoji: '💩' } })).status).toBe(400);
    const fire = (await call('/feed', { token: b })).body.find((x: { id: number }) => x.id === p1.body.id).reactions.find((r: { emoji: string }) => r.emoji === '🔥');
    expect(fire).toEqual({ emoji: '🔥', count: 1, mine: true });
    // Friends filter: b follows a only
    await call('/friends', { token: b, body: { username: 'feedA' } });
    const friends = (await call('/feed?scope=friends', { token: b })).body;
    expect(friends.every((x: { author: { username: string } }) => x.author.username === 'feedA')).toBe(true);
    // Only owners or moderators delete
    expect((await call(`/feed/${p1.body.id}`, { method: 'DELETE', token: b })).status).toBe(403);
    const cPost = (await call('/feed', { token: b })).body.find((x: { body: string }) => x.body === 'Habari wote');
    expect((await call(`/feed/${cPost.id}`, { method: 'DELETE', token: m })).status).toBe(200);
    // Three reports hide a post
    const p2 = (await call('/feed', { token: a, body: { kind: 'text', body: 'spam' } })).body;
    for (const t of [b, c, m]) await call(`/feed/${p2.id}/report`, { token: t, body: {} });
    expect((await call('/feed', { token: b })).body.some((x: { id: number }) => x.id === p2.id)).toBe(false);
  });
});
