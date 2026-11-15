export type CourseId = 'sw' | 'ki' | 'luo' | 'kln' | 'mas' | 'sheng';
export type BaseLang = 'en' | 'sw';

interface ItemBase {
  id: string;
  /** Target-language text. */
  t: string;
  /** English gloss / translation. */
  en: string;
  /** Kiswahili gloss (lets non-Swahili courses be learned from Kiswahili). */
  sw?: string;
  /** Alternative accepted target-language answers. */
  alts?: string[];
  enAlts?: string[];
  swAlts?: string[];
  note?: string;
}
export interface Word extends ItemBase { kind: 'word'; emoji?: string }
export interface Sentence extends ItemBase { kind: 'sentence' }
export type Item = Word | Sentence;

/** A scripted exchange: someone says `say`; the learner picks the right `reply`. */
export interface Chat {
  id: string;
  say: string;
  sayEn: string;
  reply: string;
  replyEn: string;
  wrong: string[];
  why: string;
}

export interface Lesson { id: string; title: string; words: Word[]; sentences: Sentence[]; chats: Chat[] }
export interface GuideSection { title: string; body: string }
export interface Unit {
  id: string;
  index: number;
  title: string;
  titleEn: string;
  icon: string;
  color: string;
  description: string;
  guide: GuideSection[];
  lessons: Lesson[];
}
export interface StoryLine { type: 'line'; speaker: string; t: string; en: string }
export interface StoryQuestion { type: 'q'; q: string; options: string[]; answer: number }
export interface Story {
  id: string;
  title: string;
  titleEn: string;
  icon: string;
  /** Unit index (0-based) that must be finished before the story unlocks. */
  afterUnit: number;
  parts: (StoryLine | StoryQuestion)[];
}
export interface Proverb { t: string; literal: string; meaning: string }
export interface SoundEntry { sym: string; sound: string; example: string; exampleEn: string }

export interface CourseMeta {
  id: CourseId;
  name: string;
  nativeName: string;
  tagline: string;
  region: string;
  community: string;
  status: 'stable' | 'beta';
  icon: string;
  color: string;
  /** BCP-47 prefix for text-to-speech voices, when a voice can read this language. */
  ttsLang?: string;
  /** BCP-47 tag for speech recognition, when supported. */
  speechLang?: string;
  specialChars?: string[];
  learnFrom: BaseLang[];
  /** Grammar helper used for automatic word breakdowns. */
  morphology?: 'swahili';
}

export interface Course extends CourseMeta {
  units: Unit[];
  stories: Story[];
  proverbs: Proverb[];
  sounds: SoundEntry[];
  culture: GuideSection[];
  /** Extra tap-for-meaning hints: token -> English (or [English, Kiswahili]). */
  hints: Record<string, string | [string, string]>;
}
