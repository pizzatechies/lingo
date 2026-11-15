/** Twiga — Lugha's original giraffe mascot, drawn in SVG. */
export type Mood = 'happy' | 'cheer' | 'think' | 'sad' | 'wave';

export function Mascot({ mood = 'happy', size = 120, outfit }: { mood?: Mood; size?: number; outfit?: string | null }) {
  const eyeY = mood === 'sad' ? 64 : 62;
  return (
    <svg className="mascot" width={size} height={size * 1.1} viewBox="0 0 120 132" role="img" aria-label={`Twiga the giraffe looks ${mood}`}>
      {/* neck */}
      <path d="M50 92 Q48 112 44 130 L78 130 Q72 112 70 92 Z" fill="#F2B33D" />
      <circle cx="56" cy="110" r="4" fill="#B5652A" /><circle cx="66" cy="122" r="5" fill="#B5652A" /><circle cx="54" cy="126" r="3" fill="#B5652A" />
      {/* ossicones */}
      <rect x="42" y="12" width="5" height="18" rx="2.5" fill="#D99A2B" transform="rotate(-12 44 21)" />
      <rect x="72" y="12" width="5" height="18" rx="2.5" fill="#D99A2B" transform="rotate(12 75 21)" />
      <circle cx="42" cy="12" r="5.5" fill="#8A4B1F" /><circle cx="78" cy="12" r="5.5" fill="#8A4B1F" />
      {/* ears */}
      <ellipse cx="28" cy="44" rx="13" ry="6" fill="#F2B33D" transform="rotate(-25 28 44)" />
      <ellipse cx="92" cy="44" rx="13" ry="6" fill="#F2B33D" transform="rotate(25 92 44)" />
      {/* head */}
      <ellipse cx="60" cy="58" rx="30" ry="32" fill="#F2B33D" />
      <path d="M38 40 q6-6 12 0 q-2 8-10 6z" fill="#B5652A" /><path d="M74 36 q8-2 10 6 q-6 4-11-1z" fill="#B5652A" />
      {/* snout */}
      <ellipse cx="60" cy="80" rx="22" ry="15" fill="#F6C98A" />
      <ellipse cx="52" cy="78" rx="2.5" ry="2" fill="#8A4B1F" /><ellipse cx="68" cy="78" rx="2.5" ry="2" fill="#8A4B1F" />
      {/* eyes */}
      {mood === 'cheer' ? (
        <g stroke="#2B1D14" strokeWidth="3" fill="none" strokeLinecap="round"><path d="M42 62 q6-7 12 0" /><path d="M66 62 q6-7 12 0" /></g>
      ) : (
        <g>
          <ellipse cx="48" cy={eyeY} rx="6" ry="7" fill="#fff" /><ellipse cx="72" cy={eyeY} rx="6" ry="7" fill="#fff" />
          <circle cx={mood === 'think' ? 50 : 49} cy={eyeY + (mood === 'think' ? -2 : 1)} r="3.5" fill="#2B1D14" />
          <circle cx={mood === 'think' ? 74 : 73} cy={eyeY + (mood === 'think' ? -2 : 1)} r="3.5" fill="#2B1D14" />
          {mood === 'sad' && <g stroke="#2B1D14" strokeWidth="2.5" strokeLinecap="round"><path d="M40 52 l10 3" /><path d="M80 52 l-10 3" /></g>}
        </g>
      )}
      {/* mouth */}
      {mood === 'sad' ? <path d="M53 88 q7-5 14 0" stroke="#8A4B1F" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        : mood === 'think' ? <path d="M54 87 h12" stroke="#8A4B1F" strokeWidth="2.5" strokeLinecap="round" />
        : <path d="M50 85 q10 10 20 0" stroke="#8A4B1F" strokeWidth="2.5" fill={mood === 'cheer' ? '#C2302E' : 'none'} strokeLinecap="round" />}
      {(mood === 'happy' || mood === 'cheer' || mood === 'wave') && <><circle cx="38" cy="74" r="4" fill="#F28C6B" opacity=".5" /><circle cx="82" cy="74" r="4" fill="#F28C6B" opacity=".5" /></>}
      {/* outfits */}
      {outfit === 'kikoi' && <g><path d="M44 96 h32 v9 h-32z" fill="#0F7C80" /><path d="M44 99 h32" stroke="#E8A317" strokeWidth="2" /><path d="M44 102 h32" stroke="#D7263D" strokeWidth="1.5" /><path d="M72 104 l6 14 l-8-2z" fill="#0F7C80" /></g>}
      {outfit === 'beads' && <g>{['#D7263D', '#1B6CA8', '#E8A317', '#2E8B57', '#fff', '#D7263D', '#1B6CA8', '#E8A317', '#2E8B57'].map((c, i) => <circle key={i} cx={44 + i * 4} cy={98 + Math.sin(i / 8 * Math.PI) * 6} r="3" fill={c} stroke="#2B1D14" strokeWidth=".5" />)}</g>}
      {outfit === 'kofia' && <g><path d="M36 34 q24-22 48 0 v4 h-48z" fill="#fff" stroke="#7B4BA0" strokeWidth="1.5" />{[42, 52, 62, 72].map((x) => <path key={x} d={`M${x} 30 l4 -4 l4 4`} stroke="#2E8B57" strokeWidth="1.5" fill="none" />)}</g>}
      {outfit === 'shades' && <g><rect x="38" y="55" width="20" height="12" rx="5" fill="#1d1d1d" /><rect x="62" y="55" width="20" height="12" rx="5" fill="#1d1d1d" /><path d="M58 60 h4" stroke="#1d1d1d" strokeWidth="2.5" /></g>}
      {outfit === 'grad' && <g><path d="M30 30 l30-12 l30 12 l-30 12z" fill="#233D6E" /><rect x="46" y="30" width="28" height="8" fill="#233D6E" /><path d="M88 30 v14" stroke="#E8A317" strokeWidth="2" /><circle cx="88" cy="45" r="2.5" fill="#E8A317" /></g>}
      {mood === 'wave' && <path d="M98 96 q8-10 4-20" stroke="#F2B33D" strokeWidth="7" strokeLinecap="round" fill="none" />}
    </svg>
  );
}
