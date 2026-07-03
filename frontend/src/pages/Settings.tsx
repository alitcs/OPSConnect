// Settings page — appearance, privacy & data, notifications, accessibility, and account.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';
import Icon, { type IconName } from '../components/Icon';

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { currentUser, refresh } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();

  const [savingLocation, setSavingLocation] = useState(false);
  const [messageAlerts, setMessageAlerts] = useState(true);
  const [announcements, setAnnouncements] = useState(false);

  const locationShared = !!(currentUser?.floorPublic || currentUser?.seatPublic);

  const toggleLocation = async () => {
    if (!currentUser || savingLocation) return;
    const next = !locationShared;
    setSavingLocation(true);
    try {
      await api.updateUser(currentUser.id, { floorPublic: next, seatPublic: next });
      await refresh();
      notify(
        next
          ? 'Your desk location is now visible to colleagues.'
          : 'Your desk location is now private.',
        'success',
      );
    } catch {
      notify('Could not update your location sharing preference.', 'error');
    } finally {
      setSavingLocation(false);
    }
  };

  const signOut = () => navigate('/login');

  return (
    <div className="page">
      <div className="page__inner">
        <h1 className="page__title">Settings</h1>
        <p className="page__subtitle">Manage your preferences, privacy, and accessibility.</p>

        <Group title="Appearance" icon="sun">
          <ToggleRow
            label="Dark mode"
            description="Reduce glare in low-light environments."
            checked={theme === 'dark'}
            onChange={toggleTheme}
          />
        </Group>

        <Group title="Privacy & data" icon="shield">
          <ToggleRow
            label="Share my desk location"
            description="Let colleagues see your floor and seat on the office map. Off by default."
            checked={locationShared}
            onChange={toggleLocation}
            disabled={savingLocation || !currentUser}
          />
          <div className="settings__note">
            <span className="settings__note-icon">
              <Icon name="info" size={16} />
            </span>
            <span>
              <strong>How your data is used.</strong> ConnectOPS reads the OPS directory from
              Microsoft&nbsp;Entra&nbsp;ID and Microsoft&nbsp;Graph. Copilot runs inside the
              protected OPS Microsoft&nbsp;365 tenant — your questions and directory data never
              leave the OPS boundary and are not used to train external models. You only ever
              see the details each colleague has chosen to make public.
            </span>
          </div>
        </Group>

        <Group title="Notifications" icon="messages">
          <ToggleRow
            label="New message alerts"
            description="Notify me when someone messages me on Teams."
            checked={messageAlerts}
            onChange={() => setMessageAlerts((v) => !v)}
          />
          <ToggleRow
            label="System announcements"
            description="Ministry-wide updates and service notices."
            checked={announcements}
            onChange={() => setAnnouncements((v) => !v)}
          />
        </Group>

        <Group title="Accessibility" icon="accessibility">
          <p className="muted" style={{ margin: 0 }}>
            ConnectOPS is built to meet the Accessibility for Ontarians with Disabilities Act
            (AODA) and WCAG&nbsp;2.0 Level&nbsp;AA. This includes:
          </p>
          <ul className="settings__list">
            <li>Full keyboard navigation with a visible focus indicator and skip-to-content link.</li>
            <li>Screen-reader support — labelled controls and live announcements for Copilot replies.</li>
            <li>Text scaling and pinch-to-zoom up to 200% without loss of content.</li>
            <li>Colour contrast that meets AA in both light and dark themes.</li>
            <li>Respect for the system “reduce motion” preference.</li>
          </ul>
          <div className="settings__note">
            <span className="settings__note-icon">
              <Icon name="mail" size={16} />
            </span>
            <span>
              Found an accessibility barrier? Report it to the OPS accessibility team and we’ll
              respond within two business days.
            </span>
          </div>
        </Group>

        <Group title="Account" icon="profile">
          <p className="muted" style={{ margin: '0 0 12px' }}>
            Signed in as <strong>{currentUser?.name ?? '—'}</strong> via Microsoft Entra ID
            single sign-on.
          </p>
          <button className="btn" onClick={signOut}>
            <Icon name="back" size={15} />
            Switch user
          </button>
        </Group>

        <Group title="About" icon="info">
          <p className="muted" style={{ margin: 0 }}>
            ConnectOPS · Prototype for the OGT Summer 2026 workflow challenge. Track: Knowledge
            Retrieval &amp; Information Access.
          </p>
        </Group>
      </div>
    </div>
  );
}

function Group({
  title,
  icon,
  children,
}: {
  title: string;
  icon: IconName;
  children: React.ReactNode;
}) {
  return (
    <section className="card settings__group">
      <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon name={icon} size={17} />
        {title}
      </h3>
      <div style={{ marginTop: 12 }}>{children}</div>
    </section>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked?: boolean;
  onChange?: () => void;
  disabled?: boolean;
}) {
  const interactive = typeof onChange === 'function';
  return (
    <div className="toggle-row">
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingRight: 16 }}>
        <span>{label}</span>
        {description && (
          <span className="muted" style={{ fontSize: 12 }}>
            {description}
          </span>
        )}
      </span>
      <button
        className={`toggle ${checked ? 'on' : ''}`}
        aria-label={label}
        aria-pressed={interactive ? !!checked : undefined}
        onClick={onChange}
        disabled={!interactive || disabled}
      >
        <span className="toggle__knob" />
      </button>
    </div>
  );
}
