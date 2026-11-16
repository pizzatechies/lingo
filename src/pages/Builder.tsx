import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { cachedTranslations, isBuiltIn, loadCourse, setPreviewDrafts } from '../content';
import { MIN_LESSON_ITEMS, sourceItems, translationProgress, type Translations } from '../content/community';
import { LANGUAGES, languageById, type Family } from '../content/languages';
import type { Course } from '../content/types';
import { fetchLanguageProgress, refreshLanguage, submitTranslations, useServer, type LangProgress } from '../lib/api';
import { readWorksheet, worksheetCsv } from '../lib/worksheet';
import { unsent, useDrafts } from '../state/drafts';
import { useApp } from '../state/store';
import { Bar } from '../components/ui';
import { Mascot } from '../components/Mascot';
import { AccountForm } from './Account';

const FAMILIES: Family[] = ['Bantu', 'Nilotic', 'Cushitic', 'Other'];

function saveFile(name: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const file = new File([blob], name, { type });
  // Mobile apps can't follow download links, so prefer the share sheet when it can carry files.
  if (navigator.canShare?.({ files: [file] })) { navigator.share({ files: [file], title: name }).catch(() => {}); return; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** Pick a language to help build. */
export function LanguageList({ progress }: { progress: LangProgress[] }) {
  const drafts = useDrafts((s) => s.drafts);
  return (
    <div className="stack">
      {FAMILIES.map((f) => (
        <div key={f}>
          <h3 style={{ margin: '.6rem 0 .4rem' }}>{f} languages</h3>
          <div className="list">
            {LANGUAGES.filter((l) => l.family === f).map((l) => {
              const p = progress.find((x) => x.lang === l.id);
              const mine = Object.keys(drafts[l.id] ?? {}).length;
              return (
                <Link key={l.id} to={l.course ? '/courses' : `/build/${l.id}`} className="list-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="grow"><b>{l.name}</b><div className="small muted">{l.region}{l.community ? ` · ${l.community}` : ''}</div></div>
                  <span className={`chip ${l.course ? 'stable' : p?.approved ? 'beta' : ''}`}>
                    {l.course ? 'Course available' : p?.approved ? `${p.approved} approved` : mine ? `${mine} in your drafts` : 'Needs translators'}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Builder() {
  const { lang } = useParams();
  const nav = useNavigate();
  const { online, user } = useServer();
  const [sw, setSw] = useState<Course | null>(null);
  const [progress, setProgress] = useState<LangProgress[]>([]);
  const [approved, setApproved] = useState<Translations>({});
  const [unitIdx, setUnitIdx] = useState(0);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const drafts = useDrafts();
  const app = useApp();
  const meta = lang ? languageById(lang) : undefined;

  useEffect(() => { loadCourse('sw').then(setSw); }, []);
  useEffect(() => { if (online) fetchLanguageProgress().then(setProgress).catch(() => {}); }, [online]);
  useEffect(() => {
    if (!lang) return;
    setApproved(cachedTranslations(lang));
    if (online) refreshLanguage(lang).then(setApproved).catch(() => {});
  }, [lang, online]);

  const mine = (lang && drafts.drafts[lang]) || {};
  const merged = useMemo(() => ({ ...approved, ...mine }), [approved, mine]);
  const pending = lang ? unsent(drafts, lang) : {};
  const stats = sw ? translationProgress(sw, merged) : { done: 0, total: 0 };

  if (!lang || !meta) {
    return (
      <>
        <div className="row" style={{ marginTop: '1rem' }}><Mascot mood="cheer" size={80} /><div><h1 style={{ margin: 0 }}>Build a course</h1><div className="small muted">Every Kenyan language deserves a course. Native speakers build them here.</div></div></div>
        <div className="notice info" style={{ margin: '1rem 0' }}>Translate the words and phrases of the Kiswahili course into your language. Once a lesson has {MIN_LESSON_ITEMS} approved translations it becomes playable for everyone.</div>
        <LanguageList progress={progress} />
      </>
    );
  }
  if (isBuiltIn(lang)) return <div className="empty"><p>{meta.name} already has a course.</p><Link className="btn" to="/courses">Open it</Link></div>;
  if (!sw) return <div className="spinner" />;

  const unit = sw.units[unitIdx];
  const items = sourceItems(sw).filter((x) => x.unit.id === unit.id);
  const preview = () => {
    setPreviewDrafts(lang, merged);
    if (!app.courses[lang]) app.startCourse(lang, 'en'); else app.setActive(lang);
    nav('/');
  };
  const submit = async () => {
    setBusy(true); setMsg('');
    try { const n = await submitTranslations(lang, pending); drafts.markSubmitted(lang, pending); setMsg(`Sent ${n} translations for review. Asante!`); app.addReport({ courseId: lang, itemId: 'translations', kind: 'other', text: `${n} translations`, note: 'course builder' }); }
    catch { setMsg('Could not send — check your connection and try again.'); }
    finally { setBusy(false); }
  };
  const upload = async (f: File) => {
    try { const tr = readWorksheet(await f.text()); drafts.merge(lang, tr); setMsg(`Loaded ${Object.keys(tr).length} translations from ${f.name}.`); }
    catch (e) { setMsg(e instanceof Error ? e.message : 'Could not read that file.'); }
  };

  return (
    <>
      <Link to="/build" className="icon-btn" style={{ marginTop: '.8rem' }}>← All languages</Link>
      <h1>{meta.name}</h1>
      <p className="muted small">{meta.family} · {meta.region}{meta.community ? ` · ${meta.community}` : ''}</p>
      {meta.note && <div className="notice" style={{ marginBottom: '.8rem' }}>{meta.note}</div>}
      <div className="card">
        <div className="row between"><b>Course progress</b><span className="small muted">{stats.done} / {stats.total} words & phrases</span></div>
        <Bar value={stats.total ? stats.done / stats.total : 0} />
        <div className="row wrap" style={{ marginTop: '.8rem' }}>
          <button className="btn small" onClick={preview} disabled={stats.done < MIN_LESSON_ITEMS}>▶ Preview as lessons</button>
          <button className="btn small soft" onClick={() => saveFile(`lugha-zetu-${lang}-worksheet.csv`, worksheetCsv(sw, merged), 'text/csv')}>⬇ Worksheet (CSV)</button>
          <button className="btn small soft" onClick={() => file.current?.click()}>⬆ Upload worksheet</button>
          <input ref={file} type="file" accept=".csv,text/csv" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ''; }} />
        </div>
        {Object.keys(pending).length > 0 && (
          online && user ? <button className="btn block accent" style={{ marginTop: '.8rem' }} onClick={submit} disabled={busy}>Send {Object.keys(pending).length} translation{Object.keys(pending).length === 1 ? '' : 's'} for review</button>
            : <p className="small muted" style={{ marginTop: '.8rem' }}>{Object.keys(pending).length} translation{Object.keys(pending).length === 1 ? '' : 's'} saved on this device. {online ? 'Sign in below to send them for review.' : 'Connect to the Lugha Zetu server to send them, or share the worksheet with the team.'}</p>
        )}
        {msg && <div className="notice info" style={{ marginTop: '.8rem' }} role="status">{msg}</div>}
      </div>
      {online && !user && Object.keys(pending).length > 0 && <div className="card" style={{ marginTop: '1rem' }}><AccountForm /></div>}

      <div className="row" style={{ margin: '1.2rem 0 .6rem' }}>
        <label htmlFor="unit-pick" className="small muted">Unit</label>
        <select id="unit-pick" className="input" value={unitIdx} onChange={(e) => setUnitIdx(Number(e.target.value))}>
          {sw.units.map((u, i) => {
            const p = translationProgress({ ...sw, units: [u] }, merged);
            return <option key={u.id} value={i}>{i + 1}. {u.titleEn} — {p.done}/{p.total}</option>;
          })}
        </select>
      </div>
      <p className="small muted">Write it the way people really speak. Separate alternatives with “|”, and use the note for dialect or usage.</p>
      <div className="list">
        {items.map(({ item, lesson }, i) => {
          const d = mine[item.id];
          const a = approved[item.id];
          const value = d?.t ?? a?.t ?? '';
          const state = d?.t && drafts.submitted[lang]?.[item.id] === d.t ? 'sent' : d?.t ? 'draft' : a ? 'approved' : '';
          return (
            <div key={item.id} className="list-item" style={{ display: 'block' }}>
              {(i === 0 || items[i - 1].lesson.id !== lesson.id) && <div className="small muted" style={{ fontWeight: 800, marginBottom: '.3rem' }}>{lesson.title}</div>}
              <div className="row between">
                <div><b>{item.kind === 'word' && item.emoji ? `${item.emoji} ` : ''}{item.en}</b><div className="small muted">Kiswahili: {item.t}</div></div>
                {state && <span className={`chip ${state === 'approved' ? 'stable' : 'beta'}`}>{state === 'approved' ? '✓ approved' : state === 'sent' ? '⏳ in review' : '✎ draft'}</span>}
              </div>
              <input className="input" style={{ marginTop: '.4rem' }} value={value} placeholder={`In ${meta.name}…`} aria-label={`${meta.name} for "${item.en}"`}
                onChange={(e) => drafts.setItem(lang, item.id, e.target.value, d?.note)} autoCapitalize="off" spellCheck={false} />
              <input className="input small" style={{ marginTop: '.3rem', fontSize: '.85rem', padding: '.45rem .8rem' }} value={d?.note ?? a?.note ?? ''} placeholder="Note (optional): dialect, usage…"
                aria-label="Note" onChange={(e) => drafts.setItem(lang, item.id, value, e.target.value)} />
            </div>
          );
        })}
      </div>
      <div className="row between" style={{ margin: '1rem 0 2rem' }}>
        <button className="btn soft small" disabled={unitIdx === 0} onClick={() => { setUnitIdx(unitIdx - 1); window.scrollTo(0, 0); }}>← Previous unit</button>
        <button className="btn small" disabled={unitIdx >= sw.units.length - 1} onClick={() => { setUnitIdx(unitIdx + 1); window.scrollTo(0, 0); }}>Next unit →</button>
      </div>
    </>
  );
}
