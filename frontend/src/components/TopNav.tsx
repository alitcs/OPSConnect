import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Avatar from './Avatar';
import Icon, { type IconName } from './Icon';

// Primary navigation. On desktop this is a persistent left sidebar; on mobile it
// collapses to a bottom tab bar.
const NAV: { to: string; label: string; icon: IconName; end: boolean }[] = [
  { to: '/', label: 'Copilot', icon: 'sparkle', end: true },
  { to: '/directory', label: 'Directory', icon: 'directory', end: false },
  { to: '/messages', label: 'Messages', icon: 'messages', end: false },
  { to: '/profile', label: 'Profile', icon: 'profile', end: false },
  { to: '/settings', label: 'Settings', icon: 'settings', end: false },
];

export default function TopNav() {
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      {/* Desktop: persistent left sidebar */}
      <aside className="sidebar" aria-label="Primary">
        <NavLink to="/" className="sidebar__brand" aria-label="ConnectOPS home">
          <span className="sidebar__brand-row">
            <span className="sidebar__brand-mark">
              <Icon name="logo" size={17} />
            </span>
            <span className="sidebar__brand-name">ConnectOPS</span>
          </span>
          <span className="sidebar__brand-sub">Ontario Public Service</span>
        </NavLink>

        <nav className="sidebar__nav" aria-label="Main navigation">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `sidebar__link ${isActive ? 'active' : ''}`}
            >
              <span className="sidebar__link-icon">
                <Icon name={item.icon} size={18} />
              </span>
              <span className="sidebar__link-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <button
            className="sidebar__footer-btn"
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            <span className="sidebar__link-icon">
              <Icon name={theme === 'light' ? 'moon' : 'sun'} size={18} />
            </span>
            <span className="sidebar__link-label">
              {theme === 'light' ? 'Dark mode' : 'Light mode'}
            </span>
          </button>

          {currentUser && (
            <button className="sidebar__user" onClick={() => navigate('/profile')} title="View your profile">
              <Avatar name={currentUser.name} size={32} status={currentUser.status} />
              <span className="sidebar__user-meta">
                <span className="sidebar__user-name">{currentUser.name}</span>
                <span className="sidebar__user-role">{currentUser.title}</span>
              </span>
            </button>
          )}

          <button className="sidebar__footer-btn" onClick={handleLogout} title="Log out">
            <span className="sidebar__link-icon">
              <Icon name="back" size={18} />
            </span>
            <span className="sidebar__link-label">Log out</span>
          </button>
        </div>
      </aside>

      {/* Mobile bottom tab bar — same items, same order. */}
      <nav className="tabbar" aria-label="Main navigation">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `tabbar__link ${isActive ? 'active' : ''}`}
          >
            <Icon name={item.icon} size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
