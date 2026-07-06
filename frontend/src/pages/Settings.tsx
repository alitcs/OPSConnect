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
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [messageAlerts, setMessageAlerts] = useState(true);
  const [announcements, setAnnouncements] = useState(false);

  const floorShared = !!currentUser?.floorPublic;
  const seatShared = !!currentUser?.seatPublic;
  const messagePrivacy = currentUser?.messagePrivacy ?? 'everyone';

  const setLocation = async (patch: { floorPublic?: boolean; seatPublic?: boolean }) => {
    if (!currentUser || savingLocation) return;
    setSavingLocation(true);
    try {
      await api.updateUser(currentUser.id, patch);
      await refresh();
      notify('Your location sharing preferences were updated.', 'success');
    } catch {
      notify('Could not update your location sharing preference.', 'error');
    } finally {
      setSavingLocation(false);
    }
  };

  const toggleFloor = () => setLocation({ floorPublic: !floorShared });
  // Sharing an exact seat only makes sense alongside a shared floor.
  const toggleSeat = () =>
    setLocation(!seatShared ? { seatPublic: true, floorPublic: true } : { seatPublic: false });

  const setMessagePrivacy = async (value: 'everyone' | 'ministry' | 'none') => {
    if (!currentUser || savingPrivacy || value === messagePrivacy) return;
    setSavingPrivacy(true);
    try {
      await api.updateUser(currentUser.id, { messagePrivacy: value });
      await refresh();
    } catch {
      notify('Could not update your messaging preference.', 'error');
    } finally {
      setSavingPrivacy(false);
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
            label="Share my floor"
            description="Let colleagues see which floor you're on. Powers “who's nearby” on Connect."
            checked={floorShared}
            onChange={toggleFloor}
            disabled={savingLocation || !currentUser}
          />
          <ToggleRow
            label="Share my exact seat"
            description="Show your desk on the office map. Turning this on also shares your floor."
            checked={seatShared}
            onChange={toggleSeat}
            disabled={savingLocation || !currentUser}
          />

          <div className="settings__control">
            <div className="settings__control-head">
              <span>Who can message me</span>
              <span className="muted" style={{ fontSize: 12 }}>
                Applies to first messages only — existing chats always continue.
              </span>
            </div>
            <div className="segmented" role="group" aria-label="Who can message me">
              {(
                [
                  ['everyone', 'Everyone'],
                  ['ministry', 'My ministry'],
                  ['none', 'No one'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={`segmented__option ${messagePrivacy === value ? 'active' : ''}`}
                  aria-pressed={messagePrivacy === value}
                  onClick={() => setMessagePrivacy(value)}
                  disabled={savingPrivacy}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="visibility-preview">
            <div className="visibility-preview__head">
              <Icon name="profile" size={15} />
              What others can see about you
            </div>
            <ul className="visibility-preview__list">
              <li>
                <Icon name={floorShared ? 'check' : 'x'} size={14} />
                {floorShared ? `Your floor (${currentUser?.floor ?? '—'})` : 'Your floor is hidden'}
              </li>
              <li>
                <Icon name={seatShared ? 'check' : 'x'} size={14} />
                {seatShared ? `Your desk (${currentUser?.seat ?? '—'})` : 'Your exact desk is hidden'}
              </li>
              <li>
                <Icon name={messagePrivacy === 'none' ? 'x' : 'check'} size={14} />
                {messagePrivacy === 'everyone'
                  ? 'Anyone in the OPS can message you'
                  : messagePrivacy === 'ministry'
                    ? 'Only people in your ministry can message you'
                    : 'No one can start a new message with you'}
              </li>
            </ul>
          </div>

          <div className="settings__note">
            <span className="settings__note-icon">
              <Icon name="info" size={16} />
            </span>
            <span>
              <strong>How your data is used.</strong> Copilot runs inside the OPS
              Microsoft&nbsp;365 tenant — your data never leaves the OPS boundary or trains
              external models. You only see what each colleague makes public.
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
