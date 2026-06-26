import type { ActivityStatus } from '../types';

const CLASS: Record<ActivityStatus, string> = {
  Online: 'status-dot--online',
  Away: 'status-dot--away',
  Offline: 'status-dot--offline',
  'Do Not Disturb': 'status-dot--dnd',
};

export default function StatusDot({
  status,
  className = '',
}: {
  status: ActivityStatus;
  className?: string;
}) {
  return (
    <span
      className={`status-dot ${CLASS[status]} ${className}`}
      title={status}
      aria-label={status}
    />
  );
}
