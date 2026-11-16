import type { Course } from '../content/types';
import { sourceItems, type Translations } from '../content/community';
import { parseCsv, toCsv } from './csv';

export const WORKSHEET_HEADER = ['source_id', 'unit', 'lesson', 'type', 'english', 'kiswahili', 'emoji', 'translation', 'notes'];

/** A spreadsheet translators fill in: one row per word or phrase of the Kiswahili course. */
export function worksheetCsv(sw: Course, existing: Translations = {}) {
  const rows = sourceItems(sw).map(({ unit, lesson, item }) => [
    item.id, `${unit.index + 1}. ${unit.titleEn}`, lesson.title, item.kind, item.en, item.t, item.kind === 'word' ? item.emoji ?? '' : '',
    existing[item.id]?.t ?? '', existing[item.id]?.note ?? '',
  ]);
  return toCsv([WORKSHEET_HEADER, ...rows]);
}

/** Reads a filled-in worksheet. Rows without a translation are skipped. */
export function readWorksheet(text: string): Translations {
  const rows = parseCsv(text);
  if (!rows.length) return {};
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const id = head.indexOf('source_id'), tr = head.indexOf('translation'), notes = head.indexOf('notes');
  if (id < 0 || tr < 0) throw new Error('The sheet needs "source_id" and "translation" columns.');
  const out: Translations = {};
  for (const r of rows.slice(1)) {
    const t = (r[tr] ?? '').trim();
    if (!r[id] || !t) continue;
    const parts = t.split('|').map((x) => x.trim()).filter(Boolean); // "main | alternative | alternative"
    out[r[id].trim()] = { t: parts[0], ...(parts.length > 1 ? { alts: parts.slice(1) } : {}), ...(notes >= 0 && r[notes]?.trim() ? { note: r[notes].trim() } : {}) };
  }
  return out;
}
