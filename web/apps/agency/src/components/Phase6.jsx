// Agency messaging + job components (Phase 6, presentational).

import { Link } from 'react-router-dom';
import { StatusBadge } from '@troublefree/ui';
import {
  FiMessageSquare,
  FiSend,
  FiBriefcase,
  FiUser,
  FiClock,
  FiCheckCircle,
  FiPlay,
  FiCheck,
  FiXCircle,
  FiMapPin,
  FiMail,
  FiPhone,
} from 'react-icons/fi';

export function ConversationCard({ conversation }) {
  if (!conversation) return null;
  const traveller = conversation.traveller ?? {};
  const label = traveller.firstName
    ? `${traveller.firstName}${traveller.lastName ? ` ${traveller.lastName}` : ''}`
    : `Request #${conversation.travelRequestId}`;

  return (
    <li
      className="agency-section-card"
      style={{
        padding: '1.25rem 1.5rem',
        marginBottom: '0.85rem',
        listStyle: 'none',
        transition: 'all 0.2s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.6rem',
        }}
      >
        <Link
          to={`/messages/${conversation.id}`}
          style={{
            fontWeight: 800,
            fontSize: '1.05rem',
            color: 'var(--agency-primary)',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <FiMessageSquare style={{ color: 'var(--agency-secondary)' }} />
          Conversation #{conversation.id}
        </Link>
        <StatusBadge status={conversation.status} />
      </div>

      <p
        style={{
          margin: '0 0 0.4rem',
          fontWeight: 600,
          fontSize: '0.92rem',
          color: 'var(--agency-text)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
        }}
      >
        <FiUser style={{ color: 'var(--agency-text-muted)' }} />
        {label}
        {conversation.unreadCount ? (
          <span
            style={{
              background: 'var(--agency-accent)',
              color: '#ffffff',
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '0.15rem 0.5rem',
              borderRadius: '999px',
              marginLeft: '0.4rem',
            }}
          >
            ({conversation.unreadCount} unread)
          </span>
        ) : null}
      </p>

      {conversation.lastMessage ? (
        <p
          style={{
            margin: 0,
            fontSize: '0.85rem',
            color: 'var(--agency-text-muted)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {conversation.lastMessage.body}
        </p>
      ) : null}
    </li>
  );
}

export function MessageList({ messages, currentUserId }) {
  if (!messages || messages.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--agency-text-muted)' }}>
        <FiMessageSquare
          style={{ fontSize: '2rem', color: 'var(--agency-text-light)', marginBottom: '0.5rem' }}
        />
        <p style={{ margin: 0, fontSize: '0.95rem' }}>
          No messages yet. Send a message below to start the conversation.
        </p>
      </div>
    );
  }

  return (
    <ul
      className="agency-chat-messages-container"
      aria-label="Messages"
      style={{ listStyle: 'none', margin: 0 }}
    >
      {messages.map((message) => {
        const isMine = message.senderUserId === currentUserId;
        const formattedDate = message.createdAt
          ? new Date(message.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })
          : '';

        return (
          <li
            key={message.id}
            className={`agency-chat-bubble ${
              isMine ? 'agency-chat-bubble-outgoing' : 'agency-chat-bubble-incoming'
            }`}
          >
            <p style={{ margin: 0, fontSize: '0.95rem' }}>{message.body}</p>
            <div className="agency-chat-bubble-meta">
              <span>{formattedDate}</span>
              {message.readAt && <span>✓✓</span>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function MessageComposer({ onSend, disabled = false }) {
  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const body = new FormData(form).get('body')?.toString().trim();
    if (!body) return;
    await onSend(body);
    form.reset();
  }

  return (
    <form className="agency-chat-composer" onSubmit={handleSubmit} aria-label="Send a message">
      <input
        id="message-body"
        name="body"
        className="agency-input"
        placeholder="Write a message to traveller…"
        disabled={disabled}
        aria-label="Message"
        style={{ flex: 1 }}
      />
      <button
        type="submit"
        className="agency-btn agency-btn-primary"
        disabled={disabled}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.65rem 1.4rem',
        }}
      >
        <FiSend /> Send
      </button>
    </form>
  );
}

export function JobListView({ jobs }) {
  if (!jobs || jobs.length === 0) {
    return (
      <div className="agency-empty-state">
        <FiBriefcase className="agency-empty-icon" />
        <h3 className="agency-empty-title">No jobs yet</h3>
        <p className="agency-empty-subtitle">Accepted travel bookings will appear here.</p>
      </div>
    );
  }

  return (
    <ul
      className="agency-requests-stack"
      aria-label="Jobs"
      style={{ listStyle: 'none', padding: 0, margin: 0 }}
    >
      {jobs.map((job) => (
        <li
          key={job.id}
          className="agency-section-card"
          style={{
            padding: '1.25rem 1.5rem',
            marginBottom: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.4rem',
              }}
            >
              <Link
                to={`/jobs/${job.id}`}
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  color: 'var(--agency-primary)',
                  textDecoration: 'none',
                }}
              >
                Job #{job.id}
              </Link>
              <StatusBadge status={job.status} />
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--agency-text-muted)' }}>
              Request #{job.travelRequestId} — Quotation #{job.quotationId}
            </p>
          </div>

          <Link
            to={`/jobs/${job.id}`}
            className="agency-btn agency-btn-secondary"
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
          >
            View Details
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function JobDetailView({ job, onStatusChange }) {
  if (!job) return <p className="agency-empty-state">No job found.</p>;
  const traveller = job.traveller ?? {};
  const status = job.status ?? 'accepted';

  return (
    <section className="agency-section-card" aria-label="Job detail" style={{ padding: '1.75rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.25rem',
          paddingBottom: '1.25rem',
          borderBottom: '1px solid var(--agency-border)',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: '1.4rem',
            fontWeight: 800,
            color: 'var(--agency-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
          }}
        >
          Job #{job.id} <StatusBadge status={job.status} />
        </h2>
        <span style={{ fontSize: '0.9rem', color: 'var(--agency-text-muted)' }}>
          Request #{job.travelRequestId} — Quotation #{job.quotationId}
        </span>
      </div>

      {/* Operational Status Timeline */}
      <div className="agency-timeline" style={{ marginBottom: '2rem' }}>
        <div className={`agency-timeline-step ${status === 'accepted' ? 'active' : 'completed'}`}>
          <div className="agency-timeline-icon">
            <FiCheckCircle />
          </div>
          <span className="agency-timeline-label">Accepted</span>
        </div>

        <div
          style={{
            flex: 1,
            height: '2px',
            background: status !== 'accepted' ? 'var(--agency-secondary)' : 'var(--agency-border)',
            margin: '0 0.5rem',
          }}
        />

        <div
          className={`agency-timeline-step ${status === 'in_progress' ? 'active' : status === 'completed' ? 'completed' : ''}`}
        >
          <div className="agency-timeline-icon">
            <FiPlay />
          </div>
          <span className="agency-timeline-label">In Progress</span>
        </div>

        <div
          style={{
            flex: 1,
            height: '2px',
            background: status === 'completed' ? 'var(--agency-secondary)' : 'var(--agency-border)',
            margin: '0 0.5rem',
          }}
        />

        <div className={`agency-timeline-step ${status === 'completed' ? 'completed' : ''}`}>
          <div className="agency-timeline-icon">
            <FiCheck />
          </div>
          <span className="agency-timeline-label">Completed</span>
        </div>
      </div>

      {/* Revealed Traveller Info */}
      <div
        style={{
          background: 'var(--agency-surface-subtle)',
          border: '1px solid var(--agency-border-subtle)',
          borderRadius: 'var(--agency-radius-lg)',
          padding: '1.25rem',
          marginBottom: '1.5rem',
        }}
      >
        <h3
          style={{
            margin: '0 0 0.75rem',
            fontSize: '1rem',
            fontWeight: 700,
            color: 'var(--agency-text)',
          }}
        >
          Confirmed Traveller Details
        </h3>
        <p style={{ margin: '0 0 0.4rem', fontSize: '0.92rem', color: 'var(--agency-text)' }}>
          Traveller:{' '}
          <strong>
            {traveller.firstName || 'Not specified'}
            {traveller.lastName ? ` ${traveller.lastName}` : ''}
          </strong>
          {traveller.email ? ` — ${traveller.email}` : ''}
          {traveller.phone ? ` — ${traveller.phone}` : ''}
        </p>
      </div>

      {/* Status Action Buttons */}
      {onStatusChange ? (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--agency-border)',
          }}
        >
          {status === 'accepted' && (
            <button
              type="button"
              className="agency-btn agency-btn-accent"
              onClick={() => onStatusChange('in_progress')}
            >
              <FiPlay /> Start trip
            </button>
          )}

          {status === 'in_progress' && (
            <button
              type="button"
              className="agency-btn agency-btn-primary"
              onClick={() => onStatusChange('completed')}
            >
              <FiCheck /> Complete trip
            </button>
          )}

          {status !== 'completed' && status !== 'cancelled' && (
            <button
              type="button"
              className="agency-btn"
              style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' }}
              onClick={() => onStatusChange('cancelled')}
            >
              <FiXCircle /> Cancel job
            </button>
          )}
        </div>
      ) : null}
    </section>
  );
}
