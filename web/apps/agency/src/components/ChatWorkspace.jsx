import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCheck,
  FiCheckCircle,
  FiChevronDown,
  FiCopy,
  FiMessageSquare,
  FiMoreVertical,
  FiRefreshCw,
  FiSearch,
  FiSend,
  FiShield,
  FiSmile,
  FiTrash2,
  FiX,
} from 'react-icons/fi';
import { SOCKET_EVENTS } from '@troublefree/types';
import { messagingApi, resolveMediaUrl } from '../lib/api.js';
import { connectMessagingSocket, joinConversation } from '../lib/socket.js';

const EMOJI_CATEGORIES = [
  {
    name: 'Smileys & Expressions',
    items: ['😊', '😂', '😍', '😃', '😎', '😉', '🥰', '🙏', '🙌', '👍', '✌️', '🔥', '✨', '💯', '❤️', '💙'],
  },
  {
    name: 'Travel & Holiday',
    items: ['✈️', '⛵', '🏨', '🏝️', '🏖️', '⛰️', '🏛️', '🗺️', '🧳', '🚘', '🌅', '📸', '📍', '🧭'],
  },
  {
    name: 'Food & Refreshment',
    items: ['☕', '🍵', '🍕', '🍔', '🥗', '🍷', '🍺', '🍹', '🍦', '🍇', '🍉'],
  },
  {
    name: 'Objects & Symbols',
    items: ['💬', '📝', '📅', '⏰', '🎉', '🎁', '💡', '🔑', '⭐', '🌟', '✅', '❌'],
  },
];

function formatTime(timestamp) {
  if (!timestamp) return '';
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return String(timestamp);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return (
      d.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
      ' ' +
      d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
  } catch {
    return String(timestamp);
  }
}

export function ChatWorkspace({ currentUserId, currentUserRole = 'agency' }) {
  const { id: routeConvId } = useParams();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(null);

  const [composerText, setComposerText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTtlMenu, setShowTtlMenu] = useState(false);
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);
  const [copiedMessageId, setCopiedMessageId] = useState(null);

  const [deleteModalMsg, setDeleteModalMsg] = useState(null);
  const [newMessagesBelow, setNewMessagesBelow] = useState(0);

  const viewportRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const actionMenuRef = useRef(null);
  const composerInputRef = useRef(null);

  const activeId = useMemo(() => {
    return routeConvId ? Number(routeConvId) : activeConv ? activeConv.id : null;
  }, [routeConvId, activeConv]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target)) {
        setActiveActionMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadConversations = useCallback(async () => {
    setLoadingConvs(true);
    try {
      const data = await messagingApi.listConversations({ page: 1, pageSize: 100 });
      const list = data.conversations ?? [];
      setConversations(list);

      if (!routeConvId && list.length > 0 && window.innerWidth >= 768) {
        setActiveConv(list[0]);
      }
    } catch (err) {
      setError(err?.message ?? 'Failed to load conversations.');
    } finally {
      setLoadingConvs(false);
    }
  }, [routeConvId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      setActiveConv(null);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoadingMessages(true);
      setError(null);
      setNewMessagesBelow(0);
      try {
        let detail = null;
        try {
          detail = await messagingApi.getConversation(activeId);
        } catch {
          // fallback if getConversation is unmocked or fails
        }
        const history = await messagingApi.listMessages(activeId, { limit: 30 });

        if (cancelled) return;
        const convData = detail ? (detail.conversation ?? detail) : { id: Number(activeId), status: 'active', travelRequestId: Number(activeId) };
        setActiveConv(convData);

        const fetchedMsgs = history.messages ?? [];
        setMessages(fetchedMsgs);
        setHasMore(Boolean(history.pagination?.hasMore));

        try {
          await messagingApi.markRead(activeId);
          setConversations((prev) =>
            prev.map((c) => (c.id === Number(activeId) ? { ...c, unreadCount: 0 } : c)),
          );
        } catch {
          // best-effort
        }

        requestAnimationFrame(() => {
          if (viewportRef.current) {
            viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
          }
        });
      } catch (err) {
        if (!cancelled) setError(err?.message ?? 'Failed to load messages.');
      } finally {
        if (!cancelled) setLoadingMessages(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeId]);

  useEffect(() => {
    if (!activeId) return;
    const socket = connectMessagingSocket();
    joinConversation(socket, Number(activeId));

    const onNewMessage = (payload) => {
      const message = payload?.message;
      if (!message || Number(message.conversationId) !== Number(activeId)) return;

      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });

      const viewport = viewportRef.current;
      if (viewport) {
        const isNearBottom =
          viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 120;
        if (isNearBottom || message.senderUserId === Number(currentUserId)) {
          requestAnimationFrame(() => {
            if (viewportRef.current) {
              viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
            }
          });
        } else {
          setNewMessagesBelow((count) => count + 1);
        }
      }

      setConversations((prev) =>
        prev.map((c) =>
          c.id === Number(activeId)
            ? { ...c, lastMessage: message, updatedAt: message.createdAt || new Date().toISOString() }
            : c,
        ),
      );
    };

    const onDeletedMessage = (payload) => {
      if (Number(payload?.conversationId) !== Number(activeId)) return;
      const { messageId, mode } = payload;
      setMessages((prev) =>
        prev
          .map((m) => {
            if (m.id !== messageId) return m;
            if (mode === 'everyone') {
              return { ...m, body: 'This message was deleted', isDeletedForEveryone: true };
            }
            return m;
          })
          .filter((m) => !(mode === 'me' && payload.userId === currentUserId)),
      );
    };

    const onRead = (payload) => {
      if (Number(payload?.conversationId) !== Number(activeId)) return;
      setMessages((prev) =>
        prev.map((m) => (m.senderUserId === Number(currentUserId) ? { ...m, readAt: new Date().toISOString() } : m)),
      );
    };

    socket.on(SOCKET_EVENTS.MESSAGE, onNewMessage);
    socket.on(SOCKET_EVENTS.DELETED, onDeletedMessage);
    socket.on(SOCKET_EVENTS.READ, onRead);

    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE, onNewMessage);
      socket.off(SOCKET_EVENTS.DELETED, onDeletedMessage);
      socket.off(SOCKET_EVENTS.READ, onRead);
    };
  }, [activeId, currentUserId]);

  const oldestMessageId = useMemo(() => {
    return messages.length > 0 ? messages[0].id : null;
  }, [messages]);

  const loadOlderMessages = async () => {
    if (loadingOlder || !hasMore || !oldestMessageId || !activeId) return;
    setLoadingOlder(true);

    const viewport = viewportRef.current;
    const oldScrollHeight = viewport ? viewport.scrollHeight : 0;
    const oldScrollTop = viewport ? viewport.scrollTop : 0;

    try {
      const history = await messagingApi.listMessages(activeId, {
        limit: 30,
        before: oldestMessageId,
      });
      const olderItems = history.messages ?? [];
      setHasMore(Boolean(history.pagination?.hasMore));

      if (olderItems.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const filteredNew = olderItems.filter((m) => !existingIds.has(m.id));
          return [...filteredNew, ...prev];
        });

        requestAnimationFrame(() => {
          if (viewportRef.current) {
            const newScrollHeight = viewportRef.current.scrollHeight;
            viewportRef.current.scrollTop = newScrollHeight - oldScrollHeight + oldScrollTop;
          }
        });
      }
    } catch (err) {
      console.error('Failed to load older messages:', err);
    } finally {
      setLoadingOlder(false);
    }
  };

  const handleViewportScroll = (e) => {
    const target = e.currentTarget;
    if (target.scrollTop < 60 && hasMore && !loadingOlder) {
      loadOlderMessages();
    }
    const isAtBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 40;
    if (isAtBottom && newMessagesBelow > 0) {
      setNewMessagesBelow(0);
    }
  };

  const scrollToBottom = () => {
    setNewMessagesBelow(0);
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const text = composerText.trim();
    if (!text || !activeId) return;

    setComposerText('');
    setShowEmojiPicker(false);

    try {
      const response = await messagingApi.sendMessage(activeId, { body: text });
      const sentMsg = response.message ?? response;
      if (sentMsg?.id) {
        setMessages((prev) =>
          prev.some((m) => m.id === sentMsg.id) ? prev : [...prev, sentMsg],
        );
        requestAnimationFrame(() => scrollToBottom());

        setConversations((prev) =>
          prev.map((c) =>
            c.id === Number(activeId)
              ? { ...c, lastMessage: sentMsg, updatedAt: sentMsg.createdAt || new Date().toISOString() }
              : c,
          ),
        );
      }
    } catch (err) {
      setError(err?.message ?? 'Failed to send message.');
    }
  };

  const confirmDeleteMessage = async (mode) => {
    if (!deleteModalMsg || !activeId) return;
    const msgId = deleteModalMsg.id;
    setDeleteModalMsg(null);

    try {
      await messagingApi.deleteMessage(activeId, msgId, mode);
      if (mode === 'everyone') {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId ? { ...m, body: 'This message was deleted', isDeletedForEveryone: true } : m,
          ),
        );
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== msgId));
      }
    } catch (err) {
      setError(err?.message ?? 'Could not delete message.');
    }
  };

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase().trim();
    return conversations.filter((c) => {
      const partnerName = (c.traveller?.firstName || c.agency?.agencyName || '').toLowerCase();
      const reqId = String(c.travelRequestId || '');
      const convIdStr = String(c.id || '');
      const lastText = (c.lastMessage?.body || '').toLowerCase();
      return partnerName.includes(q) || reqId.includes(q) || convIdStr.includes(q) || lastText.includes(q);
    });
  }, [conversations, searchQuery]);

  const partnerInfo = useMemo(() => {
    if (!activeConv) return { name: 'Conversation', avatarUrl: null, avatarInitial: 'C', subtitle: '' };
    const traveller = activeConv.traveller ?? {};
    const name =
      traveller.displayName ||
      (traveller.firstName ? `${traveller.firstName} ${traveller.lastName || ''}`.trim() : traveller.name) ||
      `Traveller #${activeConv.travellerId}`;
    const rawAvatar = traveller.avatarUrl || traveller.profilePicture || traveller.picture;
    const avatarUrl = resolveMediaUrl(rawAvatar);
    const subtitle = `Request #${activeConv.travelRequestId}`;
    return { name, avatarUrl, avatarInitial: name.charAt(0).toUpperCase(), subtitle };
  }, [activeConv]);

  return (
    <div
      className="qmt-chat-workspace-container"
      style={{
        display: 'flex',
        height: '100%',
        width: '100%',
        flex: 1,
        minHeight: 0,
        background: '#FFFBF3',
        borderRadius: '16px',
        border: '1px solid #E2DCD1',
        boxShadow: '0 4px 20px rgba(12, 78, 40, 0.06)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Sidebar Panel */}
      <div
        className={`qmt-chat-sidebar ${routeConvId ? 'qmt-chat-sidebar-mobile-hidden' : ''}`}
        style={{
          width: '340px',
          flexShrink: 0,
          borderRight: '1px solid #E2DCD1',
          background: '#FBF9F5',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid #E2DCD1', background: '#FFFFFF' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0C4E28', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiMessageSquare size={20} style={{ color: '#FC7C00' }} /> Messages
            </h2>
            <button
              type="button"
              onClick={loadConversations}
              title="Refresh conversations"
              style={{ background: 'none', border: 'none', color: '#4E5754', cursor: 'pointer', padding: '4px' }}
            >
              <FiRefreshCw size={14} />
            </button>
          </div>

          <div style={{ position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#717D79', fontSize: '14px' }} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                borderRadius: '8px',
                border: '1px solid #E2DCD1',
                fontSize: '0.85rem',
                background: '#FBF9F5',
                outline: 'none',
                color: '#13291C',
                boxSizing: 'border-box',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#717D79', cursor: 'pointer' }}
              >
                <FiX size={14} />
              </button>
            )}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
          {loadingConvs ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#717D79', fontSize: '0.9rem' }}>
              Loading conversations...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#717D79' }}>
              <FiMessageSquare size={32} style={{ color: '#BAC4BF', marginBottom: '8px' }} />
              <p style={{ margin: 0, fontSize: '0.88rem' }}>
                {searchQuery ? 'No conversations found' : 'No active conversations yet'}
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = activeId === conv.id;
              const partnerName =
                conv.traveller?.displayName ||
                (conv.traveller?.firstName ? `${conv.traveller.firstName} ${conv.traveller.lastName || ''}`.trim() : conv.traveller?.name) ||
                `Traveller #${conv.travellerId}`;
              const rawAvatar = conv.traveller?.avatarUrl || conv.traveller?.profilePicture || conv.traveller?.picture;
              const avatarUrl = resolveMediaUrl(rawAvatar);
              const initial = partnerName.charAt(0).toUpperCase();

              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    setActiveConv(conv);
                    navigate(`/messages/${conv.id}`);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    marginBottom: '6px',
                    cursor: 'pointer',
                    background: isSelected ? '#E5F2EA' : '#FFFFFF',
                    border: `1px solid ${isSelected ? '#147D33' : '#E2DCD1'}`,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={partnerName}
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        flexShrink: 0,
                        border: `1px solid ${isSelected ? '#147D33' : '#E2DCD1'}`,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        background: isSelected ? '#0C4E28' : '#E5F2EA',
                        color: isSelected ? '#FFFFFF' : '#147D33',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1rem',
                        flexShrink: 0,
                      }}
                    >
                      {initial}
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#13291C', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        Conversation #{conv.id}
                      </span>
                      {conv.lastMessage && (
                        <span style={{ fontSize: '0.72rem', color: '#717D79', flexShrink: 0 }}>
                          {formatTime(conv.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: '#4E5754', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                        {partnerName} • Request #{conv.travelRequestId}
                      </span>

                      {conv.unreadCount > 0 && (
                        <span
                          style={{
                            background: '#FC7C00',
                            color: '#fff',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '2px 7px',
                            borderRadius: '10px',
                            marginLeft: '6px',
                            flexShrink: 0,
                          }}
                        >
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Panel */}
      <div
        className="qmt-chat-main-panel"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          background: '#FFFBF3',
          minWidth: 0,
        }}
      >
        {activeId && activeConv ? (
          <>
            <div
              style={{
                padding: '12px 20px',
                background: '#FFFFFF',
                borderBottom: '1px solid #E2DCD1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                <button
                  type="button"
                  className="qmt-chat-mobile-back"
                  onClick={() => navigate('/messages')}
                  style={{
                    background: '#E5F2EA',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px',
                    color: '#0C4E28',
                    cursor: 'pointer',
                    display: 'none',
                  }}
                >
                  <FiArrowLeft size={16} />
                </button>

                {partnerInfo.avatarUrl ? (
                  <img
                    src={partnerInfo.avatarUrl}
                    alt={partnerInfo.name}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      flexShrink: 0,
                      border: '1px solid #E2DCD1',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: '#0C4E28',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1rem',
                      flexShrink: 0,
                    }}
                  >
                    {partnerInfo.avatarInitial}
                  </div>
                )}

                <div style={{ minWidth: 0 }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#13291C', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {partnerInfo.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#4E5754' }}>
                    <span>{partnerInfo.subtitle}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: activeConv.presence?.isOnline ? '#22C55E' : '#9CA3AF',
                          display: 'inline-block',
                        }}
                      />
                      <span style={{ color: activeConv.presence?.isOnline ? '#15803D' : '#6B7280' }}>
                        {activeConv.presence?.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setShowTtlMenu((prev) => !prev)}
                    title="Disappearing messages TTL"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: '#F5FAF7',
                      border: '1px solid #E2DCD1',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#0C4E28',
                      cursor: 'pointer',
                    }}
                  >
                    ⏱️ Disappearing: {
                      activeConv.disappearingTtl === 86400
                        ? '24h'
                        : activeConv.disappearingTtl === 604800
                        ? '7d'
                        : activeConv.disappearingTtl === 2592000
                        ? '30d'
                        : 'Off'
                    }
                  </button>
                  {showTtlMenu && (
                    <div
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: '100%',
                        marginTop: '4px',
                        background: '#FFF',
                        border: '1px solid #E2DCD1',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        zIndex: 50,
                        minWidth: '130px',
                        padding: '4px 0',
                      }}
                    >
                      {[
                        { label: 'Off', val: 0 },
                        { label: '24 hours', val: 86400 },
                        { label: '7 days', val: 604800 },
                        { label: '30 days', val: 2592000 },
                      ].map((opt) => (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={async () => {
                            setShowTtlMenu(false);
                            try {
                              await messagingApi.updateDisappearingTtl(activeConv.id, opt.val);
                              setActiveConv((prev) => ({ ...prev, disappearingTtl: opt.val }));
                            } catch (e) {
                              setError(e?.message || 'Failed to update TTL');
                            }
                          }}
                          style={{
                            display: 'block',
                            width: '100%',
                            textAlign: 'left',
                            padding: '6px 12px',
                            background: (activeConv.disappearingTtl || 0) === opt.val ? '#E5F2EA' : 'transparent',
                            border: 'none',
                            fontSize: '0.8rem',
                            color: '#13291C',
                            fontWeight: (activeConv.disappearingTtl || 0) === opt.val ? 700 : 400,
                            cursor: 'pointer',
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: '12px',
                    background: activeConv.status === 'active' ? '#E5F2EA' : '#F2EFE9',
                    color: activeConv.status === 'active' ? '#0C4E28' : '#717D79',
                    border: '1px solid #E2DCD1',
                  }}
                >
                  {activeConv.status?.toUpperCase() || 'ACTIVE'}
                </span>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                style={{
                  padding: '8px 16px',
                  background: '#FDF2F2',
                  color: '#D32F2F',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #F8B4B4',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FiAlertCircle /> {error}
                </span>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  style={{ background: 'none', border: 'none', color: '#D32F2F', cursor: 'pointer' }}
                >
                  <FiX size={14} />
                </button>
              </div>
            )}

            <div
              ref={viewportRef}
              onScroll={handleViewportScroll}
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                position: 'relative',
              }}
            >
              <div
                style={{
                  background: '#FFF8EC',
                  border: '1px solid #F5D399',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '0.82rem',
                  color: '#8A5200',
                  margin: '0 0 4px',
                }}
              >
                <FiShield size={16} style={{ color: '#FC7C00', flexShrink: 0 }} />
                <span>
                  <strong>Protected Communication:</strong> Direct contact numbers, emails, and external links are masked until a quotation is accepted.
                </span>
              </div>

              {loadingOlder && (
                <div style={{ textAlign: 'center', padding: '8px 0', fontSize: '0.8rem', color: '#717D79' }}>
                  Loading older messages...
                </div>
              )}

              {loadingMessages && messages.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#717D79', fontSize: '0.9rem' }}>
                  Loading chat history...
                </div>
              ) : messages.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#717D79', margin: 'auto' }}>
                  <FiMessageSquare size={36} style={{ color: '#BAC4BF', marginBottom: '8px' }} />
                  <h4 style={{ margin: '0 0 4px', color: '#13291C' }}>Start a conversation</h4>
                  <p style={{ margin: 0, fontSize: '0.88rem' }}>
                    Send a message to begin communicating about this travel request.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.senderUserId === Number(currentUserId);
                  const isDeleted = msg.isDeletedForEveryone;

                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMine ? 'flex-end' : 'flex-start',
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          maxWidth: '72%',
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          flexDirection: isMine ? 'row-reverse' : 'row',
                        }}
                      >
                        <div
                          style={{
                            padding: '10px 14px',
                            borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                            background: isMine
                              ? 'linear-gradient(135deg, #0C4E28 0%, #147D33 100%)'
                              : '#FFFFFF',
                            color: isMine ? '#FFFFFF' : '#13291C',
                            border: isMine ? 'none' : '1px solid #E2DCD1',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                            wordBreak: 'break-word',
                            lineHeight: 1.45,
                            fontSize: '0.92rem',
                            fontStyle: isDeleted ? 'italic' : 'normal',
                            opacity: isDeleted ? 0.8 : 1,
                          }}
                        >
                          <p style={{ margin: 0 }}>{msg.body}</p>
                        </div>

                        {!isDeleted && (
                          <div style={{ position: 'relative' }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveActionMenuId(activeActionMenuId === msg.id ? null : msg.id);
                              }}
                              title="Message options"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#717D79',
                                cursor: 'pointer',
                                padding: '4px',
                                opacity: 0.7,
                              }}
                            >
                              <FiMoreVertical size={14} />
                            </button>

                            {activeActionMenuId === msg.id && (
                              <div
                                ref={actionMenuRef}
                                style={{
                                  position: 'absolute',
                                  top: '24px',
                                  [isMine ? 'right' : 'left']: 0,
                                  background: '#FFFFFF',
                                  border: '1px solid #E2DCD1',
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                                  zIndex: 30,
                                  minWidth: '150px',
                                  padding: '4px 0',
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(msg.body);
                                    setCopiedMessageId(msg.id);
                                    setTimeout(() => setCopiedMessageId(null), 1500);
                                    setActiveActionMenuId(null);
                                  }}
                                  style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '8px 12px',
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '0.82rem',
                                    color: '#13291C',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                  }}
                                >
                                  {copiedMessageId === msg.id ? (
                                    <>
                                      <FiCheck size={14} style={{ color: '#147D33' }} /> Copied!
                                    </>
                                  ) : (
                                    <>
                                      <FiCopy size={14} /> Copy text
                                    </>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveActionMenuId(null);
                                    setDeleteModalMsg({ ...msg, defaultMode: 'me' });
                                  }}
                                  style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '8px 12px',
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '0.82rem',
                                    color: '#4E5754',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                  }}
                                >
                                  <FiTrash2 size={14} /> Delete for me
                                </button>

                                {isMine && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveActionMenuId(null);
                                      setDeleteModalMsg({ ...msg, defaultMode: 'everyone' });
                                    }}
                                    style={{
                                      width: '100%',
                                      textAlign: 'left',
                                      padding: '8px 12px',
                                      background: 'none',
                                      border: 'none',
                                      fontSize: '0.82rem',
                                      color: '#D32F2F',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                    }}
                                  >
                                    <FiTrash2 size={14} /> Delete for everyone
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.72rem',
                          color: '#717D79',
                          marginTop: '3px',
                        }}
                      >
                        <span>{formatTime(msg.createdAt)}</span>
                        {isMine && !isDeleted && (
                          <span
                            title={msg.readAt ? 'Read' : 'Delivered'}
                            style={{ color: msg.readAt ? '#147D33' : '#717D79', display: 'inline-flex', alignItems: 'center' }}
                          >
                            {msg.readAt ? <FiCheckCircle size={12} /> : <FiCheck size={12} />}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {newMessagesBelow > 0 && (
                <button
                  type="button"
                  onClick={scrollToBottom}
                  style={{
                    position: 'sticky',
                    bottom: '12px',
                    alignSelf: 'center',
                    background: '#0C4E28',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    zIndex: 10,
                  }}
                >
                  <span>{newMessagesBelow} new message{newMessagesBelow > 1 ? 's' : ''}</span>
                  <FiChevronDown size={14} />
                </button>
              )}
            </div>

            <div
              style={{
                padding: '12px 18px',
                background: '#FFFFFF',
                borderTop: '1px solid #E2DCD1',
                position: 'relative',
              }}
            >
              {showEmojiPicker && (
                <div
                  ref={emojiPickerRef}
                  style={{
                    position: 'absolute',
                    bottom: '68px',
                    left: '18px',
                    background: '#FFFFFF',
                    border: '1px solid #E2DCD1',
                    borderRadius: '14px',
                    boxShadow: '0 6px 24px rgba(0,0,0,0.14)',
                    padding: '12px',
                    width: '290px',
                    maxHeight: '260px',
                    overflowY: 'auto',
                    zIndex: 40,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #E2DCD1' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0C4E28' }}>Choose Emoji</span>
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(false)}
                      style={{ background: 'none', border: 'none', color: '#717D79', cursor: 'pointer' }}
                    >
                      <FiX size={14} />
                    </button>
                  </div>

                  {EMOJI_CATEGORIES.map((cat) => (
                    <div key={cat.name} style={{ marginBottom: '10px' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#717D79', marginBottom: '4px' }}>
                        {cat.name}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {cat.items.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              setComposerText((prev) => prev + emoji);
                              composerInputRef.current?.focus();
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              fontSize: '1.2rem',
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '4px',
                              lineHeight: 1,
                            }}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleSendMessage} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  title="Add Emoji"
                  style={{
                    background: showEmojiPicker ? '#E5F2EA' : 'transparent',
                    border: 'none',
                    color: showEmojiPicker ? '#0C4E28' : '#717D79',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FiSmile size={20} />
                </button>

                <input
                  ref={composerInputRef}
                  type="text"
                  placeholder="Type a message... (Press Enter to send)"
                  aria-label="Message"
                  value={composerText}
                  onChange={(e) => setComposerText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  style={{
                    flex: 1,
                    border: '1px solid #E2DCD1',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    fontSize: '0.92rem',
                    outline: 'none',
                    background: '#FBF9F5',
                    color: '#13291C',
                  }}
                />

                <button
                  type="submit"
                  disabled={!composerText.trim()}
                  style={{
                    background: composerText.trim()
                      ? 'linear-gradient(135deg, #0C4E28 0%, #147D33 100%)'
                      : '#E2DCD1',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px 18px',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: composerText.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>Send</span>
                  <FiSend size={14} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#717D79', margin: 'auto' }}>
            <FiMessageSquare size={48} style={{ color: '#BAC4BF', marginBottom: '12px' }} />
            <h3 style={{ margin: '0 0 6px', color: '#13291C' }}>Select a conversation</h3>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>
              Choose a conversation from the list to start messaging.
            </p>
          </div>
        )}
      </div>

      {deleteModalMsg && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '400px',
              width: '100%',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            }}
          >
            <h3 style={{ margin: '0 0 8px', color: '#13291C', fontSize: '1.15rem' }}>
              Delete Message?
            </h3>
            <p style={{ margin: '0 0 20px', color: '#4E5754', fontSize: '0.9rem', lineHeight: 1.4 }}>
              {deleteModalMsg.defaultMode === 'everyone'
                ? 'This message will be removed for both you and the other participant.'
                : 'This message will be hidden from your conversation view only.'}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setDeleteModalMsg(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #E2DCD1',
                  background: '#FFFFFF',
                  color: '#13291C',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => confirmDeleteMessage(deleteModalMsg.defaultMode)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#D32F2F',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
