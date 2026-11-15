import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { Mascot } from './Mascot';

/** Shown once per cold start. In the mobile apps it takes over seamlessly from the native launch image. */
let shown = false;

export function Splash() {
  const [phase, setPhase] = useState<'in' | 'out' | 'gone'>(shown ? 'gone' : 'in');
  useEffect(() => {
    if (shown) return;
    shown = true;
    if (Capacitor.isNativePlatform()) SplashScreen.hide({ fadeOutDuration: 150 }).catch(() => {});
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.reduceMotion === 'true';
    const hold = reduce ? 600 : 1700;
    const t1 = setTimeout(() => setPhase('out'), hold);
    const t2 = setTimeout(() => setPhase('gone'), hold + 450);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  if (phase === 'gone') return null;
  return (
    <div className={`splash ${phase === 'out' ? 'splash-out' : ''}`} role="presentation" onClick={() => setPhase('out')}>
      <div className="splash-center">
        <img className="splash-icon" src="./icons/icon.svg" alt="" width="112" height="112" />
        <div className="splash-name">Lugha Zetu</div>
        <div className="splash-tag">Our languages · Lugha zetu</div>
        <div className="splash-stripe kikoi" />
      </div>
      <div className="splash-twiga"><Mascot mood="wave" size={92} /></div>
      <div className="splash-credit">by <b>Pizza Technologies</b></div>
    </div>
  );
}
