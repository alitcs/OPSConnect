import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ALLOWED_DOMAIN, AuthError, DEMO_ADMIN, isOntarioEmail } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';

// Access is restricted to Ontario Public Service accounts — only "@ontario.ca"
// email addresses may sign up or log in.
// TODO (production): replace this mock auth with Microsoft Entra ID / Azure AD via MSAL.

type Mode = 'login' | 'signup';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, signup } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const emailEntered = email.trim().length > 0;
  const emailValid = isOntarioEmail(email);
  const isSignup = mode === 'signup';

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
    setError(null);
    setPassword('');
    setShowPassword(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isSignup && !name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!emailValid) {
      setError(`Please use your @${ALLOWED_DOMAIN} email address.`);
      return;
    }
    if (isSignup && password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setSubmitting(true);
    try {
      if (isSignup) {
        await signup({ name, email, password });
      } else {
        await login({ email, password });
      }
      navigate('/');
    } catch (err) {
      setError(
        err instanceof AuthError ? err.message : 'Something went wrong. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoAdmin = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await login({ email: DEMO_ADMIN.email, password: DEMO_ADMIN.password });
      navigate('/');
    } catch (err) {
      setError(
        err instanceof AuthError ? err.message : 'Something went wrong. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
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
            <p className="login__subtitle" key={mode}>
              {isSignup
                ? 'Create your Ontario Public Service account.'
                : 'Welcome back. Sign in to continue.'}
            </p>
            <span className="copilot-badge">
              <span className="copilot-badge__icon">
                <Icon name="sparkle" size={13} />
              </span>
              Powered by Microsoft Copilot
            </span>
          </div>

          <div
            className="auth-tabs"
            role="tablist"
            aria-label="Log in or sign up"
            data-active={isSignup ? 'signup' : 'login'}
          >
            <button
              type="button"
              role="tab"
              aria-selected={!isSignup}
              className={`auth-tabs__tab ${!isSignup ? 'active' : ''}`}
              onClick={() => switchMode('login')}
            >
              Log in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={isSignup}
              className={`auth-tabs__tab ${isSignup ? 'active' : ''}`}
              onClick={() => switchMode('signup')}
            >
              Sign up
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {isSignup && (
              <label className="auth-form__field auth-form__field--enter">
                <span className="auth-form__label">Full name</span>
                <input
                  className="auth-form__input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jordan Lee"
                  autoComplete="name"
                  required
                />
              </label>
            )}

            <label className="auth-form__field">
              <span className="auth-form__label">Work email</span>
              <input
                className={`auth-form__input ${emailEntered && !emailValid ? 'invalid' : ''}`}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={`jordan.lee@${ALLOWED_DOMAIN}`}
                autoComplete="email"
                aria-invalid={emailEntered && !emailValid}
                required
              />
              <span className={`auth-form__hint ${emailEntered && !emailValid ? 'error' : ''}`}>
                {emailEntered && !emailValid
                  ? `Only @${ALLOWED_DOMAIN} addresses are allowed.`
                  : `Use your @${ALLOWED_DOMAIN} email address.`}
              </span>
            </label>

            <label className="auth-form__field">
              <span className="auth-form__label">Password</span>
              <div className="auth-form__password">
                <input
                  className="auth-form__input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isSignup ? 'At least 8 characters' : 'Your password'}
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  minLength={isSignup ? 8 : undefined}
                  required
                />
                <button
                  type="button"
                  className="auth-form__reveal"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-pressed={showPassword}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>

            {error && (
              <div className="auth-form__error" role="alert">
                <Icon name="info" size={15} />
                <span>{error}</span>
              </div>
            )}

            <button className="auth-form__submit" type="submit" disabled={submitting}>
              {submitting ? (
                <span className="auth-form__spinner" aria-hidden="true" />
              ) : isSignup ? (
                'Create account'
              ) : (
                'Log in'
              )}
            </button>
          </form>

          <p className="auth-switch">
            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              className="auth-switch__link"
              onClick={() => switchMode(isSignup ? 'login' : 'signup')}
            >
              {isSignup ? 'Log in' : 'Sign up'}
            </button>
          </p>

          <div className="auth-demo">
            <span className="auth-demo__label">Just exploring?</span>
            <button
              type="button"
              className="auth-demo__btn"
              onClick={handleDemoAdmin}
              disabled={submitting}
            >
              <Icon name="sparkle" size={14} />
              Sign in as demo admin
            </button>
          </div>
        </div>

        <p className="login__footnote">
          <Icon name="shield" size={13} />
          Restricted to Ontario Public Service employees.
        </p>
      </div>
    </div>
  );
}
