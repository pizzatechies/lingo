import { useState } from 'react';
import type { Lexicon } from '../lib/lexicon';

/** Renders target-language text where every known word can be tapped for its meaning (and grammar breakdown). */
export function HintText({ text, lex, disabled }: { text: string; lex: Lexicon; disabled?: boolean }) {
  const [open, setOpen] = useState<number | null>(null);
  const parts = lex.breakdown(text);
  if (disabled) return <span>{text}</span>;
  // Re-attach punctuation from the original text around tokens.
  let rest = text;
  return (
    <span style={{ position: 'relative' }}>
      {parts.map((p, i) => {
        const at = rest.toLowerCase().indexOf(p.token.toLowerCase());
        const before = at > 0 ? rest.slice(0, at) : '';
        const shown = at >= 0 ? rest.slice(at, at + p.token.length) : p.token;
        rest = at >= 0 ? rest.slice(at + p.token.length) : rest;
        return (
          <span key={i}>
            {before}
            {p.hint ? (
              <span style={{ position: 'relative', display: 'inline-block' }}>
                <button type="button" className="hintword" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>{shown}</button>
                {open === i && (
                  <span className="hint-pop" role="tooltip" style={{ left: 0, top: '1.8em' }} onClick={() => setOpen(null)}>
                    {p.hint.parts ? p.hint.parts.map(([a, b], j) => <span key={j}>{j > 0 && ' + '}<b>{a}</b> {b}</span>) : p.hint.gloss}
                  </span>
                )}
              </span>
            ) : shown}
          </span>
        );
      })}
      {rest}
    </span>
  );
}
