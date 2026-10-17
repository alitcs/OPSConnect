import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Avatar from './Avatar';
import Icon, { type IconName } from './Icon';
import GlobalSearch, { GlobalSearchTrigger } from './GlobalSearch';
import NotificationCenter from './NotificationCenter';

// Primary navigation. On desktop this is a persistent left sidebar; on mobile it
// collapses to a bottom tab bar.
const NAV: { to: string; label: string; icon: IconName; end: boolean; adminOnly?: boolean }[] = [
  { to: '/', label: 'Copilot', icon: 'sparkle', end: true },
  { to: '/dashboard', label: 'Dashboard', icon: 'layers', end: false },
  { to: '/connect', label: 'Connect', icon: 'coffee', end: false },
  { to: '/people', label: 'People', icon: 'directory', end: false },
  { to: '/messages', label: 'Messages', icon: 'messages', end: false },
  { to: '/knowledge', label: 'Knowledge Hub', icon: 'bookOpen', end: false },
  { to: '/invite', label: 'Invite', icon: 'teams', end: false },
  { to: '/profile', label: 'Profile', icon: 'profile', end: false },
  { to: '/admin', label: 'Insights', icon: 'chart', end: false, adminOnly: true },
  { to: '/settings', label: 'Settings', icon: 'settings', end: false },
];

export default function TopNav() {
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const moreDialogRef = useRef<HTMLElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const moreCloseRef = useRef<HTMLButtonElement>(null);

  const navItems = NAV.filter((item) => !item.adminOnly || currentUser?.isAdmin);
  // The desktop sidebar already shows the user's avatar in the footer (which opens their
  // profile), so the Profile nav link there is redundant — hide it on desktop but keep it
  // in the mobile tab bar, where there is no footer avatar.
  const desktopNav = navItems.filter((item) => item.to !== '/profile');
  const mobilePrimaryRoutes = new Set(['/dashboard', '/people', '/connect', '/knowledge', '/']);
  const mobileNav = ['/dashboard', '/people', '/connect', '/knowledge', '/']
    .map((route) => navItems.find((item) => item.to === route))
    .filter((item): item is (typeof NAV)[number] => Boolean(item));
  const moreNav = navItems.filter((item) => !mobilePrimaryRoutes.has(item.to));
  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
        setMoreOpen(false);
      }
      if (event.key === 'Escape') setMoreOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!moreOpen) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusTimer = window.setTimeout(() => moreCloseRef.current?.focus(), 0);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMoreOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(moreDialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? []);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !moreDialogRef.current?.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !moreDialogRef.current?.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus();
    };
  }, [moreOpen]);

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
          {desktopNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={item.label}
              className={({ isActive }) => `sidebar__link ${isActive ? 'active' : ''}`}
            >
              <span className="sidebar__link-icon">
                <Icon name={item.icon} size={20} />
              </span>
              <span className="sidebar__link-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <GlobalSearchTrigger onOpen={openSearch} className="sidebar__footer-btn" />
          <NotificationCenter />
          <button
            type="button"
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
            <button type="button" className="sidebar__user" onClick={() => navigate('/profile')} title="View your profile">
              <Avatar name={currentUser.name} size={32} status={currentUser.status} />
              <span className="sidebar__user-meta">
                <span className="sidebar__user-name">{currentUser.name}</span>
                <span className="sidebar__user-role">{currentUser.title}</span>
              </span>
            </button>
          )}

          <button type="button" className="sidebar__footer-btn" onClick={handleLogout} title="Log out">
            <span className="sidebar__link-icon">
              <Icon name="back" size={18} />
            </span>
            <span className="sidebar__link-label">Log out</span>
          </button>
        </div>
      </aside>

      {/* Mobile keeps the most-used workspaces in reach and moves secondary tools into More. */}
      <nav className="tabbar" aria-label="Main navigation">
        {mobileNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            aria-label={item.label}
            className={({ isActive }) => `tabbar__link ${isActive ? 'active' : ''}`}
          >
            <Icon name={item.icon} size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
        <button
          type="button"
          ref={moreButtonRef}
          className={`tabbar__link tabbar__link--more ${moreOpen ? 'active' : ''}`}
          onClick={() => setMoreOpen((open) => !open)}
          aria-label="More navigation and tools"
          aria-expanded={moreOpen}
        >
          <Icon name="layers" size={20} />
          <span>More</span>
        </button>
      </nav>

      {moreOpen && (
        <div className="mobile-more-backdrop" onClick={(event) => { if (event.target === event.currentTarget) setMoreOpen(false); }}>
          <section ref={moreDialogRef} className="mobile-more" role="dialog" aria-modal="true" aria-label="More navigation and tools" tabIndex={-1}>
            <header className="mobile-more__header">
              <h2>More</h2>
              <button type="button" ref={moreCloseRef} className="icon-btn" onClick={() => setMoreOpen(false)} aria-label="Close menu"><Icon name="x" size={17} /></button>
            </header>
            <div className="mobile-more__utilities">
              <GlobalSearchTrigger onOpen={() => { openSearch(); setMoreOpen(false); }} className="mobile-more__utility" />
              <NotificationCenter className="notification-center--mobile" />
            </div>
            <nav aria-label="More destinations">
              {moreNav.map((item) => (
                <NavLink key={item.to} to={item.to} onClick={() => setMoreOpen(false)} className={({ isActive }) => `mobile-more__link ${isActive ? 'active' : ''}`}>
                  <Icon name={item.icon} size={17} /> {item.label}
                </NavLink>
              ))}
              <button type="button" className="mobile-more__link" onClick={() => { setMoreOpen(false); handleLogout(); }}>
                <Icon name="back" size={17} /> Log out
              </button>
            </nav>
          </section>
        </div>
      )}

      <GlobalSearch open={searchOpen} onClose={closeSearch} />
    </>
  );
}
