import { hashString, seeded, shuffle } from './rng';

export type QuestKind = 'xp' | 'lessons' | 'perfect' | 'combo' | 'review' | 'story' | 'newWords' | 'listen';
export interface Quest { id: string; kind: QuestKind; target: number; progress: number; reward: number; claimed: boolean }
export interface QuestDay { date: string; quests: Quest[] }

const POOL: { kind: QuestKind; targets: number[]; reward: number; needsAudio?: boolean }[] = [
  { kind: 'lessons', targets: [2, 3], reward: 10 },
  { kind: 'perfect', targets: [1], reward: 15 },
  { kind: 'combo', targets: [8, 10, 12], reward: 10 },
  { kind: 'review', targets: [8, 12], reward: 10 },
  { kind: 'story', targets: [1], reward: 15 },
  { kind: 'newWords', targets: [5, 8], reward: 10 },
  { kind: 'listen', targets: [3, 5], reward: 10, needsAudio: true },
];

/** Three quests per day, deterministic for the date. The first is always an XP goal. */
export function questsFor(date: string, dailyGoal: number, audio: boolean): QuestDay {
  const rng = seeded(hashString(date));
  const pool = shuffle(POOL.filter((p) => audio || !p.needsAudio), rng).slice(0, 2);
  const quests: Quest[] = [{ id: `${date}-xp`, kind: 'xp', target: Math.round(dailyGoal * 1.5), progress: 0, reward: 10, claimed: false }];
  for (const p of pool) quests.push({ id: `${date}-${p.kind}`, kind: p.kind, target: p.targets[Math.floor(rng() * p.targets.length)], progress: 0, reward: p.reward, claimed: false });
  return { date, quests };
}

export const questLabel = (q: Quest) => ({
  xp: `Earn ${q.target} XP`,
  lessons: `Complete ${q.target} lessons`,
  perfect: 'Finish a lesson with no mistakes',
  combo: `Get ${q.target} answers right in a row`,
  review: `Review ${q.target} words in Practice`,
  story: 'Read a story',
  newWords: `Learn ${q.target} new words`,
  listen: `Complete ${q.target} listening exercises`,
}[q.kind]);
