import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import Icon from './Icon';

// The core bulletin-board mechanic: the user sets themselves "open for coffee today" with an
// optional note. This is not directed at anyone — no notification is sent, no rejection is
// possible. It simply adds you to the Connect feed others browse.
export default function AvailabilityCard({ onChange }: { onChange?: () => void }) {
  const { notify } = useToast();
  const [available, setAvailable] = useState(false);
  const [note, setNote] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .getAvailability()
      .then((a) => {
        setAvailable(a.availableForCoffee);
        setNote(a.availabilityNote ?? '');
      })
      .finally(() => setLoaded(true));
  }, []);

  const persist = async (nextAvailable: boolean, nextNote: string) => {
    setSaving(true);
    try {
      await api.setAvailability(nextAvailable, nextNote);
      onChange?.();
    } catch {
      notify('Could not update your status. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggle = async () => {
    const next = !available;
    setAvailable(next);
    await persist(next, note);
    notify(
      next
        ? "You're on the board — colleagues can see you're open to help."
        : "You're no longer showing as available.",
      'success',
    );
  };

  return (
    <section className={`availability-card ${available ? 'is-on' : ''}`}>
      <div className="availability-card__row">
        <span className="availability-card__icon">
          <Icon name="coffee" size={22} />
        </span>
        <div className="availability-card__text">
          <div className="availability-card__title">Open to help today</div>
          <div className="availability-card__sub">
            A quiet signal you're around. No pings, no rejection.
          </div>
        </div>
        <button
          className={`toggle ${available ? 'on' : ''}`}
          onClick={toggle}
          disabled={!loaded || saving}
          aria-pressed={available}
          aria-label="Open to help today"
        >
          <span className="toggle__knob" />
        </button>
      </div>

      {available && (
        <div className="availability-card__note-row">
          <input
            className="availability-card__note-input"
            value={note}
            maxLength={120}
            aria-label="Availability note (optional)"
            placeholder="Add a note (optional) — e.g. “Free after 2pm”"
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => persist(true, note)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                (e.target as HTMLInputElement).blur();
              }
            }}
          />
        </div>
      )}
    </section>
  );
}
