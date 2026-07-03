import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UserSummary } from '../types';
import { api, getStoredUserId } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import Icon from '../components/Icon';

// Mock login / perspective switcher. No real auth — pick a dummy employee to experience
// the app as them. TODO (production): replace with Microsoft Entra ID / Azure AD via MSAL.
const PERSPECTIVES: { id: number; note: string }[] = [
  { id: 8, note: 'Manager — Digital Services' },
  { id: 1, note: 'Senior employee — Data Analyst' },
  { id: 2, note: 'Co-op student — Web Development' },
  { id: 3, note: 'Manager — Infrastructure' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { switchUser } = useAuth();
  const [all, setAll] = useState<UserSummary[]>([]);
  const [activeId, setActiveId] = useState<number>(getStoredUserId());

  useEffect(() => {
    api.getDirectory().then(setAll).catch(() => setAll([]));
  }, []);

  const choose = async (id: number) => {
    setActiveId(id);
    await switchUser(id);
    navigate('/');
  };

  const byId = (id: number) => all.find((u) => u.id === id);

  return (
    <div className="login">
      <div className="login__inner">
        <div className="login__heading">
          <div className="login__mark">
            <Icon name="logo" size={26} />
          </div>
          <h1 style={{ margin: '0 0 4px' }}>ConnectOPS</h1>
          <p className="muted" style={{ margin: '0 0 10px' }}>
            Ontario Public Service · Choose a perspective to explore the prototype.
          </p>
          <span className="copilot-badge">
            <span className="copilot-badge__icon">
              <Icon name="sparkle" size={13} />
            </span>
            Powered by Microsoft Copilot
          </span>
        </div>

        <div className="profile__section-label">Suggested perspectives</div>
        <div className="user-switch" style={{ marginBottom: 24 }}>
          {PERSPECTIVES.map(({ id, note }) => {
            const u = byId(id);
            if (!u) return null;
            return (
              <button
                key={id}
                className={`user-switch__item ${activeId === id ? 'active' : ''}`}
                onClick={() => choose(id)}
              >
                <Avatar name={u.name} size={38} status={u.status} />
                <div>
                  <div style={{ fontWeight: 600 }}>{u.name}</div>
                  <div className="muted" style={{ fontSize: 13 }}>{note}</div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="profile__section-label">Or pick anyone</div>
        <div className="user-switch">
          {all.map((u) => (
            <button
              key={u.id}
              className={`user-switch__item ${activeId === u.id ? 'active' : ''}`}
              onClick={() => choose(u.id)}
            >
              <Avatar name={u.name} size={32} status={u.status} />
              <div>
                <div style={{ fontWeight: 600 }}>{u.name}</div>
                <div className="muted" style={{ fontSize: 13 }}>
                  {u.title} · {u.ministry}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
