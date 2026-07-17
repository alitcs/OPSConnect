import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthError } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';

// Access to ConnectOPS is exclusively via Microsoft Teams single sign-on — there
// is no email/password sign-up. This screen mocks that flow: the reviewer clicks
// "Sign in with Microsoft Teams" and is signed straight into the seeded John Paul
// (admin) profile after a brief fake SSO handshake.
// TODO (production): replace this mock SSO with Microsoft Entra ID via MSAL.

type Phase = 'idle' | 'connecting';

/** The seeded profile every Teams sign-in lands on (John Paul — admin). */
const ADMIN_EMAIL = 'john.paul@ontario.ca';

// Small Microsoft four-square logo, drawn inline so it renders anywhere.
function MicrosoftLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 21 21" aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginWithTeams } = useAuth();

  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);

  const startTeamsSignIn = () => {
    setError(null);
    setPhase('connecting');
    // Fake the redirect/handshake latency of a real SSO round-trip, then sign in.
    window.setTimeout(async () => {
      try {
        await loginWithTeams(ADMIN_EMAIL);
        navigate('/');
      } catch (err) {
        setError(
          err instanceof AuthError ? err.message : 'Something went wrong. Please try again.',
        );
        setPhase('idle');
      }
    }, 900);
  };

  return (
    <div className="login">
      <div className="login__inner">
        <div className="login__card">
          <div className="login__heading">
            <div className="login__mark">
              <Icon name="logo" size={26} />
            </div>
            <h1 className="login__title">ConnectOPS</h1>
            <p className="login__subtitle" key={phase}>
              Sign in with your Ontario Public Service account.
            </p>
            <span className="copilot-badge">
              <span className="copilot-badge__icon">
                <Icon name="sparkle" size={13} />
              </span>
              Powered by Microsoft Copilot
            </span>
          </div>

          {phase === 'idle' && (
            <div className="teams-auth">
              <button
                type="button"
                className="teams-signin"
                onClick={startTeamsSignIn}
              >
                <MicrosoftLogo size={18} />
                Sign in with Microsoft Teams
              </button>
              <p className="teams-auth__note">
                <Icon name="shield" size={13} />
                Single sign-on with your @ontario.ca work account.
              </p>
              {error && (
                <div className="auth-form__error" role="alert">
                  <Icon name="info" size={15} />
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}

          {phase === 'connecting' && (
            <div className="teams-connecting" role="status" aria-live="polite">
              <span className="teams-connecting__spinner" aria-hidden="true" />
              <p className="teams-connecting__text">Connecting to Microsoft Teams…</p>
            </div>
          )}
        </div>

        <p className="login__footnote">
          <Icon name="shield" size={13} />
          Restricted to Ontario Public Service employees.
        </p>
      </div>
    </div>
  );
}
