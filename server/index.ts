import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(process.env.DATA_DIR ?? 'data');
mkdirSync(dataDir, { recursive: true });
const db = new DatabaseSync(join(dataDir, 'lugha.db'));
db.exec('PRAGMA journal_mode = WAL;');

const app = createApp({
  db,
  dataDir,
  moderators: (process.env.MODERATORS ?? '').split(',').map((s) => s.trim()).filter(Boolean),
  approvalVotes: Number(process.env.APPROVAL_VOTES ?? 3),
  // Built client lives next to the compiled server (dist/client) — or pass CLIENT_DIR.
  clientDir: process.env.CLIENT_DIR ?? resolve(here, '../client'),
});
const port = Number(process.env.PORT ?? 8787);
app.listen(port, () => console.log(`Lugha server on http://localhost:${port} (data: ${dataDir})`));
