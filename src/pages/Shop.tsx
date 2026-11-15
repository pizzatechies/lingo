import { useState } from 'react';
import { SHOP, useApp } from '../state/store';
import { Mascot } from '../components/Mascot';

export default function Shop() {
  const s = useApp();
  const [msg, setMsg] = useState('');
  const boost = s.inventory.boostUntil > Date.now() ? Math.ceil((s.inventory.boostUntil - Date.now()) / 60000) : 0;
  return (
    <>
      <div className="row between" style={{ marginTop: '1rem' }}><h1 style={{ margin: 0 }}>Duka · Shop</h1><span className="stat bstat">📿 {s.beads}</span></div>
      <p className="muted">Beads are earned by learning — there is nothing to buy with real money, and nothing here is needed to learn.</p>
      <div className="card center"><Mascot size={120} outfit={s.inventory.outfit} mood="happy" /><div className="small muted">Twiga is wearing: {SHOP.find((i) => i.id === s.inventory.outfit)?.name ?? 'nothing special'}</div></div>
      {msg && <div className="notice info" style={{ marginTop: '.8rem' }} role="status">{msg}</div>}
      <div className="stack" style={{ marginTop: '1rem' }}>
        {SHOP.map((i) => {
          const owned = i.kind === 'outfit' && s.inventory.owned.includes(i.id);
          return (
            <div key={i.id} className="card row">
              <span style={{ fontSize: '2rem' }}>{i.icon}</span>
              <div className="grow"><b>{i.name}</b><div className="small muted">{i.desc}{i.id === 'rest' ? ` You have ${s.streak.restDays}.` : ''}{i.id === 'boost' && boost ? ` Active: ${boost} min left.` : ''}</div></div>
              {owned ? <button className="btn small soft" onClick={() => s.equip(s.inventory.outfit === i.id ? null : i.id)}>{s.inventory.outfit === i.id ? 'Take off' : 'Wear'}</button>
                : <button className="btn small" disabled={s.beads < i.price} onClick={() => setMsg(s.buy(i.id) ? `Purchased ${i.name}!` : 'Not available right now.')}>📿 {i.price}</button>}
            </div>
          );
        })}
      </div>
    </>
  );
}
