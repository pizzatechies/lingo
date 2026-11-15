import express, { type NextFunction, type Request, type Response } from 'express';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';

export const TIERS = ['Dikidiki', 'Swala', 'Pundamilia', 'Nyumbu', 'Twiga', 'Nyati', 'Kifaru', 'Chui', 'Ndovu', 'Simba'];
export const PROMOTE = 7;
export const DEMOTE = 5;
const COHORT = 30;
const WEEK = 7 * 86400000;
const EAT = 3 * 3600000; // Leagues run on Nairobi time (UTC+3)
const MONDAY_EPOCH = Date.UTC(1970, 0, 5);
export const weekOf = (t = Date.now()) => Math.floor((t + EAT - MONDAY_EPOCH) / WEEK);
export const weekEnds = (w: number) => MONDAY_EPOCH + (w + 1) * WEEK - EAT;

export interface AppOptions { corsOrigins?: string[]; db: DatabaseSync; dataDir: string; moderators?: string[]; approvalVotes?: number; clientDir?: string; now?: () => number }
type User = { id: number; username: string; display_name: string; role: string; league_tier: number; total_xp: number; streak: number };
type Req = Request & { user?: User };

const hashPw = (pw: string) => { const salt = randomBytes(16).toString('hex'); return `scrypt$${salt}$${scryptSync(pw, salt, 64).toString('hex')}`; };
const checkPw = (pw: string, stored: string) => {
  const [, salt, hash] = stored.split('$');
  const a = Buffer.from(hash, 'hex'), b = scryptSync(pw, salt, 64);
  return a.length === b.length && timingSafeEqual(a, b);
};
const sha = (s: string) => createHash('sha256').update(s).digest('hex');
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const COURSE_RE = /^[a-z]{2,6}$/;

export function migrate(db: DatabaseSync) {
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE COLLATE NOCASE, display_name TEXT NOT NULL, password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'learner', league_tier INTEGER NOT NULL DEFAULT 1, total_xp INTEGER NOT NULL DEFAULT 0, streak INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS progress (user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, state TEXT NOT NULL, updated_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS xp_weekly (user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, week INTEGER NOT NULL, xp INTEGER NOT NULL DEFAULT 0, tier INTEGER NOT NULL, cohort INTEGER NOT NULL DEFAULT 0, processed INTEGER NOT NULL DEFAULT 0, result TEXT, PRIMARY KEY (user_id, week));
    CREATE INDEX IF NOT EXISTS xp_weekly_group ON xp_weekly(week, tier, cohort);
    CREATE TABLE IF NOT EXISTS follows (follower INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, followee INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, PRIMARY KEY (follower, followee));
    CREATE TABLE IF NOT EXISTS teams (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, code TEXT NOT NULL UNIQUE, goal INTEGER NOT NULL DEFAULT 500, owner INTEGER NOT NULL, created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS team_members (team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE, user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE, PRIMARY KEY (team_id, user_id));
    CREATE TABLE IF NOT EXISTS suggestions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, course_id TEXT NOT NULL, item_id TEXT NOT NULL,
      kind TEXT NOT NULL, text TEXT NOT NULL, note TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'pending', score INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS suggestion_votes (suggestion_id INTEGER NOT NULL REFERENCES suggestions(id) ON DELETE CASCADE, user_id INTEGER NOT NULL, value INTEGER NOT NULL, PRIMARY KEY (suggestion_id, user_id));
    CREATE TABLE IF NOT EXISTS audio (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, course_id TEXT NOT NULL, item_id TEXT NOT NULL, text TEXT NOT NULL,
      mime TEXT NOT NULL, file TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', score INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS audio_votes (audio_id INTEGER NOT NULL REFERENCES audio(id) ON DELETE CASCADE, user_id INTEGER NOT NULL, value INTEGER NOT NULL, PRIMARY KEY (audio_id, user_id));
    CREATE TABLE IF NOT EXISTS incubator (lang TEXT NOT NULL, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, role TEXT NOT NULL, PRIMARY KEY (lang, user_id));
  `);
}

/** Tiny fixed-window rate limiter for auth endpoints. */
function limiter(max: number, windowMs: number) {
  const hits = new Map<string, { n: number; reset: number }>();
  return (req: Request, res: Response, next: NextFunction) => {
    const k = req.ip ?? 'x', now = Date.now();
    const h = hits.get(k);
    if (!h || h.reset < now) hits.set(k, { n: 1, reset: now + windowMs });
    else if (++h.n > max) return res.status(429).json({ error: 'Too many attempts — try again in a few minutes.' });
    next();
  };
}

export function createApp(opts: AppOptions) {
  const { db, dataDir } = opts;
  const now = opts.now ?? Date.now;
  const moderators = new Set((opts.moderators ?? []).map((m) => m.toLowerCase()));
  const approvalVotes = opts.approvalVotes ?? 3;
  const audioDir = join(dataDir, 'audio');
  mkdirSync(audioDir, { recursive: true });
  migrate(db);

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use((_, res, next) => { res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin'); next(); });
  // The Android app runs on https://localhost (Capacitor), so it needs CORS to reach a hosted API.
  const cors = new Set(opts.corsOrigins ?? ['https://localhost', 'capacitor://localhost', 'http://localhost']);
  app.use('/api', (req, res, next) => {
    const origin = req.headers.origin;
    if (origin && cors.has(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });
  app.use('/api', express.json({ limit: '3mb' }));

  const q = <T>(sql: string, ...p: (string | number | null)[]) => db.prepare(sql).get(...p) as T | undefined;
  const all = <T>(sql: string, ...p: (string | number | null)[]) => db.prepare(sql).all(...p) as T[];
  const run = (sql: string, ...p: (string | number | null)[]) => db.prepare(sql).run(...p);

  const auth = (required: boolean) => (req: Req, res: Response, next: NextFunction) => {
    const h = req.headers.authorization;
    if (h?.startsWith('Bearer ')) {
      const u = q<User>('SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?', sha(h.slice(7)), now());
      if (u) req.user = u;
    }
    if (required && !req.user) return res.status(401).json({ error: 'Please sign in.' });
    next();
  };
  const issue = (userId: number) => {
    const token = randomBytes(32).toString('base64url');
    run('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)', sha(token), userId, now() + 90 * 86400000);
    return token;
  };
  const publicUser = (u: User) => ({ username: u.username, displayName: u.display_name, role: moderators.has(u.username.toLowerCase()) ? 'moderator' : u.role });

  /* ---------- Leagues ---------- */
  /** Settle any finished weeks for this user: promote, demote or stay. */
  const settle = (u: User) => {
    const cur = weekOf(now());
    const open = all<{ week: number; tier: number; cohort: number }>('SELECT week, tier, cohort FROM xp_weekly WHERE user_id = ? AND week < ? AND processed = 0 ORDER BY week', u.id, cur);
    let tier = u.league_tier, result: string | null = null;
    for (const m of open) {
      const group = all<{ user_id: number; xp: number }>('SELECT user_id, xp FROM xp_weekly WHERE week = ? AND tier = ? AND cohort = ? ORDER BY xp DESC, user_id', m.week, m.tier, m.cohort);
      const rank = group.findIndex((g) => g.user_id === u.id) + 1;
      if (rank > 0 && rank <= PROMOTE && m.tier < TIERS.length) { tier = m.tier + 1; result = `Hongera! You finished #${rank} and moved up to the ${TIERS[tier - 1]} League.`; }
      else if (group.length >= 10 && rank > group.length - DEMOTE && m.tier > 1) { tier = m.tier - 1; result = `You finished #${rank} and moved to the ${TIERS[tier - 1]} League. Next week is a fresh start!`; }
      else { tier = m.tier; result = `You finished #${rank} and stayed in the ${TIERS[tier - 1]} League.`; }
      run('UPDATE xp_weekly SET processed = 1, result = ? WHERE user_id = ? AND week = ?', result, u.id, m.week);
    }
    if (open.length) { run('UPDATE users SET league_tier = ? WHERE id = ?', tier, u.id); u.league_tier = tier; }
    return result;
  };
  const addXp = (u: User, amount: number) => {
    if (amount <= 0) return;
    settle(u);
    const w = weekOf(now());
    const existing = q<{ xp: number }>('SELECT xp FROM xp_weekly WHERE user_id = ? AND week = ?', u.id, w);
    if (existing) run('UPDATE xp_weekly SET xp = xp + ? WHERE user_id = ? AND week = ?', amount, u.id, w);
    else {
      const n = q<{ n: number }>('SELECT COUNT(*) AS n FROM xp_weekly WHERE week = ? AND tier = ?', w, u.league_tier)!.n;
      run('INSERT INTO xp_weekly (user_id, week, xp, tier, cohort) VALUES (?, ?, ?, ?, ?)', u.id, w, amount, u.league_tier, Math.floor(n / COHORT));
    }
  };
  const weekXp = (userId: number) => q<{ xp: number }>('SELECT xp FROM xp_weekly WHERE user_id = ? AND week = ?', userId, weekOf(now()))?.xp ?? 0;

  /* ---------- Routes ---------- */
  const api = express.Router();
  api.get('/health', (_req, res) => res.json({ ok: true, name: 'lugha', week: weekOf(now()) }));

  api.post('/auth/register', limiter(20, 10 * 60000), (req, res) => {
    const username = str(req.body?.username, 20), password = String(req.body?.password ?? ''), displayName = str(req.body?.displayName, 40) || username;
    if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) return res.status(400).json({ error: 'Username: 3–20 letters, numbers or _.' });
    if (password.length < 8 || password.length > 200) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    if (q('SELECT id FROM users WHERE username = ?', username)) return res.status(409).json({ error: 'That username is taken.' });
    const r = run('INSERT INTO users (username, display_name, password_hash, created_at) VALUES (?, ?, ?, ?)', username, displayName, hashPw(password), now());
    const u = q<User>('SELECT * FROM users WHERE id = ?', Number(r.lastInsertRowid))!;
    res.status(201).json({ token: issue(u.id), user: publicUser(u) });
  });
  api.post('/auth/login', limiter(20, 10 * 60000), (req, res) => {
    const u = q<User & { password_hash: string }>('SELECT * FROM users WHERE username = ?', str(req.body?.username, 20));
    if (!u || !checkPw(String(req.body?.password ?? ''), u.password_hash)) return res.status(401).json({ error: 'Wrong username or password.' });
    res.json({ token: issue(u.id), user: publicUser(u) });
  });
  api.post('/auth/logout', auth(true), (req, res) => { run('DELETE FROM sessions WHERE token_hash = ?', sha(req.headers.authorization!.slice(7))); res.json({ ok: true }); });
  api.get('/me', auth(true), (req: Req, res) => res.json({ user: publicUser(req.user!) }));

  /** Progress sync: last write wins; weekly XP is the growth in total XP since the last sync. */
  api.put('/progress', auth(true), (req: Req, res) => {
    const u = req.user!;
    const updatedAt = Number(req.body?.updatedAt) || 0;
    const totalXp = Math.max(0, Math.floor(Number(req.body?.totalXp) || 0));
    const streak = Math.max(0, Math.floor(Number(req.body?.streak) || 0));
    const delta = Math.min(2000, totalXp - u.total_xp); // cap per sync against abuse
    if (delta > 0) { addXp(u, delta); run('UPDATE users SET total_xp = ? WHERE id = ?', u.total_xp + delta, u.id); }
    run('UPDATE users SET streak = ? WHERE id = ?', streak, u.id);
    const stored = q<{ state: string; updated_at: number }>('SELECT state, updated_at FROM progress WHERE user_id = ?', u.id);
    if (stored && stored.updated_at > updatedAt) return res.json({ state: JSON.parse(stored.state), updatedAt: stored.updated_at });
    const state = JSON.stringify(req.body?.state ?? {});
    if (state.length > 2_500_000) return res.status(413).json({ error: 'Progress too large.' });
    run('INSERT INTO progress (user_id, state, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET state = excluded.state, updated_at = excluded.updated_at', u.id, state, updatedAt);
    res.json({ state: null, updatedAt });
  });

  api.get('/league', auth(true), (req: Req, res) => {
    const u = req.user!;
    const lastResult = settle(u);
    const w = weekOf(now());
    const mine = q<{ tier: number; cohort: number }>('SELECT tier, cohort FROM xp_weekly WHERE user_id = ? AND week = ?', u.id, w);
    const standings = mine
      ? all<{ username: string; display_name: string; xp: number; streak: number; id: number }>('SELECT u.id, u.username, u.display_name, u.streak, x.xp FROM xp_weekly x JOIN users u ON u.id = x.user_id WHERE x.week = ? AND x.tier = ? AND x.cohort = ? ORDER BY x.xp DESC, u.id', w, mine.tier, mine.cohort)
        .map((r) => ({ username: r.username, displayName: r.display_name, xp: r.xp, streak: r.streak, me: r.id === u.id }))
      : [];
    res.json({ tier: u.league_tier, tierName: TIERS[u.league_tier - 1], tiers: TIERS, endsAt: weekEnds(w), standings, promote: PROMOTE, demote: DEMOTE, lastResult });
  });

  api.get('/friends', auth(true), (req: Req, res) => {
    const rows = all<{ id: number; username: string; display_name: string; streak: number; total_xp: number }>('SELECT u.id, u.username, u.display_name, u.streak, u.total_xp FROM follows f JOIN users u ON u.id = f.followee WHERE f.follower = ?', req.user!.id);
    const me = req.user!;
    const list = [...rows, me].map((r) => ({ username: r.username, displayName: r.display_name, streak: r.streak, totalXp: r.total_xp, weekXp: weekXp(r.id) }));
    res.json(list.sort((a, b) => b.weekXp - a.weekXp));
  });
  api.post('/friends', auth(true), (req: Req, res) => {
    const other = q<User>('SELECT * FROM users WHERE username = ?', str(req.body?.username, 20));
    if (!other) return res.status(404).json({ error: 'No learner with that username.' });
    if (other.id === req.user!.id) return res.status(400).json({ error: "That's you!" });
    run('INSERT OR IGNORE INTO follows (follower, followee) VALUES (?, ?)', req.user!.id, other.id);
    res.status(201).json({ ok: true });
  });
  api.delete('/friends/:username', auth(true), (req: Req, res) => {
    const other = q<User>('SELECT * FROM users WHERE username = ?', String(req.params.username));
    if (other) run('DELETE FROM follows WHERE follower = ? AND followee = ?', req.user!.id, other.id);
    res.json({ ok: true });
  });

  const teamOf = (userId: number) => q<{ id: number; name: string; code: string; goal: number }>('SELECT t.* FROM teams t JOIN team_members m ON m.team_id = t.id WHERE m.user_id = ?', userId);
  api.get('/team', auth(true), (req: Req, res) => {
    const t = teamOf(req.user!.id);
    if (!t) return res.json({ team: null, members: [], weekXp: 0 });
    const members = all<{ id: number; username: string; display_name: string }>('SELECT u.id, u.username, u.display_name FROM team_members m JOIN users u ON u.id = m.user_id WHERE m.team_id = ?', t.id)
      .map((m) => ({ username: m.username, displayName: m.display_name, weekXp: weekXp(m.id) })).sort((a, b) => b.weekXp - a.weekXp);
    res.json({ team: { name: t.name, code: t.code, goal: t.goal }, members, weekXp: members.reduce((a, m) => a + m.weekXp, 0) });
  });
  api.post('/team', auth(true), (req: Req, res) => {
    const name = str(req.body?.name, 30);
    if (name.length < 2) return res.status(400).json({ error: 'Give your team a name.' });
    if (teamOf(req.user!.id)) return res.status(409).json({ error: 'Leave your current team first.' });
    let code = '';
    do code = randomBytes(4).toString('base64').replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 6).padEnd(6, 'X'); while (q('SELECT id FROM teams WHERE code = ?', code));
    const r = run('INSERT INTO teams (name, code, owner, created_at) VALUES (?, ?, ?, ?)', name, code, req.user!.id, now());
    run('INSERT INTO team_members (team_id, user_id) VALUES (?, ?)', Number(r.lastInsertRowid), req.user!.id);
    res.status(201).json({ code });
  });
  api.post('/team/join', auth(true), (req: Req, res) => {
    const t = q<{ id: number }>('SELECT id FROM teams WHERE code = ?', str(req.body?.code, 6).toUpperCase());
    if (!t) return res.status(404).json({ error: 'No team with that code.' });
    if (teamOf(req.user!.id)) return res.status(409).json({ error: 'Leave your current team first.' });
    if (q<{ n: number }>('SELECT COUNT(*) AS n FROM team_members WHERE team_id = ?', t.id)!.n >= 50) return res.status(409).json({ error: 'That team is full (50 members).' });
    run('INSERT INTO team_members (team_id, user_id) VALUES (?, ?)', t.id, req.user!.id);
    res.json({ ok: true });
  });
  api.post('/team/leave', auth(true), (req: Req, res) => { run('DELETE FROM team_members WHERE user_id = ?', req.user!.id); res.json({ ok: true }); });

  /* ---------- Community ---------- */
  const isMod = (u?: User) => !!u && (u.role === 'moderator' || moderators.has(u.username.toLowerCase()));
  api.post('/community/suggestions/bulk', auth(true), (req: Req, res) => {
    const items = Array.isArray(req.body?.items) ? req.body.items.slice(0, 50) : [];
    let n = 0;
    for (const it of items) {
      const courseId = str(it.courseId, 8), itemId = str(it.itemId, 120), kind = str(it.kind, 20), text = str(it.text, 300), note = str(it.note, 300);
      if (!COURSE_RE.test(courseId) || !itemId || !['alternative', 'correction', 'audio', 'other', 'new'].includes(kind) || (!text && kind !== 'audio')) continue;
      run('INSERT INTO suggestions (user_id, course_id, item_id, kind, text, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)', req.user!.id, courseId, itemId, kind, text, note, now());
      n++;
    }
    res.status(201).json({ created: n });
  });
  api.get('/community/suggestions', auth(true), (req: Req, res) => {
    const rows = all<{ id: number; course_id: string; item_id: string; kind: string; text: string; note: string; score: number; status: string; author: string; my: number | null }>(
      `SELECT s.*, u.display_name AS author, (SELECT value FROM suggestion_votes v WHERE v.suggestion_id = s.id AND v.user_id = ?) AS my
       FROM suggestions s JOIN users u ON u.id = s.user_id WHERE s.course_id = ? AND s.status = ? ORDER BY s.created_at DESC LIMIT 100`,
      req.user!.id, str(req.query.course, 8), str(req.query.status, 12) || 'pending');
    res.json(rows.map((r) => ({ id: r.id, courseId: r.course_id, itemId: r.item_id, kind: r.kind, text: r.text, note: r.note, score: r.score, status: r.status, author: r.author, myVote: r.my ?? 0 })));
  });
  api.post('/community/suggestions/:id/vote', auth(true), (req: Req, res) => {
    const id = Number(req.params.id), value = Number(req.body?.value) === -1 ? -1 : 1;
    const s = q<{ user_id: number; kind: string; status: string }>('SELECT user_id, kind, status FROM suggestions WHERE id = ?', id);
    if (!s) return res.status(404).json({ error: 'Not found' });
    if (s.user_id === req.user!.id) return res.status(400).json({ error: "You can't vote on your own suggestion." });
    run('INSERT INTO suggestion_votes (suggestion_id, user_id, value) VALUES (?, ?, ?) ON CONFLICT DO UPDATE SET value = excluded.value', id, req.user!.id, value);
    const score = q<{ s: number }>('SELECT COALESCE(SUM(value), 0) AS s FROM suggestion_votes WHERE suggestion_id = ?', id)!.s;
    const status = s.status === 'pending' && s.kind === 'alternative' && score >= approvalVotes ? 'approved' : s.status === 'pending' && score <= -approvalVotes ? 'rejected' : s.status;
    run('UPDATE suggestions SET score = ?, status = ? WHERE id = ?', score, status, id);
    res.json({ score, status });
  });
  api.post('/community/suggestions/:id/decision', auth(true), (req: Req, res) => {
    if (!isMod(req.user)) return res.status(403).json({ error: 'Moderators only.' });
    const status = req.body?.status === 'approved' ? 'approved' : 'rejected';
    run('UPDATE suggestions SET status = ? WHERE id = ?', status, Number(req.params.id));
    res.json({ status });
  });
  /** Public: everything approved for a course — merged into answer checking and audio on every device. */
  api.get('/community/approved', (req, res) => {
    const course = str(req.query.course, 8);
    const alternatives = all<{ item_id: string; text: string; note: string }>("SELECT item_id, text, note FROM suggestions WHERE course_id = ? AND status = 'approved' AND kind = 'alternative'", course)
      .map((r) => ({ itemId: r.item_id, text: r.text, base: !/[̀-ͯ]/.test(r.text) && r.note === 'base' }));
    const audio = all<{ id: number; item_id: string; text: string }>("SELECT id, item_id, text FROM audio WHERE course_id = ? AND status = 'approved' ORDER BY score DESC", course)
      .map((r) => ({ itemId: r.item_id, text: r.text, url: `/api/audio/${r.id}` }));
    res.set('Cache-Control', 'public, max-age=300').json({ alternatives, audio });
  });

  const MIMES: Record<string, string> = { 'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mp4': 'm4a', 'audio/mpeg': 'mp3', 'audio/wav': 'wav' };
  api.post('/audio', auth(true), (req: Req, res) => {
    const courseId = str(req.body?.courseId, 8), itemId = str(req.body?.itemId, 120), text = str(req.body?.text, 300);
    const mime = str(req.body?.mime, 40).split(';')[0];
    const data = Buffer.from(String(req.body?.data ?? ''), 'base64');
    if (!COURSE_RE.test(courseId) || !itemId || !text || !MIMES[mime]) return res.status(400).json({ error: 'Invalid recording.' });
    if (data.length < 200 || data.length > 1_500_000) return res.status(400).json({ error: 'Recording must be under ~1.5 MB.' });
    const r = run('INSERT INTO audio (user_id, course_id, item_id, text, mime, file, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)', req.user!.id, courseId, itemId, text, mime, '', now());
    const file = `${r.lastInsertRowid}.${MIMES[mime]}`;
    writeFileSync(join(audioDir, file), data);
    run('UPDATE audio SET file = ? WHERE id = ?', file, Number(r.lastInsertRowid));
    res.status(201).json({ id: Number(r.lastInsertRowid) });
  });
  api.get('/audio', auth(true), (req: Req, res) => {
    const rows = all<{ id: number; item_id: string; text: string; score: number; author: string; my: number | null }>(
      `SELECT a.id, a.item_id, a.text, a.score, u.display_name AS author, (SELECT value FROM audio_votes v WHERE v.audio_id = a.id AND v.user_id = ?) AS my
       FROM audio a JOIN users u ON u.id = a.user_id WHERE a.course_id = ? AND a.status = ? ORDER BY a.created_at DESC LIMIT 50`, req.user!.id, str(req.query.course, 8), str(req.query.status, 12) || 'pending');
    res.json(rows.map((r) => ({ id: r.id, itemId: r.item_id, text: r.text, score: r.score, author: r.author, myVote: r.my ?? 0, url: `/api/audio/${r.id}` })));
  });
  api.get('/audio/:id', (req, res) => {
    const a = q<{ file: string; mime: string }>('SELECT file, mime FROM audio WHERE id = ?', Number(req.params.id));
    const path = a && join(audioDir, a.file);
    if (!a || !path || !existsSync(path)) return res.status(404).json({ error: 'Not found' });
    res.type(a.mime).set('Cache-Control', 'public, max-age=86400').sendFile(path);
  });
  api.post('/audio/:id/vote', auth(true), (req: Req, res) => {
    const id = Number(req.params.id), value = Number(req.body?.value) === -1 ? -1 : 1;
    const a = q<{ user_id: number; status: string }>('SELECT user_id, status FROM audio WHERE id = ?', id);
    if (!a) return res.status(404).json({ error: 'Not found' });
    if (a.user_id === req.user!.id) return res.status(400).json({ error: "You can't vote on your own recording." });
    run('INSERT INTO audio_votes (audio_id, user_id, value) VALUES (?, ?, ?) ON CONFLICT DO UPDATE SET value = excluded.value', id, req.user!.id, value);
    const score = q<{ s: number }>('SELECT COALESCE(SUM(value), 0) AS s FROM audio_votes WHERE audio_id = ?', id)!.s;
    const status = a.status === 'pending' ? (score >= approvalVotes ? 'approved' : score <= -approvalVotes ? 'rejected' : 'pending') : a.status;
    run('UPDATE audio SET score = ?, status = ? WHERE id = ?', score, status, id);
    res.json({ score, status });
  });

  api.get('/incubator', (_req, res) => {
    const rows = all<{ lang: string; speakers: number; learners: number }>("SELECT lang, SUM(role = 'speaker') AS speakers, SUM(role = 'learner') AS learners FROM incubator GROUP BY lang");
    const words = all<{ course_id: string; n: number }>("SELECT course_id, COUNT(*) AS n FROM suggestions WHERE kind = 'new' GROUP BY course_id");
    const langs = new Set([...rows.map((r) => r.lang), ...words.map((w) => w.course_id)]);
    res.json([...langs].map((lang) => ({ lang, speakers: rows.find((r) => r.lang === lang)?.speakers ?? 0, learners: rows.find((r) => r.lang === lang)?.learners ?? 0, words: words.find((w) => w.course_id === lang)?.n ?? 0 })));
  });
  api.post('/incubator/:lang', auth(true), (req: Req, res) => {
    const lang = String(req.params.lang);
    if (!COURSE_RE.test(lang)) return res.status(400).json({ error: 'Unknown language.' });
    const role = req.body?.role === 'speaker' ? 'speaker' : 'learner';
    run('INSERT INTO incubator (lang, user_id, role) VALUES (?, ?, ?) ON CONFLICT DO UPDATE SET role = excluded.role', lang, req.user!.id, role);
    res.status(201).json({ ok: true });
  });

  app.use('/api', api);
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

  if (opts.clientDir && existsSync(opts.clientDir)) {
    app.use(express.static(opts.clientDir, {
      index: 'index.html',
      setHeaders: (res, path) => {
        if (path.includes('/assets/')) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        else res.setHeader('Cache-Control', 'no-cache');
      },
    }));
    app.get('*', (_req, res) => res.sendFile(join(opts.clientDir!, 'index.html')));
  }

  app.use((err: Error & { status?: number; type?: string }, _req: Request, res: Response, _next: NextFunction) => {
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request too large.' });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON.' });
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  });
  return app;
}
