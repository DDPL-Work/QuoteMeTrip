// @troublefree/ui — shared presentational components (Phase 1 & Phase 6).
//
// Plain presentational building blocks shared by Traveller, Agency, and Admin apps.
// No data fetching, no auth, no routing side effects — apps pass props and handlers.

import React from 'react';
import { FiLoader, FiFolder, FiAlertTriangle } from 'react-icons/fi';
import { STATUS_BADGE_TONES } from './theme.js';

function toneFor(status) {
  return STATUS_BADGE_TONES[status] ?? 'neutral';
}

export function AppHeader({ brand = 'QuoteMeTrip', links = [], userLabel, onSignOut }) {
  return (
    <header className="tf-header">
      <span className="tf-header-brand">
        Troublefree <span>Holiday</span>
        <span className="tf-sr-only">{brand}</span>
      </span>
      <nav aria-label="Primary">
        {links.map((link) => (
          <a key={link.to} href={link.to}>
            {link.label}
          </a>
        ))}
      </nav>
      <div>
        {userLabel ? <span>{userLabel} </span> : null}
        {onSignOut ? (
          <button type="button" className="tf-btn tf-btn-ghost" onClick={onSignOut}>
            Sign out
          </button>
        ) : null}
      </div>
    </header>
  );
}

export function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  loading = false,
  disabled = false,
  children,
  className = '',
  type = 'button',
  ...props
}) {
  const sizeClass = size !== 'md' ? ` tf-btn-${size}` : '';
  const blockClass = block ? ' tf-btn-block' : '';
  const fullClassName = `tf-btn tf-btn-${variant}${sizeClass}${blockClass}${className ? ` ${className}` : ''}`;

  return (
    <button type={type} disabled={disabled || loading} className={fullClassName} {...props}>
      {loading ? (
        <span
          className="tf-btn-spinner"
          aria-hidden="true"
          style={{ marginRight: '6px', display: 'inline-flex', alignItems: 'center' }}
        >
          <FiLoader className="tf-spin" />
        </span>
      ) : null}
      {children}
    </button>
  );
}

export function Card({ title, variant = 'default', children, className = '', ...props }) {
  const variantClass = variant !== 'default' ? ` tf-card-${variant}` : '';
  return (
    <section className={`tf-card${variantClass}${className ? ` ${className}` : ''}`} {...props}>
      {title ? <h3>{title}</h3> : null}
      {children}
    </section>
  );
}

export function TextInput({
  id,
  label,
  error,
  helpText,
  textarea = false,
  className = '',
  ...props
}) {
  const InputComponent = textarea ? 'textarea' : 'input';
  const inputClass = textarea ? 'tf-textarea' : 'tf-input';
  return (
    <div className={`tf-form-field${className ? ` ${className}` : ''}`}>
      {label ? <label htmlFor={id}>{label}</label> : null}
      <InputComponent id={id} className={inputClass} {...props} />
      {helpText ? <span className="tf-help-text">{helpText}</span> : null}
      {error ? (
        <p className="tf-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function Select({ id, label, error, helpText, options = [], className = '', ...props }) {
  return (
    <div className={`tf-form-field${className ? ` ${className}` : ''}`}>
      {label ? <label htmlFor={id}>{label}</label> : null}
      <select id={id} className="tf-input" {...props}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {helpText ? <span className="tf-help-text">{helpText}</span> : null}
      {error ? (
        <p className="tf-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function Checkbox({ id, label, checked, onChange, className = '', ...props }) {
  return (
    <label htmlFor={id} className={`tf-checkbox-label${className ? ` ${className}` : ''}`}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={onChange}
        className="tf-checkbox"
        {...props}
      />
      <span>{label}</span>
    </label>
  );
}

export function Radio({ id, name, label, value, checked, onChange, className = '', ...props }) {
  return (
    <label htmlFor={id} className={`tf-radio-label${className ? ` ${className}` : ''}`}>
      <input
        type="radio"
        id={id}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="tf-radio"
        {...props}
      />
      <span>{label}</span>
    </label>
  );
}

export function Tabs({ tabs = [], value, onChange }) {
  return (
    <div className="tf-tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          className="tf-tab"
          aria-selected={value === tab.value}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function SegmentedControl({ options = [], value, onChange }) {
  return (
    <div className="seg" role="radiogroup">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function StatusBadge({ status, label }) {
  if (!status) return null;
  const displayLabel = label ?? status.replace('_', ' ');
  return <span className={`tf-badge tf-badge-${toneFor(status)}`}>{displayLabel}</span>;
}

export function Avatar({ name = '', src = '', size = 'md' }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
  return (
    <div className={`tf-avatar tf-avatar-${size}`} aria-label={name}>
      {src ? <img src={src} alt={name} /> : <span>{initials || 'U'}</span>}
    </div>
  );
}

export function IconButton({ icon, label, onClick, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`iconbtn${className ? ` ${className}` : ''}`}
      aria-label={label}
      title={label}
      onClick={onClick}
      {...props}
    >
      {icon}
    </button>
  );
}

export function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="tf-portal-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="tf-portal-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tf-portal-modal-header">
          {title ? <h2 className="tf-portal-modal-title">{title}</h2> : <div />}
          <button type="button" className="iconbtn" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
}) {
  if (!isOpen) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p style={{ margin: '0 0 20px', color: 'var(--tf-portal-text-muted)' }}>{message}</p>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <Button variant="line" onClick={onClose}>
          {cancelText}
        </Button>
        <Button variant={variant} onClick={onConfirm}>
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}

export function Spinner({ size = 'md' }) {
  return (
    <div className={`tf-spinner tf-spinner-${size}`} role="status">
      <span className="tf-sr-only">Loading...</span>
    </div>
  );
}

export function Skeleton({
  height = '20px',
  width = '100%',
  borderRadius = '6px',
  className = '',
}) {
  return (
    <div
      className={`tf-portal-skeleton${className ? ` ${className}` : ''}`}
      style={{ height, width, borderRadius }}
      aria-hidden="true"
    />
  );
}

export function Divider({ margin = '16px 0' }) {
  return <hr className="tf-divider" style={{ margin }} />;
}

export function PageHeader({ title, subtitle, breadcrumbs, actions }) {
  return (
    <header className="tf-portal-page-header">
      {breadcrumbs ? <div className="tf-portal-breadcrumbs">{breadcrumbs}</div> : null}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          {title ? <h1 className="tf-portal-page-title">{title}</h1> : null}
          {subtitle ? <p className="tf-portal-page-subtitle">{subtitle}</p> : null}
        </div>
        {actions ? <div style={{ display: 'flex', gap: '10px' }}>{actions}</div> : null}
      </div>
    </header>
  );
}

export function Stepper({ steps = [], currentStep = 0 }) {
  return (
    <ol className="steps" role="list">
      {steps.map((step, idx) => {
        const isPassed = idx < currentStep;
        const isCurrent = idx === currentStep;
        return (
          <li key={step.label || idx} className={isPassed || isCurrent ? 'on' : ''}>
            <span>{step.label}</span>
            <i
              aria-hidden="true"
              style={{
                background: isPassed
                  ? 'var(--tf-portal-green)'
                  : isCurrent
                    ? 'var(--tf-portal-orange)'
                    : 'var(--tf-portal-border-strong)',
              }}
            />
          </li>
        );
      })}
    </ol>
  );
}

export function ProgressBar({ progress = 0 }) {
  return (
    <div
      style={{
        width: '100%',
        height: '8px',
        background: 'var(--tf-portal-border)',
        borderRadius: '4px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${Math.min(100, Math.max(0, progress))}%`,
          height: '100%',
          background: 'var(--tf-portal-green)',
          transition: 'width 0.3s ease',
        }}
      />
    </div>
  );
}

export function EmptyState({
  title = 'No data available',
  description,
  action,
  icon = <FiFolder aria-hidden="true" />,
}) {
  return (
    <div className="tf-portal-state-container">
      <div className="tf-portal-state-icon">{icon}</div>
      <h3 className="tf-portal-state-title">{title}</h3>
      {description ? <p className="tf-portal-state-desc">{description}</p> : null}
      {action ? <div>{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
}) {
  return (
    <div className="tf-portal-state-container" style={{ borderColor: 'var(--tf-portal-warn)' }}>
      <div
        className="tf-portal-state-icon"
        style={{ background: 'var(--tf-portal-warn-bg)', color: 'var(--tf-portal-warn)' }}
      >
        <FiAlertTriangle aria-hidden="true" />
      </div>
      <h3 className="tf-portal-state-title">{title}</h3>
      <p className="tf-portal-state-desc">{message}</p>
      {onRetry ? (
        <Button variant="primary" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}

export function QuotationCard({ quotation, href }) {
  if (!quotation) return null;
  const agency = quotation.agency ?? {};
  return (
    <li className="tf-card">
      <div>
        Quotation #{quotation.id} <StatusBadge status={quotation.status} />
      </div>
      <p>
        {quotation.quotationType ?? '—'} — {quotation.totalAmount ?? quotation.total ?? '—'}{' '}
        {quotation.currency ?? ''} — {agency.agencyName ?? 'Agency'}
        {agency.city ? `, ${agency.city}` : ''}
        {agency.country ? ` ${agency.country}` : ''}
      </p>
      {href ? <a href={href}>View quotation</a> : null}
    </li>
  );
}

export function RequestCard({ request, href }) {
  if (!request) return null;
  return (
    <li className="tf-card">
      <div>
        Request #{request.id ?? request.travelRequestId} <StatusBadge status={request.status} />
      </div>
      {href ? <a href={href}>View request</a> : null}
    </li>
  );
}

export function ConversationList({ conversations }) {
  if (!conversations || conversations.length === 0) return <p>No conversations yet.</p>;
  return (
    <ul className="tf-list" aria-label="Conversations">
      {conversations.map((conversation) => (
        <ConversationListItem key={conversation.id} conversation={conversation} />
      ))}
    </ul>
  );
}

export function ConversationListItem({ conversation }) {
  const agency = conversation.agency ?? {};
  const traveller = conversation.traveller ?? {};
  const other =
    agency.agencyName ?? traveller.firstName ?? `Request #${conversation.travelRequestId}`;
  return (
    <li className="tf-card">
      <a href={`./${conversation.id}`}>Conversation #{conversation.id}</a>{' '}
      <StatusBadge status={conversation.status} />
      <p>
        {other}
        {conversation.unreadCount ? ` (${conversation.unreadCount} unread)` : ''}
      </p>
      {conversation.lastMessage ? <p>{conversation.lastMessage.body}</p> : null}
    </li>
  );
}

export function ConversationView({ conversation, messages }) {
  return (
    <section className="tf-conversation" aria-label="Conversation">
      {conversation ? (
        <p>
          Conversation #{conversation.id} for request #{conversation.travelRequestId}{' '}
          <StatusBadge status={conversation.status} />
        </p>
      ) : null}
      {!messages || messages.length === 0 ? (
        <p>No messages yet.</p>
      ) : (
        <ul className="tf-messages" aria-label="Messages">
          {messages.map((message) => (
            <li key={message.id} className="tf-message">
              <p>{message.body}</p>
              <p className="tf-message-meta">
                {message.messageType ?? 'text'} — {message.createdAt ?? ''}
                {message.readAt ? ' — read' : ''}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function JobCard({ job, href }) {
  if (!job) return null;
  return (
    <li className="tf-card">
      <div>
        Job #{job.id} <StatusBadge status={job.status} />
      </div>
      <p>
        Request #{job.travelRequestId} — Quotation #{job.quotationId}
      </p>
      {href ? <a href={href}>View job</a> : null}
    </li>
  );
}
