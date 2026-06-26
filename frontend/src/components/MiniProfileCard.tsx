import type { UserSummary } from '../types';
import { usePreviewCard } from '../context/PreviewCardContext';
import Avatar from './Avatar';

// Step 1 of the universal flow: a compact, tappable card. Tapping it opens the
// preview card (step 2). Used inline in chat and in the directory list — identical
// behavior in both contexts.
export default function MiniProfileCard({
  person,
  rationale,
}: {
  person: UserSummary;
  rationale?: string;
}) {
  const { openPreview } = usePreviewCard();

  return (
    <button
      type="button"
      className="mini-card"
      onClick={() => openPreview(person.id)}
    >
      <Avatar name={person.name} size={38} status={person.status} />
      <div className="mini-card__body">
        <div className="mini-card__name">{person.name}</div>
        <div className="mini-card__meta">
          {person.title} · {person.team}
        </div>
        {rationale && <div className="mini-card__rationale">{rationale}</div>}
      </div>
    </button>
  );
}
