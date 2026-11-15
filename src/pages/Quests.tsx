import { useApp } from '../state/store';
import { questLabel } from '../lib/quests';
import { Bar } from '../components/ui';
import { Mascot } from '../components/Mascot';
import { totalXp } from '../state/store';
import { dayKey } from '../lib/dates';

export default function Quests() {
  const s = useApp();
  const now = new Date();
  const midnight = new Date(now); midnight.setHours(24, 0, 0, 0);
  const hrs = Math.ceil((midnight.getTime() - now.getTime()) / 3600000);
  const month = dayKey().slice(0, 7);
  const monthXp = Object.entries(s.xpLog).filter(([d]) => d.startsWith(month)).reduce((a, [, v]) => a + v, 0);
  return (
    <>
      <div className="row" style={{ marginTop: '1rem' }}><Mascot mood="cheer" size={80} /><div><h1 style={{ margin: 0 }}>Daily quests</h1><div className="muted small">New quests in {hrs}h · rewards are beads, never paywalls</div></div></div>
      <div className="stack" style={{ marginTop: '1rem' }}>
        {s.questDay?.quests.map((q) => (
          <div key={q.id} className="card">
            <div className="row between"><b>{questLabel(q)}</b><span className="chip">📿 {q.reward}</span></div>
            <div className="row" style={{ marginTop: '.5rem' }}><Bar value={q.progress / q.target} /><span className="small">{q.progress}/{q.target}</span></div>
            {q.progress >= q.target && <button className="btn small success" style={{ marginTop: '.6rem' }} disabled={q.claimed} onClick={() => s.claimQuest(q.id)}>{q.claimed ? 'Claimed ✓' : 'Claim reward'}</button>}
          </div>
        ))}
      </div>
      <div className="card" style={{ marginTop: '1rem' }}>
        <h3>🗓️ Monthly challenge</h3>
        <p className="small muted">Earn 1,000 XP this month.</p>
        <div className="row"><Bar value={monthXp / 1000} className="accent" /><span className="small">{monthXp}/1000</span></div>
      </div>
      <p className="small muted center" style={{ marginTop: '1rem' }}>Lifetime XP: {totalXp(s)}</p>
    </>
  );
}
