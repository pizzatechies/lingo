export interface Stats {
  lessons: number; perfect: number; xp: number; stories: number; reviews: number; words: number;
  correct: number; answered: number; courses: number; longestStreak: number; contributions: number; recordings: number;
  mastered: number; nightOwl: boolean; earlyBird: boolean; speed: number;
}
export interface Achievement { id: string; icon: string; name: string; desc: string; test: (s: Stats) => boolean; reward: number }

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first', icon: '🌱', name: 'Hatua ya Kwanza', desc: 'Complete your first lesson', test: (s) => s.lessons >= 1, reward: 10 },
  { id: 'lessons25', icon: '📗', name: 'Mwanafunzi', desc: 'Complete 25 lessons', test: (s) => s.lessons >= 25, reward: 30 },
  { id: 'lessons100', icon: '🎓', name: 'Msomi', desc: 'Complete 100 lessons', test: (s) => s.lessons >= 100, reward: 100 },
  { id: 'streak3', icon: '🔥', name: 'Moto', desc: 'Reach a 3-day streak', test: (s) => s.longestStreak >= 3, reward: 10 },
  { id: 'streak7', icon: '🌋', name: 'Wiki Nzima', desc: 'Reach a 7-day streak', test: (s) => s.longestStreak >= 7, reward: 30 },
  { id: 'streak30', icon: '☀️', name: 'Mwezi Mzima', desc: 'Reach a 30-day streak', test: (s) => s.longestStreak >= 30, reward: 100 },
  { id: 'perfect5', icon: '💎', name: 'Bila Makosa', desc: 'Finish 5 lessons with no mistakes', test: (s) => s.perfect >= 5, reward: 30 },
  { id: 'xp1000', icon: '🦁', name: 'Simba', desc: 'Earn 1,000 XP', test: (s) => s.xp >= 1000, reward: 50 },
  { id: 'words50', icon: '📚', name: 'Kamusi', desc: 'Learn 50 words', test: (s) => s.words >= 50, reward: 30 },
  { id: 'words150', icon: '🗂️', name: 'Maktaba', desc: 'Learn 150 words', test: (s) => s.words >= 150, reward: 80 },
  { id: 'stories3', icon: '📖', name: 'Msimulizi', desc: 'Read 3 stories', test: (s) => s.stories >= 3, reward: 30 },
  { id: 'review10', icon: '🧠', name: 'Kumbukumbu', desc: 'Complete 10 practice sessions', test: (s) => s.reviews >= 10, reward: 30 },
  { id: 'polyglot', icon: '🌍', name: 'Mtaalamu wa Lugha', desc: 'Start 3 languages', test: (s) => s.courses >= 3, reward: 30 },
  { id: 'gold', icon: '👑', name: 'Dhahabu', desc: 'Earn gold on a unit (mastery challenge)', test: (s) => s.mastered >= 1, reward: 50 },
  { id: 'helper', icon: '🤝', name: 'Harambee', desc: 'Suggest a fix or record audio for the community', test: (s) => s.contributions + s.recordings >= 1, reward: 30 },
  { id: 'night', icon: '🦉', name: 'Bundi', desc: 'Practise after 10 p.m.', test: (s) => s.nightOwl, reward: 10 },
  { id: 'early', icon: '🐓', name: 'Jogoo', desc: 'Practise before 7 a.m.', test: (s) => s.earlyBird, reward: 10 },
  { id: 'speed', icon: '⚡', name: 'Mbio', desc: 'Match 15 pairs in one speed round', test: (s) => s.speed >= 15, reward: 20 },
];
