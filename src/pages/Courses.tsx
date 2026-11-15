import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { COURSE_META } from '../content';
import type { CourseId } from '../content/types';
import { useApp } from '../state/store';
import { CourseGrid } from './Onboarding';

export default function Courses() {
  const s = useApp();
  const nav = useNavigate();
  const [pick, setPick] = useState<CourseId | null>(s.active);
  const meta = COURSE_META.find((c) => c.id === pick);
  const go = (base: 'en' | 'sw') => { if (!pick) return; if (s.courses[pick]) s.setActive(pick); else s.startCourse(pick, base); nav('/'); };
  return (
    <>
      <h1 style={{ marginTop: '1rem' }}>Your languages</h1>
      <CourseGrid value={pick} onPick={setPick} />
      {meta && (
        <div className="footer" style={{ marginTop: '1rem' }}><div className="inner">
          {s.courses[meta.id] ? <><span className="muted">Continue {meta.name}</span><button className="btn" onClick={() => go('en')}>Switch</button></>
            : meta.learnFrom.length > 1 ? <><button className="btn soft" onClick={() => go('sw')}>Learn from Kiswahili</button><button className="btn" onClick={() => go('en')}>Learn from English</button></>
            : <><span /><button className="btn" onClick={() => go('en')}>Start {meta.name}</button></>}
        </div></div>
      )}
    </>
  );
}
