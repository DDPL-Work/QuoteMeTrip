import React, { useState, useEffect } from 'react';
import {
  FiX,
  FiCompass,
  FiBriefcase,
  FiHome,
  FiTruck,
  FiMapPin,
  FiCalendar,
  FiUsers,
  FiClock,
  FiAnchor,
  FiGlobe,
  FiCheck,
  FiAlertCircle,
  FiArrowRight,
  FiChevronDown,
  FiMessageSquare,
  FiSearch,
} from 'react-icons/fi';
import { useI18n } from '@troublefree/i18n';
import { normalizeScope, serializeSearchToQuery } from '../../features/trip/search-trip-mapping.js';

export const SUGGESTED_ACTIVITIES = [
  'Historical & Ancient Sites',
  'Hot Air Balloon Flight',
  'Culinary & Wine Tasting',
  'Boat & Island Excursions',
  'Hiking & Trekking',
  'Scuba Diving & Snorkeling',
  'Cultural & Crafts Workshop',
  'Paragliding & Aerial Sports',
  'Turkish Bath & Hammam Wellness',
  'Jeep & ATV Safari',
];

export const SERVICE_CONFIGS = {
  'Blue Cruise': {
    id: 'blue_cruise',
    title: 'Blue Cruise Charter',
    icon: FiCompass,
    tagline: 'Sail the turquoise Mediterranean & Aegean coast on private or cabin gulets.',
    badge: 'Maritime Journey',
    color: '#0284C7',
    bgLight: '#F0F9FF',
    borderLight: '#BAE6FD',
  },
  'Full package': {
    id: 'full_package',
    title: 'Full Custom Package',
    icon: FiBriefcase,
    tagline: 'Complete door-to-door itinerary with hotels, private transfers, and excursions.',
    badge: 'All-Inclusive Planning',
    color: '#15803D',
    bgLight: '#F0FDF4',
    borderLight: '#BBF7D0',
  },
  'Hotel only': {
    id: 'hotel_only',
    title: 'Hotel Only Booking',
    icon: FiHome,
    tagline: 'Hand-picked boutique stays, cave suites, beach resorts, and historic villas.',
    badge: 'Accommodations',
    color: '#B45309',
    bgLight: '#FFFBEB',
    borderLight: '#FDE68A',
  },
  'Vehicle + driver': {
    id: 'vehicle_driver',
    title: 'Vehicle + Chauffeur Transfer',
    icon: FiTruck,
    tagline: 'Private executive vans and minivans with licensed professional drivers.',
    badge: 'Private Transport',
    color: '#7C3AED',
    bgLight: '#F5F3FF',
    borderLight: '#DDD6FE',
  },
  'Guide & activities': {
    id: 'guide_activities',
    title: 'Licensed Guide & Tours',
    icon: FiMapPin,
    tagline: 'Private historian guides, balloon flights, cooking classes, and outdoor adventures.',
    badge: 'Experiences & Tours',
    color: '#C2410C',
    bgLight: '#FFF7ED',
    borderLight: '#FFEDD5',
  },
};

export function TripRequestModal({
  isOpen,
  serviceName,
  initialData = {},
  onClose,
  onSubmit,
}) {
  const { t } = useI18n();

  const config =
    SERVICE_CONFIGS[serviceName] ||
    SERVICE_CONFIGS['Full package'];

  const Icon = config.icon;

  // Safe resolution helpers for duration and traveller counts
  const resolveDurationValue = (data) => {
    const raw = data?.daysCount ?? data?.chosenDuration ?? (typeof data?.days === 'number' ? data.days : null);
    if (typeof raw === 'number' && !isNaN(raw)) return raw;
    if (typeof raw === 'string' && /^\d+$/.test(raw)) return parseInt(raw, 10);
    return 7;
  };

  const resolveTravellersValue = (data) => {
    const raw = data?.travellers ?? data?.numberOfTravellers;
    if (typeof raw === 'number' && !isNaN(raw)) return raw;
    if (typeof raw === 'string' && /^\d+$/.test(raw)) return parseInt(raw, 10);
    return 2;
  };

  // Common editable state
  const [destination, setDestination] = useState(initialData.country || 'Türkiye');
  const [startDate, setStartDate] = useState(initialData.startDate || initialData.days?.[0]?.date || '');
  const [durationText, setDurationText] = useState(String(resolveDurationValue(initialData)));
  const [travellersText, setTravellersText] = useState(String(resolveTravellersValue(initialData)));
  const [flexible, setFlexible] = useState(Boolean(initialData.flexible || initialData.isFlexibleDates));
  const [specialRequests, setSpecialRequests] = useState(initialData.specialRequests || '');

  // Service-specific states
  const [cruiseDuration, setCruiseDuration] = useState('4d_3n');
  const [cruiseDays, setCruiseDays] = useState(4);
  const [cruiseNights, setCruiseNights] = useState(3);
  const [cruiseCabinType, setCruiseCabinType] = useState('standard_cabin');
  const [customCabinDetails, setCustomCabinDetails] = useState('');
  const [accommodationType, setAccommodationType] = useState('4_star');
  const [customAccommodationDetails, setCustomAccommodationDetails] = useState('');
  const [hotelRoomCount, setHotelRoomCount] = useState('1');
  const [vehicleType, setVehicleType] = useState('vip_minivan');
  const [pickupTime, setPickupTime] = useState('09:00');
  const [pickupLocation, setPickupLocation] = useState('');
  const [guideLanguage, setGuideLanguage] = useState('English');
  const [activityCategory, setActivityCategory] = useState('Historical & Archaeological');
  const [selectedActivities, setSelectedActivities] = useState(['Historical & Archaeological']);
  const [activitySearch, setActivitySearch] = useState('');
  const [isActivityDropdownOpen, setIsActivityDropdownOpen] = useState(false);

  const [validationError, setValidationError] = useState('');

  // Keep state updated when initialData or modal changes
  useEffect(() => {
    if (isOpen) {
      setDestination(initialData.country || 'Türkiye');
      setStartDate(initialData.startDate || initialData.days?.[0]?.date || '');
      setDurationText(String(resolveDurationValue(initialData)));
      setTravellersText(String(resolveTravellersValue(initialData)));
      setFlexible(Boolean(initialData.flexible || initialData.isFlexibleDates));
      if (initialData.specialRequests) {
        setSpecialRequests(initialData.specialRequests);
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    const parsedDays = parseInt(durationText, 10);
    const parsedTravellers = parseInt(travellersText, 10);

    if (isNaN(parsedDays) || parsedDays < 1 || parsedDays > 30) {
      setValidationError('Please enter a duration between 1 and 30 days.');
      return;
    }

    if (isNaN(parsedTravellers) || parsedTravellers < 1 || parsedTravellers > 100) {
      setValidationError('Please enter between 1 and 100 travellers.');
      return;
    }

    // Build specialized request package
    const customNotes = [];
    if (config.id === 'blue_cruise') {
      customNotes.push(`Cruise Duration: ${cruiseDays} Days / ${cruiseNights} Nights`);
      const cabinDesc = cruiseCabinType === 'custom' && customCabinDetails.trim()
        ? `Custom: ${customCabinDetails.trim()}`
        : cruiseCabinType === 'standard_cabin'
        ? 'Cabin Charter (Double/Twin)'
        : cruiseCabinType === 'private_gulet'
        ? 'Private Gulet Charter'
        : cruiseCabinType === 'deluxe_gulet'
        ? 'Deluxe / VIP Gulet'
        : cruiseCabinType;
      customNotes.push(`Cabin Preference: ${cabinDesc}`);
    } else if (config.id === 'hotel_only') {
      customNotes.push(`Rooms: ${hotelRoomCount}`);
      const hotelDesc = accommodationType === 'custom' && customAccommodationDetails.trim()
        ? `Custom: ${customAccommodationDetails.trim()}`
        : accommodationType;
      customNotes.push(`Hotel Class: ${hotelDesc}`);
    } else if (config.id === 'vehicle_driver') {
      if (pickupLocation.trim()) customNotes.push(`Pickup Location: ${pickupLocation.trim()}`);
      if (pickupTime) customNotes.push(`Pickup Time: ${pickupTime}`);
      customNotes.push(`Vehicle Preference: ${vehicleType}`);
    } else if (config.id === 'guide_activities') {
      const actStr = selectedActivities.length > 0 ? selectedActivities.join(', ') : activityCategory;
      customNotes.push(`Activities: ${actStr}`);
      customNotes.push(`Guide Language: ${guideLanguage}`);
    } else if (config.id === 'full_package') {
      const hotelDesc = accommodationType === 'custom' && customAccommodationDetails.trim()
        ? `Custom: ${customAccommodationDetails.trim()}`
        : accommodationType;
      customNotes.push(`Accommodation Preference: ${hotelDesc}`);
    }

    if (specialRequests.trim()) {
      customNotes.push(`Notes: ${specialRequests.trim()}`);
    }

    const payload = {
      country: destination,
      days: [{ date: startDate }],
      startDate: startDate,
      travelStartDate: startDate,
      daysCount: parsedDays,
      chosenDuration: parsedDays,
      travellers: parsedTravellers,
      numberOfTravellers: parsedTravellers,
      flexible,
      isFlexibleDates: flexible,
      scope: serviceName,
      packageType: config.id,
      cruiseDuration: config.id === 'blue_cruise' ? cruiseDuration : undefined,
      cruiseDays: config.id === 'blue_cruise' ? cruiseDays : undefined,
      cruiseNights: config.id === 'blue_cruise' ? cruiseNights : undefined,
      cruiseCabinType: config.id === 'blue_cruise' ? (cruiseCabinType === 'custom' && customCabinDetails.trim() ? customCabinDetails.trim() : cruiseCabinType) : undefined,
      activities: config.id === 'guide_activities' ? selectedActivities : undefined,
      activityCategory: config.id === 'guide_activities' ? (selectedActivities.join(', ') || activityCategory) : undefined,
      accommodationType: config.id === 'hotel_only' || config.id === 'full_package' ? (accommodationType === 'custom' && customAccommodationDetails.trim() ? customAccommodationDetails.trim() : accommodationType) : undefined,
      specialRequests: customNotes.join(' | '),
    };

    onSubmit(payload);
  };

  const fieldWrapStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    border: '1.5px solid #E2E8F0',
    borderRadius: '10px',
    padding: '0.65rem 0.85rem',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  };

  const inputStyle = {
    width: '100%',
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '0.92rem',
    fontWeight: 600,
    color: '#0F172A',
    outline: 'none',
    fontFamily: 'inherit',
    marginLeft: '0.65rem',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: 700,
    color: '#475569',
    marginBottom: '0.4rem',
    letterSpacing: '-0.01em',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        overflowY: 'auto',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-service-title"
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '18px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.35rem 1.65rem',
            borderBottom: '1px solid #E2E8F0',
            backgroundColor: config.bgLight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: '#FFFFFF',
                border: `2px solid ${config.borderLight}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: config.color,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                flexShrink: 0,
              }}
            >
              <Icon size={24} />
            </div>
            <div>
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: config.color,
                  letterSpacing: '0.06em',
                }}
              >
                {config.badge}
              </div>
              <h2
                id="modal-service-title"
                style={{
                  margin: '0.2rem 0 0 0',
                  fontSize: '1.35rem',
                  fontWeight: 800,
                  color: '#0F172A',
                  letterSpacing: '-0.02em',
                }}
              >
                {config.title}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748B',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
              transition: 'background-color 0.15s ease',
            }}
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '1.5rem 1.65rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748B', lineHeight: 1.55 }}>
            {config.tagline}
          </p>

          {validationError && (
            <div
              style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FCA5A5',
                color: '#991B1B',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                fontWeight: 600,
              }}
            >
              <FiAlertCircle size={18} /> {validationError}
            </div>
          )}

          {/* Row 1: Destination & Start Date */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Destination Country</label>
              <div style={fieldWrapStyle}>
                <FiGlobe size={18} style={{ color: config.color, flexShrink: 0 }} />
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="Türkiye">Türkiye</option>
                  <option value="Greece">Greece</option>
                  <option value="Italy">Italy</option>
                </select>
                <FiChevronDown size={16} style={{ color: '#94A3B8', pointerEvents: 'none' }} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Preferred Start Date</label>
              <div style={fieldWrapStyle}>
                <FiCalendar size={18} style={{ color: config.color, flexShrink: 0 }} />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* Row 2: Duration & Travellers (Fully Editable with React Icons) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Duration (Days)</label>
              <div style={fieldWrapStyle}>
                <FiClock size={18} style={{ color: config.color, flexShrink: 0 }} />
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  aria-label="Duration"
                  value={durationText}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^\d+$/.test(val)) setDurationText(val);
                  }}
                  onBlur={() => {
                    if (durationText === '' || parseInt(durationText, 10) < 1) setDurationText('1');
                    else if (parseInt(durationText, 10) > 30) setDurationText('30');
                  }}
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Number of Travellers</label>
              <div style={fieldWrapStyle}>
                <FiUsers size={18} style={{ color: config.color, flexShrink: 0 }} />
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  aria-label="Travellers"
                  value={travellersText}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^\d+$/.test(val)) setTravellersText(val);
                  }}
                  onBlur={() => {
                    if (travellersText === '' || parseInt(travellersText, 10) < 1) setTravellersText('1');
                    else if (parseInt(travellersText, 10) > 100) setTravellersText('100');
                  }}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* Service-Specific Custom Fields */}
          {config.id === 'blue_cruise' && (
            <div
              style={{
                backgroundColor: '#F8FAFC',
                padding: '1.15rem',
                borderRadius: '12px',
                border: '1.5px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <div
                style={{
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  color: '#0F172A',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <FiAnchor size={17} style={{ color: config.color }} />
                <span>Blue Cruise Preferences</span>
              </div>

              {/* Flexible Itinerary Duration: Presets + Custom Days & Nights */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                    Itinerary Duration
                  </label>
                  <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>
                    {cruiseDays} Days / {cruiseNights} Nights
                  </span>
                </div>

                {/* Preset Pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.65rem' }}>
                  {[
                    { label: '4 Days / 3 Nights', days: 4, nights: 3, val: '4d_3n' },
                    { label: '6 Days / 5 Nights', days: 6, nights: 5, val: '6d_5n' },
                    { label: '7 Days / 6 Nights', days: 7, nights: 6, val: '7d_6n' },
                    { label: 'Custom', days: null, nights: null, val: 'custom' },
                  ].map((preset) => {
                    const isSelected =
                      preset.days !== null
                        ? cruiseDays === preset.days && cruiseNights === preset.nights
                        : !([
                            [4, 3],
                            [6, 5],
                            [7, 6],
                          ].some(([d, n]) => cruiseDays === d && cruiseNights === n));

                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          if (preset.days !== null) {
                            setCruiseDays(preset.days);
                            setCruiseNights(preset.nights);
                            setCruiseDuration(preset.val);
                            setDurationText(String(preset.days));
                          }
                        }}
                        style={{
                          padding: '0.35rem 0.65rem',
                          borderRadius: '8px',
                          border: '1px solid',
                          borderColor: isSelected ? config.color : '#CBD5E1',
                          backgroundColor: isSelected ? config.bgLight : '#FFFFFF',
                          color: isSelected ? config.color : '#475569',
                          fontWeight: isSelected ? 700 : 500,
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                {/* Flexible numeric day / night inputs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#64748B', marginBottom: '0.25rem' }}>
                      Days
                    </label>
                    <div style={fieldWrapStyle}>
                      <FiClock size={15} style={{ color: config.color, flexShrink: 0 }} />
                      <input
                        type="number"
                        min="1"
                        max="30"
                        aria-label="Cruise Days"
                        value={cruiseDays}
                        onChange={(e) => {
                          const d = parseInt(e.target.value, 10);
                          const nextDays = isNaN(d) ? 1 : Math.max(1, Math.min(30, d));
                          setCruiseDays(nextDays);
                          setDurationText(String(nextDays));
                          const n = Math.max(0, nextDays - 1);
                          setCruiseNights(n);
                          setCruiseDuration(nextDays === 4 && n === 3 ? '4d_3n' : nextDays === 6 && n === 5 ? '6d_5n' : `${nextDays}d_${n}n`);
                        }}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#64748B', marginBottom: '0.25rem' }}>
                      Nights
                    </label>
                    <div style={fieldWrapStyle}>
                      <FiClock size={15} style={{ color: config.color, flexShrink: 0 }} />
                      <input
                        type="number"
                        min="0"
                        max="30"
                        aria-label="Cruise Nights"
                        value={cruiseNights}
                        onChange={(e) => {
                          const n = parseInt(e.target.value, 10);
                          const nextNights = isNaN(n) ? 0 : Math.max(0, Math.min(30, n));
                          setCruiseNights(nextNights);
                          setCruiseDuration(cruiseDays === 4 && nextNights === 3 ? '4d_3n' : cruiseDays === 6 && nextNights === 5 ? '6d_5n' : `${cruiseDays}d_${nextNights}n`);
                        }}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Charter / Cabin Type */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginBottom: '0.3rem' }}>
                  Charter / Cabin Type
                </label>
                <div style={fieldWrapStyle}>
                  <select
                    value={cruiseCabinType}
                    onChange={(e) => setCruiseCabinType(e.target.value)}
                    style={{ ...inputStyle, marginLeft: 0, cursor: 'pointer' }}
                  >
                    <option value="standard_cabin">Cabin Charter (Double/Twin)</option>
                    <option value="private_gulet">Private Gulet Charter</option>
                    <option value="deluxe_gulet">Deluxe / VIP Gulet</option>
                    <option value="custom">Custom Yacht / Charter Specification</option>
                  </select>
                  <FiChevronDown size={16} style={{ color: '#94A3B8' }} />
                </div>
                {cruiseCabinType === 'custom' && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <input
                      type="text"
                      placeholder="Specify yacht details (e.g. 4-cabin catamaran, master stateroom, private chef)..."
                      value={customCabinDetails}
                      onChange={(e) => setCustomCabinDetails(e.target.value)}
                      style={{
                        ...inputStyle,
                        marginLeft: 0,
                        border: '1.5px solid #CBD5E1',
                        borderRadius: '8px',
                        padding: '0.5rem 0.75rem',
                        backgroundColor: '#FFFFFF',
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {config.id === 'hotel_only' && (
            <div
              style={{
                backgroundColor: '#F8FAFC',
                padding: '1.15rem',
                borderRadius: '12px',
                border: '1.5px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
              }}
            >
              <div
                style={{
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  color: '#0F172A',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <FiHome size={17} style={{ color: config.color }} />
                <span>Accommodation Preferences</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginBottom: '0.3rem' }}>
                    Hotel Rating Class
                  </label>
                  <div style={fieldWrapStyle}>
                    <select
                      value={accommodationType}
                      onChange={(e) => setAccommodationType(e.target.value)}
                      style={{ ...inputStyle, marginLeft: 0, cursor: 'pointer' }}
                    >
                      <option value="3_star">3 Star / Comfortable</option>
                      <option value="4_star">4 Star / First Class</option>
                      <option value="5_star">5 Star / Luxury</option>
                      <option value="s_class">Special Class / Boutique Cave</option>
                      <option value="custom">Custom Stay / Villa / Other</option>
                    </select>
                    <FiChevronDown size={16} style={{ color: '#94A3B8' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginBottom: '0.3rem' }}>
                    Number of Rooms
                  </label>
                  <div style={fieldWrapStyle}>
                    <select
                      value={hotelRoomCount}
                      onChange={(e) => setHotelRoomCount(e.target.value)}
                      style={{ ...inputStyle, marginLeft: 0, cursor: 'pointer' }}
                    >
                      <option value="1">1 Room</option>
                      <option value="2">2 Rooms</option>
                      <option value="3">3+ Rooms</option>
                    </select>
                    <FiChevronDown size={16} style={{ color: '#94A3B8' }} />
                  </div>
                </div>
              </div>
              {accommodationType === 'custom' && (
                <div>
                  <input
                    type="text"
                    placeholder="Specify custom stay preferences (e.g. cliffside cave suite, private infinity pool)..."
                    value={customAccommodationDetails}
                    onChange={(e) => setCustomAccommodationDetails(e.target.value)}
                    style={{
                      ...inputStyle,
                      marginLeft: 0,
                      border: '1.5px solid #CBD5E1',
                      borderRadius: '8px',
                      padding: '0.5rem 0.75rem',
                      backgroundColor: '#FFFFFF',
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {config.id === 'vehicle_driver' && (
            <div
              style={{
                backgroundColor: '#F8FAFC',
                padding: '1.15rem',
                borderRadius: '12px',
                border: '1.5px solid #E2E8F0',
              }}
            >
              <div
                style={{
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  color: '#0F172A',
                  marginBottom: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <FiTruck size={17} style={{ color: config.color }} />
                <span>Chauffeur & Vehicle Specifications</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', marginBottom: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginBottom: '0.3rem' }}>
                    Vehicle Class
                  </label>
                  <div style={fieldWrapStyle}>
                    <select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                      style={{ ...inputStyle, marginLeft: 0, cursor: 'pointer' }}
                    >
                      <option value="vip_minivan">Mercedes Vito / VIP Minivan</option>
                      <option value="executive_sprinter">Executive Sprinter (Up to 16)</option>
                      <option value="sedan">Private Executive Sedan</option>
                    </select>
                    <FiChevronDown size={16} style={{ color: '#94A3B8' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginBottom: '0.3rem' }}>
                    Pickup Time
                  </label>
                  <div style={fieldWrapStyle}>
                    <FiClock size={16} style={{ color: config.color, flexShrink: 0 }} />
                    <input
                      type="time"
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginBottom: '0.3rem' }}>
                  Pickup Airport, Port, or Address
                </label>
                <div style={fieldWrapStyle}>
                  <FiMapPin size={16} style={{ color: config.color, flexShrink: 0 }} />
                  <input
                    type="text"
                    placeholder="e.g. Istanbul Airport (IST), Hotel lobby..."
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>
          )}

          {config.id === 'guide_activities' && (
            <div
              style={{
                backgroundColor: '#F8FAFC',
                padding: '1.15rem',
                borderRadius: '12px',
                border: '1.5px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <div
                style={{
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  color: '#0F172A',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <FiMapPin size={17} style={{ color: config.color }} />
                <span>Excursion & Guide Requirements</span>
              </div>

              {/* Activity Category: Searchable Multi-Select with Tag Pills & Custom Entry */}
              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginBottom: '0.35rem' }}>
                  Activity Category
                </label>

                {/* Selected Tag Pills */}
                {selectedActivities.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.5rem' }}>
                    {selectedActivities.map((act) => (
                      <span
                        key={act}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.25rem 0.55rem',
                          borderRadius: '6px',
                          backgroundColor: '#FFEDD5',
                          color: '#C2410C',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          border: '1px solid #FED7AA',
                        }}
                      >
                        {act}
                        <button
                          type="button"
                          aria-label={`Remove ${act}`}
                          onClick={() => {
                            const updated = selectedActivities.filter((a) => a !== act);
                            setSelectedActivities(updated);
                            setActivityCategory(updated.join(', ') || 'General Sightseeing');
                          }}
                          style={{
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            color: '#C2410C',
                          }}
                        >
                          <FiX size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Search / Custom input */}
                <div style={fieldWrapStyle}>
                  <FiSearch size={15} style={{ color: config.color, flexShrink: 0 }} />
                  <input
                    type="text"
                    placeholder="Search or type custom activity and press Enter..."
                    value={activitySearch}
                    onChange={(e) => {
                      setActivitySearch(e.target.value);
                      setIsActivityDropdownOpen(true);
                    }}
                    onFocus={() => setIsActivityDropdownOpen(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const trimmed = activitySearch.trim();
                        if (trimmed && !selectedActivities.includes(trimmed)) {
                          const updated = [...selectedActivities, trimmed];
                          setSelectedActivities(updated);
                          setActivityCategory(updated.join(', '));
                          setActivitySearch('');
                        }
                      } else if (e.key === 'Backspace' && !activitySearch && selectedActivities.length > 0) {
                        const updated = selectedActivities.slice(0, -1);
                        setSelectedActivities(updated);
                        setActivityCategory(updated.join(', ') || 'General Sightseeing');
                      } else if (e.key === 'Escape') {
                        setIsActivityDropdownOpen(false);
                      }
                    }}
                    style={inputStyle}
                  />
                  {activitySearch && (
                    <button
                      type="button"
                      onClick={() => {
                        const trimmed = activitySearch.trim();
                        if (trimmed && !selectedActivities.includes(trimmed)) {
                          const updated = [...selectedActivities, trimmed];
                          setSelectedActivities(updated);
                          setActivityCategory(updated.join(', '));
                          setActivitySearch('');
                        }
                      }}
                      style={{
                        border: 'none',
                        background: '#C2410C',
                        color: '#FFFFFF',
                        borderRadius: '6px',
                        padding: '0.2rem 0.5rem',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Add
                    </button>
                  )}
                </div>

                {/* Suggestions Dropdown */}
                {isActivityDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: '#FFFFFF',
                      borderRadius: '8px',
                      border: '1.5px solid #E2E8F0',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                      zIndex: 10,
                      marginTop: '4px',
                      maxHeight: '180px',
                      overflowY: 'auto',
                    }}
                  >
                    {SUGGESTED_ACTIVITIES.filter((act) =>
                      act.toLowerCase().includes(activitySearch.toLowerCase())
                    ).map((act) => {
                      const isSelected = selectedActivities.includes(act);
                      return (
                        <div
                          key={act}
                          onClick={() => {
                            let updated;
                            if (isSelected) {
                              updated = selectedActivities.filter((a) => a !== act);
                            } else {
                              updated = [...selectedActivities, act];
                            }
                            setSelectedActivities(updated);
                            setActivityCategory(updated.join(', ') || 'General Sightseeing');
                            setActivitySearch('');
                          }}
                          style={{
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: isSelected ? '#FFF7ED' : 'transparent',
                            color: isSelected ? '#C2410C' : '#334155',
                            fontWeight: isSelected ? 700 : 500,
                          }}
                        >
                          <span>{act}</span>
                          {isSelected && <FiCheck size={14} />}
                        </div>
                      );
                    })}
                    {activitySearch.trim() &&
                      !SUGGESTED_ACTIVITIES.some(
                        (a) => a.toLowerCase() === activitySearch.trim().toLowerCase()
                      ) && (
                        <div
                          onClick={() => {
                            const trimmed = activitySearch.trim();
                            if (trimmed && !selectedActivities.includes(trimmed)) {
                              const updated = [...selectedActivities, trimmed];
                              setSelectedActivities(updated);
                              setActivityCategory(updated.join(', '));
                              setActivitySearch('');
                            }
                          }}
                          style={{
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            color: '#C2410C',
                            fontWeight: 700,
                            borderTop: '1px solid #F1F5F9',
                            backgroundColor: '#FFF7ED',
                          }}
                        >
                          + Add custom: "{activitySearch.trim()}"
                        </div>
                      )}
                  </div>
                )}
              </div>

              {/* Guide Language */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginBottom: '0.3rem' }}>
                  Guide Language
                </label>
                <div style={fieldWrapStyle}>
                  <select
                    value={guideLanguage}
                    onChange={(e) => setGuideLanguage(e.target.value)}
                    style={{ ...inputStyle, marginLeft: 0, cursor: 'pointer' }}
                  >
                    <option value="English">English</option>
                    <option value="German">German</option>
                    <option value="French">French</option>
                    <option value="Spanish">Spanish</option>
                    <option value="Italian">Italian</option>
                  </select>
                  <FiChevronDown size={16} style={{ color: '#94A3B8' }} />
                </div>
              </div>
            </div>
          )}

          {config.id === 'full_package' && (
            <div
              style={{
                backgroundColor: '#F8FAFC',
                padding: '1.15rem',
                borderRadius: '12px',
                border: '1.5px solid #E2E8F0',
              }}
            >
              <div
                style={{
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  color: '#0F172A',
                  marginBottom: '0.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <FiBriefcase size={17} style={{ color: config.color }} />
                <span>Complete Package Inclusions</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0 0 0.85rem 0' }}>
                Includes curated accommodation, private transit, daily sightseeing, and dedicated support.
              </p>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginBottom: '0.3rem' }}>
                  Target Accommodation Tier
                </label>
                <div style={fieldWrapStyle}>
                  <select
                    value={accommodationType}
                    onChange={(e) => setAccommodationType(e.target.value)}
                    style={{ ...inputStyle, marginLeft: 0, cursor: 'pointer' }}
                  >
                    <option value="4_star">4 Star & Boutique Comfort</option>
                    <option value="5_star">5 Star & Luxury Stays</option>
                    <option value="s_class">Special Class & Historic Cave</option>
                    <option value="3_star">3 Star / Value Oriented</option>
                  </select>
                  <FiChevronDown size={16} style={{ color: '#94A3B8' }} />
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label style={labelStyle}>
              Special Requests & Preferences
            </label>
            <div style={{ ...fieldWrapStyle, alignItems: 'flex-start', padding: '0.65rem' }}>
              <FiMessageSquare size={18} style={{ color: '#94A3B8', marginTop: '0.2rem', flexShrink: 0 }} />
              <textarea
                rows={2}
                placeholder="e.g. dietary requirements, honeymoon setup, child seat..."
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                  fontSize: '0.88rem',
                  fontWeight: 500,
                }}
              />
            </div>
          </div>

          {/* Custom Checkbox for Flexible Dates */}
          <button
            type="button"
            role="checkbox"
            aria-checked={flexible}
            onClick={() => setFlexible(!flexible)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.88rem',
              fontWeight: 600,
              color: flexible ? '#147D33' : '#475569',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '5px',
                border: flexible ? '2px solid #147D33' : '2px solid #CBD5E1',
                backgroundColor: flexible ? '#147D33' : '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                transition: 'all 0.15s ease',
                flexShrink: 0,
              }}
            >
              {flexible && <FiCheck size={13} strokeWidth={3} />}
            </div>
            <span>My travel dates are flexible (±3 days)</span>
          </button>

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              marginTop: '0.5rem',
              justifyContent: 'flex-end',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.75rem 1.35rem',
                borderRadius: '10px',
                border: '1.5px solid #E2E8F0',
                backgroundColor: '#FFFFFF',
                color: '#475569',
                fontSize: '0.92rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '0.75rem 1.65rem',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: '#E06D00',
                color: '#FFFFFF',
                fontSize: '0.92rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 14px rgba(224, 109, 0, 0.35)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
            >
              <span>Continue to Quotes</span>
              <FiArrowRight size={17} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TripRequestModal;
