// Agency conversation list (Phase 6).

import { useEffect, useState } from 'react';
import { ConversationList } from '@troublefree/ui';
import { messagingApi } from '../lib/api.js';
import { ConversationCard } from '../components/Phase6.jsx';

export function MessagesPage() {
  const [conversations, setConversations] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await messagingApi.listConversations({ page: 1, pageSize: 20 });
        if (!cancelled) setConversations(data.conversations ?? []);
      } catch (e) {
        if (!cancelled) setError(e?.message ?? 'Failed to load messages.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="tf-page">
      <h1>Messages</h1>
      {error && <p role="alert">{error}</p>}
      {conversations.length > 0 ? (
        <ul className="tf-list" aria-label="Conversations">
          {conversations.map((conversation) => (
            <ConversationCard key={conversation.id} conversation={conversation} />
          ))}
        </ul>
      ) : (
        <ConversationList conversations={conversations} />
      )}
    </main>
  );
}
