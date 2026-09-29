// Traveller messaging + job components (Phase 6, presentational).

import { Link } from 'react-router-dom';
import { StatusBadge } from '@troublefree/ui';

export function ConversationCard({ conversation }) {
  if (!conversation) return null;
  const agency = conversation.agency ?? {};
  return (
    <li className="tf-card">
      <Link to={`/messages/${conversation.id}`}>Conversation #{conversation.id}</Link>{' '}
      <StatusBadge status={conversation.status} />
      <p>
        {agency.agencyName ?? 'Agency'}
        {agency.city ? `, ${agency.city}` : ''}
        {conversation.unreadCount ? ` (${conversation.unreadCount} unread)` : ''}
      </p>
      {conversation.lastMessage ? <p>{conversation.lastMessage.body}</p> : null}
    </li>
  );
}

export function MessageList({ messages, currentUserId }) {
  if (!messages || messages.length === 0) return <p>No messages yet.</p>;
  return (
    <ul className="tf-messages" aria-label="Messages">
      {messages.map((message) => (
        <li
          key={message.id}
          className={`tf-message${message.senderUserId === currentUserId ? ' tf-message-mine' : ''}`}
        >
          <p>{message.body}</p>
          <p className="tf-message-meta">
            {message.messageType ?? 'text'} — {message.createdAt ?? ''}
            {message.readAt ? ' — read' : ''}
          </p>
        </li>
      ))}
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
    <form className="tf-composer" onSubmit={handleSubmit} aria-label="Send a message">
      <input
        id="message-body"
        name="body"
        className="tf-input"
        placeholder="Write a message…"
        disabled={disabled}
        aria-label="Message"
      />
      <button type="submit" className="tf-btn tf-btn-primary" disabled={disabled}>
        Send
      </button>
    </form>
  );
}

export function JobListView({ jobs }) {
  if (!jobs || jobs.length === 0) return <p>No jobs yet.</p>;
  return (
    <ul className="tf-list" aria-label="Jobs">
      {jobs.map((job) => (
        <li key={job.id} className="tf-card">
          <Link to={`/jobs/${job.id}`}>Job #{job.id}</Link> <StatusBadge status={job.status} />
          <p>
            Request #{job.travelRequestId} — Quotation #{job.quotationId}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function JobDetailView({ job, onStatusChange }) {
  if (!job) return <p>No job found.</p>;
  const agency = job.agency ?? {};
  return (
    <section className="tf-card" aria-label="Job detail">
      <h2>
        Job #{job.id} <StatusBadge status={job.status} />
      </h2>
      <p>
        Request #{job.travelRequestId} — Quotation #{job.quotationId}
      </p>
      <p>
        Agency: {agency.agencyName ?? '—'}
        {agency.businessEmail ? ` — ${agency.businessEmail}` : ''}
        {agency.phone ? ` — ${agency.phone}` : ''}
        {agency.contactPerson ? ` (${agency.contactPerson})` : ''}
      </p>
      {onStatusChange ? (
        <div>
          <button
            type="button"
            className="tf-btn tf-btn-secondary"
            onClick={() => onStatusChange('in_progress')}
          >
            Start trip
          </button>{' '}
          <button
            type="button"
            className="tf-btn tf-btn-primary"
            onClick={() => onStatusChange('completed')}
          >
            Complete trip
          </button>{' '}
          <button
            type="button"
            className="tf-btn tf-btn-ghost"
            onClick={() => onStatusChange('cancelled')}
          >
            Cancel job
          </button>
        </div>
      ) : null}
    </section>
  );
}
