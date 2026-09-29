// Traveller conversation thread (Phase 6): history + send (REST),
// live reception (Socket.IO), mark read.

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SOCKET_EVENTS } from '@troublefree/types';
import { messagingApi } from '../lib/api.js';
import { connectMessagingSocket, joinConversation } from '../lib/socket.js';
import { MessageComposer, MessageList } from '../components/Phase6.jsx';
import { useAuth } from '../features/auth/auth-context.js';

export function ConversationDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const detail = await messagingApi.getConversation(id);
        const history = await messagingApi.listMessages(id);
        if (cancelled) return;
        setConversation(detail.conversation ?? detail);
        setMessages(history.messages ?? []);
        try {
          await messagingApi.markRead(id);
        } catch {
          // Read receipts are best-effort.
        }
      } catch (e) {
        if (!cancelled) setError(e?.message ?? 'Failed to load conversation.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const appendMessage = useCallback((message) => {
    setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
  }, []);

  useEffect(() => {
    const socket = connectMessagingSocket();
    joinConversation(socket, Number(id));
    const onMessage = (payload) => {
      const message = payload?.message;
      if (message && Number(message.conversationId) === Number(id)) appendMessage(message);
    };
    socket.on(SOCKET_EVENTS.MESSAGE, onMessage);
    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE, onMessage);
    };
  }, [id, appendMessage]);

  async function handleSend(body) {
    try {
      const data = await messagingApi.sendMessage(id, { body });
      const message = data.message ?? data;
      if (message?.id) appendMessage(message);
    } catch (e) {
      setError(e?.message ?? 'Failed to send message.');
    }
  }

  return (
    <main className="tf-page">
      <h1>Conversation #{id}</h1>
      {error && <p role="alert">{error}</p>}
      {conversation ? <p>Request #{conversation.travelRequestId}</p> : null}
      <MessageList messages={messages} currentUserId={user?.id} />
      <MessageComposer onSend={handleSend} />
    </main>
  );
}
