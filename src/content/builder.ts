import type { Chat, Course, CourseMeta, GuideSection, Lesson, Proverb, Sentence, SoundEntry, Story, StoryLine, StoryQuestion, Unit, Word } from './types';

/** Compact authoring helpers. IDs are derived from the text so progress survives content edits elsewhere. */
type Extra = Partial<Pick<Word, 'sw' | 'alts' | 'enAlts' | 'swAlts' | 'note'>>;
export type WordIn = Omit<Word, 'id'>;
export type SentenceIn = Omit<Sentence, 'id'>;
export type ChatIn = Omit<Chat, 'id'>;

export const slug = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const w = (t: string, en: string, emoji?: string, extra: Extra = {}): WordIn => ({ kind: 'word', t, en, emoji, ...extra });
export const s = (t: string, en: string, extra: Extra = {}): SentenceIn => ({ kind: 'sentence', t, en, ...extra });
export const chat = (say: string, sayEn: string, reply: string, replyEn: string, wrong: string[], why: string): ChatIn => ({ say, sayEn, reply, replyEn, wrong, why });
export const line = (speaker: string, t: string, en: string): StoryLine => ({ type: 'line', speaker, t, en });
export const q = (question: string, options: string[], answer = 0): StoryQuestion => ({ type: 'q', q: question, options, answer });
export const g = (title: string, body: string): GuideSection => ({ title, body });

export interface LessonIn { title: string; items: (WordIn | SentenceIn)[]; chats?: ChatIn[] }
export const lesson = (title: string, items: (WordIn | SentenceIn)[], chats: ChatIn[] = []): LessonIn => ({ title, items, chats });

export interface UnitIn { title: string; titleEn: string; icon: string; description: string; lessons: LessonIn[]; guide: GuideSection[] }
export const unit = (title: string, titleEn: string, icon: string, description: string, guide: GuideSection[], lessons: LessonIn[]): UnitIn => ({ title, titleEn, icon, description, guide, lessons });

export const UNIT_COLORS = ['#D7263D', '#1B6CA8', '#2E8B57', '#E08E0B', '#D9541E', '#7B4BA0', '#0F7C80', '#C2457A', '#8B5A2B', '#233D6E', '#5E7F1F', '#A4307A'];

export interface CourseIn {
  meta: CourseMeta;
  units: UnitIn[];
  stories?: Omit<Story, 'id'>[];
  proverbs?: Proverb[];
  sounds?: SoundEntry[];
  culture?: GuideSection[];
  hints?: Course['hints'];
}

export function defineCourse(c: CourseIn): Course {
  const id = c.meta.id;
  const units: Unit[] = c.units.map((u, ui) => ({
    id: `${id}.u${ui + 1}`,
    index: ui,
    title: u.title,
    titleEn: u.titleEn,
    icon: u.icon,
    color: UNIT_COLORS[ui % UNIT_COLORS.length],
    description: u.description,
    guide: u.guide,
    lessons: u.lessons.map((l, li): Lesson => ({
      id: `${id}.u${ui + 1}.l${li + 1}`,
      title: l.title,
      words: l.items.filter((x): x is WordIn => x.kind === 'word').map((x) => ({ ...x, id: `${id}.w.${slug(x.t)}` })),
      sentences: l.items.filter((x): x is SentenceIn => x.kind === 'sentence').map((x) => ({ ...x, id: `${id}.s.${slug(x.t)}` })),
      chats: (l.chats ?? []).map((x) => ({ ...x, id: `${id}.c.${slug(x.say)}.${slug(x.reply)}` })),
    })),
  }));
  return {
    ...c.meta,
    units,
    stories: (c.stories ?? []).map((st, i) => ({ ...st, id: `${id}.st${i + 1}` })),
    proverbs: c.proverbs ?? [],
    sounds: c.sounds ?? [],
    culture: c.culture ?? [],
    hints: c.hints ?? {},
  };
}
