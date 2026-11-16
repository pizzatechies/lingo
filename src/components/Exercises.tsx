import { useEffect, useMemo, useRef, useState } from 'react';
import type { Course } from '../content/types';
import type { Exercise } from '../lib/exercises';
import type { AnswerValue } from '../lib/grade';
import type { Lexicon } from '../lib/lexicon';
import { listenOnce, recognitionSupported, recordingSupported, speak, startRecording } from '../lib/audio';
import { feedback } from '../lib/feedback';
import { HintText } from './HintText';
import { Mascot } from './Mascot';
import { shuffle } from '../lib/rng';

export interface ExProps<T extends Exercise['type']> {
  ex: Extract<Exercise, { type: T }>;
  course: Course;
  lex: Lexicon;
  value: AnswerValue | null;
  onChange: (v: AnswerValue | null) => void;
  locked: boolean;
  audio: boolean;
  noHints?: boolean;
}

const SpeakBtn = ({ text, course, audio, big }: { text: string; course: Course; audio: boolean; big?: boolean }) =>
  audio ? (
    big ? (
      <div className="row" style={{ justifyContent: 'center', gap: '1rem', margin: '1rem 0 1.5rem' }}>
        <button type="button" className="big-play" aria-label="Play audio" onClick={() => speak(text, course.ttsLang)}>🔊</button>
        <button type="button" className="slow-play" aria-label="Play slowly" onClick={() => speak(text, course.ttsLang, true)}>🐢</button>
      </div>
    ) : <button type="button" className="icon-btn" aria-label="Play audio" onClick={() => speak(text, course.ttsLang)}>🔊</button>
  ) : null;

function Prompt({ text, target, course, lex, audio, noHints }: { text: string; target: boolean; course: Course; lex: Lexicon; audio: boolean; noHints?: boolean }) {
  useEffect(() => { if (target && audio) speak(text, course.ttsLang); }, [text]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="prompt">
      <Mascot size={70} mood="think" />
      <div className="bubble">
        {target && <SpeakBtn text={text} course={course} audio={audio} />} {target ? <HintText text={text} lex={lex} disabled={noHints} /> : text}
      </div>
    </div>
  );
}

/** Number keys 1–9 pick options. */
function useNumberKeys(n: number, locked: boolean, pickIdx: (i: number) => void) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (locked || (e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return;
      const i = Number(e.key) - 1;
      if (i >= 0 && i < n) { feedback.select(); pickIdx(i); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [n, locked, pickIdx]);
}

export function IntroEx({ ex, course, audio }: { ex: Extract<Exercise, { type: 'intro' }>; course: Course; audio: boolean }) {
  useEffect(() => { if (audio) speak(ex.word.t, course.ttsLang); }, [ex.key]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="card intro-card">
      <div className="chip">✨ New word</div>
      {ex.word.emoji && <div className="em" aria-hidden>{ex.word.emoji}</div>}
      <div className="word">{ex.word.t} <SpeakBtn text={ex.word.t} course={course} audio={audio} /></div>
      <div style={{ fontSize: '1.2rem' }}>{ex.word.en}{ex.word.sw && ex.word.sw !== ex.word.en ? <span className="muted"> · {ex.word.sw}</span> : null}</div>
      {ex.word.note && <p className="muted small" style={{ marginTop: '.8rem' }}>💡 {ex.word.note}</p>}
      {!audio && <p className="muted small" style={{ marginTop: '.8rem' }}>No native audio yet — you can record this word in Community.</p>}
    </div>
  );
}

export function ChoiceEx({ ex, course, lex, value, onChange, locked, audio, noHints }: ExProps<'choice'>) {
  useNumberKeys(ex.options.length, locked, (i) => onChange(i));
  return (
    <>
      <div className="instr">{ex.promptTarget ? 'What does this mean?' : 'How do you say this?'}</div>
      <Prompt text={ex.prompt} target={ex.promptTarget} course={course} lex={lex} audio={audio} noHints={noHints} />
      <div className="options" role="group">
        {ex.options.map((o, i) => (
          <button key={i} type="button" className={`option ${locked && i === ex.correct ? 'ok' : ''} ${locked && value === i && i !== ex.correct ? 'bad' : ''}`} aria-pressed={value === i} disabled={locked}
            onClick={() => { feedback.select(); onChange(i); if (!ex.promptTarget && audio) speak(o, course.ttsLang); }}>
            <span className="num">{i + 1}</span>{o}
          </button>
        ))}
      </div>
    </>
  );
}

export function PictureEx({ ex, course, value, onChange, locked, audio }: ExProps<'picture'>) {
  useNumberKeys(ex.options.length, locked, (i) => onChange(i));
  return (
    <>
      <div className="instr">Which one is “{ex.prompt}”?</div>
      <div className="pics" role="group">
        {ex.options.map((o, i) => (
          <button key={i} type="button" className={`pic ${locked && i === ex.correct ? 'ok' : ''}`} aria-pressed={value === i} disabled={locked}
            onClick={() => { feedback.select(); onChange(i); if (audio) speak(o.text, course.ttsLang); }}>
            <span className="em" aria-hidden>{o.emoji}</span>{o.text}
          </button>
        ))}
      </div>
    </>
  );
}

export function MatchEx({ ex, course, audio, onDone }: { ex: Extract<Exercise, { type: 'match' }>; course: Course; audio: boolean; onDone: (mistakes: string[]) => void }) {
  const rights = useMemo(() => shuffle(ex.pairs.map((p, i) => ({ ...p, i }))), [ex.key]); // eslint-disable-line react-hooks/exhaustive-deps
  const [sel, setSel] = useState<{ side: 'l' | 'r'; i: number } | null>(null);
  const [gone, setGone] = useState<number[]>([]);
  const [bad, setBad] = useState<number[]>([]);
  const mistakes = useRef<Set<string>>(new Set());
  const tap = (side: 'l' | 'r', i: number) => {
    if (side === 'l' && audio) speak(ex.pairs[i].left, course.ttsLang);
    if (!sel || sel.side === side) { feedback.select(); setSel({ side, i }); return; }
    const l = side === 'l' ? i : sel.i, r = side === 'r' ? i : sel.i;
    setSel(null);
    if (l === r) {
      const next = [...gone, l];
      setGone(next);
      feedback.pair(next.length);
      if (next.length === ex.pairs.length) setTimeout(() => onDone([...mistakes.current]), 350);
    } else {
      mistakes.current.add(ex.pairs[l].itemId);
      feedback.mismatch();
      setBad([l, r]);
      setTimeout(() => setBad([]), 450);
    }
  };
  return (
    <>
      <div className="instr">Tap the matching pairs</div>
      <div className="match">
        <div className="stack">
          {ex.pairs.map((p, i) => (
            <button key={i} type="button" className={`tile ${gone.includes(i) ? 'gone' : ''} ${bad[0] === i ? 'bad' : ''}`} aria-pressed={sel?.side === 'l' && sel.i === i} onClick={() => tap('l', i)}>{p.left}</button>
          ))}
        </div>
        <div className="stack">
          {rights.map((p) => (
            <button key={p.i} type="button" className={`tile ${gone.includes(p.i) ? 'gone' : ''} ${bad[1] === p.i ? 'bad' : ''}`} aria-pressed={sel?.side === 'r' && sel.i === p.i} onClick={() => tap('r', p.i)}>{p.right}</button>
          ))}
        </div>
      </div>
    </>
  );
}

export function BuildEx({ ex, course, lex, value, onChange, locked, audio, noHints }: ExProps<'build'>) {
  const [picked, setPicked] = useState<number[]>([]);
  useEffect(() => setPicked([]), [ex.key]);
  useEffect(() => { onChange(picked.length ? picked.map((i) => ex.tiles[i]).join(' ') : null); }, [picked]); // eslint-disable-line react-hooks/exhaustive-deps
  void value;
  const add = (i: number) => { if (locked) return; feedback.place(); setPicked((p) => [...p, i]); if (ex.answerTarget && audio) speak(ex.tiles[i], course.ttsLang); };
  const remove = (i: number) => { if (!locked) { feedback.remove(); } if (!locked) setPicked((p) => p.filter((x) => x !== i)); };
  return (
    <>
      <div className="instr">{ex.listen ? 'Tap what you hear' : 'Translate this sentence'}</div>
      {ex.listen ? <SpeakBtn text={ex.speak!} course={course} audio={audio} big /> : <Prompt text={ex.prompt} target={ex.promptTarget} course={course} lex={lex} audio={audio} noHints={noHints} />}
      <div className="answer-line" aria-label="Your answer">
        {picked.map((i) => <button key={i} type="button" className="tile" onClick={() => remove(i)}>{ex.tiles[i]}</button>)}
      </div>
      <div className="bank">
        {ex.tiles.map((t, i) => <button key={i} type="button" className={`tile ${picked.includes(i) ? 'used' : ''}`} onClick={() => add(i)} disabled={picked.includes(i) || locked}>{t}</button>)}
      </div>
    </>
  );
}

export function TypeEx({ ex, course, lex, value, onChange, locked, audio, noHints }: ExProps<'type'>) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, [ex.key]);
  const insert = (ch: string) => {
    feedback.select();
    const el = ref.current; if (!el) return;
    const v = String(value ?? ''), a = el.selectionStart ?? v.length, b = el.selectionEnd ?? v.length;
    onChange(v.slice(0, a) + ch + v.slice(b));
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(a + ch.length, a + ch.length); });
  };
  return (
    <>
      <div className="instr">{ex.listen ? 'Type what you hear' : ex.answerTarget ? `Write this in ${course.name}` : 'Write this in English'}</div>
      {ex.listen ? <SpeakBtn text={ex.speak!} course={course} audio={audio} big /> : <Prompt text={ex.prompt} target={ex.promptTarget} course={course} lex={lex} audio={audio} noHints={noHints} />}
      <input ref={ref} className="input" value={String(value ?? '')} disabled={locked} placeholder={ex.answerTarget ? `Type in ${course.name}` : 'Type your answer'} autoComplete="off" autoCapitalize="off" spellCheck={false}
        onChange={(e) => onChange(e.target.value || null)} aria-label="Your answer" lang={ex.answerTarget ? course.id : 'en'} />
      {ex.answerTarget && course.specialChars && (
        <div className="chars">{course.specialChars.map((c) => <button key={c} type="button" onClick={() => insert(c)} disabled={locked}>{c}</button>)}</div>
      )}
    </>
  );
}

export function FillEx({ ex, value, onChange, locked }: ExProps<'fill'>) {
  useNumberKeys(ex.options.length, locked, (i) => onChange(i));
  const chosen = typeof value === 'number' ? ex.options[value] : null;
  return (
    <>
      <div className="instr">Fill in the blank</div>
      <div className="card flat" style={{ fontSize: '1.25rem', marginBottom: '.6rem' }}>
        {ex.before} <span style={{ display: 'inline-block', minWidth: 80, borderBottom: '3px solid var(--accent)', textAlign: 'center', fontWeight: 800 }}>{chosen ?? ' '}</span> {ex.after}
      </div>
      <p className="muted">“{ex.translation}”</p>
      <div className="options">
        {ex.options.map((o, i) => (
          <button key={i} type="button" className={`option ${locked && i === ex.correct ? 'ok' : ''}`} aria-pressed={value === i} disabled={locked} onClick={() => { feedback.select(); onChange(i); }}>
            <span className="num">{i + 1}</span>{o}
          </button>
        ))}
      </div>
    </>
  );
}

export function ChatEx({ ex, course, lex, value, onChange, locked, audio, noHints }: ExProps<'chat'>) {
  useNumberKeys(ex.options.length, locked, (i) => onChange(i));
  useEffect(() => { if (audio) speak(ex.say, course.ttsLang); }, [ex.key]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <div className="instr">Choose the best reply</div>
      <div className="prompt">
        <Mascot size={70} mood="wave" />
        <div className="bubble"><SpeakBtn text={ex.say} course={course} audio={audio} /> <HintText text={ex.say} lex={lex} disabled={noHints} /><div className="muted small">{ex.sayGloss}</div></div>
      </div>
      <div className="options" style={{ marginLeft: 'auto', width: 'min(100%, 460px)' }}>
        {ex.options.map((o, i) => (
          <button key={i} type="button" className={`option ${locked && i === ex.correct ? 'ok' : ''}`} aria-pressed={value === i} disabled={locked} onClick={() => { feedback.select(); onChange(i); }}>
            <span className="num">{i + 1}</span>{o}
          </button>
        ))}
      </div>
    </>
  );
}

export function SpeakEx({ ex, course, lex, value, onChange, locked, audio }: ExProps<'speak'>) {
  const [state, setState] = useState<'idle' | 'listening' | 'recording' | 'recorded' | 'error'>('idle');
  const [url, setUrl] = useState<string | null>(null);
  const recRef = useRef<{ stop: () => Promise<Blob> } | null>(null);
  const canRecognise = recognitionSupported() && !!course.speechLang;
  useEffect(() => { setState('idle'); setUrl(null); }, [ex.key]);
  const listen = async () => {
    setState('listening');
    try {
      const { promise } = listenOnce(course.speechLang!);
      const heard = await promise;
      onChange({ transcript: heard.split(' | ')[0] });
      setState('idle');
    } catch { setState('error'); }
  };
  const record = async () => {
    if (state === 'recording') { const blob = await recRef.current!.stop(); setUrl(URL.createObjectURL(blob)); setState('recorded'); return; }
    try { recRef.current = await startRecording(); setState('recording'); } catch { setState('error'); }
  };
  const transcript = value && typeof value === 'object' ? value.transcript : undefined;
  return (
    <>
      <div className="instr">Say this out loud</div>
      <Prompt text={ex.text} target course={course} lex={lex} audio={audio} />
      <p className="muted">“{ex.translation}”</p>
      {canRecognise && state !== 'error' ? (
        <div className="center stack">
          <button type="button" className="btn accent" onClick={listen} disabled={locked || state === 'listening'}>{state === 'listening' ? '👂 Listening…' : '🎤 Tap and speak'}</button>
          {transcript && <p>I heard: <b>{transcript}</b></p>}
        </div>
      ) : recordingSupported() ? (
        <div className="center stack">
          <p className="small muted">Record yourself, compare with the audio, then be honest 🙂</p>
          <button type="button" className="btn accent" onClick={record} disabled={locked}>{state === 'recording' ? '⏹ Stop' : '🎙️ Record'}</button>
          {url && <audio src={url} controls style={{ width: '100%' }} />}
          {(state === 'recorded' || !audio) && (
            <div className="row" style={{ justifyContent: 'center' }}>
              <button type="button" className="btn soft small" aria-pressed={value !== null && typeof value === 'object' && value.self === false} onClick={() => onChange({ self: false })} disabled={locked}>Not quite</button>
              <button type="button" className="btn success small" onClick={() => onChange({ self: true })} disabled={locked}>I said it right</button>
            </div>
          )}
        </div>
      ) : (
        <div className="center"><button type="button" className="btn success" onClick={() => onChange({ self: true })} disabled={locked}>I said it out loud</button></div>
      )}
    </>
  );
}
