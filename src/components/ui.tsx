import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export function Modal({ open, onClose, children, label }: { open: boolean; onClose: () => void; children: ReactNode; label: string }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="modal-back" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={label} onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>,
    document.body,
  );
}

export const Bar = ({ value, className = '' }: { value: number; className?: string }) => (
  <div className={`bar ${className}`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)}>
    <i style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
  </div>
);

export function Ring({ value, size = 56, stroke = 7, children, color = 'var(--primary)' }: { value: number; size?: number; stroke?: number; children?: ReactNode; color?: string }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} className="ring" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, value))} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: size / 4 }}>{children}</div>
    </div>
  );
}

export const Toggle = ({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <label className="toggle">
    <span><b>{label}</b>{hint && <><br /><span className="muted small">{hint}</span></>}</span>
    <input type="checkbox" className="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
  </label>
);

const COLORS = ['#D7263D', '#1B6CA8', '#2E8B57', '#E08E0B', '#7B4BA0', '#0F7C80', '#C2457A', '#8B5A2B'];
export const Avatar = ({ name, size = 40 }: { name: string; size?: number }) => {
  const c = COLORS[[...name].reduce((a, ch) => a + ch.charCodeAt(0), 0) % COLORS.length];
  return <span className="avatar" style={{ background: c, width: size, height: size, fontSize: size / 2.4 }}>{(name || '?').slice(0, 1).toUpperCase()}</span>;
};

export function Confetti() {
  const colors = ['#D7263D', '#1B6CA8', '#E8A317', '#2E8B57', '#D9541E', '#7B4BA0'];
  return (
    <div className="confetti" aria-hidden>
      {Array.from({ length: 60 }, (_, i) => (
        <i key={i} style={{ left: `${(i * 37) % 100}%`, background: colors[i % colors.length], animationDelay: `${(i % 10) * 0.08}s`, animationDuration: `${1.8 + (i % 5) * 0.3}s` }} />
      ))}
    </div>
  );
}

export const Strength = ({ n }: { n: number }) => (
  <span className="strength" aria-label={`Memory strength ${n} of 4`}>{[1, 2, 3, 4].map((i) => <i key={i} className={i <= n ? 'on' : ''} />)}</span>
);
