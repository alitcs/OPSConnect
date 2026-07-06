import { useState } from 'react';
import type { User } from '../types';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import EditableTags from './EditableTags';
import InterestSelector from './InterestSelector';

// Section 2 — extended info. Editable, shown only on the user's own profile (not on other
// people's public profiles). The AI uses this data internally even though most humans never
// scroll here. This section is always visible — no accordion/toggle, just further down.
export default function ProfileSection2({ user }: { user: User }) {
  const { refresh } = useAuth();
  const [draft, setDraft] = useState<User>(user);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const update = (patch: Partial<User>) => setDraft((d) => ({ ...d, ...patch }));

  const save = async () => {
    setSaving(true);
    try {
      await api.updateUser(user.id, {
        skills: draft.skills,
        certifications: draft.certifications,
        interests: draft.interests,
        aspirations: draft.aspirations,
        mentoringAreas: draft.mentoringAreas,
        coopInfo: draft.coopInfo,
        floorPublic: draft.floorPublic,
        seatPublic: draft.seatPublic,
      });
      await refresh();
      setSavedAt(Date.now());
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card section2">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Extended Info</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {savedAt && <span className="muted" style={{ fontSize: 13 }}>Saved ✓</span>}
          <button className="btn btn--primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      <TagField
        label="Skills"
        placeholder="Add a skill…"
        values={draft.skills}
        onChange={(v) => update({ skills: v })}
        empty="Add skills so others can find you."
      />
      <TagField
        label="Certifications"
        placeholder="Add a certification…"
        values={draft.certifications}
        onChange={(v) => update({ certifications: v })}
        empty="Add certifications you hold."
      />
      <div className="section2__field">
        <div className="field__label" style={{ marginBottom: 8 }}>Interests</div>
        {draft.interests.length === 0 && (
          <div className="placeholder-text" style={{ marginBottom: 8 }}>
            Pick interests to spark connections.
          </div>
        )}
        <InterestSelector values={draft.interests} onChange={(v) => update({ interests: v })} />
      </div>
      <TagField
        label="Career Aspirations"
        placeholder="Add an aspiration…"
        values={draft.aspirations}
        onChange={(v) => update({ aspirations: v })}
        empty="Where do you want to grow?"
      />
      <TagField
        label="Open to Mentoring On"
        placeholder="Add a mentoring area…"
        values={draft.mentoringAreas}
        onChange={(v) => update({ mentoringAreas: v })}
        empty="Topics you'll mentor on."
      />

      {/* Co-op rotation info — only relevant for co-op students. */}
      <div className="section2__field">
        <div className="field__label" style={{ marginBottom: 8 }}>Co-op Rotation</div>
        {draft.coopInfo ? (
          <div className="business-card__grid" style={{ marginTop: 0 }}>
            <CoopInput label="School" value={draft.coopInfo.school} onChange={(school) => update({ coopInfo: { ...draft.coopInfo!, school } })} />
            <CoopInput label="Program" value={draft.coopInfo.program} onChange={(program) => update({ coopInfo: { ...draft.coopInfo!, program } })} />
            <CoopInput label="Term" value={draft.coopInfo.term} onChange={(term) => update({ coopInfo: { ...draft.coopInfo!, term } })} />
          </div>
        ) : (
          <button
            className="btn btn--ghost"
            style={{ paddingLeft: 0 }}
            onClick={() => update({ coopInfo: { school: '', program: '', term: '' } })}
          >
            + Add co-op rotation info
          </button>
        )}
      </div>

      {/* Tier 2 privacy controls — default OFF. */}
      <div className="profile__section-sep" />
      <div className="profile__section-label">Location Sharing (Tier 2 — off by default)</div>
      <p className="muted" style={{ marginTop: -6, fontSize: 13.5 }}>
        When on, your floor/seat appears on your profile and others can open a map to find you.
      </p>
      <Toggle
        label="Show my floor"
        on={draft.floorPublic}
        onToggle={() => update({ floorPublic: !draft.floorPublic })}
      />
      <Toggle
        label="Show my seat number"
        on={draft.seatPublic}
        onToggle={() => update({ seatPublic: !draft.seatPublic })}
      />
    </section>
  );
}

function TagField({
  label,
  placeholder,
  values,
  onChange,
  empty,
}: {
  label: string;
  placeholder: string;
  values: string[];
  onChange: (v: string[]) => void;
  empty: string;
}) {
  return (
    <div className="section2__field">
      <div className="field__label" style={{ marginBottom: 8 }}>{label}</div>
      {values.length === 0 && <div className="placeholder-text" style={{ marginBottom: 8 }}>{empty}</div>}
      <EditableTags values={values} placeholder={placeholder} onChange={onChange} />
    </div>
  );
}

function CoopInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="field">
      <span className="field__label">{label}</span>
      <input
        className="directory__search"
        style={{ margin: 0 }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
      />
    </div>
  );
}

function Toggle({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <div className="toggle-row">
      <span>{label}</span>
      <button className={`toggle ${on ? 'on' : ''}`} onClick={onToggle} aria-pressed={on} aria-label={label}>
        <span className="toggle__knob" />
      </button>
    </div>
  );
}
