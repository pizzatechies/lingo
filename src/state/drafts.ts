import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Translations } from '../content/community';

/** A contributor's own translations, saved on the device until submitted. */
interface DraftState {
  drafts: Record<string, Translations>;
  submitted: Record<string, Record<string, string>>;
  setItem: (lang: string, sourceId: string, t: string, note?: string) => void;
  merge: (lang: string, tr: Translations) => void;
  markSubmitted: (lang: string, tr: Translations) => void;
}

const storage = createJSONStorage(() => ({
  getItem: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  setItem: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
  removeItem: (k: string) => { try { localStorage.removeItem(k); } catch { /* ignore */ } },
}));

export const useDrafts = create<DraftState>()(persist((set) => ({
  drafts: {},
  submitted: {},
  setItem: (lang, sourceId, t, note) => set((s) => {
    const cur = { ...(s.drafts[lang] ?? {}) };
    if (!t.trim() && !note?.trim()) delete cur[sourceId];
    else cur[sourceId] = { t, ...(note?.trim() ? { note } : {}) };
    return { drafts: { ...s.drafts, [lang]: cur } };
  }),
  merge: (lang, tr) => set((s) => ({ drafts: { ...s.drafts, [lang]: { ...(s.drafts[lang] ?? {}), ...tr } } })),
  markSubmitted: (lang, tr) => set((s) => ({ submitted: { ...s.submitted, [lang]: { ...(s.submitted[lang] ?? {}), ...Object.fromEntries(Object.entries(tr).map(([k, v]) => [k, v.t])) } } })),
}), { name: 'lugha-drafts', storage }));

/** Drafts not yet sent (or changed since sending). */
export const unsent = (s: DraftState, lang: string): Translations =>
  Object.fromEntries(Object.entries(s.drafts[lang] ?? {}).filter(([k, v]) => v.t.trim() && s.submitted[lang]?.[k] !== v.t));
