import { useState } from 'react';
import {
  FiCalendar,
  FiUsers,
  FiBriefcase,
  FiHome,
  FiUserCheck,
  FiTruck,
  FiMinus,
  FiPlus,
  FiCheckCircle,
  FiFileText,
  FiCheck,
  FiAnchor,
  FiCompass,
} from 'react-icons/fi';
import { validateRequestInput } from '../features/trip/validation.js';

const DEFAULT_FORM = {
  travelStartDate: '',
  travelEndDate: '',
  numberOfTravellers: 2,
  luggageCount: 2,
  accommodationType: '4_star',
  hotelRequired: true,
  guideRequired: false,
  driverRequired: true,
  packageType: 'blue_cruise',
  cruiseDuration: '4d_3n',
  specialRequests: '',
};

export function TravelRequestForm({
  initial = {},
  onSubmit = () => {},
  submitting = false,
  submitButtonLabel = 'Save request',
}) {
  const [form, setForm] = useState({ ...DEFAULT_FORM, ...initial });
  const [errors, setErrors] = useState({});

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCruiseDurationSelect = (durationId, nights) => {
    setForm((prev) => {
      const next = { ...prev, cruiseDuration: durationId };
      if (prev.travelStartDate && !prev.travelEndDate) {
        try {
          const startDate = new Date(prev.travelStartDate);
          if (!isNaN(startDate.getTime())) {
            startDate.setDate(startDate.getDate() + nights);
            next.travelEndDate = startDate.toISOString().split('T')[0];
          }
        } catch {
          // ignore
        }
      }
      return next;
    });
  };

  const handleTravellerChange = (delta) => {
    setForm((prev) => ({
      ...prev,
      numberOfTravellers: Math.max(1, Math.min(100, (Number(prev.numberOfTravellers) || 1) + delta)),
    }));
  };

  const handleLuggageChange = (delta) => {
    setForm((prev) => ({
      ...prev,
      luggageCount: Math.max(0, Math.min(500, (Number(prev.luggageCount) || 0) + delta)),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const nextErrors = validateRequestInput(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(form);
  };

  const packageOptions = [
    {
      id: 'blue_cruise',
      title: 'Blue Cruise',
      description: 'Gulet yacht sailing along turquoise bays with all-inclusive meals & cabins',
      icon: FiAnchor,
    },
    {
      id: 'full_package',
      title: 'Full Package',
      description: 'Hotels, private vehicle, driver, and guided tours',
      icon: FiBriefcase,
    },
    {
      id: 'hotel_only',
      title: 'Hotel Only',
      description: 'Accommodations and daily breakfasts only',
      icon: FiHome,
    },
    {
      id: 'vehicle_driver',
      title: 'Vehicle + Driver Only',
      description: 'Private car/van with driver for transfers and sightseeing',
      icon: FiTruck,
    },
  ];

  const accommodationOptions = [
    { id: '3_star', label: '3-Star Standard' },
    { id: '4_star', label: '4-Star Superior' },
    { id: '5_star', label: '5-Star Luxury' },
    { id: 's_class', label: 'Special / Boutique Class' },
  ];

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. Dates & Travellers Card */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2DCD1',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <h3
          style={{
            fontSize: '18px',
            fontWeight: '700',
            color: '#13291C',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <FiCalendar style={{ color: '#147D33' }} /> Dates & Group Size
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          {/* Start Date */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#4E5754', display: 'block', marginBottom: '6px' }}>
              Travel Start Date
            </label>
            <input
              type="date"
              role="textbox"
              value={form.travelStartDate}
              onChange={(e) => setField('travelStartDate', e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                border: errors.travelStartDate ? '1px solid #D93025' : '1px solid #D5CDBF',
                fontSize: '14px',
                background: '#FFFBF3',
                color: '#13291C',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {errors.travelStartDate && (
              <span role="alert" style={{ color: '#D93025', fontSize: '12.5px', marginTop: '4px', display: 'block' }}>
                {errors.travelStartDate}
              </span>
            )}
          </div>

          {/* End Date */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#4E5754', display: 'block', marginBottom: '6px' }}>
              Travel End Date
            </label>
            <input
              type="date"
              role="textbox"
              value={form.travelEndDate}
              onChange={(e) => setField('travelEndDate', e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                border: errors.travelEndDate ? '1px solid #D93025' : '1px solid #D5CDBF',
                fontSize: '14px',
                background: '#FFFBF3',
                color: '#13291C',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {errors.travelEndDate && (
              <span role="alert" style={{ color: '#D93025', fontSize: '12.5px', marginTop: '4px', display: 'block' }}>
                {errors.travelEndDate}
              </span>
            )}
          </div>
        </div>

        {/* Stepper Controls: Travellers & Luggage */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginTop: '4px' }}>
          {/* Travellers Stepper */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFBF3', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2DCD1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FiUsers style={{ color: '#147D33' }} size={20} />
              <div>
                <strong style={{ fontSize: '14px', color: '#13291C', display: 'block' }}>Travellers</strong>
                <span style={{ fontSize: '12px', color: '#66716B' }}>Adults & Children</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={() => handleTravellerChange(-1)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: '1px solid #D5CDBF',
                  background: '#FFFFFF',
                  color: '#13291C',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FiMinus size={14} />
              </button>
              <span style={{ fontSize: '16px', fontWeight: '800', width: '24px', textAlign: 'center' }}>
                {form.numberOfTravellers}
              </span>
              <button
                type="button"
                onClick={() => handleTravellerChange(1)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: '1px solid #D5CDBF',
                  background: '#FFFFFF',
                  color: '#13291C',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FiPlus size={14} />
              </button>
            </div>
          </div>

          {/* Luggage Stepper */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFBF3', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2DCD1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FiBriefcase style={{ color: '#147D33' }} size={20} />
              <div>
                <strong style={{ fontSize: '14px', color: '#13291C', display: 'block' }}>Luggage</strong>
                <span style={{ fontSize: '12px', color: '#66716B' }}>Bags & Suitcases</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={() => handleLuggageChange(-1)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: '1px solid #D5CDBF',
                  background: '#FFFFFF',
                  color: '#13291C',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FiMinus size={14} />
              </button>
              <span style={{ fontSize: '16px', fontWeight: '800', width: '24px', textAlign: 'center' }}>
                {form.luggageCount}
              </span>
              <button
                type="button"
                onClick={() => handleLuggageChange(1)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: '1px solid #D5CDBF',
                  background: '#FFFFFF',
                  color: '#13291C',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FiPlus size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Service Requirements Selection Cards */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2DCD1',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#13291C', margin: 0 }}>
          Services Needed
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          {/* Hotel Requirement */}
          <div
            onClick={() => setField('hotelRequired', !form.hotelRequired)}
            style={{
              padding: '16px',
              borderRadius: '12px',
              border: form.hotelRequired ? '2px solid #147D33' : '1px solid #E2DCD1',
              background: form.hotelRequired ? '#E5F2EA' : '#FFFBF3',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FiHome size={22} style={{ color: form.hotelRequired ? '#0C4E28' : '#66716B' }} />
              <div>
                <strong style={{ fontSize: '15px', color: '#13291C', display: 'block' }}>Hotel Booking</strong>
                <span style={{ fontSize: '12px', color: '#56625B' }}>Accommodations</span>
              </div>
            </div>
            {form.hotelRequired && <FiCheckCircle size={20} style={{ color: '#147D33' }} />}
          </div>

          {/* Guide Requirement */}
          <div
            onClick={() => setField('guideRequired', !form.guideRequired)}
            style={{
              padding: '16px',
              borderRadius: '12px',
              border: form.guideRequired ? '2px solid #147D33' : '1px solid #E2DCD1',
              background: form.guideRequired ? '#E5F2EA' : '#FFFBF3',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FiUserCheck size={22} style={{ color: form.guideRequired ? '#0C4E28' : '#66716B' }} />
              <div>
                <strong style={{ fontSize: '15px', color: '#13291C', display: 'block' }}>Tour Guide</strong>
                <span style={{ fontSize: '12px', color: '#56625B' }}>Licensed Guide</span>
              </div>
            </div>
            {form.guideRequired && <FiCheckCircle size={20} style={{ color: '#147D33' }} />}
          </div>

          {/* Driver Requirement */}
          <div
            onClick={() => setField('driverRequired', !form.driverRequired)}
            style={{
              padding: '16px',
              borderRadius: '12px',
              border: form.driverRequired ? '2px solid #147D33' : '1px solid #E2DCD1',
              background: form.driverRequired ? '#E5F2EA' : '#FFFBF3',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FiTruck size={22} style={{ color: form.driverRequired ? '#0C4E28' : '#66716B' }} />
              <div>
                <strong style={{ fontSize: '15px', color: '#13291C', display: 'block' }}>Vehicle + Driver</strong>
                <span style={{ fontSize: '12px', color: '#56625B' }}>Transfers & Drivers</span>
              </div>
            </div>
            {form.driverRequired && <FiCheckCircle size={20} style={{ color: '#147D33' }} />}
          </div>
        </div>
      </div>

      {/* 3. Package Scope & Accommodation Class */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2DCD1',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#13291C', margin: 0 }}>
          Package Type & Category
        </h3>

        {/* Package Scope Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
          {packageOptions.map((pkg) => {
            const isSelected = form.packageType === pkg.id;
            const IconComp = pkg.icon || FiCheck;
            return (
              <div
                key={pkg.id}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                onClick={() => {
                  setField('packageType', pkg.id);
                  if (pkg.id === 'blue_cruise' && !form.cruiseDuration) {
                    setField('cruiseDuration', '4d_3n');
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setField('packageType', pkg.id);
                    if (pkg.id === 'blue_cruise' && !form.cruiseDuration) {
                      setField('cruiseDuration', '4d_3n');
                    }
                  }
                }}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: isSelected ? '2px solid #0C4E28' : '1px solid #E2DCD1',
                  background: isSelected ? '#E5F2EA' : '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: isSelected ? '0 4px 12px rgba(12, 78, 40, 0.08)' : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <IconComp size={18} style={{ color: isSelected ? '#0C4E28' : '#147D33' }} />
                    <strong style={{ fontSize: '15px', color: '#13291C' }}>{pkg.title}</strong>
                  </div>
                  {isSelected && <FiCheck size={16} style={{ color: '#147D33' }} />}
                </div>
                <span style={{ fontSize: '12.5px', color: '#56625B', lineHeight: '1.4' }}>
                  {pkg.description}
                </span>
              </div>
            );
          })}
        </div>

        {/* Dedicated Blue Cruise Duration Selection UI */}
        {form.packageType === 'blue_cruise' && (
          <div
            style={{
              marginTop: '4px',
              padding: '20px',
              background: '#FFFBF3',
              borderRadius: '12px',
              border: errors.cruiseDuration ? '2px solid #D93025' : '1px solid #E2DCD1',
              animation: 'tfFadeInUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            }}
          >
            <label
              style={{
                fontSize: '14px',
                fontWeight: '700',
                color: '#0C4E28',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px',
              }}
            >
              <FiCompass style={{ color: '#FC7C00' }} /> Choose your cruise duration
            </label>
            <div
              role="radiogroup"
              aria-label="Choose your cruise duration"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '12px',
              }}
            >
              {[
                { id: '4d_3n', label: '4 Days / 3 Nights', nights: 3 },
                { id: '6d_5n', label: '6 Days / 5 Nights', nights: 5 },
              ].map((d) => {
                const isSelected = form.cruiseDuration === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => handleCruiseDurationSelect(d.id, d.nights)}
                    style={{
                      padding: '16px',
                      borderRadius: '10px',
                      border: isSelected ? '2px solid #147D33' : '1px solid #D5CDBF',
                      background: isSelected ? '#E5F2EA' : '#FFFFFF',
                      color: '#13291C',
                      fontWeight: isSelected ? '700' : '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  >
                    <div style={{ textAlign: 'left' }}>
                      <span style={{ fontSize: '15px', display: 'block' }}>{d.label}</span>
                      <span style={{ fontSize: '12px', color: isSelected ? '#0C4E28' : '#56625B' }}>
                        {isSelected ? '✓ Selected' : 'Select'}
                      </span>
                    </div>
                    {isSelected && <FiCheckCircle size={20} style={{ color: '#147D33' }} />}
                  </button>
                );
              })}
            </div>
            {errors.cruiseDuration && (
              <span role="alert" style={{ color: '#D93025', fontSize: '13px', marginTop: '8px', display: 'block', fontWeight: '600' }}>
                {errors.cruiseDuration}
              </span>
            )}
          </div>
        )}

        {/* Accommodation Star Class Options */}
        <div style={{ marginTop: '8px' }}>
          <label style={{ fontSize: '13px', fontWeight: '700', color: '#4E5754', display: 'block', marginBottom: '8px' }}>
            Preferred Hotel Class
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
            {accommodationOptions.map((acc) => {
              const isSelected = form.accommodationType === acc.id;
              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => setField('accommodationType', acc.id)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: isSelected ? '2px solid #147D33' : '1px solid #D5CDBF',
                    background: isSelected ? '#147D33' : '#FFFBF3',
                    color: isSelected ? '#FFFFFF' : '#13291C',
                    fontWeight: isSelected ? '700' : '600',
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  {acc.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Special Requests Notes */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2DCD1',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <h3
          style={{
            fontSize: '18px',
            fontWeight: '700',
            color: '#13291C',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <FiFileText style={{ color: '#147D33' }} /> Special Requests & Notes
        </h3>
        <textarea
          value={form.specialRequests}
          onChange={(e) => setField('specialRequests', e.target.value)}
          placeholder="Tell local agencies about any specific hotel preferences, dietary requirements, room counts, or special wishes..."
          rows={3}
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: '10px',
            border: '1px solid #D5CDBF',
            fontSize: '14px',
            fontFamily: 'inherit',
            background: '#FFFBF3',
            color: '#13291C',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px', marginTop: '8px' }}>
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '14px 28px',
            background: '#FC7C00',
            color: '#FFFFFF',
            border: 0,
            borderRadius: '12px',
            fontWeight: '700',
            fontSize: '16px',
            cursor: submitting ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(252, 124, 0, 0.3)',
          }}
        >
          {submitting ? 'Saving Request...' : submitButtonLabel}
        </button>
      </div>
    </form>
  );
}

export default TravelRequestForm;
