// Settings page. The specific settings are TBD (open question #4) — these are placeholder
// groups with TODO notes describing what still needs to be decided.
import { useTheme } from '../context/ThemeContext';

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="page">
      <div className="page__inner">
        <h1 className="page__title">Settings</h1>
        <p className="page__subtitle">Manage your app preferences.</p>

        <Group title="Notification Preferences" todo="Define what notifications exist (new messages, system announcements) and whether mobile push is supported (open question #9).">
          <ToggleRow label="New message alerts" />
          <ToggleRow label="System announcements" />
        </Group>

        <Group title="Privacy Controls" todo="May duplicate or link to the Tier 2 floor/seat toggles on the Profile page. Decide whether privacy controls live here, on the profile, or both (open question on Section 9.1).">
          <p className="muted" style={{ margin: 0 }}>
            Location sharing toggles currently live on your Profile page.
          </p>
        </Group>

        <Group title="Appearance" todo="Font size and additional theme options to be decided (Section 9.1).">
          <ToggleRow
            label="Dark mode"
            checked={theme === 'dark'}
            onChange={toggleTheme}
          />
        </Group>

        <Group title="Account" todo="Logout, delete account, linked accounts. In production this ties into Microsoft Entra ID.">
          <button className="btn">Sign out</button>
        </Group>

        <Group title="About" todo="Wire up real terms of service / privacy policy links.">
          <p className="muted" style={{ margin: 0 }}>ConnectOPS · Prototype v0.1.0</p>
        </Group>

        <Group title="Help / Feedback" todo="Link to support and a feedback form.">
          <button className="btn">Send feedback</button>
        </Group>
      </div>
    </div>
  );
}

function Group({ title, todo, children }: { title: string; todo: string; children: React.ReactNode }) {
  return (
    <section className="card settings__group">
      <h3>{title}</h3>
      <div style={{ marginTop: 12 }}>{children}</div>
      <div className="settings__todo">TODO: {todo}</div>
    </section>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked?: boolean;
  onChange?: () => void;
}) {
  // When no handler is provided this is a placeholder, non-functional toggle.
  const interactive = typeof onChange === 'function';
  return (
    <div className="toggle-row">
      <span>{label}</span>
      <button
        className={`toggle ${checked ? 'on' : ''}`}
        aria-label={label}
        aria-pressed={interactive ? !!checked : undefined}
        onClick={onChange}
        disabled={!interactive}
      >
        <span className="toggle__knob" />
      </button>
    </div>
  );
}
