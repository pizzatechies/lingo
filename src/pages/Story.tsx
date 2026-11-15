import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAudioAvailable, useCourse } from '../hooks';
import { useApp, type Summary } from '../state/store';
import { lexiconFor } from '../lib/lexicon';
import { sfx, speak } from '../lib/audio';
import { HintText } from '../components/HintText';
import { Bar, Confetti } from '../components/ui';
import { Mascot } from '../components/Mascot';

export default function Story() {
  const { id } = useParams();
  const course = useCourse();
  const audio = useAudioAvailable(course);
  const app = useApp();
  const nav = useNavigate();
  const story = course?.stories.find((s) => s.id === id);
  const [shown, setShown] = useState(1);
  const [picked, setPicked] = useState<Record<number, number>>({});
  const [showEn, setShowEn] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const lex = useMemo(() => (course ? lexiconFor(course, app.courses[course.id]!.base) : null), [course, app.courses]);
  const part = story?.parts[shown - 1];
  useEffect(() => { if (part?.type === 'line' && audio) speak(part.t, course!.ttsLang); }, [shown]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!course || !story || !lex) return <div className="spinner" />;
  const blocked = part?.type === 'q' && picked[shown - 1] !== part.answer;
  const done = shown >= story.parts.length && !blocked;
  const qs = story.parts.filter((p) => p.type === 'q').length;
  const firstTry = Object.entries(picked).length;

  if (summary) {
    return (
      <div className="session"><Confetti /><div className="done-screen">
        <Mascot mood="cheer" size={140} /><h1>Story complete!</h1>
        <div className="tiles3"><div className="tile-stat"><div className="lbl">XP</div><div className="val">+{summary.xp}</div></div><div className="tile-stat" style={{ ['--c' as string]: 'var(--accent)' }}><div className="lbl">Beads</div><div className="val">+{summary.beads}</div></div><div className="tile-stat" style={{ ['--c' as string]: 'var(--success)' }}><div className="lbl">Questions</div><div className="val">{qs}</div></div></div>
        <button className="btn block" onClick={() => nav('/explore/stories')}>Continue</button>
      </div></div>
    );
  }
  return (
    <div className="session">
      <div className="session-top"><button className="icon-btn" onClick={() => nav('/explore/stories')} aria-label="Close">✕</button><Bar value={shown / story.parts.length} /><button className="btn soft small" onClick={() => setShowEn(!showEn)}>{showEn ? 'Hide' : 'Show'} English</button></div>
      <div className="session-body stack">
        <div className="center"><div style={{ fontSize: '3rem' }}>{story.icon}</div><h2>{story.title}</h2><div className="muted">{story.titleEn}</div></div>
        {story.parts.slice(0, shown).map((p, i) => p.type === 'line' ? (
          <div key={i} className="story-line">
            <button className="icon-btn" onClick={() => speak(p.t, course.ttsLang)} aria-label="Play" disabled={!audio}>{audio ? '🔊' : '💬'}</button>
            <div><div className="who">{p.speaker}</div><div style={{ fontSize: '1.1rem' }}><HintText text={p.t} lex={lex} /></div>{showEn && <div className="small muted">{p.en}</div>}</div>
          </div>
        ) : (
          <div key={i} className="card story-line" style={{ display: 'block' }}>
            <b>❓ {p.q}</b>
            <div className="options" style={{ marginTop: '.6rem' }}>
              {p.options.map((o, j) => (
                <button key={j} className={`option ${picked[i] === j ? (j === p.answer ? 'ok' : 'bad') : ''}`} disabled={picked[i] === p.answer}
                  onClick={() => { setPicked({ ...picked, [i]: j }); if (app.settings.sound) (j === p.answer ? sfx.correct : sfx.wrong)(); }}>{o}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="footer"><div className="inner"><span className="small muted">{firstTry}/{qs} questions answered</span>
        {done ? <button className="btn success" onClick={() => setSummary(app.completeSession({ kind: 'story', courseId: course.id, storyId: story.id, correct: qs, total: qs, maxCombo: 0, newWords: 0, listens: 0 }))}>Finish</button>
          : <button className="btn" disabled={blocked} onClick={() => setShown(shown + 1)}>Continue</button>}
      </div></div>
    </div>
  );
}
