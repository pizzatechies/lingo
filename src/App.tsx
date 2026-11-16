import { lazy, Suspense, useEffect } from 'react';
import { HashRouter, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useApp } from './state/store';
import { useAudioAvailable, useCourse } from './hooks';
import Onboarding from './pages/Onboarding';
import Learn from './pages/Learn';
import { SidePanel } from './pages/SidePanel';
import { Splash } from './components/Splash';
import { checkServer, refreshCommunity, sync } from './lib/api';
import { useWidgetSync } from './lib/widget';

const Session = lazy(() => import('./pages/Session'));
const Practice = lazy(() => import('./pages/Practice'));
const Explore = lazy(() => import('./pages/Explore'));
const Story = lazy(() => import('./pages/Story'));
const Social = lazy(() => import('./pages/Social'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const Shop = lazy(() => import('./pages/Shop'));
const Quests = lazy(() => import('./pages/Quests'));
const Community = lazy(() => import('./pages/Community'));
const Speed = lazy(() => import('./pages/Speed'));
const Courses = lazy(() => import('./pages/Courses'));
const Builder = lazy(() => import('./pages/Builder'));

function useThemeAttrs() {
  const { theme, reduceMotion, bigText } = useApp((s) => s.settings);
  useEffect(() => {
    const r = document.documentElement;
    if (theme === 'system') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', theme);
    r.setAttribute('data-reduce-motion', String(reduceMotion));
    r.setAttribute('data-big-text', String(bigText));
  }, [theme, reduceMotion, bigText]);
}

const NAV = [
  { to: '/', ico: '🏠', label: 'Learn' },
  { to: '/practice', ico: '🧠', label: 'Practice' },
  { to: '/explore', ico: '📚', label: 'Explore' },
  { to: '/social', ico: '🏆', label: 'Leagues' },
  { to: '/profile', ico: '🦒', label: 'Me' },
];

function Shell() {
  const loc = useLocation();
  const onboarded = useApp((s) => s.onboarded);
  const active = useApp((s) => s.active);
  const auth = useApp((s) => s.auth);
  const course = useCourse();
  const audio = useAudioAvailable(course);
  useWidgetSync(course);
  const dailyTick = useApp((s) => s.dailyTick);
  useThemeAttrs();
  useEffect(() => { dailyTick(audio); }, [dailyTick, audio, loc.pathname]);
  useEffect(() => {
    checkServer().then((s) => { if (s === 'online' && active) refreshCommunity(active).catch(() => {}); if (s === 'online') sync().catch(() => {}); });
  }, [active, auth?.token, loc.pathname === '/']); // eslint-disable-line react-hooks/exhaustive-deps

  if (!onboarded || !active) return <Onboarding />;
  if (loc.pathname.startsWith('/session') || loc.pathname.startsWith('/story/') || loc.pathname.startsWith('/speed')) {
    return (
      <Suspense fallback={<div className="spinner" />}>
        <Routes>
          <Route path="/session/:kind/:ref?" element={<Session />} />
          <Route path="/story/:id" element={<Story />} />
          <Route path="/speed" element={<Speed />} />
        </Routes>
      </Suspense>
    );
  }
  return (
    <div className="shell">
      <nav className="nav" aria-label="Main">
        <div className="brand"><img src="./icons/icon.svg" alt="" width="34" height="34" /> Lugha Zetu</div>
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
            <span className="ico" aria-hidden>{n.ico}</span><span>{n.label}</span>
          </NavLink>
        ))}
      </nav>
      <main className="main">
        <Suspense fallback={<div className="spinner" />}>
          <Routes>
            <Route path="/" element={<Learn />} />
            <Route path="/practice" element={<Practice />} />
            <Route path="/explore/*" element={<Explore />} />
            <Route path="/social" element={<Social />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/quests" element={<Quests />} />
            <Route path="/community" element={<Community />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/build/:lang?" element={<Builder />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </main>
      <aside className="side"><SidePanel /></aside>
    </div>
  );
}

export default function App() {
  return <HashRouter><Splash /><Shell /></HashRouter>;
}
