import { useEffect } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import type { Course } from '../content/types';
import { useApp } from '../state/store';
import { addDays, dayKey } from './dates';
import { hashString } from './rng';

/** Native bridge to the iOS home-screen and lock-screen widgets (see ios/App/App/WidgetBridgePlugin.swift). */
interface WidgetBridge { update(o: { json: string }): Promise<void> }
const bridge = registerPlugin<WidgetBridge>('WidgetBridge');
const enabled = () => Capacitor.getPlatform() === 'ios';

/** The same "word of the day" the Learn page shows, for today and the next 6 days. */
export function widgetPayload(course: Course) {
  const s = useApp.getState();
  const today = dayKey();
  const base = s.courses[course.id]?.base ?? 'en';
  const words = course.units.flatMap((u) => u.lessons.flatMap((l) => l.words)).filter((w) => w.emoji);
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  return {
    streak: s.streak.current,
    practisedToday: s.streak.history[today] === 'active',
    xpToday: s.xpLog[today] ?? 0,
    goal: s.settings.dailyGoal,
    course: course.name,
    updated: today,
    words: days.map((date) => {
      const w = words[hashString(date + course.id) % words.length];
      return { date, t: w.t, gloss: base === 'sw' && w.sw ? w.sw : w.en, emoji: w.emoji ?? null };
    }),
    proverbs: course.proverbs.length ? days.map((date) => {
      const p = course.proverbs[hashString(date) % course.proverbs.length];
      return { date, t: p.t, meaning: p.literal };
    }) : [],
  };
}

/** Keeps the widgets in step with progress: on launch and whenever streak, XP or goal change. */
export function useWidgetSync(course: Course | null) {
  const streak = useApp((s) => s.streak.current);
  const xpToday = useApp((s) => s.xpLog[dayKey()] ?? 0);
  const goal = useApp((s) => s.settings.dailyGoal);
  const base = useApp((s) => (course ? s.courses[course.id]?.base : undefined));
  useEffect(() => {
    if (!course || !enabled()) return;
    const t = setTimeout(() => { bridge.update({ json: JSON.stringify(widgetPayload(course)) }).catch(() => {}); }, 300);
    return () => clearTimeout(t);
  }, [course, streak, xpToday, goal, base]);
}
