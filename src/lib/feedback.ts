/**
 * Haptic + sound feedback for every interaction, in one place.
 * Haptics use the native Taptic Engine / vibration motor in the mobile apps, and the Vibration API
 * on Android browsers. Sounds are synthesized (original, no files) so they work offline.
 * Both respect the Sound and Vibration switches in Settings.
 */
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { useApp } from '../state/store';

const native = Capacitor.isNativePlatform();
const settings = () => useApp.getState().settings;

/* ---------- Haptics ---------- */
function vibrate(pattern: number | number[]) { try { navigator.vibrate?.(pattern); } catch { /* unsupported */ } }
const haptic = {
  select: () => (native ? Haptics.selectionChanged().catch(() => {}) : vibrate(8)),
  light: () => (native ? Haptics.impact({ style: ImpactStyle.Light }).catch(() => {}) : vibrate(12)),
  medium: () => (native ? Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {}) : vibrate(20)),
  success: () => (native ? Haptics.notification({ type: NotificationType.Success }).catch(() => {}) : vibrate([18, 60, 28])),
  error: () => (native ? Haptics.notification({ type: NotificationType.Error }).catch(() => {}) : vibrate([60, 50, 60])),
  warning: () => (native ? Haptics.notification({ type: NotificationType.Warning }).catch(() => {}) : vibrate([30, 40, 30])),
  celebrate: () => {
    if (!native) return vibrate([20, 50, 20, 50, 60]);
    Haptics.notification({ type: NotificationType.Success }).catch(() => {});
    setTimeout(() => Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {}), 220);
    setTimeout(() => Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {}), 420);
  },
};

/* ---------- Sound (Web Audio synthesis) ---------- */
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
function audio() {
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  } catch { return null; }
}
/** iOS only lets audio start inside a user gesture, so unlock it on the first touch. */
if (typeof window !== 'undefined') {
  const unlock = () => { const c = audio(); if (c) { const b = c.createBuffer(1, 1, 22050); const s = c.createBufferSource(); s.buffer = b; s.connect(master!); s.start(0); } window.removeEventListener('pointerdown', unlock); };
  window.addEventListener('pointerdown', unlock, { passive: true });
}

/** A short marimba-like note: sine body plus a quick, brighter attack. */
function note(freq: number, at = 0, dur = 0.25, vol = 0.14, type: OscillatorType = 'sine') {
  const c = audio(); if (!c || !master) return;
  const t = c.currentTime + at;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(master);
  const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t); o.connect(g); o.start(t); o.stop(t + dur + 0.05);
  const o2 = c.createOscillator(); const g2 = c.createGain();
  o2.type = 'triangle'; o2.frequency.setValueAtTime(freq * 4, t);
  g2.gain.setValueAtTime(vol * 0.25, t); g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
  o2.connect(g2).connect(master); o2.start(t); o2.stop(t + 0.08);
}
/** A soft wooden tick for taps. */
function tick(at = 0, freq = 1800, vol = 0.05) {
  const c = audio(); if (!c || !master) return;
  const t = c.currentTime + at;
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * 0.03), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 4);
  const src = c.createBufferSource(); src.buffer = buf;
  const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 4;
  const g = c.createGain(); g.gain.value = vol;
  src.connect(f).connect(g).connect(master); src.start(t);
}
// Pentatonic scale (C major pentatonic) — rising notes for combos.
const PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760];

const sound = {
  select: () => tick(0, 2200, 0.06),
  place: () => tick(0, 1400, 0.07),
  remove: () => tick(0, 900, 0.05),
  correct: (combo = 1) => {
    const i = Math.min(PENTA.length - 3, Math.max(0, combo - 1) % 6);
    note(PENTA[i + 2], 0, 0.22, 0.13);
    note(PENTA[i + 4] ?? PENTA[PENTA.length - 1], 0.08, 0.32, 0.13);
  },
  wrong: () => { note(311, 0, 0.18, 0.08, 'triangle'); note(233, 0.11, 0.3, 0.08, 'triangle'); },
  pair: (n = 0) => note(PENTA[Math.min(PENTA.length - 1, 2 + n)], 0, 0.2, 0.11),
  mismatch: () => note(220, 0, 0.18, 0.07, 'triangle'),
  combo: () => [0, 2, 4, 7].forEach((k, i) => note(PENTA[k], i * 0.06, 0.25, 0.09)),
  complete: () => { [0, 2, 4, 5, 7].forEach((k, i) => note(PENTA[k], i * 0.1, 0.4, 0.12)); note(PENTA[9], 0.55, 0.8, 0.1); note(PENTA[7], 0.55, 0.8, 0.08); },
  reward: () => { note(PENTA[5], 0, 0.18, 0.1); note(PENTA[7], 0.07, 0.18, 0.1); note(PENTA[9], 0.14, 0.4, 0.11); tick(0.14, 4000, 0.04); },
  fail: () => { note(392, 0, 0.3, 0.08, 'triangle'); note(330, 0.2, 0.3, 0.08, 'triangle'); note(262, 0.4, 0.5, 0.08, 'triangle'); },
};

const run = (s?: () => void, h?: () => void) => { const st = settings(); if (st.sound && s) s(); if (st.haptics && h) h(); };

/** Call these from the UI. */
export const feedback = {
  /** Choosing an option, tile, picture or pair. */
  select: () => run(sound.select, haptic.select),
  /** Placing a word tile on the answer line / removing it. */
  place: () => run(sound.place, haptic.light),
  remove: () => run(sound.remove, haptic.select),
  /** Answer checked. Combo raises the pitch; every 5 in a row gets a flourish. */
  correct: (combo = 1) => run(() => { sound.correct(combo); if (combo > 0 && combo % 5 === 0) setTimeout(sound.combo, 260); }, combo > 0 && combo % 5 === 0 ? haptic.celebrate : haptic.success),
  wrong: () => run(sound.wrong, haptic.error),
  /** Matching pairs. */
  pair: (n = 0) => run(() => sound.pair(n), haptic.light),
  mismatch: () => run(sound.mismatch, haptic.warning),
  /** End of a lesson, story or test. */
  complete: () => run(sound.complete, haptic.celebrate),
  failed: () => run(sound.fail, haptic.warning),
  /** Claiming a quest, buying in the shop, unlocking an achievement. */
  reward: () => run(sound.reward, haptic.success),
  /** Generic button press (Check, Continue). */
  press: () => run(undefined, haptic.light),
};
export const previewFeedback = () => { sound.correct(3); setTimeout(() => { if (settings().haptics) haptic.success(); }, 0); };
