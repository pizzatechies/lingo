import { Link } from 'react-router-dom';
import { metaOf } from '../content';
import { useApp } from '../state/store';
import { dayKey } from '../lib/dates';

export function TopBar() {
  const s = useApp();
  const meta = s.active ? metaOf(s.active) : null;
  const practisedToday = s.streak.history[dayKey()] === 'active';
  return (
    <div className="topbar">
      <Link to="/courses" className="stat" aria-label="Switch course"><span style={{ fontSize: '1.4rem' }}>{meta?.icon}</span> <span className="small">{meta?.name}</span></Link>
      <div className="row" style={{ gap: '.1rem' }}>
        <Link to="/profile" className={`stat fire ${practisedToday ? '' : 'dim'}`} aria-label={`${s.streak.current}-day streak`}>🔥 {s.streak.current}</Link>
        <Link to="/shop" className="stat bead" aria-label={`${s.beads} beads`}>📿 {s.beads}</Link>
        {s.settings.hardcore && <span className="stat heart" aria-label={`${s.hearts.n} hearts`}>❤️ {s.hearts.n}</span>}
        <Link to="/quests" className="stat" aria-label="Daily quests">🎯</Link>
      </div>
    </div>
  );
}
