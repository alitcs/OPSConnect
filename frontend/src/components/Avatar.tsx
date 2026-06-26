import type { ActivityStatus } from '../types';
import StatusDot from './StatusDot';

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// A small palette of solid, friendly colors. Each person gets a stable color
// derived from their name so avatars are colorful but consistent.
const COLORS = [
  '#e5484d', // red
  '#ff5da2', // pink
  '#1fb6ff', // sky
  '#13c296', // teal
  '#ff8a3d', // orange
  '#f0476b', // rose
  '#3b82f6', // blue
  '#0fb5ba', // cyan
  '#e9b949', // amber
  '#16a34a', // green
];

function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function Avatar({
  name,
  size = 40,
  status,
}: {
  name: string;
  size?: number;
  status?: ActivityStatus;
}) {
  const color = colorFor(name);
  return (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: color,
        color: '#fff',
      }}
    >
      {initials(name)}
      {status && <StatusDot status={status} className="avatar__status" />}
    </div>
  );
}
