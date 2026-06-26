import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Avatar from './Avatar';
import Icon, { type IconName } from './Icon';

// Primary navigation. On desktop this is a persistent left sidebar; on mobile it
// collapses to a bottom tab bar. Order reflects the spec's importance ranking.
// TODO (open question #3): the Messages inbox location is undecided.
const NAV: { to: string; label: string; icon: IconName; end: boolean }[] = [
  { to: '/', label: 'Assistant', icon: 'chat', end: true },
  { to: '/directory', label: 'Directory', icon: 'directory', end: false },
  { to: '/messages', label: 'Messages', icon: 'messages', end: false },
  { to: '/profile', label: 'Profile', icon: 'profile', end: false },
  { to: '/settings', label: 'Settings', icon: 'settings', end: false },
];

export default function TopNav() {
  const { currentUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <>
      {/* Desktop: persistent left sidebar */}
      <aside className="sidebar">
        <NavLink to="/" className="sidebar__brand">
          <span className="sidebar__brand-mark">
            <Icon name="logo" size={17} />
          </span>
          <span className="sidebar__brand-name">ConnectOPS</span>
        </NavLink>

        <nav className="sidebar__nav">
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
            <button className="sidebar__user" onClick={() => navigate('/login')} title="Switch user">
              <Avatar name={currentUser.name} size={32} status={currentUser.status} />
              <span className="sidebar__user-meta">
                <span className="sidebar__user-name">{currentUser.name}</span>
                <span className="sidebar__user-role">{currentUser.title}</span>
              </span>
            </button>
          )}
        </div>
      </aside>

      {/* Mobile bottom tab bar — same items, same order. */}
      <nav className="tabbar">
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
