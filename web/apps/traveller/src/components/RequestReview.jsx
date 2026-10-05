import React from 'react';
import {
  FiCheckCircle,
  FiMapPin,
  FiCalendar,
  FiUsers,
  FiBriefcase,
  FiHome,
  FiUserCheck,
  FiTruck,
  FiFileText,
  FiSend,
  FiSave,
} from 'react-icons/fi';

/**
 * RequestReview Component (Phase 4)
 * Comprehensive review screen before draft save or final submission.
 */
export function RequestReview({
  route = null,
  form = {},
  days = [],
  profile = null,
  onSubmit = () => {},
  onSaveDraft = () => {},
  submitting = false,
  savingDraft = false,
}) {
  const distanceKm = route?.totalDistanceKm ?? route?.distanceKm ?? 0;
  const durationMins = route?.estimatedDurationMinutes ?? route?.durationMinutes ?? 0;
  const hours = Math.floor(durationMins / 60);
  const mins = durationMins % 60;

  const packageLabels = {
    blue_cruise: 'Blue Cruise',
    full_package: 'Full Package (Hotels + Vehicle + Guide)',
    hotel_only: 'Hotel Only',
    vehicle_driver: 'Vehicle + Driver Only',
    guide_activities: 'Guide & Activities',
  };

  const durationLabels = {
    '4d_3n': '4 Days / 3 Nights',
    '6d_5n': '6 Days / 5 Nights',
  };

  const accommodationLabels = {
    '3_star': '3-Star Standard',
    '4_star': '4-Star Superior',
    '5_star': '5-Star Luxury',
    s_class: 'Special Class / Boutique',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Step Header */}
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
          <FiCheckCircle size={18} /> Step 4: Final Review & Submission
        </div>
        <h2
          style={{
            fontFamily: 'var(--serif, serif)',
            fontSize: '28px',
            color: '#13291C',
            margin: '8px 0 4px',
          }}
        >
          Review Your Travel Request
        </h2>
        <p style={{ color: '#4E5754', margin: 0, fontSize: '15px' }}>
          Verify all itinerary details before submitting your request to local agencies.
        </p>
      </div>

      {/* Main Review Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
        }}
      >
        {/* Route Card */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2DCD1',
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <h3
            style={{
              fontSize: '16px',
              fontWeight: '700',
              color: '#0C4E28',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <FiMapPin /> Route Overview
          </h3>
          <div style={{ fontSize: '15px', fontWeight: '700', color: '#13291C' }}>
            {route?.startLocation || 'Start'} → {route?.finalDestination || 'Destination'}
          </div>
          <div style={{ fontSize: '13.5px', color: '#4E5754' }}>
            Distance: <b>{distanceKm} km</b> · Estimated drive:{' '}
            <b>
              {hours}h {mins}m
            </b>
          </div>
          {route?.stops && route.stops.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
              {route.stops.map((stop, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: '12px',
                    background: '#E5F2EA',
                    color: '#0C4E28',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontWeight: '600',
                  }}
                >
                  {stop.locationName || stop.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Travel Details Card */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2DCD1',
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <h3
            style={{
              fontSize: '16px',
              fontWeight: '700',
              color: '#0C4E28',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <FiCalendar /> Dates & Travellers
          </h3>
          <div style={{ fontSize: '14.5px', color: '#13291C' }}>
            Dates: <b>{form.travelStartDate || 'Not set'}</b> to{' '}
            <b>{form.travelEndDate || 'Not set'}</b>
          </div>
          <div style={{ fontSize: '14px', color: '#4E5754', display: 'flex', gap: '16px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FiUsers /> <b>{form.numberOfTravellers || 1}</b> Travellers
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FiBriefcase /> <b>{form.luggageCount || 0}</b> Luggage pieces
            </span>
          </div>
        </div>

        {/* Services Card */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2DCD1',
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <h3
            style={{
              fontSize: '16px',
              fontWeight: '700',
              color: '#0C4E28',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <FiHome /> Service Preferences
          </h3>
          <div style={{ fontSize: '14px', color: '#13291C' }}>
            SERVICE: <b>{packageLabels[form.packageType] || form.packageType || 'Blue Cruise'}</b>
          </div>
          {form.packageType === 'blue_cruise' && form.cruiseDuration && (
            <div style={{ fontSize: '14px', color: '#13291C' }}>
              DURATION: <b>{durationLabels[form.cruiseDuration] || form.cruiseDuration}</b>
            </div>
          )}
          {form.accommodationType && (
            <div style={{ fontSize: '13.5px', color: '#4E5754' }}>
              Accommodation:{' '}
              <b>{accommodationLabels[form.accommodationType] || form.accommodationType}</b>
            </div>
          )}
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            {form.hotelRequired && (
              <span
                style={{
                  fontSize: '12px',
                  background: '#E5F2EA',
                  color: '#0C4E28',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <FiHome size={12} /> Hotel
              </span>
            )}
            {form.guideRequired && (
              <span
                style={{
                  fontSize: '12px',
                  background: '#FFF1DC',
                  color: '#B45A00',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <FiUserCheck size={12} /> Guide
              </span>
            )}
            {form.driverRequired && (
              <span
                style={{
                  fontSize: '12px',
                  background: '#F0F4F8',
                  color: '#1E3A8A',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <FiTruck size={12} /> Driver
              </span>
            )}
          </div>
        </div>

        {/* Profile Contact Card */}
        {profile && (
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2DCD1',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <h3
              style={{
                fontSize: '16px',
                fontWeight: '700',
                color: '#0C4E28',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <FiFileText /> Traveller Contact Info
            </h3>
            <div style={{ fontSize: '14px', color: '#13291C' }}>
              <b>{profile.fullName || profile.email}</b>
            </div>
            <div style={{ fontSize: '13.5px', color: '#4E5754' }}>
              Email: <b>{profile.email}</b>
            </div>
            {profile.phone && (
              <div style={{ fontSize: '13.5px', color: '#4E5754' }}>
                Phone / WhatsApp: <b>{profile.phone}</b>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Day Plan Summary */}
      {days.length > 0 && (
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2DCD1',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#13291C', margin: 0 }}>
            Day-by-Day Itinerary ({days.length} Days)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {days.map((day, i) => (
              <div
                key={i}
                style={{
                  padding: '12px 14px',
                  background: '#FFFBF3',
                  borderRadius: '10px',
                  border: '1px solid #E2DCD1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <b style={{ color: '#0C4E28', marginRight: '8px' }}>
                    Day {day.dayNumber || i + 1}:
                  </b>
                  <span style={{ fontWeight: '600', color: '#13291C' }}>
                    {day.location || 'Destination'}
                  </span>
                  {day.title && <span style={{ color: '#4E5754' }}> — {day.title}</span>}
                </div>
                {day.hotelNotes && (
                  <span style={{ fontSize: '12px', color: '#B45A00', fontWeight: '600' }}>
                    Hotel: {day.hotelNotes}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Special Requests */}
      {form.specialRequests && (
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2DCD1',
            borderRadius: '16px',
            padding: '20px',
          }}
        >
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: '700', color: '#13291C' }}>
            Special Requests & Notes
          </h4>
          <p style={{ margin: 0, fontSize: '14px', color: '#4E5754', whiteSpace: 'pre-wrap' }}>
            {form.specialRequests}
          </p>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px', marginTop: '12px' }}>
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={savingDraft || submitting}
          style={{
            padding: '14px 24px',
            background: '#FFFBF3',
            border: '1px solid #147D33',
            color: '#147D33',
            borderRadius: '12px',
            fontWeight: '700',
            fontSize: '15px',
            cursor: savingDraft || submitting ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <FiSave size={18} /> {savingDraft ? 'Saving Draft...' : 'Save as Draft'}
        </button>

        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          style={{
            padding: '14px 32px',
            background: '#FC7C00',
            color: '#FFFFFF',
            border: 0,
            borderRadius: '12px',
            fontWeight: '700',
            fontSize: '16px',
            cursor: submitting ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 4px 12px rgba(252, 124, 0, 0.3)',
          }}
        >
          <FiSend size={18} /> {submitting ? 'Submitting Request...' : 'Submit Request'}
        </button>
      </div>
    </div>
  );
}

export default RequestReview;
