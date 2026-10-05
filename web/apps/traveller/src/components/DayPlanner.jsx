import React from 'react';
import { FiPlus, FiCalendar, FiSun } from 'react-icons/fi';
import { DayCard } from './DayCard.jsx';

/**
 * DayPlanner Component (Phase 4)
 * Manages the full day-by-day itinerary schedule.
 */
export function DayPlanner({
  days = [],
  onAddDay = () => {},
  onUpdateDay = () => {},
  onDeleteDay = () => {},
  targetDuration = 3,
  stops = [],
}) {
  const handleAddNewDay = () => {
    const nextDayNumber = days.length + 1;
    // Auto suggest location based on stops sequence
    let suggestedLocation = '';
    if (stops.length > 0) {
      const stopIndex = Math.min(nextDayNumber - 1, stops.length - 1);
      suggestedLocation = stops[stopIndex]?.name || '';
    }

    onAddDay({
      dayNumber: nextDayNumber,
      location: suggestedLocation,
      title: `Day ${nextDayNumber} Exploration`,
      description: '',
      hotelNotes: '',
      guideNotes: '',
      driverNotes: '',
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div
        style={{
          background: '#FFFBF3',
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid #E2DCD1',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#147D33',
            fontWeight: '700',
            fontSize: '13px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          <FiSun size={18} /> Step 3: Day-by-Day Itinerary Plan
        </div>
        <h2
          style={{
            fontFamily: 'var(--serif, serif)',
            fontSize: '26px',
            color: '#13291C',
            margin: '8px 0 4px',
          }}
        >
          Customize Each Day of Your Holiday
        </h2>
        <p style={{ color: '#4E5754', margin: 0, fontSize: '15px' }}>
          Define what you want to experience on each day, or specify hotel and guide preferences for
          local agencies to quote.
        </p>
      </div>

      {/* Days List */}
      {days.length === 0 ? (
        <div
          style={{
            background: '#FFFFFF',
            border: '2px dashed #D5CDBF',
            borderRadius: '16px',
            padding: '36px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <FiCalendar size={36} style={{ color: '#147D33' }} />
          <h3 style={{ fontSize: '18px', margin: 0, color: '#13291C' }}>No Days Planned Yet</h3>
          <p style={{ color: '#4E5754', margin: 0, fontSize: '14px', maxWidth: '400px' }}>
            Click below to create your day-by-day plan for your {targetDuration}-day trip.
          </p>
          <button
            type="button"
            onClick={handleAddNewDay}
            style={{
              padding: '12px 24px',
              background: '#147D33',
              color: '#FFFFFF',
              border: 0,
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '8px',
            }}
          >
            <FiPlus size={18} /> Add Day 1
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {days.map((day, index) => (
            <DayCard
              key={day.id || day.dayNumber || index}
              day={day}
              index={index}
              onUpdateDay={onUpdateDay}
              onDeleteDay={onDeleteDay}
            />
          ))}

          <button
            type="button"
            onClick={handleAddNewDay}
            style={{
              alignSelf: 'flex-start',
              padding: '12px 20px',
              background: '#FFFBF3',
              border: '1px solid #147D33',
              color: '#147D33',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '4px',
            }}
          >
            <FiPlus size={16} /> Add Another Day (Day {days.length + 1})
          </button>
        </div>
      )}
    </div>
  );
}

export default DayPlanner;
