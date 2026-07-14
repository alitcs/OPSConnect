import { useEffect, useState } from 'react';

// Teams-style startup splash. Shows once per full app load: a blank, theme-aware
// backdrop with the ConnectOPS mark drawing itself in, followed by the wordmark.
// Self-manages its own fade-out and calls onDone when it should unmount.
export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const holdMs = reduce ? 700 : 2050;
    const fadeMs = reduce ? 260 : 620;

    const leaveTimer = window.setTimeout(() => setLeaving(true), holdMs);
    const doneTimer = window.setTimeout(onDone, holdMs + fadeMs);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div
      className={`splash ${leaving ? 'splash--leaving' : ''}`}
      role="status"
      aria-live="polite"
      aria-label="Loading ConnectOPS"
    >
      <div className="splash__stage">
        <svg
          className="splash__mark"
          viewBox="0 0 24 24"
          width="80"
          height="80"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {/* Connecting lines — drawn in first */}
          <path className="splash__link splash__link--1" d="m15.41 6.51-6.82 3.98" />
          <path className="splash__link splash__link--2" d="m8.59 13.51 6.83 3.98" />
          {/* Nodes — pop in after */}
          <circle className="splash__node splash__node--1" cx="18" cy="5" r="3" />
          <circle className="splash__node splash__node--2" cx="6" cy="12" r="3" />
          <circle className="splash__node splash__node--3" cx="18" cy="19" r="3" />
        </svg>

        <div className="splash__wordmark" aria-hidden="true">
          <span className="splash__word splash__word--1">Connect</span>
          <span className="splash__word splash__word--2">OPS</span>
        </div>
      </div>
    </div>
  );
}
