import { useEffect, useState } from 'react';
import { CONNECT_INTENTS, type ConnectIntentId } from '../types';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import Icon, { type IconName } from './Icon';

// The core bulletin-board mechanic: the user sets themselves "open to connect today" and picks
// the kinds of low-pressure connection they're up for (a coffee, a walk, a skill exchange…).
// This is not directed at anyone — no notification is sent, no rejection is possible. It simply
// adds you to the Connect feed others browse, with a little human context about how you'd like
// to meet. Warm, but professional: opt-in, easy to switch off, invisible to managers.
export default function AvailabilityCard({ onChange }: { onChange?: () => void }) {
  const { notify } = useToast();
  const [available, setAvailable] = useState(false);
  const [note, setNote] = useState('');
  const [intents, setIntents] = useState<ConnectIntentId[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .getAvailability()
      .then((a) => {
        setAvailable(a.availableForCoffee);
        setNote(a.availabilityNote ?? '');
        setIntents(a.connectIntents ?? []);
      })
      .finally(() => setLoaded(true));
  }, []);

  const persist = async (
    nextAvailable: boolean,
    nextNote: string,
    nextIntents: ConnectIntentId[],
  ) => {
    setSaving(true);
    try {
      await api.setAvailability(nextAvailable, nextNote, nextIntents);
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
    // Default to a coffee chat when switching on with nothing picked, so the entry reads well.
    const nextIntents: ConnectIntentId[] = next ? (intents.length ? intents : ['coffee']) : [];
    setIntents(nextIntents);
    await persist(next, note, nextIntents);
    notify(
      next
        ? "You're on the board — colleagues can see how you'd like to connect."
        : "You're no longer showing as available.",
      'success',
    );
  };

  const toggleIntent = async (id: ConnectIntentId) => {
    if (!available) return;
    const next = intents.includes(id) ? intents.filter((x) => x !== id) : [...intents, id];
    setIntents(next);
    await persist(true, note, next);
  };

  return (
    <section className={`availability-card ${available ? 'is-on' : ''}`}>
      <div className="availability-card__row">
        <div className="availability-card__text">
          <div className="availability-card__title">Open to connect today</div>
          <div className="availability-card__sub">A quiet signal — no pings, no rejection.</div>
        </div>
        <button
          className={`toggle ${available ? 'on' : ''}`}
          onClick={toggle}
          disabled={!loaded || saving}
          aria-pressed={available}
          aria-label="Open to connect today"
        >
          <span className="toggle__knob" />
        </button>
      </div>

      {available && (
        <>
          <div className="availability-card__intents-label">I'm up for…</div>
          <div
            className="availability-card__intents"
            role="group"
            aria-label="How you'd like to connect today"
          >
            {CONNECT_INTENTS.map((it) => {
              const on = intents.includes(it.id);
              return (
                <button
                  key={it.id}
                  type="button"
                  className={`intent-chip ${on ? 'is-on' : ''}`}
                  onClick={() => toggleIntent(it.id)}
                  disabled={saving}
                  aria-pressed={on}
                  title={it.blurb}
                >
                  <Icon name={it.icon as IconName} size={15} />
                  <span>{it.label}</span>
                </button>
              );
            })}
          </div>

          <div className="availability-card__note-row">
            <input
              className="availability-card__note-input"
              value={note}
              maxLength={120}
              aria-label="Availability note (optional)"
              placeholder="Add a note (optional) — e.g. “Free after 2pm” or “Ask me about GIS”"
              onChange={(e) => setNote(e.target.value)}
              onBlur={() => persist(true, note, intents)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  (e.target as HTMLInputElement).blur();
                }
              }}
            />
          </div>
        </>
      )}
    </section>
  );
}
