/** Speech synthesis, recognition, recording and synthesized UI sounds — all optional and offline-friendly. */
import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

/** In the Android app, the WebView has no speechSynthesis, so we use the device's native TTS engine. */
const native = Capacitor.isNativePlatform();
let nativeLangs: string[] = [];

let voices: SpeechSynthesisVoice[] = [];
const listeners = new Set<() => void>();
function loadVoices() {
  try {
    if (typeof speechSynthesis === 'undefined') return;
    voices = speechSynthesis.getVoices();
    listeners.forEach((l) => l());
  } catch { /* unsupported */ }
}
if (native) {
  TextToSpeech.getSupportedLanguages().then((r) => { nativeLangs = r.languages.map((l) => l.toLowerCase().replace('_', '-')); listeners.forEach((l) => l()); }).catch(() => {});
} else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
  speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
}
export const onVoicesChanged = (fn: () => void) => { listeners.add(fn); return () => listeners.delete(fn); };
export const voiceFor = (lang?: string) => (lang ? voices.find((v) => v.lang.toLowerCase().replace('_', '-').startsWith(lang)) ?? null : null);
const nativeLang = (lang?: string) => (lang ? nativeLangs.find((l) => l.startsWith(lang)) : undefined);
export const canSpeakLang = (lang?: string) => (native ? !!nativeLang(lang) : !!voiceFor(lang));

/** Community recordings override synthetic voices: itemText -> audio URL. */
const clips = new Map<string, string>();
export const registerClip = (text: string, url: string) => clips.set(text.toLowerCase(), url);
export const hasClip = (text: string) => clips.has(text.toLowerCase());

export function speak(text: string, lang?: string, slow = false) {
  const clip = clips.get(text.toLowerCase());
  if (clip) { const a = new Audio(clip); a.playbackRate = slow ? 0.75 : 1; a.play().catch(() => {}); return; }
  if (native) {
    const l = nativeLang(lang);
    if (l) TextToSpeech.stop().catch(() => {}).finally(() => TextToSpeech.speak({ text, lang: l, rate: slow ? 0.6 : 0.9 }).catch(() => {}));
    return;
  }
  const v = voiceFor(lang);
  if (!v) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.voice = v; u.lang = v.lang; u.rate = slow ? 0.6 : 0.9;
    speechSynthesis.speak(u);
  } catch { /* ignore */ }
}

type Rec = { start: () => void; stop: () => void; abort: () => void; lang: string; interimResults: boolean; maxAlternatives: number; onresult: ((e: any) => void) | null; onerror: ((e: any) => void) | null; onend: (() => void) | null };
export const recognitionSupported = () => typeof window !== 'undefined' && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
export function listenOnce(lang: string): { promise: Promise<string>; stop: () => void } {
  const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const rec: Rec = new Ctor();
  rec.lang = lang; rec.interimResults = false; rec.maxAlternatives = 3;
  const promise = new Promise<string>((resolve, reject) => {
    let done = false;
    rec.onresult = (e) => { done = true; resolve(Array.from(e.results[0] as ArrayLike<{ transcript: string }>).map((r) => r.transcript).join(' | ')); };
    rec.onerror = (e) => { done = true; reject(new Error(e.error || 'speech-error')); };
    rec.onend = () => { if (!done) reject(new Error('no-speech')); };
    rec.start();
  });
  return { promise, stop: () => rec.stop() };
}

export const recordingSupported = () => typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';
export async function startRecording(): Promise<{ stop: () => Promise<Blob> }> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const rec = new MediaRecorder(stream);
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => chunks.push(e.data);
  rec.start();
  return {
    stop: () => new Promise((resolve) => {
      rec.onstop = () => { stream.getTracks().forEach((t) => t.stop()); resolve(new Blob(chunks, { type: rec.mimeType || 'audio/webm' })); };
      rec.stop();
    }),
  };
}

let ctx: AudioContext | null = null;
function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.12) {
  try {
    ctx = ctx ?? new AudioContext();
    const o = ctx.createOscillator(), gn = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    const t = ctx.currentTime + start;
    gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(vol, t + 0.01); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(gn).connect(ctx.destination); o.start(t); o.stop(t + dur + 0.02);
  } catch { /* audio unavailable */ }
}
/** Original, synthesized cues (marimba-like). */
export const sfx = {
  correct: () => { tone(784, 0, 0.18, 'triangle'); tone(1175, 0.09, 0.25, 'triangle'); },
  wrong: () => { tone(220, 0, 0.22, 'sawtooth', 0.05); tone(185, 0.1, 0.25, 'sawtooth', 0.05); },
  complete: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.35, 'triangle')),
  tap: () => tone(1400, 0, 0.05, 'sine', 0.04),
};
