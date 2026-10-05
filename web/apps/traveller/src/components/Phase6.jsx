// Traveller messaging + job components (Phase 6, presentational).

import { Link } from 'react-router-dom';
import { StatusBadge } from '@troublefree/ui';
import {
  FiMessageSquare,
  FiSend,
  FiUser,
  FiClock,
  FiCheck,
  FiCheckCircle,
  FiShield,
  FiBriefcase,
  FiMapPin,
  FiMail,
  FiPhone,
  FiArrowRight,
} from 'react-icons/fi';

function formatTime(timestamp) {
  if (!timestamp) return '';
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return timestamp;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return timestamp;
  }
}

export function ConversationCard({ conversation }) {
  if (!conversation) return null;
  const agency = conversation.agency ?? {};
  const agencyName = agency.agencyName ?? 'Partner Agency';
  const initial = agencyName.charAt(0).toUpperCase();

  return (
    <li
      className="tf-card"
      style={{
        background: '#fff',
        borderRadius: '12px',
        border: '1px solid var(--tf-portal-border, #E2DCD1)',
        padding: '16px 20px',
        marginBottom: '12px',
        listStyle: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'var(--tf-portal-green-soft, #E5F2EA)',
            color: 'var(--tf-portal-green, #147D33)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '1.1rem',
            flexShrink: 0,
          }}
        >
          {initial}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Link
              to={`/messages/${conversation.id}`}
              style={{
                fontWeight: 700,
                fontSize: '1rem',
                color: 'var(--tf-portal-text-primary, #13291C)',
                textDecoration: 'none',
              }}
            >
              Conversation #{conversation.id}
            </Link>
            <StatusBadge status={conversation.status} />
            {conversation.unreadCount ? (
              <span
                style={{
                  background: '#FC7C00',
                  color: '#fff',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                }}
              >
                ({conversation.unreadCount} unread)
              </span>
            ) : null}
          </div>

          <div
            style={{
              fontSize: '0.85rem',
              color: 'var(--tf-portal-text-muted, #4E5754)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '2px',
            }}
          >
            <span style={{ fontWeight: 600, color: 'var(--tf-portal-text-primary, #13291C)' }}>
              {agencyName}
            </span>
            {agency.city && <span>• {agency.city}</span>}
            {conversation.travelRequestId && (
              <span>• Request #{conversation.travelRequestId}</span>
            )}
          </div>

          {conversation.lastMessage ? (
            <p
              style={{
                margin: 0,
                fontSize: '0.85rem',
                color: '#56625B',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {conversation.lastMessage.body}
            </p>
          ) : null}
        </div>
      </div>

      <Link
        to={`/messages/${conversation.id}`}
        style={{
          padding: '8px 16px',
          background: 'var(--tf-portal-green-soft, #E5F2EA)',
          color: 'var(--tf-portal-green, #147D33)',
          borderRadius: '8px',
          fontWeight: 600,
          fontSize: '0.85rem',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span>Open</span>
        <FiArrowRight size={14} />
      </Link>
    </li>
  );
}

export function MessageList({ messages, currentUserId }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Contact Protection Banner */}
      <div
        style={{
          background: '#FFF8EC',
          border: '1px solid #F5D399',
          borderRadius: '10px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '0.85rem',
          color: '#8A5200',
        }}
      >
        <FiShield size={18} style={{ color: '#FC7C00', flexShrink: 0 }} />
        <span>
          <strong>Contact Protection Active:</strong> Direct phone numbers, emails, WhatsApp, and external links are protected until your quotation is accepted.
        </span>
      </div>

      {!messages || messages.length === 0 ? (
        <div
          style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: 'var(--tf-portal-text-muted, #4E5754)',
          }}
        >
          <FiMessageSquare size={36} style={{ color: '#BAC4BF', marginBottom: '8px' }} />
          <p style={{ margin: 0, fontSize: '0.95rem' }}>No messages yet. Send a message to start the conversation.</p>
        </div>
      ) : (
        <ul
          className="tf-messages"
          aria-label="Messages"
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {messages.map((message) => {
            const isMine = message.senderUserId === currentUserId;
            const timeStr = formatTime(message.createdAt);

            return (
              <li
                key={message.id}
                className={`tf-message${isMine ? ' tf-message-mine' : ''}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isMine ? 'flex-end' : 'flex-start',
                  maxWidth: '100%',
                }}
              >
                <div
                  style={{
                    maxWidth: '72%',
                    padding: '12px 16px',
                    borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: isMine ? 'var(--tf-portal-green, #147D33)' : '#F2EFE9',
                    color: isMine ? '#FFFFFF' : 'var(--tf-portal-text-primary, #13291C)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                    wordBreak: 'break-word',
                    lineHeight: 1.45,
                    fontSize: '0.92rem',
                  }}
                >
                  <p style={{ margin: 0 }}>{message.body}</p>
                </div>

                <div
                  className="tf-message-meta"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.72rem',
                    color: '#717D79',
                    marginTop: '4px',
                    padding: '0 4px',
                  }}
                >
                  {timeStr && <span>{timeStr}</span>}
                  {isMine && message.readAt && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: '#147D33' }}>
                      • <FiCheck size={12} /> Read
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function MessageComposer({ onSend, disabled = false }) {
  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.elements['body'];
    const body = input?.value?.trim();
    if (!body) return;
    await onSend(body);
    form.reset();
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.currentTarget.form.requestSubmit();
    }
  }

  return (
    <form
      className="tf-composer"
      onSubmit={handleSubmit}
      aria-label="Send a message"
      style={{
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
        padding: '14px',
        background: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid var(--tf-portal-border, #E2DCD1)',
        marginTop: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
    >
      <input
        id="message-body"
        name="body"
        className="tf-input"
        placeholder="Write a message… (Press Enter to send)"
        disabled={disabled}
        aria-label="Message"
        onKeyDown={handleKeyDown}
        style={{
          flex: 1,
          border: 'none',
          outline: 'none',
          fontSize: '0.92rem',
          padding: '8px 12px',
          background: 'transparent',
          color: 'var(--tf-portal-text-primary, #13291C)',
        }}
      />
      <button
        type="submit"
        className="tf-btn tf-btn-primary"
        disabled={disabled}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '10px 18px',
          borderRadius: '8px',
          background: 'var(--tf-portal-green, #147D33)',
          color: '#fff',
          fontWeight: 600,
          border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        <span>Send</span>
        <FiSend size={14} />
      </button>
    </form>
  );
}

export function JobListView({ jobs }) {
  if (!jobs || jobs.length === 0) {
    return (
      <div
        style={{
          padding: '48px 24px',
          textAlign: 'center',
          background: '#fff',
          borderRadius: '12px',
          border: '1px solid var(--tf-portal-border, #E2DCD1)',
        }}
      >
        <FiBriefcase size={36} style={{ color: '#BAC4BF', marginBottom: '8px' }} />
        <p style={{ margin: 0, color: 'var(--tf-portal-text-muted, #4E5754)' }}>No active trips or jobs yet.</p>
      </div>
    );
  }

  return (
    <ul className="tf-list" aria-label="Jobs" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {jobs.map((job) => {
        const agency = job.agency ?? {};
        return (
          <li
            key={job.id}
            className="tf-card"
            style={{
              background: '#fff',
              borderRadius: '12px',
              border: '1px solid var(--tf-portal-border, #E2DCD1)',
              padding: '20px 24px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <Link
                  to={`/jobs/${job.id}`}
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    color: 'var(--tf-portal-green, #147D33)',
                    textDecoration: 'none',
                  }}
                >
                  Job #{job.id}
                </Link>
                <StatusBadge status={job.status} />
              </div>

              <div style={{ color: 'var(--tf-portal-text-muted, #4E5754)', fontSize: '0.88rem', marginBottom: '4px' }}>
                Request #{job.travelRequestId} — Quotation #{job.quotationId}
              </div>

              {agency.agencyName && (
                <div style={{ fontSize: '0.85rem', color: '#13291C', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FiBriefcase size={14} style={{ color: '#147D33' }} />
                  <span>Agency: <strong>{agency.agencyName}</strong></span>
                </div>
              )}
            </div>

            <Link
              to={`/jobs/${job.id}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: 'var(--tf-portal-green, #147D33)',
                color: '#fff',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.85rem',
                textDecoration: 'none',
              }}
            >
              <span>View Job Details</span>
              <FiArrowRight size={14} />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function JobDetailView({ job, onStatusChange }) {
  if (!job) return <p>No job found.</p>;
  const agency = job.agency ?? {};

  const stages = [
    { key: 'accepted', label: 'Accepted' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'completed', label: 'Completed' },
  ];

  const getStageIndex = (st) => {
    if (st === 'in_progress') return 1;
    if (st === 'completed') return 2;
    if (st === 'cancelled') return -1;
    return 0; // accepted
  };

  const currentStageIdx = getStageIndex(job.status);

  return (
    <section className="tf-card" aria-label="Job detail" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: '0 0 6px', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>Job #{job.id}</span>
            <StatusBadge status={job.status} />
          </h2>
          <div style={{ color: 'var(--tf-portal-text-muted, #4E5754)', fontSize: '0.9rem' }}>
            Request #{job.travelRequestId} — Quotation #{job.quotationId}
          </div>
        </div>
      </div>

      {/* Visual Status Progression */}
      {job.status !== 'cancelled' ? (
        <div
          style={{
            background: '#FBF9F5',
            border: '1px solid var(--tf-portal-border, #E2DCD1)',
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4E5754', marginBottom: '16px', textTransform: 'uppercase' }}>
            Trip Lifecycle Progress
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            {stages.map((stage, idx) => {
              const isPast = idx < currentStageIdx;
              const isCurrent = idx === currentStageIdx;
              const color = isPast || isCurrent ? '#147D33' : '#BAC4BF';

              return (
                <div key={stage.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', zIndex: 1 }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: isCurrent ? '#147D33' : isPast ? '#E5F2EA' : '#F0EDE8',
                      color: isCurrent ? '#fff' : isPast ? '#147D33' : '#717D79',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      border: `2px solid ${color}`,
                    }}
                  >
                    {isPast ? <FiCheck size={16} /> : idx + 1}
                  </div>
                  <span
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: isCurrent ? 700 : 500,
                      color: isCurrent ? '#147D33' : '#4E5754',
                    }}
                  >
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{ background: '#FDF2F2', border: '1px solid #D32F2F', borderRadius: '10px', padding: '16px', color: '#D32F2F' }}>
          This job was cancelled.
        </div>
      )}

      {/* Agency Details Card */}
      <div
        style={{
          background: '#fff',
          border: '1px solid var(--tf-portal-border, #E2DCD1)',
          borderRadius: '12px',
          padding: '20px',
        }}
      >
        <h3 style={{ margin: '0 0 12px', fontSize: '1.05rem', color: 'var(--tf-portal-text-primary, #13291C)' }}>
          Agency & Contact Information
        </h3>
        <p style={{ margin: '0 0 10px', fontSize: '0.9rem' }}>
          Agency: {agency.agencyName ?? '—'}
          {agency.businessEmail ? ` — ${agency.businessEmail}` : ''}
          {agency.phone ? ` — ${agency.phone}` : ''}
          {agency.contactPerson ? ` (${agency.contactPerson})` : ''}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.88rem', color: '#4E5754' }}>
          {agency.businessEmail && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <FiMail style={{ color: '#147D33' }} /> {agency.businessEmail}
            </span>
          )}
          {agency.phone && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <FiPhone style={{ color: '#147D33' }} /> {agency.phone}
            </span>
          )}
          {agency.contactPerson && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <FiUser style={{ color: '#147D33' }} /> {agency.contactPerson}
            </span>
          )}
        </div>
      </div>

      {/* Status Transition Action Buttons */}
      {onStatusChange ? (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px' }}>
          <button
            type="button"
            className="tf-btn tf-btn-secondary"
            onClick={() => onStatusChange('in_progress')}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              background: '#0C4E28',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Start trip
          </button>
          <button
            type="button"
            className="tf-btn tf-btn-primary"
            onClick={() => onStatusChange('completed')}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              background: '#147D33',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Complete trip
          </button>
          <button
            type="button"
            className="tf-btn tf-btn-ghost"
            onClick={() => onStatusChange('cancelled')}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              background: 'transparent',
              color: '#D32F2F',
              border: '1px solid #D32F2F',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Cancel job
          </button>
        </div>
      ) : null}
    </section>
  );
}
