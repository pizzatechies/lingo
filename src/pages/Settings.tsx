import { useRef, useState } from 'react';
import { previewFeedback } from '../lib/feedback';
import { Link } from 'react-router-dom';
import { metaOf } from '../content';
import { progressSnapshot, useApp } from '../state/store';
import { Modal, Toggle } from '../components/ui';
import { GOALS } from './Onboarding';
import { loadCourse } from '../content';
import { useCourse } from '../hooks';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function download(name: string, text: string, type: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** A recurring calendar event works as a daily reminder on any phone, with no push server or tracking. */
function reminderIcs(time: string) {
  const [h, m] = time.split(':');
  const d = new Date(); d.setHours(Number(h), Number(m), 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Lugha//Reminder//EN', 'BEGIN:VEVENT', `UID:lugha-${Date.now()}@lugha.app`, `DTSTAMP:${stamp}`, `DTSTART:${stamp}`, 'DURATION:PT10M', 'RRULE:FREQ=DAILY', 'SUMMARY:Lugha Zetu — time to practise', 'DESCRIPTION:Keep your streak alive with a quick lesson.', 'BEGIN:VALARM', 'TRIGGER:PT0M', 'ACTION:DISPLAY', 'DESCRIPTION:Lugha Zetu practice', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
}

export default function Settings() {
  const s = useApp();
  const course = useCourse();
  const set = s.updateSettings;
  const [time, setTime] = useState('19:00');
  const [confirmReset, setConfirmReset] = useState(false);
  const [msg, setMsg] = useState('');
  const file = useRef<HTMLInputElement>(null);
  const meta = s.active ? metaOf(s.active) : null;
  const cp = s.active ? s.courses[s.active] : undefined;
  return (
    <>
      <h1 style={{ marginTop: '1rem' }}>Settings</h1>
      {msg && <div className="notice info" role="status">{msg}</div>}
      <div className="card" style={{ marginTop: '.8rem' }}>
        <h3>Learning</h3>
        <label className="toggle"><b>Daily goal</b>
          <select className="input" style={{ width: 'auto' }} value={s.settings.dailyGoal} onChange={(e) => set({ dailyGoal: Number(e.target.value) })}>
            {GOALS.map((g) => <option key={g.xp} value={g.xp}>{g.label} · {g.xp} XP</option>)}
          </select>
        </label>
        {meta && cp && meta.learnFrom.length > 1 && (
          <label className="toggle"><b>Learn {meta.name} from</b>
            <select className="input" style={{ width: 'auto' }} value={cp.base} onChange={(e) => s.setBase(meta.id, e.target.value as 'en' | 'sw')}><option value="en">English</option><option value="sw">Kiswahili</option></select>
          </label>
        )}
        <Toggle label="Listening exercises" hint="Needs a voice for the language on this device" checked={s.settings.listening} onChange={(v) => set({ listening: v })} />
        <Toggle label="Speaking exercises" checked={s.settings.speaking} onChange={(v) => set({ speaking: v })} />
        <Toggle label="Hardcore mode" hint="Optional hearts for an extra challenge. Off by default — mistakes never block learning." checked={s.settings.hardcore} onChange={(v) => set({ hardcore: v })} />
      </div>
      <div className="card" style={{ marginTop: '1rem' }}>
        <h3>Streak & days off</h3>
        <p className="small muted">Pick days that never break your streak — for church, Jummah, market day or rest.</p>
        <div className="days" role="group" aria-label="Days off">
          {DAYS.map((d, i) => <button key={i} aria-label={DAY_NAMES[i]} aria-pressed={s.settings.daysOff.includes(i)} onClick={() => set({ daysOff: s.settings.daysOff.includes(i) ? s.settings.daysOff.filter((x) => x !== i) : [...s.settings.daysOff, i].slice(0, 2) })}>{d}</button>)}
        </div>
        <p className="small muted" style={{ marginTop: '.6rem' }}>Up to 2 days a week. You also earn a rest day every 7-day streak (🛌 {s.streak.restDays} banked).</p>
        <div className="row wrap" style={{ marginTop: '.6rem' }}>
          <input type="time" className="input" style={{ width: 'auto' }} value={time} onChange={(e) => setTime(e.target.value)} aria-label="Reminder time" />
          <button className="btn soft small" onClick={() => download('lugha-reminder.ics', reminderIcs(time), 'text/calendar')}>📅 Add daily reminder to my calendar</button>
        </div>
      </div>
      <div className="card" style={{ marginTop: '1rem' }}>
        <h3>App</h3>
        <label className="toggle"><b>Theme</b>
          <select className="input" style={{ width: 'auto' }} value={s.settings.theme} onChange={(e) => set({ theme: e.target.value as 'system' })}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select>
        </label>
        <Toggle label="Sound effects" hint="Marimba-style cues for answers, combos and rewards" checked={s.settings.sound} onChange={(v) => { set({ sound: v }); if (v) setTimeout(previewFeedback, 0); }} />
        <Toggle label="Haptic feedback" hint="Gentle taps and buzzes as you answer (iPhone & Android)" checked={s.settings.haptics} onChange={(v) => { set({ haptics: v }); if (v) setTimeout(previewFeedback, 0); }} />
        <Toggle label="Larger text" checked={s.settings.bigText} onChange={(v) => set({ bigText: v })} />
        <Toggle label="Reduce motion" checked={s.settings.reduceMotion} onChange={(v) => set({ reduceMotion: v })} />
        <Toggle label="Show leagues" hint="Prefer learning without competition? Turn this off." checked={s.settings.showLeagues} onChange={(v) => set({ showLeagues: v })} />
        <label className="toggle"><span><b>Your name</b></span><input className="input" style={{ maxWidth: 200 }} value={s.profile.name} onChange={(e) => s.setName(e.target.value)} maxLength={30} /></label>
      </div>
      <div className="card" style={{ marginTop: '1rem' }}>
        <h3>Offline & data</h3>
        <p className="small muted">Lugha Zetu works offline after the first visit. Your progress lives on this device{s.auth ? ' and syncs to your account' : ''}.</p>
        <div className="stack">
          <button className="btn soft" onClick={async () => { if (course) { await Promise.all((['sw', 'ki', 'luo', 'kln', 'mas', 'sheng'] as const).map(loadCourse)); setMsg('All courses downloaded for offline use.'); } }}>⬇️ Download all courses for offline</button>
          <button className="btn soft" onClick={() => download(`lugha-progress-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(progressSnapshot(s)), 'application/json')}>💾 Export my progress</button>
          <button className="btn soft" onClick={() => file.current?.click()}>📂 Import progress</button>
          <input ref={file} type="file" accept="application/json" hidden onChange={async (e) => {
            const f = e.target.files?.[0]; if (!f) return;
            try { const data = JSON.parse(await f.text()); if (!data.courses || !data.srs) throw new Error(); s.replaceState(data); setMsg('Progress imported.'); } catch { setMsg('That file does not look like a Lugha export.'); }
          }} />
          <button className="btn ghost" onClick={() => setConfirmReset(true)}>Reset all progress</button>
        </div>
      </div>
      <div className="card center" style={{ marginTop: '1rem' }}>
        <img src="./icons/icon.svg" alt="" width="56" height="56" />
        <h3 style={{ margin: '.4rem 0 .1rem' }}>Lugha Zetu</h3>
        <div className="small muted">Version {__APP_VERSION__}</div>
        <div className="row" style={{ justifyContent: 'center', marginTop: '.8rem' }}>
          <img className="pt-logo" src="./brand/pizza-technologies.jpg" alt="Pizza Technologies logo" width="56" height="56" />
          <div style={{ textAlign: 'left' }}><div className="small muted">Made in Kenya by</div><b>Pizza Technologies</b></div>
        </div>
        <p className="small muted" style={{ margin: '.6rem 0 0' }}>Free & open · <Link to="/community">Help build it</Link></p>
      </div>
      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} label="Reset progress">
        <div className="stack center"><h2>Reset everything?</h2><p className="muted">This deletes all progress on this device. Export first if you might want it back.</p><button className="btn danger" onClick={() => { s.reset(); setConfirmReset(false); }}>Yes, reset</button><button className="btn ghost" onClick={() => setConfirmReset(false)}>Cancel</button></div>
      </Modal>
    </>
  );
}
