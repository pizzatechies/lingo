import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { COURSE_META, INCUBATOR } from '../content';
import type { BaseLang, CourseId } from '../content/types';
import { Mascot } from '../components/Mascot';
import { useApp } from '../state/store';

export const GOALS = [
  { xp: 10, label: 'Casual', time: '5 min / day' },
  { xp: 20, label: 'Regular', time: '10 min / day' },
  { xp: 30, label: 'Serious', time: '15 min / day' },
  { xp: 50, label: 'Intense', time: '20+ min / day' },
];
const REASONS = ['👪 Family & heritage', '✈️ Travel', '💼 Work', '🤝 Friends', '🎓 School', '🌍 Culture'];

export function CourseGrid({ value, onPick }: { value: CourseId | null; onPick: (id: CourseId) => void }) {
  return (
    <div className="stack">
      {COURSE_META.map((c) => (
        <button key={c.id} type="button" className="card tap course-card" aria-pressed={value === c.id} onClick={() => onPick(c.id)} style={{ ['--c' as string]: c.color }}>
          <span className="flag" aria-hidden>{c.icon}</span>
          <span className="grow">
            <span className="row between"><b style={{ fontSize: '1.1rem' }}>{c.name}</b><span className={`chip ${c.status}`}>{c.status === 'stable' ? 'Full course' : 'Beta · community review'}</span></span>
            <span className="muted small">{c.tagline} · {c.community}</span>
          </span>
        </button>
      ))}
      <details className="card flat">
        <summary><b>Coming soon: {INCUBATOR.length} more Kenyan languages</b></summary>
        <p className="muted small" style={{ marginTop: '.6rem' }}>{INCUBATOR.map((l) => l.name).join(' · ')}. Native speakers can help build them in the Community tab.</p>
      </details>
    </div>
  );
}

export default function Onboarding() {
  const finish = useApp((s) => s.finishOnboarding);
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [course, setCourse] = useState<CourseId | null>(null);
  const [base, setBase] = useState<BaseLang>('en');
  const [goal, setGoal] = useState(20);
  const [name, setName] = useState('');
  const [reason, setReason] = useState<string | null>(null);
  const meta = COURSE_META.find((c) => c.id === course);
  const steps = ['welcome', 'course', ...(meta && meta.learnFrom.length > 1 ? ['base'] : []), 'reason', 'goal', 'start'];
  const cur = steps[step];
  const next = () => setStep((s) => Math.min(steps.length - 1, s + 1));
  const done = (placement: boolean) => {
    finish({ course: course!, base, goal, name: name.trim() });
    nav(placement ? '/session/placement' : '/');
  };

  return (
    <div className="main" style={{ paddingTop: 'calc(1rem + var(--sat))', paddingBottom: '2rem' }}>
      {step > 0 && <div className="row" style={{ marginBottom: '1rem' }}><button className="icon-btn" onClick={() => setStep(step - 1)} aria-label="Back">←</button><div className="bar grow"><i style={{ width: `${(step / (steps.length - 1)) * 100}%` }} /></div></div>}
      {cur === 'welcome' && (
        <div className="hero">
          <div className="row" style={{ justifyContent: 'center' }}>
            <img src="./icons/icon.svg" alt="" width="44" height="44" />
            <span style={{ fontWeight: 900, fontSize: '1.6rem', color: 'var(--primary)' }}>Lugha Zetu</span>
          </div>
          <p className="small muted" style={{ marginTop: '-.4rem' }}>“Our languages” in Kiswahili</p>
          <Mascot mood="wave" size={150} />
          <h1>Karibu! I'm Twiga.</h1>
          <p className="muted" style={{ maxWidth: 420 }}>Learn Kiswahili, Gĩkũyũ, Dholuo, Kalenjin, Maa and Sheng — free forever, works offline, and built together with native speakers.</p>
          <div className="kikoi" style={{ width: 200 }} />
          <button className="btn block" style={{ maxWidth: 360 }} onClick={next}>Get started</button>
          <p className="small muted">No ads · No paywalls · No account needed</p>
          <p className="small muted row" style={{ marginTop: '1.5rem', justifyContent: 'center' }}><img className="pt-logo" src="./brand/pizza-technologies.jpg" alt="Pizza Technologies logo" width="28" height="28" /><span>by <b>Pizza Technologies</b></span></p>
        </div>
      )}
      {cur === 'course' && (
        <>
          <h1>What do you want to learn?</h1>
          <CourseGrid value={course} onPick={(id) => { setCourse(id); setBase('en'); }} />
          <div className="footer" style={{ marginTop: '1rem' }}><div className="inner"><span /><button className="btn" disabled={!course} onClick={next}>Continue</button></div></div>
        </>
      )}
      {cur === 'base' && (
        <>
          <h1>Learn {meta?.name} from…</h1>
          <p className="muted">Many Kenyans already speak Kiswahili — learn through the language you're most comfortable with.</p>
          <div className="options">
            <button className="option" aria-pressed={base === 'en'} onClick={() => setBase('en')}>🇬🇧 English</button>
            <button className="option" aria-pressed={base === 'sw'} onClick={() => setBase('sw')}>🇰🇪 Kiswahili</button>
          </div>
          <div className="footer" style={{ marginTop: '1rem' }}><div className="inner"><span /><button className="btn" onClick={next}>Continue</button></div></div>
        </>
      )}
      {cur === 'reason' && (
        <>
          <h1>Why are you learning?</h1>
          <div className="grid2">{REASONS.map((r) => <button key={r} className="option" aria-pressed={reason === r} onClick={() => setReason(r)}>{r}</button>)}</div>
          <div className="footer" style={{ marginTop: '1rem' }}><div className="inner"><span /><button className="btn" onClick={next}>{reason ? 'Continue' : 'Skip'}</button></div></div>
        </>
      )}
      {cur === 'goal' && (
        <>
          <h1>Pick a daily goal</h1>
          <p className="muted">You can change it any time. Your streak also lets you schedule days off — like Sundays.</p>
          <div className="options">{GOALS.map((g) => <button key={g.xp} className="option" aria-pressed={goal === g.xp} onClick={() => setGoal(g.xp)}><b className="grow">{g.label}</b><span className="muted">{g.time} · {g.xp} XP</span></button>)}</div>
          <div className="footer" style={{ marginTop: '1rem' }}><div className="inner"><span /><button className="btn" onClick={next}>Continue</button></div></div>
        </>
      )}
      {cur === 'start' && (
        <div className="stack">
          <h1>Last thing: what should I call you?</h1>
          <input className="input" placeholder="Your name (optional)" value={name} onChange={(e) => setName(e.target.value)} maxLength={30} />
          <button className="card tap" onClick={() => done(false)}><b>🌱 Start from scratch</b><br /><span className="muted small">Begin with the very first lesson.</span></button>
          {meta && meta.id === 'sw' && <button className="card tap" onClick={() => done(true)}><b>🧭 I know some already</b><br /><span className="muted small">Take a short placement test and skip what you know.</span></button>}
        </div>
      )}
    </div>
  );
}
