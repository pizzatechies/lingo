import { metaOf } from '../content';
import { totalXp, useApp, wordsLearned } from '../state/store';
import { api } from './api';

export interface ProgressData { streak: number; xp: number; words: number; lessons: number; course: string; courseIcon: string; title?: string; icon?: string; accuracy?: number }

/** A snapshot of the learner's progress for a community post or an outside share. */
export function progressData(extra: Partial<ProgressData> = {}): ProgressData {
  const s = useApp.getState();
  const meta = s.active ? metaOf(s.active) : null;
  return { streak: s.streak.current, xp: totalXp(s), words: wordsLearned(s.srs), lessons: s.stats.lessons, course: meta?.name ?? '', courseIcon: meta?.icon ?? '🌍', ...extra };
}

export function progressText(d: ProgressData, note = '') {
  const lines = [note || `I'm learning ${d.course} on Lugha Zetu!`, `🔥 ${d.streak}-day streak · ⚡ ${d.xp} XP · 📚 ${d.words} words`, 'Learn Kenyan languages free: Lugha Zetu by Pizza Technologies'];
  return lines.join('\n');
}

/** Post to the Lugha Zetu community feed (needs an account and the server). */
export async function postProgress(body: string, data: ProgressData | null, kind: 'progress' | 'text' | 'milestone' = data ? 'progress' : 'text') {
  return api('/feed', { body: { kind, body, data } });
}

/** Share outside the app (WhatsApp, SMS…) via the share sheet, or copy to the clipboard. */
export async function shareOutside(text: string): Promise<'shared' | 'copied' | 'failed'> {
  try {
    if (navigator.share) { await navigator.share({ text, title: 'Lugha Zetu' }); return 'shared'; }
  } catch (e) { if ((e as Error).name === 'AbortError') return 'failed'; }
  try { await navigator.clipboard.writeText(text); return 'copied'; } catch { return 'failed'; }
}

export function timeAgo(t: number) {
  const s = Math.max(1, Math.round((Date.now() - t) / 1000));
  if (s < 60) return 'just now';
  const m = Math.round(s / 60); if (m < 60) return `${m}m`;
  const h = Math.round(m / 60); if (h < 24) return `${h}h`;
  const d = Math.round(h / 24); return d < 7 ? `${d}d` : new Date(t).toLocaleDateString();
}
