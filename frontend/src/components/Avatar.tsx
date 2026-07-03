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

// A small palette of solid, professional tones. Each person gets a stable color
// derived from their name so avatars are distinct but consistent.
const COLORS = [
  '#0f6cbd', // Ontario blue
  '#00a4b4', // teal
  '#2f6f4f', // forest
  '#3b5bdb', // indigo
  '#0c7d8c', // deep cyan
  '#5a4bb3', // slate purple
  '#1f7a5a', // green
  '#b45309', // amber-brown
  '#0e639c', // steel blue
  '#6b4d8f', // muted violet
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
