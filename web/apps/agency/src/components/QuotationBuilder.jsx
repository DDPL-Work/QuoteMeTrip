import { useState, useMemo } from 'react';
import {
  FiHome,
  FiMapPin,
  FiTruck,
  FiMap,
  FiCalendar,
  FiPlus,
  FiTrash2,
  FiSave,
  FiSend,
  FiInfo,
  FiChevronDown,
  FiChevronUp,
  FiCheckCircle,
  FiAlertCircle,
  FiEye,
  FiUsers,
  FiBriefcase,
  FiX,
  FiLayers,
  FiArrowRight,
  FiArrowLeft,
  FiCopy,
} from 'react-icons/fi';
import {
  QUOTATION_TYPES,
  QUOTATION_TYPE_LABELS,
} from '@troublefree/types';
import { QuotationPreviewModal } from './QuotationPreviewModal.jsx';

/**
 * Calculates day difference between two YYYY-MM-DD date strings.
 */
function calculateNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 1;
  const d1 = new Date(checkIn);
  const d2 = new Date(checkOut);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 1;
  const diffTime = d2.getTime() - d1.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 1;
}

/**
 * Normalizes an incoming raw quotation item to one of our rich category forms.
 */
function parseInitialItem(item, idx) {
  const meta = item.metadata || {};
  const itemType = item.itemType || 'other';

  if (itemType === 'hotel') {
    return {
      _category: 'hotel',
      id: item.id || `hotel-${Date.now()}-${idx}`,
      title: item.title || '',
      property: meta.property || item.title || '',
      starCategory: meta.starCategory || '4 Star',
      mealPlan: meta.mealPlan || 'CP (Breakfast Included)',
      checkIn: meta.checkIn || '',
      checkOut: meta.checkOut || '',
      nights: Number(meta.nights) || 1,
      roomCategory: meta.roomCategory || 'Standard Room',
      roomType: meta.roomType || 'Double (2 Persons)',
      rooms: Number(meta.rooms) || 1,
      bedType: meta.bedType || 'Queen Bed',
      extraBed: meta.extraBed || 'None',
      maxAdults: Number(meta.maxAdults) || 2,
      maxChildren: Number(meta.maxChildren) || 1,
      addons: {
        aweb: Boolean(meta.addons?.aweb),
        cweb: Boolean(meta.addons?.cweb),
        cwoeb: Boolean(meta.addons?.cwoeb),
      },
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.unitPrice) || 0,
      description: item.description || '',
    };
  }

  if (itemType === 'vehicle' || itemType === 'driver') {
    return {
      _category: 'transport',
      id: item.id || `transport-${Date.now()}-${idx}`,
      title: item.title || '',
      serviceType: meta.serviceType || (itemType === 'driver' ? 'Chauffeur / Driver' : 'Airport Transfer'),
      serviceDate: meta.serviceDate || '',
      pickupTime: meta.pickupTime || '',
      vehicleType: meta.vehicleType || 'Sedan (1-3 PAX)',
      usageType: meta.usageType || 'One-way Transfer',
      passengerCapacity: meta.passengerCapacity || '3 Passengers',
      luggageCapacity: meta.luggageCapacity || '2 Luggage Bags',
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.unitPrice) || 0,
      description: item.description || '',
    };
  }

  if (itemType === 'guide' || itemType === 'service') {
    return {
      _category: 'activity',
      id: item.id || `activity-${Date.now()}-${idx}`,
      title: item.title || '',
      category: meta.category || (itemType === 'guide' ? 'Guided Excursion' : 'Sightseeing Tour'),
      tourDate: meta.tourDate || '',
      duration: meta.duration || 'Half Day (4 Hours)',
      guideIncluded: meta.guideIncluded !== undefined ? Boolean(meta.guideIncluded) : true,
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.unitPrice) || 0,
      description: item.description || '',
    };
  }

  return {
    _category: 'other',
    id: item.id || `other-${Date.now()}-${idx}`,
    itemType: item.itemType || 'other',
    title: item.title || '',
    quantity: Number(item.quantity) || 1,
    unitPrice: Number(item.unitPrice) || 0,
    description: item.description || '',
    metadata: meta,
  };
}

export function QuotationBuilder({
  initial = null,
  travelRequest = null,
  onSubmit = null,
  onSaveDraft = null,
  onCancel = null,
  submitLabel = 'Save draft',
  isSubmitting = false,
}) {
  const defaultDestination = useMemo(() => {
    if (travelRequest?.route?.destination) return travelRequest.route.destination;
    if (travelRequest?.cities?.length) return travelRequest.cities.join(' → ');
    return 'Turkey';
  }, [travelRequest]);

  // Form State
  const [activeStep, setActiveStep] = useState('basic');
  const [quotationType, setQuotationType] = useState(initial?.quotationType ?? '');
  const [quotationTitle, setQuotationTitle] = useState(
    initial?.notes?.split('\n')?.[0]?.replace(/^Title:\s*/i, '') ||
      `${defaultDestination} Official Travel Quotation`,
  );
  const [destination, setDestination] = useState(defaultDestination);
  const [country, setCountry] = useState(travelRequest?.route?.destinationCountry || 'Turkey');
  const [currency, setCurrency] = useState(initial?.currency || 'USD');
  const [validUntil, setValidUntil] = useState(initial?.validUntil || '');
  const [notes, setNotes] = useState(initial?.notes || '');
  const [showRequestDetails, setShowRequestDetails] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [formError, setFormError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Structured Service Items
  const [hotels, setHotels] = useState(() => {
    if (initial?.items?.length) {
      const parsed = initial.items.map(parseInitialItem).filter((it) => it._category === 'hotel');
      if (parsed.length) return parsed;
    }
    // Default 1 hotel entry
    const sDate = travelRequest?.travelStartDate || '';
    const eDate = travelRequest?.travelEndDate || '';
    const nights = calculateNights(sDate, eDate);
    return [
      {
        _category: 'hotel',
        id: `hotel-${Date.now()}-0`,
        title: initial?.items?.[0]?.title || '',
        property: '',
        starCategory: travelRequest?.accommodationType
          ? travelRequest.accommodationType.replace('_', ' ').toUpperCase()
          : '4 Star',
        mealPlan: 'CP (Breakfast Included)',
        checkIn: sDate,
        checkOut: eDate,
        nights: nights,
        roomCategory: 'Standard Room',
        roomType: 'Double (2 Persons)',
        rooms: 1,
        bedType: 'Queen Bed',
        extraBed: 'None',
        maxAdults: travelRequest?.numberOfTravellers || 2,
        maxChildren: 0,
        addons: { aweb: false, cweb: false, cwoeb: false },
        quantity: Number(initial?.items?.[0]?.quantity) || 1,
        unitPrice: Number(initial?.items?.[0]?.unitPrice) || 0,
        description: initial?.items?.[0]?.description || '',
      },
    ];
  });

  const [transports, setTransports] = useState(() => {
    if (initial?.items?.length) {
      return initial.items.map(parseInitialItem).filter((it) => it._category === 'transport');
    }
    if (travelRequest?.driverRequired) {
      return [
        {
          _category: 'transport',
          id: `transport-${Date.now()}-0`,
          title: `${defaultDestination} Airport Transfer`,
          serviceType: 'Airport Transfer',
          serviceDate: travelRequest.travelStartDate || '',
          pickupTime: '10:00 AM',
          vehicleType: 'Sedan (1-3 PAX)',
          usageType: 'One-way Transfer',
          passengerCapacity: `${travelRequest.numberOfTravellers || 2} Passengers`,
          luggageCapacity: `${travelRequest.luggageCount || 2} Bags`,
          quantity: 1,
          unitPrice: 45,
          description: 'Dedicated air-conditioned private vehicle with driver.',
        },
      ];
    }
    return [];
  });

  const [activities, setActivities] = useState(() => {
    if (initial?.items?.length) {
      return initial.items.map(parseInitialItem).filter((it) => it._category === 'activity');
    }
    if (travelRequest?.guideRequired) {
      return [
        {
          _category: 'activity',
          id: `activity-${Date.now()}-0`,
          title: `${defaultDestination} Guided Historic Tour`,
          category: 'Cultural Excursion',
          tourDate: travelRequest.travelStartDate || '',
          duration: 'Full Day (8 Hours)',
          guideIncluded: true,
          quantity: travelRequest.numberOfTravellers || 2,
          unitPrice: 35,
          description: 'Licensed expert tour guide with museum entries.',
        },
      ];
    }
    return [];
  });

  const [otherItems] = useState(() => {
    if (initial?.items?.length) {
      return initial.items.map(parseInitialItem).filter((it) => it._category === 'other');
    }
    return [];
  });

  // Calculate duration label from dates
  const durationLabel = useMemo(() => {
    const sDate = travelRequest?.travelStartDate;
    const eDate = travelRequest?.travelEndDate;
    if (sDate && eDate) {
      const n = calculateNights(sDate, eDate);
      return `${n}N / ${n + 1}D`;
    }
    return 'Flexible Duration';
  }, [travelRequest]);

  // Calculations for Summary
  const hotelTotal = useMemo(() => {
    return hotels.reduce((sum, h) => sum + (Number(h.quantity) || 1) * (Number(h.unitPrice) || 0), 0);
  }, [hotels]);

  const transportTotal = useMemo(() => {
    return transports.reduce((sum, t) => sum + (Number(t.quantity) || 1) * (Number(t.unitPrice) || 0), 0);
  }, [transports]);

  const activityTotal = useMemo(() => {
    return activities.reduce((sum, a) => sum + (Number(a.quantity) || 1) * (Number(a.unitPrice) || 0), 0);
  }, [activities]);

  const otherTotal = useMemo(() => {
    return otherItems.reduce((sum, o) => sum + (Number(o.quantity) || 1) * (Number(o.unitPrice) || 0), 0);
  }, [otherItems]);

  const subtotal = useMemo(() => {
    return Math.round((hotelTotal + transportTotal + activityTotal + otherTotal) * 100) / 100;
  }, [hotelTotal, transportTotal, activityTotal, otherTotal]);

  const totalItemsCount = hotels.length + transports.length + activities.length + otherItems.length;

  const costPerPassenger = useMemo(() => {
    const pax = Number(travelRequest?.numberOfTravellers) || 0;
    if (pax > 0 && subtotal > 0) {
      return (subtotal / pax).toFixed(2);
    }
    return null;
  }, [subtotal, travelRequest]);

  // Converts rich components back into standard backend quotation items
  function buildPayload() {
    setFormError(null);

    if (!QUOTATION_TYPES.includes(quotationType)) {
      setFormError('Select a quotation type.');
      return null;
    }

    if (totalItemsCount === 0) {
      setFormError('Add at least one service item.');
      return null;
    }

    // Validate hotels
    for (let i = 0; i < hotels.length; i++) {
      const h = hotels[i];
      if (!String(h.title || '').trim()) {
        setFormError(`Item ${i + 1} requires a title.`);
        return null;
      }
      if (!(Number(h.quantity) > 0)) {
        setFormError(`Item ${i + 1} needs a quantity greater than 0.`);
        return null;
      }
      if (Number(h.unitPrice) < 0) {
        setFormError(`Item ${i + 1} needs a unit price of 0 or more.`);
        return null;
      }
    }

    // Validate transports
    for (let i = 0; i < transports.length; i++) {
      const t = transports[i];
      if (!String(t.title || '').trim()) {
        setFormError(`Transport item ${i + 1} requires a title.`);
        setActiveStep('transports');
        return null;
      }
      if (!(Number(t.quantity) > 0)) {
        setFormError(`Transport item ${i + 1} needs a quantity greater than 0.`);
        setActiveStep('transports');
        return null;
      }
      if (Number(t.unitPrice) < 0) {
        setFormError(`Transport item ${i + 1} needs a unit price of 0 or more.`);
        setActiveStep('transports');
        return null;
      }
    }

    // Validate activities
    for (let i = 0; i < activities.length; i++) {
      const a = activities[i];
      if (!String(a.title || '').trim()) {
        setFormError(`Activity item ${i + 1} requires a title.`);
        setActiveStep('activities');
        return null;
      }
      if (!(Number(a.quantity) > 0)) {
        setFormError(`Activity item ${i + 1} needs a quantity greater than 0.`);
        setActiveStep('activities');
        return null;
      }
      if (Number(a.unitPrice) < 0) {
        setFormError(`Activity item ${i + 1} needs a unit price of 0 or more.`);
        setActiveStep('activities');
        return null;
      }
    }

    // Map all structured items to backend QuotationItem format
    const formattedItems = [
      ...hotels.map((h) => ({
        itemType: 'hotel',
        title: String(h.title).trim(),
        description: h.description || `${h.starCategory} - ${h.roomCategory} (${h.mealPlan})`,
        quantity: Number(h.quantity) || 1,
        unitPrice: Number(h.unitPrice) || 0,
        metadata: {
          property: h.property,
          starCategory: h.starCategory,
          mealPlan: h.mealPlan,
          checkIn: h.checkIn,
          checkOut: h.checkOut,
          nights: h.nights,
          roomCategory: h.roomCategory,
          roomType: h.roomType,
          rooms: h.rooms,
          bedType: h.bedType,
          extraBed: h.extraBed,
          maxAdults: h.maxAdults,
          maxChildren: h.maxChildren,
          addons: h.addons,
        },
      })),
      ...transports.map((t) => ({
        itemType: t.serviceType.toLowerCase().includes('driver') ? 'driver' : 'vehicle',
        title: String(t.title).trim(),
        description: t.description || `${t.vehicleType} - ${t.usageType}`,
        quantity: Number(t.quantity) || 1,
        unitPrice: Number(t.unitPrice) || 0,
        metadata: {
          serviceType: t.serviceType,
          serviceDate: t.serviceDate,
          pickupTime: t.pickupTime,
          vehicleType: t.vehicleType,
          usageType: t.usageType,
          passengerCapacity: t.passengerCapacity,
          luggageCapacity: t.luggageCapacity,
        },
      })),
      ...activities.map((a) => ({
        itemType: a.category.toLowerCase().includes('guide') ? 'guide' : 'service',
        title: String(a.title).trim(),
        description: a.description || `${a.category} - ${a.duration}`,
        quantity: Number(a.quantity) || 1,
        unitPrice: Number(a.unitPrice) || 0,
        metadata: {
          category: a.category,
          tourDate: a.tourDate,
          duration: a.duration,
          guideIncluded: a.guideIncluded,
        },
      })),
      ...otherItems.map((o) => ({
        itemType: o.itemType || 'other',
        title: String(o.title).trim(),
        description: o.description || null,
        quantity: Number(o.quantity) || 1,
        unitPrice: Number(o.unitPrice) || 0,
        metadata: o.metadata || null,
      })),
    ];

    return {
      quotationType,
      currency: currency || 'USD',
      validUntil: validUntil || undefined,
      notes: notes || undefined,
      items: formattedItems,
    };
  }

  async function handleFinalSubmit(e) {
    e?.preventDefault?.();
    const payload = buildPayload();
    if (!payload) return;

    try {
      if (onSubmit) {
        await onSubmit(payload);
      }
    } catch (err) {
      setFormError(err?.message || 'Failed to submit quotation.');
    }
  }

  async function handleDraftSave(e) {
    e?.preventDefault?.();
    const payload = buildPayload();
    if (!payload) return;

    try {
      if (onSaveDraft) {
        await onSaveDraft(payload);
      } else if (onSubmit) {
        await onSubmit(payload);
      }
      setSuccessMessage('Draft saved successfully.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setFormError(err?.message || 'Failed to save quotation draft.');
    }
  }

  // Hotel item handlers
  function addHotel() {
    const sDate = travelRequest?.travelStartDate || '';
    const eDate = travelRequest?.travelEndDate || '';
    const nights = calculateNights(sDate, eDate);
    const newHotel = {
      _category: 'hotel',
      id: `hotel-${Date.now()}-${hotels.length}`,
      title: `${destination} Hotel Stay`,
      property: '',
      starCategory: '4 Star',
      mealPlan: 'CP (Breakfast Included)',
      checkIn: sDate,
      checkOut: eDate,
      nights: nights,
      roomCategory: 'Standard Room',
      roomType: 'Double (2 Persons)',
      rooms: 1,
      bedType: 'Queen Bed',
      extraBed: 'None',
      maxAdults: 2,
      maxChildren: 1,
      addons: { aweb: false, cweb: false, cwoeb: false },
      quantity: 1,
      unitPrice: 120,
      description: 'Standard accommodation with breakfast included.',
    };
    setHotels([...hotels, newHotel]);
  }

  function updateHotel(index, field, value) {
    setHotels((prev) =>
      prev.map((h, i) => {
        if (i !== index) return h;
        const updated = { ...h, [field]: value };
        if (field === 'checkIn' || field === 'checkOut') {
          updated.nights = calculateNights(
            field === 'checkIn' ? value : updated.checkIn,
            field === 'checkOut' ? value : updated.checkOut,
          );
        }
        return updated;
      }),
    );
  }

  function duplicateHotel(index) {
    const orig = hotels[index];
    if (!orig) return;
    const copy = { ...orig, id: `hotel-${Date.now()}`, title: `${orig.title} (Copy)` };
    setHotels([...hotels, copy]);
  }

  function removeHotel(index) {
    setHotels((prev) => prev.filter((_, i) => i !== index));
  }

  // Transport item handlers
  function addTransport(type = 'Airport Transfer') {
    const newTransport = {
      _category: 'transport',
      id: `transport-${Date.now()}-${transports.length}`,
      title: type === 'Chauffeur / Driver' ? 'Full Day Driver & Vehicle' : 'Airport to Hotel Transfer',
      serviceType: type,
      serviceDate: travelRequest?.travelStartDate || '',
      pickupTime: '10:00 AM',
      vehicleType: 'Sedan (1-3 PAX)',
      usageType: 'One-way Transfer',
      passengerCapacity: '3 Passengers',
      luggageCapacity: '2 Bags',
      quantity: 1,
      unitPrice: 40,
      description: 'Air-conditioned private vehicle with driver.',
    };
    setTransports([...transports, newTransport]);
  }

  function updateTransport(index, field, value) {
    setTransports((prev) => prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
  }

  function removeTransport(index) {
    setTransports((prev) => prev.filter((_, i) => i !== index));
  }

  // Activity item handlers
  function addActivity(category = 'Sightseeing Tour') {
    const newActivity = {
      _category: 'activity',
      id: `activity-${Date.now()}-${activities.length}`,
      title: category === 'Adventure Experience' ? 'Adventure Outdoor Experience' : 'City Highlights Sightseeing Tour',
      category: category,
      tourDate: travelRequest?.travelStartDate || '',
      duration: 'Half Day (4 Hours)',
      guideIncluded: true,
      quantity: Number(travelRequest?.numberOfTravellers) || 2,
      unitPrice: 30,
      description: 'Guided excursion with licensed expert tour guide.',
    };
    setActivities([...activities, newActivity]);
  }

  function updateActivity(index, field, value) {
    setActivities((prev) => prev.map((a, i) => (i === index ? { ...a, [field]: value } : a)));
  }

  function removeActivity(index) {
    setActivities((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <form
      aria-label="Quotation form"
      onSubmit={handleDraftSave}
      className="qmt-quotation-builder"
      style={{ width: '100%', display: 'flex', flexDirection: 'column' }}
    >
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          paddingBottom: '1.25rem',
          marginBottom: '1rem',
          borderBottom: '1px solid var(--agency-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0c4e28 0%, #147d33 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              boxShadow: 'var(--agency-shadow-sm)',
            }}
          >
            <FiLayers />
          </div>
          <div>
            <h2
              style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                color: 'var(--agency-primary)',
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              Add Services to Quotation
            </h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--agency-text-muted)' }}>
              Configure hotels, transfers, sightseeing and activities for this travel proposal.
            </p>
          </div>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close Quotation Builder"
            style={{
              background: '#ffffff',
              border: '1px solid var(--agency-border)',
              borderRadius: '8px',
              padding: '0.5rem 0.85rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--agency-text-muted)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <FiX /> Close
          </button>
        )}
      </div>

      {/* Traveller Request Context Banner */}
      {travelRequest && (
        <div
          style={{
            background: 'linear-gradient(135deg, #0c4e28 0%, #147d33 100%)',
            color: '#ffffff',
            borderRadius: '12px',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.5rem',
            boxShadow: 'var(--agency-shadow-md)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontWeight: 800,
                  color: '#86efac',
                  marginBottom: '0.35rem',
                }}
              >
                <FiInfo /> QUERY REQUIREMENTS • REQUEST #{travelRequest.id}
              </div>
              <h3
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  margin: '0 0 0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#ffffff',
                }}
              >
                <FiMapPin style={{ color: 'var(--agency-accent)' }} />
                {destination}
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    background: 'rgba(255,255,255,0.15)',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '999px',
                    marginLeft: '0.5rem',
                  }}
                >
                  {durationLabel}
                </span>
              </h3>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '1.25rem',
                  fontSize: '0.85rem',
                  opacity: 0.95,
                }}
              >
                {travelRequest.travelStartDate && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <FiCalendar /> {travelRequest.travelStartDate}{' '}
                    {travelRequest.travelEndDate ? `→ ${travelRequest.travelEndDate}` : ''}
                  </span>
                )}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <FiUsers /> {travelRequest.numberOfTravellers || 1} PAX
                </span>
                {travelRequest.luggageCount !== undefined && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <FiBriefcase /> {travelRequest.luggageCount} Luggage
                  </span>
                )}
                {travelRequest.hotelRequired && (
                  <span
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      padding: '0.1rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.78rem',
                    }}
                  >
                    Hotel Required
                  </span>
                )}
                {travelRequest.driverRequired && (
                  <span
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      padding: '0.1rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.78rem',
                    }}
                  >
                    Driver Required
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowRequestDetails(!showRequestDetails)}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: '#ffffff',
                borderRadius: '8px',
                padding: '0.45rem 0.85rem',
                fontSize: '0.825rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'background 0.2s',
              }}
            >
              {showRequestDetails ? <FiChevronUp /> : <FiChevronDown />}
              {showRequestDetails ? 'Hide Request Details' : 'Show Request Details'}
            </button>
          </div>

          {/* Expanded Request Context Drawer */}
          {showRequestDetails && (
            <div
              style={{
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                fontSize: '0.85rem',
              }}
            >
              <div>
                <strong style={{ color: '#86efac', display: 'block', fontSize: '0.75rem' }}>
                  TRAVELLER SPECIFICATION
                </strong>
                <div>Accomodation: {travelRequest.accommodationType || 'Any Standard'}</div>
                <div>Package Type: {travelRequest.packageType || 'Full Package'}</div>
              </div>
              <div>
                <strong style={{ color: '#86efac', display: 'block', fontSize: '0.75rem' }}>
                  SPECIAL REQUESTS / PREFERENCES
                </strong>
                <div style={{ fontStyle: travelRequest.specialRequests ? 'normal' : 'italic' }}>
                  {travelRequest.specialRequests || 'No special requirements noted.'}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Feedback Messages */}
      {formError && (
        <div
          role="alert"
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            borderRadius: '8px',
            padding: '0.85rem 1.25rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            fontSize: '0.9rem',
            fontWeight: 600,
          }}
        >
          <FiAlertCircle style={{ fontSize: '1.2rem', flexShrink: 0 }} />
          <span>{formError}</span>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#166534',
            borderRadius: '8px',
            padding: '0.85rem 1.25rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            fontSize: '0.9rem',
            fontWeight: 600,
          }}
        >
          <FiCheckCircle style={{ fontSize: '1.2rem', flexShrink: 0 }} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Horizontal Step Navigation Bar */}
      <div
        className="qmt-step-navigation"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          borderBottom: '2px solid var(--agency-border)',
          marginBottom: '1.5rem',
          overflowX: 'auto',
          paddingBottom: '2px',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveStep('basic')}
          style={{
            background: 'none',
            border: 'none',
            padding: '0.75rem 1.25rem',
            fontSize: '0.9rem',
            fontWeight: activeStep === 'basic' ? 800 : 600,
            color: activeStep === 'basic' ? 'var(--agency-primary)' : 'var(--agency-text-muted)',
            borderBottom: activeStep === 'basic' ? '3px solid var(--agency-primary)' : '3px solid transparent',
            marginBottom: '-2px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            whiteSpace: 'nowrap',
          }}
        >
          1. Basic Details
        </button>

        <button
          type="button"
          onClick={() => setActiveStep('hotels')}
          style={{
            background: 'none',
            border: 'none',
            padding: '0.75rem 1.25rem',
            fontSize: '0.9rem',
            fontWeight: activeStep === 'hotels' ? 800 : 600,
            color: activeStep === 'hotels' ? 'var(--agency-primary)' : 'var(--agency-text-muted)',
            borderBottom: activeStep === 'hotels' ? '3px solid var(--agency-primary)' : '3px solid transparent',
            marginBottom: '-2px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            whiteSpace: 'nowrap',
          }}
        >
          <FiHome /> 2. Hotels ({hotels.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveStep('transports')}
          style={{
            background: 'none',
            border: 'none',
            padding: '0.75rem 1.25rem',
            fontSize: '0.9rem',
            fontWeight: activeStep === 'transports' ? 800 : 600,
            color: activeStep === 'transports' ? 'var(--agency-primary)' : 'var(--agency-text-muted)',
            borderBottom:
              activeStep === 'transports' ? '3px solid var(--agency-primary)' : '3px solid transparent',
            marginBottom: '-2px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            whiteSpace: 'nowrap',
          }}
        >
          <FiTruck /> 3. Transports ({transports.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveStep('activities')}
          style={{
            background: 'none',
            border: 'none',
            padding: '0.75rem 1.25rem',
            fontSize: '0.9rem',
            fontWeight: activeStep === 'activities' ? 800 : 600,
            color: activeStep === 'activities' ? 'var(--agency-primary)' : 'var(--agency-text-muted)',
            borderBottom:
              activeStep === 'activities' ? '3px solid var(--agency-primary)' : '3px solid transparent',
            marginBottom: '-2px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            whiteSpace: 'nowrap',
          }}
        >
          <FiMap /> 4. Activities & Tours ({activities.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveStep('terms')}
          style={{
            background: 'none',
            border: 'none',
            padding: '0.75rem 1.25rem',
            fontSize: '0.9rem',
            fontWeight: activeStep === 'terms' ? 800 : 600,
            color: activeStep === 'terms' ? 'var(--agency-primary)' : 'var(--agency-text-muted)',
            borderBottom: activeStep === 'terms' ? '3px solid var(--agency-primary)' : '3px solid transparent',
            marginBottom: '-2px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            whiteSpace: 'nowrap',
          }}
        >
          5. Terms & Notes
        </button>
      </div>

      {/* Main Two-Column Workspace Layout */}
      <div
        className="qmt-builder-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 340px',
          gap: '1.75rem',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Active Step Workspace */}
        <div className="qmt-step-content" style={{ minWidth: 0 }}>
          {/* STEP 1: BASIC DETAILS */}
          {activeStep === 'basic' && (
            <div
              style={{
                background: '#ffffff',
                borderRadius: '12px',
                border: '1px solid var(--agency-border)',
                padding: '1.5rem',
                boxShadow: 'var(--agency-shadow-sm)',
              }}
            >
              <h3
                style={{
                  margin: '0 0 1.25rem 0',
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  color: 'var(--agency-primary)',
                }}
              >
                Proposal & Trip Details
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--agency-text)' }}>
                  Quotation Title *
                  <input
                    aria-label="Quotation Title"
                    value={quotationTitle}
                    onChange={(e) => setQuotationTitle(e.target.value)}
                    placeholder="e.g. Istanbul & Cappadocia Exclusive Package"
                    className="agency-input"
                    style={{ paddingLeft: '0.85rem' }}
                  />
                </label>

                {/* Quotation Type (Compatible with existing selectors and test suites) */}
                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--agency-text)' }}>
                  Quotation Type *
                  <select
                    aria-label="Quotation type"
                    value={quotationType}
                    onChange={(e) => setQuotationType(e.target.value)}
                    className="agency-select"
                    style={{ width: '100%' }}
                  >
                    <option value="">Select type</option>
                    {QUOTATION_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {QUOTATION_TYPE_LABELS[t] || t}
                      </option>
                    ))}
                  </select>
                </label>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                  }}
                >
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--agency-text)' }}>
                    Destination *
                    <input
                      aria-label="Destination"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="e.g. Istanbul, Cappadocia"
                      className="agency-input"
                      style={{ paddingLeft: '0.85rem' }}
                    />
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--agency-text)' }}>
                    Country
                    <input
                      aria-label="Country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="e.g. Turkey"
                      className="agency-input"
                      style={{ paddingLeft: '0.85rem' }}
                    />
                  </label>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                  }}
                >
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--agency-text)' }}>
                    Currency *
                    <select
                      aria-label="Currency"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="agency-select"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="TRY">TRY (₺)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--agency-text)' }}>
                    Valid Until
                    <input
                      aria-label="Valid until"
                      type="date"
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                      className="agency-input"
                      style={{ paddingLeft: '0.85rem' }}
                    />
                  </label>
                </div>

                {/* Primary Service Item Row (Item #1) */}
                <div
                  style={{
                    background: '#fbf9f5',
                    border: '1px solid var(--agency-border-subtle)',
                    borderRadius: '8px',
                    padding: '1rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'var(--agency-secondary)',
                      }}
                    >
                      Primary Service / Item #1
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--agency-text-muted)' }}>
                      Detailed accommodation & transfers configured in tabs 2–4
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr',
                      gap: '0.85rem',
                    }}
                  >
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}>
                      Service Title
                      <input
                        aria-label="Item 1 title"
                        value={hotels[0]?.title ?? ''}
                        placeholder="e.g. Hotel stay / Tour package"
                        onChange={(e) => updateHotel(0, 'title', e.target.value)}
                        className="agency-input"
                        style={{ paddingLeft: '0.75rem' }}
                      />
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}>
                      Quantity
                      <input
                        aria-label="Item 1 quantity"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={hotels[0]?.quantity ?? 1}
                        onChange={(e) => updateHotel(0, 'quantity', Number(e.target.value))}
                        className="agency-input"
                        style={{ paddingLeft: '0.75rem' }}
                      />
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}>
                      Unit Price ({currency})
                      <input
                        aria-label="Item 1 unit price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={hotels[0]?.unitPrice ?? 0}
                        onChange={(e) => updateHotel(0, 'unitPrice', Number(e.target.value))}
                        className="agency-input"
                        style={{ paddingLeft: '0.75rem' }}
                      />
                    </label>
                  </div>
                </div>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--agency-text)' }}>
                  Quotation Description / Overview
                  <textarea
                    aria-label="Notes"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Short overview of the quotation, experience highlights, and key destination appeal..."
                    className="agency-input"
                    style={{ paddingLeft: '0.85rem', resize: 'vertical' }}
                  />
                </label>
              </div>

              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setActiveStep('hotels')}
                  className="agency-btn agency-btn-accent"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  Configure Hotels ({hotels.length}) <FiArrowRight />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: HOTELS */}
          {activeStep === 'hotels' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#ffffff',
                  padding: '1rem 1.25rem',
                  borderRadius: '10px',
                  border: '1px solid var(--agency-border)',
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: '0 0 0.25rem',
                      fontSize: '1.1rem',
                      fontWeight: 800,
                      color: 'var(--agency-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <FiHome style={{ color: 'var(--agency-secondary)' }} /> Hotel Stays & Accommodations
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--agency-text-muted)' }}>
                    Configure hotel stays, room categories, and meal plans for {destination}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addHotel}
                  className="agency-btn agency-btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                >
                  <FiPlus /> Add Hotel
                </button>
              </div>

              {hotels.map((hotel, idx) => (
                <div
                  key={hotel.id || idx}
                  data-testid={`quotation-item-${idx}`}
                  style={{
                    background: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid var(--agency-border)',
                    padding: '1.25rem',
                    boxShadow: 'var(--agency-shadow-sm)',
                  }}
                >
                  {/* Hotel Header */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: '1px solid var(--agency-border-subtle)',
                      paddingBottom: '0.75rem',
                      marginBottom: '1rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        style={{
                          background: 'var(--agency-primary-light)',
                          color: 'var(--agency-primary)',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '999px',
                          fontWeight: 800,
                          fontSize: '0.8rem',
                        }}
                      >
                        Hotel #{idx + 1}
                      </span>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--agency-text)' }}>
                        {hotel.title || hotel.property || `Hotel #${idx + 1}`}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => duplicateHotel(idx)}
                        title="Duplicate hotel card"
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          padding: '0.35rem 0.6rem',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          color: '#475569',
                        }}
                      >
                        <FiCopy /> Duplicate
                      </button>
                      {hotels.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeHotel(idx)}
                          aria-label={`Remove item ${idx + 1}`}
                          style={{
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: '6px',
                            padding: '0.35rem 0.6rem',
                            fontSize: '0.8rem',
                            color: '#dc2626',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                          }}
                        >
                          <FiTrash2 /> Remove
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Hotel Fields Grid */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1fr',
                        gap: '1rem',
                      }}
                    >
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 700 }}>
                        Service / Hotel Title *
                        <input
                          aria-label={`Item ${idx + 1} title`}
                          value={hotel.title}
                          onChange={(e) => updateHotel(idx, 'title', e.target.value)}
                          placeholder="e.g. 5-Star Boutique Resort Istanbul"
                          className="agency-input"
                          style={{ paddingLeft: '0.75rem' }}
                        />
                      </label>

                      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 700 }}>
                        Star Category
                        <select
                          value={hotel.starCategory}
                          onChange={(e) => updateHotel(idx, 'starCategory', e.target.value)}
                          className="agency-select"
                        >
                          <option value="5 Star">5 Star Luxury</option>
                          <option value="4 Star">4 Star Premium</option>
                          <option value="3 Star">3 Star Comfort</option>
                          <option value="Boutique">Boutique Heritage</option>
                          <option value="Resort">Resort & Spa</option>
                        </select>
                      </label>

                      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 700 }}>
                        Meal Plan
                        <select
                          value={hotel.mealPlan}
                          onChange={(e) => updateHotel(idx, 'mealPlan', e.target.value)}
                          className="agency-select"
                        >
                          <option value="EP (Room Only)">EP (Room Only)</option>
                          <option value="CP (Breakfast Included)">CP (Breakfast Included)</option>
                          <option value="MAP (Half Board)">MAP (Half Board - Breakfast + Dinner)</option>
                          <option value="AP (Full Board)">AP (Full Board - All Meals)</option>
                          <option value="All Inclusive">All Inclusive</option>
                        </select>
                      </label>
                    </div>

                    {/* Dates and Auto-calculated Nights */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gap: '1rem',
                        background: '#fbf9f5',
                        padding: '0.85rem',
                        borderRadius: '8px',
                        border: '1px solid var(--agency-border-subtle)',
                      }}
                    >
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 700 }}>
                        Check-in Date *
                        <input
                          type="date"
                          value={hotel.checkIn}
                          onChange={(e) => updateHotel(idx, 'checkIn', e.target.value)}
                          className="agency-input"
                          style={{ paddingLeft: '0.75rem' }}
                        />
                      </label>

                      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 700 }}>
                        Check-out Date *
                        <input
                          type="date"
                          value={hotel.checkOut}
                          onChange={(e) => updateHotel(idx, 'checkOut', e.target.value)}
                          className="agency-input"
                          style={{ paddingLeft: '0.75rem' }}
                        />
                      </label>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 700 }}>
                        Total Nights (Auto Calculated)
                        <div
                          style={{
                            height: '38px',
                            background: '#e5f2ea',
                            color: 'var(--agency-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            paddingLeft: '0.75rem',
                            borderRadius: '6px',
                            border: '1px solid #bbf7d0',
                            fontWeight: 800,
                          }}
                        >
                          {hotel.nights} {hotel.nights === 1 ? 'Night' : 'Nights'}
                        </div>
                      </div>
                    </div>

                    {/* Room & Occupancy Configuration */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                        gap: '0.85rem',
                      }}
                    >
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 700 }}>
                        Room Category
                        <select
                          value={hotel.roomCategory}
                          onChange={(e) => updateHotel(idx, 'roomCategory', e.target.value)}
                          className="agency-select"
                        >
                          <option value="Standard Room">Standard Room</option>
                          <option value="Deluxe Room">Deluxe Room</option>
                          <option value="Superior Room">Superior Room</option>
                          <option value="Suite">Executive Suite</option>
                          <option value="Villa">Private Villa</option>
                        </select>
                      </label>

                      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 700 }}>
                        Occupancy
                        <select
                          value={hotel.roomType}
                          onChange={(e) => updateHotel(idx, 'roomType', e.target.value)}
                          className="agency-select"
                        >
                          <option value="Single (1 Person)">Single (1 Person)</option>
                          <option value="Double (2 Persons)">Double (2 Persons)</option>
                          <option value="Triple (3 Persons)">Triple (3 Persons)</option>
                          <option value="Quad (4 Persons)">Quad (4 Persons)</option>
                          <option value="Family Suite">Family Suite</option>
                        </select>
                      </label>

                      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 700 }}>
                        Rooms Count
                        <input
                          aria-label={`Item ${idx + 1} quantity`}
                          type="number"
                          min="1"
                          step="1"
                          value={hotel.quantity}
                          onChange={(e) => updateHotel(idx, 'quantity', Number(e.target.value))}
                          className="agency-input"
                          style={{ paddingLeft: '0.75rem' }}
                        />
                      </label>

                      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 700 }}>
                        Total Hotel Cost ({currency}) *
                        <input
                          aria-label={`Item ${idx + 1} unit price`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={hotel.unitPrice}
                          onChange={(e) => updateHotel(idx, 'unitPrice', Number(e.target.value))}
                          className="agency-input"
                          style={{ paddingLeft: '0.75rem' }}
                        />
                      </label>
                    </div>

                    {/* Optional Add-ons */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1.5rem',
                        background: '#ffffff',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '8px',
                        border: '1px solid var(--agency-border-subtle)',
                        fontSize: '0.8rem',
                      }}
                    >
                      <span style={{ fontWeight: 700, color: 'var(--agency-text-muted)' }}>
                        OPTIONAL ADD-ONS:
                      </span>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={hotel.addons?.aweb || false}
                          onChange={(e) =>
                            updateHotel(idx, 'addons', { ...hotel.addons, aweb: e.target.checked })
                          }
                        />
                        Extra adult with extra bed (A.W.E.B)
                      </label>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={hotel.addons?.cweb || false}
                          onChange={(e) =>
                            updateHotel(idx, 'addons', { ...hotel.addons, cweb: e.target.checked })
                          }
                        />
                        Child with extra bed (C.W.E.B)
                      </label>
                    </div>
                  </div>
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setActiveStep('basic')}
                  className="agency-btn agency-btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <FiArrowLeft /> Back to Basic Details
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep('transports')}
                  className="agency-btn agency-btn-accent"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  Continue to Transports ({transports.length}) <FiArrowRight />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: TRANSPORTS */}
          {activeStep === 'transports' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#ffffff',
                  padding: '1rem 1.25rem',
                  borderRadius: '10px',
                  border: '1px solid var(--agency-border)',
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: '0 0 0.25rem',
                      fontSize: '1.1rem',
                      fontWeight: 800,
                      color: 'var(--agency-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <FiTruck style={{ color: 'var(--agency-secondary)' }} /> Airport Transfers & Transport
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--agency-text-muted)' }}>
                    Configure dedicated airport transfers, private vehicles, and chauffeur options.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => addTransport('Airport Transfer')}
                  className="agency-btn agency-btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                >
                  <FiPlus /> Add Transfer
                </button>
              </div>

              {transports.length === 0 ? (
                <div
                  style={{
                    background: '#ffffff',
                    border: '2px dashed var(--agency-border)',
                    borderRadius: '12px',
                    padding: '3rem 2rem',
                    textAlign: 'center',
                  }}
                >
                  <FiTruck style={{ fontSize: '2.5rem', color: 'var(--agency-text-light)', marginBottom: '0.75rem' }} />
                  <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.05rem', fontWeight: 700 }}>
                    No Transport Services Added Yet
                  </h4>
                  <p style={{ color: 'var(--agency-text-muted)', fontSize: '0.875rem', maxWidth: '400px', margin: '0 auto 1.25rem' }}>
                    Provide seamless transfers between airport, hotels, and city destinations.
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                    <button
                      type="button"
                      onClick={() => addTransport('Airport Transfer')}
                      className="agency-btn agency-btn-secondary"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <FiPlus /> Add Airport Transfer
                    </button>
                    <button
                      type="button"
                      onClick={() => addTransport('Chauffeur / Driver')}
                      className="agency-btn agency-btn-secondary"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <FiPlus /> Add Chauffeur Service
                    </button>
                  </div>
                </div>
              ) : (
                transports.map((transport, idx) => (
                  <div
                    key={transport.id || idx}
                    style={{
                      background: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid var(--agency-border)',
                      padding: '1.25rem',
                      boxShadow: 'var(--agency-shadow-sm)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: '1px solid var(--agency-border-subtle)',
                        paddingBottom: '0.75rem',
                        marginBottom: '1rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          style={{
                            background: 'var(--agency-primary-light)',
                            color: 'var(--agency-primary)',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '999px',
                            fontWeight: 800,
                            fontSize: '0.8rem',
                          }}
                        >
                          Transfer #{idx + 1}
                        </span>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--agency-text)' }}>
                          {transport.title || 'New Transfer Service'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeTransport(idx)}
                        style={{
                          background: '#fef2f2',
                          border: '1px solid #fecaca',
                          borderRadius: '6px',
                          padding: '0.35rem 0.6rem',
                          fontSize: '0.8rem',
                          color: '#dc2626',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                        }}
                      >
                        <FiTrash2 /> Remove
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '2fr 1fr 1fr',
                          gap: '1rem',
                        }}
                      >
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 700 }}>
                          Service / Route Title *
                          <input
                            value={transport.title}
                            onChange={(e) => updateTransport(idx, 'title', e.target.value)}
                            placeholder="e.g. Istanbul Airport (IST) to Hotel Private Transfer"
                            className="agency-input"
                            style={{ paddingLeft: '0.75rem' }}
                          />
                        </label>

                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 700 }}>
                          Vehicle Type
                          <select
                            value={transport.vehicleType}
                            onChange={(e) => updateTransport(idx, 'vehicleType', e.target.value)}
                            className="agency-select"
                          >
                            <option value="Sedan (1-3 PAX)">Sedan (1-3 PAX)</option>
                            <option value="Luxury Van / Vito (1-6 PAX)">Luxury Van / Mercedes Vito (1-6 PAX)</option>
                            <option value="Minibus (7-14 PAX)">Minibus (7-14 PAX)</option>
                            <option value="SUV Luxury">SUV Luxury</option>
                          </select>
                        </label>

                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 700 }}>
                          Usage / Trip Type
                          <select
                            value={transport.usageType}
                            onChange={(e) => updateTransport(idx, 'usageType', e.target.value)}
                            className="agency-select"
                          >
                            <option value="One-way Transfer">One-way Transfer</option>
                            <option value="Round-trip Transfer">Round-trip Transfer</option>
                            <option value="Full Day Chauffeur">Full Day Chauffeur (8 Hours)</option>
                            <option value="Multi-day Hire">Multi-day Hire</option>
                          </select>
                        </label>
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                          gap: '0.85rem',
                        }}
                      >
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 700 }}>
                          Service Date
                          <input
                            type="date"
                            value={transport.serviceDate}
                            onChange={(e) => updateTransport(idx, 'serviceDate', e.target.value)}
                            className="agency-input"
                            style={{ paddingLeft: '0.75rem' }}
                          />
                        </label>

                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 700 }}>
                          Pickup Time
                          <input
                            type="text"
                            value={transport.pickupTime}
                            onChange={(e) => updateTransport(idx, 'pickupTime', e.target.value)}
                            placeholder="e.g. 10:00 AM"
                            className="agency-input"
                            style={{ paddingLeft: '0.75rem' }}
                          />
                        </label>

                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 700 }}>
                          Quantity (Vehicles)
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={transport.quantity}
                            onChange={(e) => updateTransport(idx, 'quantity', Number(e.target.value))}
                            className="agency-input"
                            style={{ paddingLeft: '0.75rem' }}
                          />
                        </label>

                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 700 }}>
                          Transfer Cost ({currency}) *
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={transport.unitPrice}
                            onChange={(e) => updateTransport(idx, 'unitPrice', Number(e.target.value))}
                            className="agency-input"
                            style={{ paddingLeft: '0.75rem' }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                ))
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setActiveStep('hotels')}
                  className="agency-btn agency-btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <FiArrowLeft /> Back to Hotels
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep('activities')}
                  className="agency-btn agency-btn-accent"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  Continue to Activities ({activities.length}) <FiArrowRight />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: ACTIVITIES & TOURS */}
          {activeStep === 'activities' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#ffffff',
                  padding: '1rem 1.25rem',
                  borderRadius: '10px',
                  border: '1px solid var(--agency-border)',
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: '0 0 0.25rem',
                      fontSize: '1.1rem',
                      fontWeight: 800,
                      color: 'var(--agency-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <FiMap style={{ color: 'var(--agency-secondary)' }} /> Activities, Excursions & Tours
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--agency-text-muted)' }}>
                    Add guided sightseeing, outdoor adventures, boat tours and cultural experiences.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => addActivity('Sightseeing Tour')}
                    className="agency-btn agency-btn-secondary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                  >
                    <FiPlus /> Add Sightseeing
                  </button>
                  <button
                    type="button"
                    onClick={() => addActivity('Adventure Experience')}
                    className="agency-btn agency-btn-secondary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                  >
                    <FiPlus /> Add Activity
                  </button>
                </div>
              </div>

              {activities.length === 0 ? (
                <div
                  style={{
                    background: '#ffffff',
                    border: '2px dashed var(--agency-border)',
                    borderRadius: '12px',
                    padding: '3rem 2rem',
                    textAlign: 'center',
                  }}
                >
                  <FiMap style={{ fontSize: '2.5rem', color: 'var(--agency-text-light)', marginBottom: '0.75rem' }} />
                  <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.05rem', fontWeight: 700 }}>
                    No Activities or Tours Added Yet
                  </h4>
                  <p style={{ color: 'var(--agency-text-muted)', fontSize: '0.875rem', maxWidth: '400px', margin: '0 auto 1.25rem' }}>
                    Elevate this quotation by adding curated adventures and cultural sightseeing.
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                    <button
                      type="button"
                      onClick={() => addActivity('Sightseeing Tour')}
                      className="agency-btn agency-btn-secondary"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <FiPlus /> Add Sightseeing Tour
                    </button>
                    <button
                      type="button"
                      onClick={() => addActivity('Adventure Experience')}
                      className="agency-btn agency-btn-secondary"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <FiPlus /> Add Adventure Activity
                    </button>
                  </div>
                </div>
              ) : (
                activities.map((activity, idx) => (
                  <div
                    key={activity.id || idx}
                    style={{
                      background: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid var(--agency-border)',
                      padding: '1.25rem',
                      boxShadow: 'var(--agency-shadow-sm)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: '1px solid var(--agency-border-subtle)',
                        paddingBottom: '0.75rem',
                        marginBottom: '1rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          style={{
                            background: 'var(--agency-primary-light)',
                            color: 'var(--agency-primary)',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '999px',
                            fontWeight: 800,
                            fontSize: '0.8rem',
                          }}
                        >
                          Activity #{idx + 1}
                        </span>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--agency-text)' }}>
                          {activity.title || 'New Tour Service'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeActivity(idx)}
                        style={{
                          background: '#fef2f2',
                          border: '1px solid #fecaca',
                          borderRadius: '6px',
                          padding: '0.35rem 0.6rem',
                          fontSize: '0.8rem',
                          color: '#dc2626',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                        }}
                      >
                        <FiTrash2 /> Remove
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '2fr 1fr 1fr',
                          gap: '1rem',
                        }}
                      >
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 700 }}>
                          Activity / Tour Title *
                          <input
                            value={activity.title}
                            onChange={(e) => updateActivity(idx, 'title', e.target.value)}
                            placeholder="e.g. Cappadocia Hot Air Balloon Sunrise Flight"
                            className="agency-input"
                            style={{ paddingLeft: '0.75rem' }}
                          />
                        </label>

                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 700 }}>
                          Category
                          <select
                            value={activity.category}
                            onChange={(e) => updateActivity(idx, 'category', e.target.value)}
                            className="agency-select"
                          >
                            <option value="Sightseeing Tour">Sightseeing Tour</option>
                            <option value="Adventure Experience">Adventure Experience</option>
                            <option value="Cultural Excursion">Cultural Excursion</option>
                            <option value="Boat Tour / Cruise">Boat Tour / Cruise</option>
                            <option value="Museum & Heritage">Museum & Heritage</option>
                          </select>
                        </label>

                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 700 }}>
                          Duration
                          <input
                            value={activity.duration}
                            onChange={(e) => updateActivity(idx, 'duration', e.target.value)}
                            placeholder="e.g. Half Day (4 Hours)"
                            className="agency-input"
                            style={{ paddingLeft: '0.75rem' }}
                          />
                        </label>
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                          gap: '0.85rem',
                        }}
                      >
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 700 }}>
                          Tour Date
                          <input
                            type="date"
                            value={activity.tourDate}
                            onChange={(e) => updateActivity(idx, 'tourDate', e.target.value)}
                            className="agency-input"
                            style={{ paddingLeft: '0.75rem' }}
                          />
                        </label>

                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 700 }}>
                          Quantity (PAX / Vouchers)
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={activity.quantity}
                            onChange={(e) => updateActivity(idx, 'quantity', Number(e.target.value))}
                            className="agency-input"
                            style={{ paddingLeft: '0.75rem' }}
                          />
                        </label>

                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 700 }}>
                          Price per PAX ({currency}) *
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={activity.unitPrice}
                            onChange={(e) => updateActivity(idx, 'unitPrice', Number(e.target.value))}
                            className="agency-input"
                            style={{ paddingLeft: '0.75rem' }}
                          />
                        </label>

                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 700 }}>
                          Guide Included?
                          <select
                            value={activity.guideIncluded ? 'yes' : 'no'}
                            onChange={(e) => updateActivity(idx, 'guideIncluded', e.target.value === 'yes')}
                            className="agency-select"
                          >
                            <option value="yes">Yes - Expert Guide</option>
                            <option value="no">No - Self Guided</option>
                          </select>
                        </label>
                      </div>
                    </div>
                  </div>
                ))
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setActiveStep('transports')}
                  className="agency-btn agency-btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <FiArrowLeft /> Back to Transports
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep('terms')}
                  className="agency-btn agency-btn-accent"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  Continue to Terms & Notes <FiArrowRight />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: TERMS & NOTES */}
          {activeStep === 'terms' && (
            <div
              style={{
                background: '#ffffff',
                borderRadius: '12px',
                border: '1px solid var(--agency-border)',
                padding: '1.5rem',
                boxShadow: 'var(--agency-shadow-sm)',
              }}
            >
              <h3
                style={{
                  margin: '0 0 1.25rem 0',
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  color: 'var(--agency-primary)',
                }}
              >
                Inclusions, Exclusions & Special Terms
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--agency-text)' }}>
                  Terms, Conditions & Payment Guidelines
                  <textarea
                    rows={6}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Specify booking conditions, cancellation policy, payment schedule, check-in instructions, and traveller advice..."
                    className="agency-input"
                    style={{ paddingLeft: '0.85rem', resize: 'vertical' }}
                  />
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setActiveStep('activities')}
                  className="agency-btn agency-btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <FiArrowLeft /> Back to Activities
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreview(true)}
                  className="agency-btn agency-btn-accent"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <FiEye /> Review Full Quotation
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Sticky Summary & Financial Breakdown */}
        <div
          className="qmt-summary-column"
          style={{
            position: 'sticky',
            top: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid var(--agency-border)',
              padding: '1.25rem',
              boxShadow: 'var(--agency-shadow-md)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                borderBottom: '1px solid var(--agency-border-subtle)',
                paddingBottom: '0.75rem',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--agency-text)' }}>
                Price Breakdown
              </h3>
              <span
                style={{
                  background: 'var(--agency-primary-light)',
                  color: 'var(--agency-primary)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '999px',
                }}
              >
                {totalItemsCount} {totalItemsCount === 1 ? 'Item' : 'Items'}
              </span>
            </div>

            {/* Category Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>Hotels ({hotels.length})</span>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>
                  {currency} {hotelTotal.toFixed(2)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>Transports ({transports.length})</span>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>
                  {currency} {transportTotal.toFixed(2)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>Activities ({activities.length})</span>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>
                  {currency} {activityTotal.toFixed(2)}
                </span>
              </div>
              {otherItems.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Other Services ({otherItems.length})</span>
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>
                    {currency} {otherTotal.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Total Section */}
            <div
              style={{
                borderTop: '2px solid var(--agency-border)',
                paddingTop: '1rem',
                marginBottom: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--agency-text)' }}>
                  Total Amount
                </span>
                <span
                  data-testid="items-total"
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 900,
                    color: 'var(--agency-primary)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Total: {subtotal.toFixed(0)} {currency}
                </span>
              </div>

              {costPerPassenger && (
                <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--agency-text-muted)' }}>
                  Cost per Passenger: <strong style={{ color: 'var(--agency-secondary)' }}>{currency} {costPerPassenger}</strong>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <button
                type="submit"
                disabled={isSubmitting}
                className="agency-btn agency-btn-accent"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  fontSize: '0.925rem',
                  fontWeight: 800,
                }}
              >
                <FiSave /> {submitLabel}
              </button>

              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="agency-btn agency-btn-secondary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1rem',
                  fontSize: '0.875rem',
                }}
              >
                <FiSend /> Finalize & Send Quote
              </button>

              <button
                type="button"
                onClick={() => setShowPreview(true)}
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.6rem 1rem',
                  background: '#ffffff',
                  border: '1px solid var(--agency-border)',
                  borderRadius: '6px',
                  color: 'var(--agency-text)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <FiEye /> Preview Offer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quotation Preview Modal */}
      {showPreview && (
        <QuotationPreviewModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          formData={{
            quotationType,
            currency,
            validUntil,
            notes,
            items: [
              ...hotels.map((h) => ({
                title: h.title,
                description: `${h.starCategory} - ${h.roomCategory} (${h.mealPlan})`,
                quantity: h.quantity,
                unitPrice: h.unitPrice,
              })),
              ...transports.map((t) => ({
                title: t.title,
                description: `${t.vehicleType} - ${t.usageType}`,
                quantity: t.quantity,
                unitPrice: t.unitPrice,
              })),
              ...activities.map((a) => ({
                title: a.title,
                description: `${a.category} - ${a.duration}`,
                quantity: a.quantity,
                unitPrice: a.unitPrice,
              })),
              ...otherItems,
            ],
          }}
          travelRequest={travelRequest}
        />
      )}
    </form>
  );
}
