import { Link } from 'react-router-dom';
import { useApp } from '../state/store';
import { questLabel } from '../lib/quests';
import { Bar } from '../components/ui';
import { Mascot } from '../components/Mascot';
import { StreakCalendar } from './Profile';

export function SidePanel() {
  const s = useApp();
  return (
    <>
      <div className="card center"><Mascot size={90} outfit={s.inventory.outfit} /><div><b>🔥 {s.streak.current}-day streak</b></div><div className="small muted">🛌 {s.streak.restDays} rest day{s.streak.restDays === 1 ? '' : 's'} banked</div></div>
      <div className="card"><StreakCalendar /></div>
      <div className="card">
        <div className="row between"><h3>Daily quests</h3><Link to="/quests" className="small">View all</Link></div>
        <div className="stack">
          {s.questDay?.quests.map((q) => <div key={q.id}><div className="small">{questLabel(q)}</div><Bar value={q.progress / q.target} className="thin" /></div>)}
        </div>
      </div>
      <div className="card"><h3>🏆 Leagues</h3><p className="small muted">Compete weekly — or team up with friends in a Harambee team.</p><Link to="/social" className="btn soft small">Open leagues</Link></div>
    </>
  );
}
