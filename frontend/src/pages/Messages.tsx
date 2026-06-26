// TODO (Section 8.4): This in-app messaging feature is planned but MAY BE CUT if the team
// decides the app should only facilitate discovery, not conversation. It is built as a
// self-contained module (Messages page + MessageInbox + MessageThread + /api/messages) so
// it can be removed cleanly without affecting other features. To remove: delete this page,
// the two message components, the messages route in App.tsx, and the Messages nav item.

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { MessageThreadSummary, UserSummary } from '../types';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import MessageInbox from '../components/MessageInbox';
import MessageThread, { threadKeyFor } from '../components/MessageThread';

export default function MessagesPage() {
  const { currentUser } = useAuth();
  const { threadId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const toParam = searchParams.get('to');

  const [threads, setThreads] = useState<MessageThreadSummary[]>([]);
  const [activeUser, setActiveUser] = useState<UserSummary | null>(null);

  const loadThreads = () => api.listThreads().then(setThreads).catch(() => setThreads([]));

  useEffect(() => {
    loadThreads();
  }, [currentUser?.id]);

  // Resolve the active conversation partner from either ?to=<userId> or /messages/:threadId.
  useEffect(() => {
    if (toParam) {
      api
        .getUser(Number(toParam))
        .then((u) =>
          setActiveUser({
            id: u.id,
            name: u.name,
            title: u.title,
            team: u.team,
            ministry: u.ministry,
            location: u.location,
            status: u.status,
          }),
        )
        .catch(() => setActiveUser(null));
    } else if (threadId) {
      const found = threads.find((t) => t.id === threadId);
      if (found?.participant) setActiveUser(found.participant);
    } else {
      setActiveUser(null);
    }
  }, [toParam, threadId, threads]);

  const activeThreadId = useMemo(
    () => (currentUser && activeUser ? threadKeyFor(currentUser.id, activeUser.id) : null),
    [currentUser, activeUser],
  );

  const selectThread = (t: MessageThreadSummary) => {
    if (t.participant) setActiveUser(t.participant);
    setSearchParams({});
    navigate(`/messages/${t.id}`);
  };

  const back = () => {
    setActiveUser(null);
    setSearchParams({});
    navigate('/messages');
  };

  return (
    <div className="messages">
      <MessageInbox
        threads={threads}
        activeThreadId={activeThreadId}
        onSelect={selectThread}
        className={activeUser ? 'hidden-mobile' : ''}
      />

      {activeUser ? (
        <MessageThread otherUser={activeUser} onSent={loadThreads} onBack={back} />
      ) : (
        <div className="messages__thread messages__empty">
          Select a conversation, or message someone from their profile.
        </div>
      )}
    </div>
  );
}
