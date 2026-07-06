import { useEffect, useRef, useState } from 'react';
import { INTEREST_GROUPS } from '../data/interestOptions';
import Icon from './Icon';

// Curated interest picker — users choose from a pre-set, grouped list rather than free text.
// Keeps the tone professional while still enabling meaningful discovery, and guarantees the
// AI and Connect board reason over a shared vocabulary. Any legacy free-text values already
// on the profile are still shown as removable chips.
export default function InterestSelector({
  values,
  onChange,
}: {
  values: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const has = (v: string) => values.some((x) => x.toLowerCase() === v.toLowerCase());
  const toggle = (v: string) =>
    has(v) ? onChange(values.filter((x) => x.toLowerCase() !== v.toLowerCase())) : onChange([...values, v]);
  const remove = (v: string) => onChange(values.filter((x) => x !== v));

  return (
    <div className="interest-selector" ref={ref}>
      <div className="editable-tags">
        {values.map((v) => (
          <span key={v} className="tag">
            {v}
            <button className="tag__remove" onClick={() => remove(v)} aria-label={`Remove ${v}`}>
              <Icon name="x" size={11} strokeWidth={2.5} />
            </button>
          </span>
        ))}
        <button
          type="button"
          className="interest-selector__add"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          <Icon name="plus" size={13} strokeWidth={2.4} />
          Add interest
        </button>
      </div>

      {open && (
        <div className="interest-selector__menu" role="group" aria-label="Choose interests">
          {INTEREST_GROUPS.map((group) => (
            <div className="interest-selector__group" key={group.label}>
              <div className="interest-selector__group-label">{group.label}</div>
              <div className="interest-selector__options">
                {group.options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    aria-pressed={has(opt)}
                    className={`interest-selector__option ${has(opt) ? 'is-selected' : ''}`}
                    onClick={() => toggle(opt)}
                  >
                    {has(opt) && <Icon name="check" size={12} strokeWidth={2.6} />}
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
