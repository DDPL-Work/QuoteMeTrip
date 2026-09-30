import React, { useState } from 'react';
import {
  FiCalendar,
  FiMapPin,
  FiEdit3,
  FiTrash2,
  FiCheck,
  FiX,
  FiHome,
  FiUserCheck,
  FiTruck,
} from 'react-icons/fi';

/**
 * DayCard Component (Phase 4)
 * Individual day card for Day-by-Day trip planning.
 * Supports editing activities, accommodation notes, guide/driver preferences per day.
 */
export function DayCard({
  day = {},
  index = 0,
  onUpdateDay = () => {},
  onDeleteDay = () => {},
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState({ ...day });

  const handleSave = () => {
    onUpdateDay(day.id || day.dayNumber, draft);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraft({ ...day });
    setIsEditing(false);
  };

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2DCD1',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        boxShadow: '0 2px 8px rgba(19, 41, 28, 0.04)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: '800',
              background: '#0C4E28',
              color: '#FFFFFF',
              padding: '4px 10px',
              borderRadius: '6px',
              letterSpacing: '0.08em',
            }}
          >
            DAY {day.dayNumber || index + 1}
          </span>
          {day.date && (
            <span style={{ fontSize: '13px', color: '#4E5754', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FiCalendar size={13} /> {day.date}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {!isEditing ? (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                style={{
                  border: '1px solid #D5CDBF',
                  background: '#FFFBF3',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#13291C',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <FiEdit3 size={14} /> Edit
              </button>
              <button
                type="button"
                onClick={() => onDeleteDay(day.id || day.dayNumber)}
                style={{
                  border: 0,
                  background: 'transparent',
                  padding: '6px',
                  color: '#D93025',
                  cursor: 'pointer',
                }}
                title="Remove day"
                aria-label={`Remove day ${day.dayNumber}`}
              >
                <FiTrash2 size={16} />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleSave}
                style={{
                  border: 0,
                  background: '#147D33',
                  color: '#fff',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <FiCheck size={14} /> Save
              </button>
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  border: '1px solid #D5CDBF',
                  background: '#fff',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <FiX size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {!isEditing ? (
        /* Read Mode */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '15px', fontWeight: '700', color: '#13291C', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FiMapPin style={{ color: '#147D33' }} /> {day.location || 'Destination not set'}
            {day.title && <span style={{ fontWeight: '400', color: '#4E5754' }}>— {day.title}</span>}
          </div>

          {day.description && (
            <p style={{ margin: 0, fontSize: '14px', color: '#4E5754', lineHeight: '1.5' }}>
              {day.description}
            </p>
          )}

          {/* Preferences Badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
            {day.hotelNotes && (
              <span
                style={{
                  fontSize: '12px',
                  background: '#E5F2EA',
                  color: '#0C4E28',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontWeight: '600',
                }}
              >
                <FiHome size={13} /> Hotel: {day.hotelNotes}
              </span>
            )}
            {day.guideNotes && (
              <span
                style={{
                  fontSize: '12px',
                  background: '#FFF1DC',
                  color: '#B45A00',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontWeight: '600',
                }}
              >
                <FiUserCheck size={13} /> Guide: {day.guideNotes}
              </span>
            )}
            {day.driverNotes && (
              <span
                style={{
                  fontSize: '12px',
                  background: '#F0F4F8',
                  color: '#1E3A8A',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontWeight: '600',
                }}
              >
                <FiTruck size={13} /> Driver: {day.driverNotes}
              </span>
            )}
          </div>
        </div>
      ) : (
        /* Edit Mode Form */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#4E5754', display: 'block', marginBottom: '4px' }}>
                Location
              </label>
              <input
                type="text"
                value={draft.location || ''}
                onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #D5CDBF', fontSize: '14px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#4E5754', display: 'block', marginBottom: '4px' }}>
                Day Title / Focus
              </label>
              <input
                type="text"
                value={draft.title || ''}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="e.g. City Tour & Bazaar"
                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #D5CDBF', fontSize: '14px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#4E5754', display: 'block', marginBottom: '4px' }}>
              Activities & Notes
            </label>
            <textarea
              value={draft.description || ''}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              rows={2}
              placeholder="What would you like to do on this day?"
              style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #D5CDBF', fontSize: '14px', fontFamily: 'inherit' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#4E5754', display: 'block', marginBottom: '2px' }}>
                Hotel Preference
              </label>
              <input
                type="text"
                value={draft.hotelNotes || ''}
                onChange={(e) => setDraft({ ...draft, hotelNotes: e.target.value })}
                placeholder="e.g. 4 Star Cave Hotel"
                style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #D5CDBF', fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#4E5754', display: 'block', marginBottom: '2px' }}>
                Guide Preference
              </label>
              <input
                type="text"
                value={draft.guideNotes || ''}
                onChange={(e) => setDraft({ ...draft, guideNotes: e.target.value })}
                placeholder="e.g. English speaking guide"
                style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #D5CDBF', fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#4E5754', display: 'block', marginBottom: '2px' }}>
                Driver Preference
              </label>
              <input
                type="text"
                value={draft.driverNotes || ''}
                onChange={(e) => setDraft({ ...draft, driverNotes: e.target.value })}
                placeholder="e.g. Private Mercedes Sprinter"
                style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #D5CDBF', fontSize: '13px' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DayCard;
