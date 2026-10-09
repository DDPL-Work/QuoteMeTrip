import React, { useState, useMemo, useEffect } from 'react';
import {
  FiHome,
  FiMapPin,
  FiTruck,
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
  FiArrowRight,
  FiArrowLeft,
  FiCopy,
  FiPrinter,
  FiDownload,
  FiDollarSign,
  FiTag,
  FiFileText,
  FiShield,
  FiClock,
} from 'react-icons/fi';
import {
  QUOTATION_TYPES,
  QUOTATION_TYPE_LABELS,
} from '@troublefree/types';
import {
  QuotationDocument,
  downloadQuotationDoc,
  printQuotationDocument,
  formatQuotationCurrency,
  formatDocDate,
  formatDayNumber,
  toast,
} from '@troublefree/ui';
import { QuotationPreviewModal } from './QuotationPreviewModal.jsx';
import { agencyProfileApi } from '../lib/api.js';

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
 * Helper to get weekday name from date string.
 */
function getWeekday(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}

/**
 * Helper to add days to a YYYY-MM-DD date string.
 */
function addDays(dateStr, days) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
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
      city: meta.city || '',
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
      maxChildren: Number(meta.maxChildren) || 0,
      amenities: meta.amenities || '',
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
      city: meta.city || '',
      pickupLocation: meta.pickupLocation || '',
      dropLocation: meta.dropLocation || '',
      pickupTime: meta.pickupTime || '',
      vehicleType: meta.vehicleType || 'Sedan (1-3 PAX)',
      usageType: meta.usageType || 'One-way Transfer',
      passengerCapacity: meta.passengerCapacity || '3 Passengers',
      luggageCapacity: meta.luggageCapacity || '2 Luggage Bags',
      driverIncluded: meta.driverIncluded !== undefined ? Boolean(meta.driverIncluded) : true,
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
      city: meta.city || '',
      category: meta.category || (itemType === 'guide' ? 'Guided Excursion' : 'Sightseeing Tour'),
      tourType: meta.tourType || 'Sharing Tour',
      tourDate: meta.tourDate || '',
      slotTime: meta.slotTime || meta.slot || '10:00',
      duration: meta.duration || 'Half Day (4 Hours)',
      operatingDays: meta.operatingDays || 'Daily',
      guideIncluded: meta.guideIncluded !== undefined ? Boolean(meta.guideIncluded) : true,
      transportIncluded: meta.transportIncluded !== undefined ? Boolean(meta.transportIncluded) : false,
      paxCount: meta.paxCount || '',
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

export const BUILDER_STEPS = [
  { id: 'basic', label: '1. Basic Details', icon: FiFileText },
  { id: 'hotels', label: '2. Hotels', icon: FiHome },
  { id: 'transports', label: '3. Transports', icon: FiTruck },
  { id: 'activities', label: '4. Activities & Tours', icon: FiClock },
  { id: 'itinerary', label: '5. Day Wise Itinerary', icon: FiCalendar },
  { id: 'pricing', label: '6. Pricing', icon: FiDollarSign },
  { id: 'payment', label: '7. Payment Details', icon: FiBriefcase },
  { id: 'inclusions', label: '8. Inclusions & Exclusions', icon: FiTag },
  { id: 'terms', label: '9. Terms & Conditions', icon: FiShield },
  { id: 'preview', label: '10. Preview & Finalize', icon: FiEye },
];

export function QuotationBuilder({
  initial = null,
  travelRequest = null,
  onSubmit = null,
  onSaveDraft = null,
  onCancel = null,
  submitLabel = 'Save draft',
  isSubmitting = false,
}) {
  const [agencyProfile, setAgencyProfile] = useState(null);

  // Load agency profile for defaults if available
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await agencyProfileApi.getProfile();
        if (!cancelled && res?.profile) {
          setAgencyProfile(res.profile);
        }
      } catch {
        // Soft fail
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const defaultDestination = useMemo(() => {
    if (travelRequest?.route?.destination) return travelRequest.route.destination;
    if (travelRequest?.cities?.length) return travelRequest.cities.join(' → ');
    return 'Cappadocia, Turkey';
  }, [travelRequest]);

  // Active step state
  const [activeStep, setActiveStep] = useState('basic');

  // Step 1: Basic Details & Package Overview
  const [quotationType, setQuotationType] = useState(initial?.quotationType ?? travelRequest?.packageType ?? '');
  const [quotationTitle, setQuotationTitle] = useState(
    initial?.notes?.split('\n')?.[0]?.replace(/^Title:\s*/i, '') ||
      `${defaultDestination} Official Travel Proposal`,
  );
  const [destination, setDestination] = useState(initial?.packageOverview?.destination || defaultDestination);
  const [currency, setCurrency] = useState(initial?.currency || 'USD');
  const [validUntil, setValidUntil] = useState(initial?.validUntil || '');
  const [notes, setNotes] = useState(initial?.notes || '');
  const [showRequestDetails, setShowRequestDetails] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [formError, setFormError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Greeting
  const [greetingRecipient, setGreetingRecipient] = useState(
    initial?.greeting?.recipient || travelRequest?.traveller?.firstName || 'Valued Guest',
  );
  const [greetingTitle, setGreetingTitle] = useState(
    initial?.greeting?.title || `Greetings from ${agencyProfile?.agencyName || 'QuoteMeTrip'} !!!`,
  );
  const [greetingMessage, setGreetingMessage] = useState(
    initial?.greeting?.message || 'As per our discussion, following is the customized travel proposal details.',
  );

  // Package Overview Details
  const [tripId, setTripId] = useState(
    initial?.packageOverview?.tripId || `QRY-${travelRequest?.id || initial?.id || '101'}`,
  );
  const [startDate, setStartDate] = useState(
    initial?.packageOverview?.startDate || travelRequest?.travelStartDate || '',
  );
  const [endDate, setEndDate] = useState(
    initial?.packageOverview?.endDate || travelRequest?.travelEndDate || '',
  );
  const [adultsCount, setAdultsCount] = useState(
    initial?.packageOverview?.adults || travelRequest?.numberOfTravellers || 2,
  );
  const [childrenCount, setChildrenCount] = useState(initial?.packageOverview?.children || 0);
  const [infantsCount, setInfantsCount] = useState(initial?.packageOverview?.infants || 0);

  // Step 2: Hotels (empty by default unless initial quotation has items)
  const [hotels, setHotels] = useState(() => {
    if (initial?.items?.length) {
      const parsed = initial.items.map(parseInitialItem).filter((it) => it._category === 'hotel');
      if (parsed.length) return parsed;
    }
    return [];
  });

  // Step 3: Transports (empty by default unless initial quotation has items)
  const [transports, setTransports] = useState(() => {
    if (initial?.items?.length) {
      return initial.items.map(parseInitialItem).filter((it) => it._category === 'transport');
    }
    return [];
  });

  // Step 4: Activities (empty by default unless initial quotation has items)
  const [activities, setActivities] = useState(() => {
    if (initial?.items?.length) {
      return initial.items.map(parseInitialItem).filter((it) => it._category === 'activity');
    }
    return [];
  });

  // Step 5: Day Wise Itinerary
  const [itineraryDays, setItineraryDays] = useState(() => {
    if (Array.isArray(initial?.itineraryDays) && initial.itineraryDays.length > 0) {
      return initial.itineraryDays;
    }
    // Auto generate days from travel dates if available
    const sDate = travelRequest?.travelStartDate;
    const eDate = travelRequest?.travelEndDate;
    const daysCount = travelRequest?.chosenDuration || (sDate && eDate ? calculateNights(sDate, eDate) + 1 : 3);
    const gen = [];
    for (let i = 1; i <= daysCount; i++) {
      const curDate = sDate ? addDays(sDate, i - 1) : '';
      const wDay = curDate ? getWeekday(curDate) : '';
      let defaultTitle = `Day ${i} Tour Program`;
      let defaultDesc = 'Sightseeing and planned local activities as per guest preferences.';
      if (i === 1) {
        defaultTitle = `Arrival & Welcome in ${defaultDestination}`;
        defaultDesc = `Arrival at destination. Meet and greet by representative, followed by hotel check-in and leisure evening.`;
      } else if (i === daysCount) {
        defaultTitle = `Departure & Onward Journey`;
        defaultDesc = `After breakfast, hotel check-out and transfer to onward travel terminal.`;
      }
      gen.push({
        dayNumber: i,
        weekday: wDay,
        date: curDate,
        title: defaultTitle,
        description: defaultDesc,
        city: defaultDestination,
      });
    }
    return gen;
  });

  // Step 6: Pricing & Taxes
  const [taxRate, setTaxRate] = useState(initial?.taxRate || 0);
  const [taxLabel, setTaxLabel] = useState(
    initial?.taxLabel || (initial?.taxRate ? `including ${initial.taxRate}% GST & other Taxes` : 'including 5% GST & other Taxes'),
  );
  const [taxApplicable, setTaxApplicable] = useState(Boolean(initial?.taxRate && initial.taxRate > 0));

  // Step 7: Payment Details
  const [paymentDetails, setPaymentDetails] = useState(() => {
    if (initial?.paymentDetails) return initial.paymentDetails;
    return {
      includePaymentDetails: false,
      bankName: '',
      accountHolder: '',
      accountNumber: '',
      ifsc: '',
      branch: '',
      instructions: 'Minimum 50% booking amount required upon confirmation.',
    };
  });

  // Step 8: Inclusions & Exclusions
  const [inclusions, setInclusions] = useState(() => {
    if (Array.isArray(initial?.inclusions) && initial.inclusions.length > 0) {
      return initial.inclusions;
    }
    return [
      'Accommodation: Hotel accommodation as per the selected package',
      'Meals: Breakfast as per the hotel meal plan',
      'Transport: Local transfers and sightseeing transportation as per itinerary',
      'Sightseeing: Sightseeing as mentioned in the itinerary',
    ];
  });

  const [exclusions, setExclusions] = useState(() => {
    if (Array.isArray(initial?.exclusions) && initial.exclusions.length > 0) {
      return initial.exclusions;
    }
    return [
      'Travel: Airfare, train fare, or bus tickets',
      'Personal Expenses: Shopping, laundry, tips, and other personal expenses',
      'Entry Tickets: Monument, attraction, and activity entry fees unless mentioned',
      'Others: Any service not specifically mentioned under inclusions',
    ];
  });

  // Step 9: Terms & Conditions
  const [termsSections, setTermsSections] = useState(() => {
    if (Array.isArray(initial?.termsSections) && initial.termsSections.length > 0) {
      return initial.termsSections;
    }
    return [
      {
        title: 'Bookings and Reservations',
        content: 'When you make a booking, you agree to provide accurate and complete information.',
        points: [
          'Booking Process: Booking is confirmed upon receipt of designated confirmation deposit.',
          'Payment Terms: 50% deposit upon confirmation, remaining balance 20 days prior to departure.',
          'Confirmation Vouchers: Vouchers will be delivered 7 days prior to arrival.',
          'Airport Transfers: Includes 60 minutes airport waiting time and 10 minutes hotel lobby waiting time.',
          'Changes & Cancellations: Subject to supplier and operator cancellation policies.',
        ],
        enabled: true,
      },
      {
        title: 'Travel Documents and Requirements',
        content: 'Guests must carry valid government-issued photographic identification for travel and check-in.',
        points: [
          'Valid ID Proof: Passports, identity cards, or visas are the traveler’s responsibility.',
          'Travel Insurance: We strongly advise securing comprehensive travel protection.',
        ],
        enabled: true,
      },
      {
        title: 'Changes to Itineraries & Liability',
        content: 'Right reserved to modify itinerary or accommodations due to unforeseen circumstances with prompt notice.',
        points: [
          'Force Majeure: Not liable for delays or disruptions resulting from weather, road closures, or strikes.',
          'Governing Law: Governed by the local laws and regulations of jurisdiction.',
        ],
        enabled: true,
      },
      {
        title: 'Contact Information',
        content: 'For assistance or emergency inquiries, please contact our support desk.',
        points: ['Contact information available on document header.'],
        enabled: true,
      },
    ];
  });

  // Other items (preserved if any)
  const [otherItems] = useState(() => {
    if (initial?.items?.length) {
      return initial.items.map(parseInitialItem).filter((it) => it._category === 'other');
    }
    return [];
  });

  // Real-time calculations
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

  const taxAmount = useMemo(() => {
    if (!taxApplicable || !(Number(taxRate) > 0)) return 0;
    return Math.round(subtotal * (Number(taxRate) / 100) * 100) / 100;
  }, [subtotal, taxApplicable, taxRate]);

  const finalTotal = useMemo(() => {
    return Math.round((subtotal + taxAmount) * 100) / 100;
  }, [subtotal, taxAmount]);

  const totalItemsCount = hotels.length + transports.length + activities.length + otherItems.length;

  const costPerPassenger = useMemo(() => {
    const pax = Number(adultsCount) + Number(childrenCount);
    if (pax > 0 && finalTotal > 0) {
      return (finalTotal / pax).toFixed(2);
    }
    return null;
  }, [finalTotal, adultsCount, childrenCount]);

  // Duration label
  const durationLabel = useMemo(() => {
    if (startDate && endDate) {
      const n = calculateNights(startDate, endDate);
      return `${n} Nights / ${n + 1} Days`;
    }
    const totalNights = hotels.reduce((s, h) => s + (Number(h.nights) || 1), 0);
    return `${totalNights} Nights / ${totalNights + 1} Days`;
  }, [startDate, endDate, hotels]);

  // Construct current canonical quotation object for preview
  const canonicalQuotation = useMemo(() => {
    return {
      id: initial?.id || 'DRAFT',
      travelRequestId: travelRequest?.id,
      quotationType,
      currency,
      subtotal,
      taxRate: taxApplicable ? Number(taxRate) : 0,
      taxAmount,
      taxLabel: taxApplicable ? taxLabel : '',
      totalAmount: finalTotal,
      validUntil,
      notes,
      greeting: {
        recipient: greetingRecipient,
        title: greetingTitle,
        message: greetingMessage,
      },
      packageOverview: {
        tripId,
        destination,
        startDate,
        endDate,
        duration: durationLabel,
        adults: adultsCount,
        children: childrenCount,
        infants: infantsCount,
      },
      items: [
        ...hotels.map((h) => ({
          itemType: 'hotel',
          title: String(h.title).trim(),
          description: h.description || `${h.starCategory} - ${h.roomCategory} (${h.mealPlan})`,
          quantity: Number(h.quantity) || 1,
          unitPrice: Number(h.unitPrice) || 0,
          metadata: { ...h },
        })),
        ...transports.map((t) => ({
          itemType: t.serviceType.toLowerCase().includes('driver') ? 'driver' : 'vehicle',
          title: String(t.title).trim(),
          description: t.description || `${t.vehicleType} - ${t.usageType}`,
          quantity: Number(t.quantity) || 1,
          unitPrice: Number(t.unitPrice) || 0,
          metadata: { ...t },
        })),
        ...activities.map((a) => ({
          itemType: a.category.toLowerCase().includes('guide') ? 'guide' : 'service',
          title: String(a.title).trim(),
          description: a.description || `${a.category} - ${a.duration}`,
          quantity: Number(a.quantity) || 1,
          unitPrice: Number(a.unitPrice) || 0,
          metadata: { ...a },
        })),
        ...otherItems.map((o) => ({
          itemType: o.itemType || 'other',
          title: String(o.title).trim(),
          description: o.description || null,
          quantity: Number(o.quantity) || 1,
          unitPrice: Number(o.unitPrice) || 0,
          metadata: o.metadata || null,
        })),
      ],
      itineraryDays,
      paymentDetails,
      inclusions,
      exclusions,
      termsSections,
      branding: {
        agencyName: agencyProfile?.agencyName || 'QuoteMeTrip',
        logoUrl: agencyProfile?.logoPath || null,
        phone: agencyProfile?.phone || null,
        email: agencyProfile?.businessEmail || null,
        address: [agencyProfile?.address, agencyProfile?.city, agencyProfile?.country].filter(Boolean).join(', ') || null,
      },
    };
  }, [
    initial,
    travelRequest,
    quotationType,
    currency,
    subtotal,
    taxApplicable,
    taxRate,
    taxAmount,
    taxLabel,
    finalTotal,
    validUntil,
    notes,
    greetingRecipient,
    greetingTitle,
    greetingMessage,
    tripId,
    destination,
    startDate,
    endDate,
    durationLabel,
    adultsCount,
    childrenCount,
    infantsCount,
    hotels,
    transports,
    activities,
    otherItems,
    itineraryDays,
    paymentDetails,
    inclusions,
    exclusions,
    termsSections,
    agencyProfile,
  ]);

  // Validation function
  function validateBuilder() {
    setFormError(null);

    if (!quotationType || !QUOTATION_TYPES.includes(quotationType)) {
      const err = 'Select a quotation type.';
      setFormError(err);
      toast.error(err);
      return false;
    }

    if (totalItemsCount === 0) {
      const err = 'Add at least one service item before saving or previewing.';
      setFormError(err);
      toast.error(err);
      return false;
    }

    // Validate hotels
    for (let i = 0; i < hotels.length; i++) {
      const h = hotels[i];
      if (!String(h.title || '').trim()) {
        const err = `Hotel item ${i + 1} requires a service title.`;
        setFormError(err);
        toast.error(err);
        setActiveStep('hotels');
        return false;
      }
      if (h.checkIn && h.checkOut && h.checkOut <= h.checkIn) {
        const err = `Hotel item ${i + 1}: check-out date must be after check-in date.`;
        setFormError(err);
        toast.error(err);
        setActiveStep('hotels');
        return false;
      }
      if (!(Number(h.quantity) > 0)) {
        const err = `Hotel item ${i + 1} quantity must be greater than 0.`;
        setFormError(err);
        toast.error(err);
        setActiveStep('hotels');
        return false;
      }
    }

    // Validate transports
    for (let i = 0; i < transports.length; i++) {
      const t = transports[i];
      if (!String(t.title || '').trim()) {
        const err = `Transport item ${i + 1} requires a service title.`;
        setFormError(err);
        toast.error(err);
        setActiveStep('transports');
        return false;
      }
    }

    // Validate activities
    for (let i = 0; i < activities.length; i++) {
      const a = activities[i];
      if (!String(a.title || '').trim()) {
        const err = `Activity item ${i + 1} requires a tour name.`;
        setFormError(err);
        toast.error(err);
        setActiveStep('activities');
        return false;
      }
    }

    return true;
  }

  // Converts rich components back into standard backend quotation payload
  function buildPayload() {
    if (!validateBuilder()) return null;

    const formattedItems = [
      ...hotels.map((h) => ({
        itemType: 'hotel',
        title: String(h.title).trim(),
        description: h.description || `${h.starCategory} - ${h.roomCategory} (${h.mealPlan})`,
        quantity: Number(h.quantity) || 1,
        unitPrice: Number(h.unitPrice) || 0,
        metadata: {
          property: h.property,
          city: h.city,
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
          amenities: h.amenities,
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
          city: t.city,
          pickupLocation: t.pickupLocation,
          dropLocation: t.dropLocation,
          pickupTime: t.pickupTime,
          vehicleType: t.vehicleType,
          usageType: t.usageType,
          passengerCapacity: t.passengerCapacity,
          luggageCapacity: t.luggageCapacity,
          driverIncluded: t.driverIncluded,
        },
      })),
      ...activities.map((a) => ({
        itemType: a.category.toLowerCase().includes('guide') ? 'guide' : 'service',
        title: String(a.title).trim(),
        description: a.description || `${a.category} - ${a.duration}`,
        quantity: Number(a.quantity) || 1,
        unitPrice: Number(a.unitPrice) || 0,
        metadata: {
          city: a.city,
          category: a.category,
          tourType: a.tourType,
          tourDate: a.tourDate,
          slotTime: a.slotTime,
          duration: a.duration,
          operatingDays: a.operatingDays,
          guideIncluded: a.guideIncluded,
          transportIncluded: a.transportIncluded,
          paxCount: a.paxCount,
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
      taxRate: taxApplicable ? Number(taxRate) : 0,
      taxLabel: taxApplicable ? taxLabel : undefined,
      greeting: {
        recipient: greetingRecipient,
        title: greetingTitle,
        message: greetingMessage,
      },
      packageOverview: {
        tripId,
        destination,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        duration: durationLabel,
        adults: Number(adultsCount) || 2,
        children: Number(childrenCount) || 0,
        infants: Number(infantsCount) || 0,
      },
      items: formattedItems,
      itineraryDays,
      paymentDetails,
      inclusions,
      exclusions,
      termsSections,
      branding: {
        agencyName: agencyProfile?.agencyName || undefined,
        logoUrl: agencyProfile?.logoPath || undefined,
        phone: agencyProfile?.phone || undefined,
        email: agencyProfile?.businessEmail || undefined,
        address: [agencyProfile?.address, agencyProfile?.city, agencyProfile?.country].filter(Boolean).join(', ') || undefined,
      },
    };
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
      const successMsg = 'Quotation draft saved successfully.';
      setSuccessMessage(successMsg);
      toast.success(successMsg);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const errMsg = err?.message || 'Failed to save quotation draft.';
      setFormError(errMsg);
      toast.error(errMsg);
    }
  }

  async function handleFinalSubmit(e) {
    e?.preventDefault?.();
    const payload = buildPayload();
    if (!payload) return;

    try {
      if (onSubmit) {
        await onSubmit(payload);
      }
      toast.success('Quotation submitted successfully to traveller.');
    } catch (err) {
      const errMsg = err?.message || 'Failed to submit quotation.';
      setFormError(errMsg);
      toast.error(errMsg);
    }
  }

  // Hotel actions
  function addHotel() {
    const sDate = travelRequest?.travelStartDate || '';
    const eDate = travelRequest?.travelEndDate || '';
    const nights = calculateNights(sDate, eDate);
    setHotels([
      ...hotels,
      {
        _category: 'hotel',
        id: `hotel-${Date.now()}-${hotels.length}`,
        title: `${destination} Hotel Stay`,
        property: `${destination} Hotel`,
        city: destination,
        starCategory: '4 Star',
        mealPlan: 'CP (Breakfast Included)',
        checkIn: sDate,
        checkOut: eDate,
        nights,
        roomCategory: 'Standard Room',
        roomType: 'Double (2 Persons)',
        rooms: 1,
        bedType: 'Queen Bed',
        extraBed: 'None',
        maxAdults: 2,
        maxChildren: 0,
        amenities: 'Standard Room | CP | Wifi | Air Conditioning | Daily Housekeeping',
        quantity: 1,
        unitPrice: 120,
        description: 'Standard boutique accommodation with breakfast.',
      },
    ]);
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

  function removeHotel(index) {
    setHotels((prev) => prev.filter((_, i) => i !== index));
  }

  // Transport actions
  function addTransport(type = 'Airport Transfer') {
    setTransports([
      ...transports,
      {
        _category: 'transport',
        id: `transport-${Date.now()}-${transports.length}`,
        title: type === 'Chauffeur / Driver' ? 'Full Day Driver & Vehicle' : 'Airport to Hotel Transfer',
        serviceType: type,
        serviceDate: travelRequest?.travelStartDate || '',
        city: destination,
        pickupLocation: 'Airport',
        dropLocation: 'Hotel',
        pickupTime: '10:00 AM',
        vehicleType: 'Sedan (1-3 PAX)',
        usageType: 'One-way Transfer',
        passengerCapacity: '3 Passengers',
        luggageCapacity: '2 Bags',
        driverIncluded: true,
        quantity: 1,
        unitPrice: 40,
        description: 'Private air-conditioned vehicle with licensed driver.',
      },
    ]);
  }

  function updateTransport(index, field, value) {
    setTransports((prev) => prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
  }

  function removeTransport(index) {
    setTransports((prev) => prev.filter((_, i) => i !== index));
  }

  // Activity actions
  function addActivity(cat = 'Sightseeing Tour') {
    setActivities([
      ...activities,
      {
        _category: 'activity',
        id: `activity-${Date.now()}-${activities.length}`,
        title: `${destination} City Highlights Tour`,
        city: destination,
        category: cat,
        tourType: 'Sharing Tour',
        tourDate: travelRequest?.travelStartDate || '',
        slotTime: '10:00',
        duration: 'Half Day (4 Hours)',
        operatingDays: 'Daily',
        guideIncluded: true,
        transportIncluded: false,
        paxCount: `${adultsCount} Pax`,
        quantity: adultsCount || 1,
        unitPrice: 35,
        description: 'Guided excursion covering primary regional landmarks.',
      },
    ]);
  }

  function updateActivity(index, field, value) {
    setActivities((prev) => prev.map((a, i) => (i === index ? { ...a, [field]: value } : a)));
  }

  function removeActivity(index) {
    setActivities((prev) => prev.filter((_, i) => i !== index));
  }

  // Itinerary actions
  function addItineraryDay() {
    const nextNum = itineraryDays.length + 1;
    const lastDate = itineraryDays[itineraryDays.length - 1]?.date;
    const nextDate = lastDate ? addDays(lastDate, 1) : '';
    setItineraryDays([
      ...itineraryDays,
      {
        dayNumber: nextNum,
        weekday: nextDate ? getWeekday(nextDate) : '',
        date: nextDate,
        title: `Day ${nextNum} Program`,
        description: 'Full day sightseeing, excursion activities, and leisurely exploration.',
        city: destination,
      },
    ]);
  }

  function updateItineraryDay(index, field, value) {
    setItineraryDays((prev) =>
      prev.map((d, i) => {
        if (i !== index) return d;
        const updated = { ...d, [field]: value };
        if (field === 'date') {
          updated.weekday = getWeekday(value);
        }
        return updated;
      }),
    );
  }

  function removeItineraryDay(index) {
    setItineraryDays((prev) =>
      prev.filter((_, i) => i !== index).map((d, i) => ({ ...d, dayNumber: i + 1 })),
    );
  }

  // Inclusions/Exclusions actions
  function addInclusion(text = '') {
    setInclusions([...inclusions, text || 'New inclusion item']);
  }
  function updateInclusion(index, text) {
    setInclusions(inclusions.map((item, i) => (i === index ? text : item)));
  }
  function removeInclusion(index) {
    setInclusions(inclusions.filter((_, i) => i !== index));
  }

  function addExclusion(text = '') {
    setExclusions([...exclusions, text || 'New exclusion item']);
  }
  function updateExclusion(index, text) {
    setExclusions(exclusions.map((item, i) => (i === index ? text : item)));
  }
  function removeExclusion(index) {
    setExclusions(exclusions.filter((_, i) => i !== index));
  }

  // Terms & Conditions actions
  function addTermSection(title = 'Custom Terms Policy') {
    setTermsSections([
      ...termsSections,
      {
        title: title || 'New Policy Section',
        content: '',
        points: ['New policy clause or instruction'],
        enabled: true,
      },
    ]);
  }

  function removeTermSection(index) {
    setTermsSections(termsSections.filter((_, i) => i !== index));
  }

  function addTermPoint(secIndex, pointText = '') {
    setTermsSections((prev) =>
      prev.map((sec, i) => {
        if (i !== secIndex) return sec;
        const currentPoints = Array.isArray(sec.points) ? sec.points : [];
        return {
          ...sec,
          points: [...currentPoints, pointText || 'Additional policy condition'],
        };
      })
    );
  }

  function removeTermPoint(secIndex, pointIndex) {
    setTermsSections((prev) =>
      prev.map((sec, i) => {
        if (i !== secIndex) return sec;
        return {
          ...sec,
          points: (sec.points || []).filter((_, pIdx) => pIdx !== pointIndex),
        };
      })
    );
  }

  // Navigation handlers
  const stepIdx = BUILDER_STEPS.findIndex((s) => s.id === activeStep);
  const prevStep = stepIdx > 0 ? BUILDER_STEPS[stepIdx - 1].id : null;
  const nextStep = stepIdx < BUILDER_STEPS.length - 1 ? BUILDER_STEPS[stepIdx + 1].id : null;

  return (
    <div className="quotation-builder-container" style={{ width: '100%', fontFamily: 'inherit' }}>
      {/* Traveller Request Context Banner */}
      {travelRequest && (
        <div
          style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '1rem 1.25rem',
            marginBottom: '1.25rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
            }}
            onClick={() => setShowRequestDetails(!showRequestDetails)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  backgroundColor: '#e0f2fe',
                  color: '#0369a1',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                QUERY REQUIREMENTS • REQUEST #{travelRequest.id}
              </span>
              <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>{defaultDestination}</strong>
              <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
                &bull; {travelRequest.numberOfTravellers || 2} PAX &bull; {durationLabel}
              </span>
            </div>

            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                color: '#0284c7',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              {showRequestDetails ? 'Hide Details' : 'Show Request Details'}
              {showRequestDetails ? <FiChevronUp /> : <FiChevronDown />}
            </button>
          </div>

          {showRequestDetails && (
            <div
              style={{
                marginTop: '1rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid #e2e8f0',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.75rem',
                fontSize: '0.85rem',
                color: '#334155',
              }}
            >
              <div><strong>Dates:</strong> {startDate || 'Flexible'} – {endDate || 'Flexible'}</div>
              <div><strong>Luggage:</strong> {travelRequest.luggageCount || 0} Bags</div>
              <div><strong>Hotel Required:</strong> {travelRequest.hotelRequired ? 'Yes' : 'No'}</div>
              <div><strong>Driver Required:</strong> {travelRequest.driverRequired ? 'Yes' : 'No'}</div>
              <div><strong>Guide Required:</strong> {travelRequest.guideRequired ? 'Yes' : 'No'}</div>
              {travelRequest.specialRequests && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <strong>Special Notes:</strong> {travelRequest.specialRequests}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error & Success Alerts */}
      {formError && (
        <div
          role="alert"
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.9rem',
            fontWeight: 600,
          }}
        >
          <FiAlertCircle style={{ flexShrink: 0 }} />
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
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.9rem',
            fontWeight: 600,
          }}
        >
          <FiCheckCircle style={{ flexShrink: 0 }} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 10-Step Progress Navigation Tabs */}
      <div
        className="builder-step-tabs"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          borderBottom: '2px solid #e2e8f0',
          marginBottom: '1.5rem',
          overflowX: 'auto',
          paddingBottom: '2px',
        }}
      >
        {BUILDER_STEPS.map((s) => {
          let countBadge = null;
          if (s.id === 'hotels') countBadge = ` (${hotels.length})`;
          if (s.id === 'transports') countBadge = ` (${transports.length})`;
          if (s.id === 'activities') countBadge = ` (${activities.length})`;
          if (s.id === 'itinerary') countBadge = ` (${itineraryDays.length})`;

          const isActive = activeStep === s.id;
          const Icon = s.icon;

          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveStep(s.id)}
              style={{
                background: 'none',
                border: 'none',
                padding: '0.75rem 1rem',
                fontSize: '0.85rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#0c4e28' : '#64748b',
                borderBottom: isActive ? '3px solid #0c4e28' : '3px solid transparent',
                marginBottom: '-2px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon style={{ fontSize: '1rem', color: isActive ? '#0c4e28' : '#94a3b8' }} />
              {s.label}{countBadge}
            </button>
          );
        })}
      </div>

      {/* Main Workspace Area */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* STEP 1: BASIC DETAILS & PACKAGE OVERVIEW */}
        {activeStep === 'basic' && (
          <div className="step-content">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 1rem', color: '#0f172a' }}>
              Proposal &amp; Trip Details
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label
                  htmlFor="quotation-type-select"
                  style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}
                >
                  Quotation Type *
                </label>
                <select
                  id="quotation-type-select"
                  aria-label="Quotation type"
                  value={quotationType}
                  onChange={(e) => setQuotationType(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                >
                  <option value="">-- Select quotation type --</option>
                  {QUOTATION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {QUOTATION_TYPE_LABELS[t] || t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Proposal Title
                </label>
                <input
                  type="text"
                  value={quotationTitle}
                  onChange={(e) => setQuotationTitle(e.target.value)}
                  placeholder="e.g. Cappadocia Royal Stay & Excursions"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Trip Destination
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Currency *
                </label>
                <select
                  aria-label="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="TRY">TRY (₺)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Quotation Validity Date
                </label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Trip Reference ID
                </label>
                <input
                  type="text"
                  value={tripId}
                  onChange={(e) => setTripId(e.target.value)}
                  placeholder="e.g. QRY-1118"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>
            </div>

            {/* Guest Greeting & Introduction */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem', marginBottom: '1.25rem' }}>
              <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                Guest Greeting &amp; Introduction
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Guest Recipient Name
                  </label>
                  <input
                    type="text"
                    value={greetingRecipient}
                    onChange={(e) => setGreetingRecipient(e.target.value)}
                    placeholder="e.g. Elena Rostova"
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Greeting Title
                  </label>
                  <input
                    type="text"
                    value={greetingTitle}
                    onChange={(e) => setGreetingTitle(e.target.value)}
                    placeholder="e.g. Greetings from QuoteMeTrip !!!"
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Introduction / Discussion Message
                </label>
                <textarea
                  rows={2}
                  value={greetingMessage}
                  onChange={(e) => setGreetingMessage(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            {/* Quick Primary Item Title for compatibility */}
            <div style={{ backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '1rem' }}>
              <label htmlFor="primary-item-title" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Primary Service Title
              </label>
              <input
                id="primary-item-title"
                aria-label="Item 1 title"
                type="text"
                value={hotels[0]?.title || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (hotels.length === 0) {
                    if (val) {
                      setHotels([{
                        _category: 'hotel',
                        id: `hotel-${Date.now()}-0`,
                        title: val,
                        property: destination,
                        city: destination,
                        starCategory: '4 Star',
                        mealPlan: 'CP (Breakfast Included)',
                        checkIn: startDate,
                        checkOut: endDate,
                        nights: calculateNights(startDate, endDate),
                        roomCategory: 'Standard Room',
                        roomType: 'Double (2 Persons)',
                        rooms: 1,
                        bedType: 'Queen Bed',
                        extraBed: 'None',
                        maxAdults: adultsCount || 2,
                        maxChildren: 0,
                        amenities: 'Standard Room | CP | Wifi',
                        quantity: 1,
                        unitPrice: 100,
                        description: val,
                      }]);
                    }
                  } else {
                    updateHotel(0, 'title', val);
                  }
                }}
                placeholder="e.g. Royal Cave Suite"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
              />
            </div>
          </div>
        )}

        {/* STEP 2: HOTELS */}
        {activeStep === 'hotels' && (
          <div className="step-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                  Hotel Stays &amp; Accommodations
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Configure accommodation dates, meal plans, star categories, and room types.
                </p>
              </div>
              <button
                type="button"
                onClick={addHotel}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#0c4e28',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <FiPlus /> Add Hotel
              </button>
            </div>

            {hotels.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                <p style={{ color: '#64748b', margin: '0 0 1rem' }}>No hotels added yet.</p>
                <button type="button" onClick={addHotel} style={{ padding: '6px 14px', borderRadius: '6px', backgroundColor: '#0c4e28', color: '#fff', border: 'none', cursor: 'pointer' }}>
                  + Add First Hotel
                </button>
              </div>
            ) : (
              hotels.map((h, idx) => (
                <div
                  key={h.id || idx}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '1.25rem',
                    marginBottom: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>Hotel #{idx + 1}</strong>
                    <button
                      type="button"
                      aria-label="Remove"
                      onClick={() => removeHotel(idx)}
                      style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <FiTrash2 /> Remove
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Service / Package Title *
                      </label>
                      <input
                        type="text"
                        value={h.title}
                        onChange={(e) => updateHotel(idx, 'title', e.target.value)}
                        placeholder="e.g. Udaipur Royal Lake Stay"
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Hotel Property Name
                      </label>
                      <input
                        type="text"
                        value={h.property}
                        onChange={(e) => updateHotel(idx, 'property', e.target.value)}
                        placeholder="e.g. Taj Lake Palace"
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        City / Location
                      </label>
                      <input
                        type="text"
                        value={h.city}
                        onChange={(e) => updateHotel(idx, 'city', e.target.value)}
                        placeholder="e.g. Udaipur, India"
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Star Category
                      </label>
                      <select
                        value={h.starCategory}
                        onChange={(e) => updateHotel(idx, 'starCategory', e.target.value)}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      >
                        <option value="5 Star">⭐⭐⭐⭐⭐ 5 Star</option>
                        <option value="4 Star">⭐⭐⭐⭐ 4 Star</option>
                        <option value="3 Star">⭐⭐⭐ 3 Star</option>
                        <option value="Heritage Hotel">Heritage Resort</option>
                        <option value="Boutique Cave">Boutique / Cave</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Check-in Date
                      </label>
                      <input
                        type="date"
                        value={h.checkIn}
                        onChange={(e) => updateHotel(idx, 'checkIn', e.target.value)}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Check-out Date
                      </label>
                      <input
                        type="date"
                        value={h.checkOut}
                        onChange={(e) => updateHotel(idx, 'checkOut', e.target.value)}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Meal Plan
                      </label>
                      <select
                        value={h.mealPlan}
                        onChange={(e) => updateHotel(idx, 'mealPlan', e.target.value)}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      >
                        <option value="CP (Breakfast Included)">CP (Breakfast Included)</option>
                        <option value="EP (Room Only)">EP (Room Only)</option>
                        <option value="MAP (Breakfast & Dinner)">MAP (Breakfast &amp; Dinner)</option>
                        <option value="AP (All Meals Included)">AP (All Meals Included)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Room Category &amp; Type
                      </label>
                      <input
                        type="text"
                        value={h.roomCategory}
                        onChange={(e) => updateHotel(idx, 'roomCategory', e.target.value)}
                        placeholder="e.g. Standard Room (Double)"
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Rooms Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={h.rooms}
                        onChange={(e) => updateHotel(idx, 'rooms', Number(e.target.value) || 1)}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Quantity (Lines)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={h.quantity}
                        onChange={(e) => updateHotel(idx, 'quantity', Number(e.target.value) || 1)}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Unit Price ({currency})
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={h.unitPrice}
                        onChange={(e) => updateHotel(idx, 'unitPrice', Number(e.target.value) || 0)}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Inclusions &amp; Amenities Line
                      </label>
                      <input
                        type="text"
                        value={h.amenities}
                        onChange={(e) => updateHotel(idx, 'amenities', e.target.value)}
                        placeholder="e.g. Standard Room | EP | Taj Lake Palace | Wifi | Air Conditioning | Daily Housekeeping"
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* STEP 3: TRANSPORTS */}
        {activeStep === 'transports' && (
          <div className="step-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                  Airport Transfers &amp; Transport
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Dedicated chauffeur, vehicle transfers, and route transportation.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => addTransport('Airport Transfer')}
                  style={{
                    backgroundColor: '#0c4e28',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 14px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <FiPlus /> Add Airport Transfer
                </button>
                <button
                  type="button"
                  onClick={() => addTransport('Chauffeur / Driver')}
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#0c4e28',
                    border: '1px solid #0c4e28',
                    borderRadius: '6px',
                    padding: '8px 14px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <FiPlus /> Add Transfer
                </button>
              </div>
            </div>

            {transports.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                <p style={{ color: '#64748b', margin: '0 0 1rem' }}>No Transport Services Added Yet.</p>
                <button type="button" onClick={() => addTransport('Airport Transfer')} style={{ padding: '6px 14px', borderRadius: '6px', backgroundColor: '#0c4e28', color: '#fff', border: 'none', cursor: 'pointer' }}>
                  + Add First Transfer
                </button>
              </div>
            ) : (
              transports.map((t, idx) => (
                <div
                  key={t.id || idx}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '1.25rem',
                    marginBottom: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>Transfer #{idx + 1}</strong>
                    <button
                      type="button"
                      aria-label="Remove"
                      onClick={() => removeTransport(idx)}
                      style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <FiTrash2 /> Remove
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Service / Route Name *
                      </label>
                      <input
                        type="text"
                        value={t.title}
                        onChange={(e) => updateTransport(idx, 'title', e.target.value)}
                        placeholder="e.g. Udaipur Lake City Transfer"
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Vehicle Type
                      </label>
                      <select
                        value={t.vehicleType}
                        onChange={(e) => updateTransport(idx, 'vehicleType', e.target.value)}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      >
                        <option value="Sedan (1-3 PAX)">Sedan (1-3 PAX)</option>
                        <option value="SUV (1-4 PAX)">SUV (1-4 PAX)</option>
                        <option value="Luxury Van (Mercedes Vito)">Luxury Van (Mercedes Vito)</option>
                        <option value="Minibus (14 PAX)">Minibus (14 PAX)</option>
                        <option value="Coach (30 PAX)">Coach (30 PAX)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Service Date
                      </label>
                      <input
                        type="date"
                        value={t.serviceDate}
                        onChange={(e) => updateTransport(idx, 'serviceDate', e.target.value)}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Usage Type
                      </label>
                      <select
                        value={t.usageType}
                        onChange={(e) => updateTransport(idx, 'usageType', e.target.value)}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      >
                        <option value="One-way Transfer">One-way Transfer</option>
                        <option value="Round-trip Transfer">Round-trip Transfer</option>
                        <option value="Full Day Disposal (8 Hours)">Full Day Disposal (8 Hours)</option>
                        <option value="Intercity Route Transfer">Intercity Route Transfer</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={t.quantity}
                        onChange={(e) => updateTransport(idx, 'quantity', Number(e.target.value) || 1)}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Unit Price ({currency})
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={t.unitPrice}
                        onChange={(e) => updateTransport(idx, 'unitPrice', Number(e.target.value) || 0)}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Details &amp; Included Features
                      </label>
                      <input
                        type="text"
                        value={t.description}
                        onChange={(e) => updateTransport(idx, 'description', e.target.value)}
                        placeholder="e.g. Meet & Greet | AC Sedan | Tolls & Parking Included"
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* STEP 4: ACTIVITIES & SIGHTSEEING */}
        {activeStep === 'activities' && (
          <div className="step-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                  Activities, Excursions &amp; Tours
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Guided excursions, monuments, sightseeing tours, and experiences.
                </p>
              </div>
              <button
                type="button"
                onClick={() => addActivity('Sightseeing Tour')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#0c4e28',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <FiPlus /> Add Sightseeing Tour
              </button>
            </div>

            {activities.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                <p style={{ color: '#64748b', margin: '0 0 1rem' }}>No activities added yet.</p>
                <button type="button" onClick={() => addActivity('Sightseeing Tour')} style={{ padding: '6px 14px', borderRadius: '6px', backgroundColor: '#0c4e28', color: '#fff', border: 'none', cursor: 'pointer' }}>
                  + Add First Activity
                </button>
              </div>
            ) : (
              activities.map((a, idx) => (
                <div
                  key={a.id || idx}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '1.25rem',
                    marginBottom: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>Activity #{idx + 1}</strong>
                    <button
                      type="button"
                      aria-label="Remove"
                      onClick={() => removeActivity(idx)}
                      style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <FiTrash2 /> Remove
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Activity / Tour Name *
                      </label>
                      <input
                        type="text"
                        value={a.title}
                        onChange={(e) => updateActivity(idx, 'title', e.target.value)}
                        placeholder="e.g. Sajjangarh Monsoon Palace Tour"
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Tour Type
                      </label>
                      <select
                        value={a.tourType}
                        onChange={(e) => updateActivity(idx, 'tourType', e.target.value)}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      >
                        <option value="Sharing Tour">Sharing Tour</option>
                        <option value="Private Tour">Private Tour</option>
                        <option value="Walking Tour">Walking Tour</option>
                        <option value="Boat / Cruise Excursion">Boat / Cruise Excursion</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Tour Date
                      </label>
                      <input
                        type="date"
                        value={a.tourDate}
                        onChange={(e) => updateActivity(idx, 'tourDate', e.target.value)}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Slot Time
                      </label>
                      <input
                        type="text"
                        value={a.slotTime}
                        onChange={(e) => updateActivity(idx, 'slotTime', e.target.value)}
                        placeholder="e.g. 16:00 or 10:00 - 14:00"
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Duration
                      </label>
                      <input
                        type="text"
                        value={a.duration}
                        onChange={(e) => updateActivity(idx, 'duration', e.target.value)}
                        placeholder="e.g. 8 Hours or Half Day"
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Quantity (PAX)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={a.quantity}
                        onChange={(e) => updateActivity(idx, 'quantity', Number(e.target.value) || 1)}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Unit Price ({currency})
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={a.unitPrice}
                        onChange={(e) => updateActivity(idx, 'unitPrice', Number(e.target.value) || 0)}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Inclusions &amp; Description Line
                      </label>
                      <input
                        type="text"
                        value={a.description}
                        onChange={(e) => updateActivity(idx, 'description', e.target.value)}
                        placeholder="e.g. Monsoon Palace | Guided Activity | Shared Group | Standard Guide"
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* STEP 5: DAY WISE ITINERARY */}
        {activeStep === 'itinerary' && (
          <div className="step-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                  Day Wise Schedule
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Detailed day-by-day travel itinerary matching guest document layout.
                </p>
              </div>
              <button
                type="button"
                onClick={addItineraryDay}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#0c4e28',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <FiPlus /> Add Day
              </button>
            </div>

            {itineraryDays.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                <p style={{ color: '#64748b', margin: '0 0 1rem' }}>No itinerary days configured.</p>
                <button type="button" onClick={addItineraryDay} style={{ padding: '6px 14px', borderRadius: '6px', backgroundColor: '#0c4e28', color: '#fff', border: 'none', cursor: 'pointer' }}>
                  + Add Day 1
                </button>
              </div>
            ) : (
              itineraryDays.map((d, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '1.25rem',
                    marginBottom: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ backgroundColor: '#e0f2fe', color: '#0284c7', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                        {formatDayNumber(d.dayNumber || idx + 1)}
                      </span>
                      {d.weekday && <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{d.weekday}</span>}
                    </div>
                    <button
                      type="button"
                      aria-label="Remove"
                      onClick={() => removeItineraryDay(idx)}
                      style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <FiTrash2 /> Remove Day
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Date
                      </label>
                      <input
                        type="date"
                        value={d.date || ''}
                        onChange={(e) => updateItineraryDay(idx, 'date', e.target.value)}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Day Title *
                      </label>
                      <input
                        type="text"
                        value={d.title}
                        onChange={(e) => updateItineraryDay(idx, 'title', e.target.value)}
                        placeholder="e.g. Arrival in Udaipur & City Sightseeing"
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      Detailed Day Itinerary Narrative
                    </label>
                    <textarea
                      rows={3}
                      value={d.description}
                      onChange={(e) => updateItineraryDay(idx, 'description', e.target.value)}
                      placeholder="Detailed sightseeing description..."
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', lineHeight: 1.5 }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* STEP 6: PRICING & TAXES */}
        {activeStep === 'pricing' && (
          <div className="step-content">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 1rem', color: '#0f172a' }}>
              Quotation Pricing &amp; Taxes
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '4px' }}>Services Subtotal</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
                  {formatQuotationCurrency(subtotal, currency)}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Calculated from {totalItemsCount} line items
                </span>
              </div>

              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                    Tax Configuration
                  </label>
                  <label style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={taxApplicable}
                      onChange={(e) => setTaxApplicable(e.target.checked)}
                    />
                    Apply Tax
                  </label>
                </div>

                {taxApplicable && (
                  <div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={taxRate}
                        onChange={(e) => setTaxRate(Number(e.target.value) || 0)}
                        placeholder="Tax %"
                        style={{ width: '80px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                      <input
                        type="text"
                        value={taxLabel}
                        onChange={(e) => setTaxLabel(e.target.value)}
                        placeholder="Tax statement label"
                        style={{ flex: 1, padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#2563eb' }}>
                      Tax Amount: {formatQuotationCurrency(taxAmount, currency)}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.85rem', color: '#166534', fontWeight: 600, marginBottom: '4px' }}>
                  Final Total Amount (Server Authoritative)
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0c4e28' }}>
                  {formatQuotationCurrency(finalTotal, currency)}
                </div>
                {costPerPassenger && (
                  <span style={{ fontSize: '0.8rem', color: '#15803d' }}>
                    Approx. {formatQuotationCurrency(costPerPassenger, currency)} per passenger
                  </span>
                )}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Commercial Notes &amp; Validity Statement
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Quotation valid for 7 days. Rates subject to dynamic airline and hotel tariff adjustments."
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
              />
            </div>
          </div>
        )}

        {/* STEP 7: PAYMENT DETAILS */}
        {activeStep === 'payment' && (
          <div className="step-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                  Bank Account Details for Payment
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Official agency banking coordinates presented in guest quotation document.
                </p>
              </div>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={Boolean(paymentDetails.includePaymentDetails)}
                  onChange={(e) =>
                    setPaymentDetails({ ...paymentDetails, includePaymentDetails: e.target.checked })
                  }
                />
                Include Bank Details Table
              </label>
            </div>

            {paymentDetails.includePaymentDetails ? (
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={paymentDetails.bankName || ''}
                      onChange={(e) => setPaymentDetails({ ...paymentDetails, bankName: e.target.value })}
                      placeholder="e.g. HDFC Bank"
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      A/c Holder Name
                    </label>
                    <input
                      type="text"
                      value={paymentDetails.accountHolder || ''}
                      onChange={(e) => setPaymentDetails({ ...paymentDetails, accountHolder: e.target.value })}
                      placeholder="e.g. DDLC Company"
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      A/c Number
                    </label>
                    <input
                      type="text"
                      value={paymentDetails.accountNumber || ''}
                      onChange={(e) => setPaymentDetails({ ...paymentDetails, accountNumber: e.target.value })}
                      placeholder="e.g. 50200103968171"
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      IFSC / SWIFT Code
                    </label>
                    <input
                      type="text"
                      value={paymentDetails.ifsc || ''}
                      onChange={(e) => setPaymentDetails({ ...paymentDetails, ifsc: e.target.value })}
                      placeholder="e.g. HDFC0004413"
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      Branch
                    </label>
                    <input
                      type="text"
                      value={paymentDetails.branch || ''}
                      onChange={(e) => setPaymentDetails({ ...paymentDetails, branch: e.target.value })}
                      placeholder="e.g. DWARKA SEC VII"
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Payment Schedule Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={paymentDetails.instructions || ''}
                    onChange={(e) => setPaymentDetails({ ...paymentDetails, instructions: e.target.value })}
                    placeholder="e.g. Minimum 50% deposit required upon confirmation."
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                <p style={{ color: '#64748b' }}>
                  Bank account details are currently disabled for this quotation. Check the box above if you want bank details to appear on the final document.
                </p>
              </div>
            )}
          </div>
        )}

        {/* STEP 8: INCLUSIONS & EXCLUSIONS */}
        {activeStep === 'inclusions' && (
          <div className="step-content">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 1rem', color: '#0f172a' }}>
              Package Inclusions &amp; Exclusions
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {/* Inclusions Column */}
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <strong style={{ color: '#047857', fontSize: '1rem' }}>Inclusions</strong>
                  <button
                    type="button"
                    onClick={() => addInclusion()}
                    style={{ background: '#f0fdf4', color: '#047857', border: '1px solid #bbf7d0', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    + Add Item
                  </button>
                </div>
                {inclusions.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                    <span style={{ color: '#059669', fontWeight: 'bold' }}>✓</span>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => updateInclusion(idx, e.target.value)}
                      style={{ flex: 1, padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                    <button type="button" onClick={() => removeInclusion(idx)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
              </div>

              {/* Exclusions Column */}
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <strong style={{ color: '#b91c1c', fontSize: '1rem' }}>Exclusions</strong>
                  <button
                    type="button"
                    onClick={() => addExclusion()}
                    style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    + Add Item
                  </button>
                </div>
                {exclusions.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                    <span style={{ color: '#dc2626', fontWeight: 'bold' }}>✗</span>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => updateExclusion(idx, e.target.value)}
                      style={{ flex: 1, padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                    <button type="button" onClick={() => removeExclusion(idx)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
                <div style={{ marginTop: '12px', fontSize: '0.8rem', fontWeight: 'bold', color: '#0f766e' }}>
                  NOTE: Anything not mentioned in the inclusions is excluded.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 9: TERMS & CONDITIONS */}
        {activeStep === 'terms' && (
          <div className="step-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                  Terms and Conditions
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Structured legal, operational, and booking policy clauses matching reference quotation document.
                </p>
              </div>

              <button
                type="button"
                onClick={() => addTermSection()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#0c4e28',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <FiPlus /> Add Policy Section
              </button>
            </div>

            {termsSections.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                <p style={{ color: '#64748b', margin: '0 0 1rem' }}>No terms & conditions sections configured.</p>
                <button
                  type="button"
                  onClick={() => addTermSection('General Terms & Conditions')}
                  style={{ padding: '6px 14px', borderRadius: '6px', backgroundColor: '#0c4e28', color: '#fff', border: 'none', cursor: 'pointer' }}
                >
                  + Add First Policy Section
                </button>
              </div>
            ) : (
              termsSections.map((sec, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '1.25rem',
                    marginBottom: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                      <input
                        type="text"
                        value={sec.title}
                        onChange={(e) => {
                          const updated = [...termsSections];
                          updated[idx].title = e.target.value;
                          setTermsSections(updated);
                        }}
                        placeholder="e.g. Bookings and Reservations"
                        style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', border: 'none', borderBottom: '1px dashed #cbd5e1', padding: '4px 6px', width: '100%', maxWidth: '400px' }}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <label style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#334155' }}>
                        <input
                          type="checkbox"
                          checked={sec.enabled !== false}
                          onChange={(e) => {
                            const updated = [...termsSections];
                            updated[idx].enabled = e.target.checked;
                            setTermsSections(updated);
                          }}
                        />
                        Include in Quotation
                      </label>

                      <button
                        type="button"
                        aria-label="Remove Policy Section"
                        onClick={() => removeTermSection(idx)}
                        style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <FiTrash2 /> Remove Section
                      </button>
                    </div>
                  </div>

                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Section Overview / Introductory Policy
                  </label>
                  <textarea
                    rows={2}
                    value={sec.content || ''}
                    onChange={(e) => {
                      const updated = [...termsSections];
                      updated[idx].content = e.target.value;
                      setTermsSections(updated);
                    }}
                    placeholder="Enter section overview text..."
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', marginBottom: '10px' }}
                  />

                  {/* Bullet Points Clauses List */}
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>
                        Policy Clauses &amp; Terms Items ({sec.points?.length || 0})
                      </label>
                      <button
                        type="button"
                        onClick={() => addTermPoint(idx)}
                        style={{
                          background: '#f0fdf4',
                          color: '#047857',
                          border: '1px solid #bbf7d0',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <FiPlus size={13} /> Add Point
                      </button>
                    </div>

                    {Array.isArray(sec.points) && sec.points.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {sec.points.map((pt, pIdx) => (
                          <div key={pIdx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>&bull;</span>
                            <input
                              type="text"
                              value={pt}
                              onChange={(e) => {
                                const updated = [...termsSections];
                                updated[idx].points[pIdx] = e.target.value;
                                setTermsSections(updated);
                              }}
                              placeholder="e.g. Payment Terms: 50% deposit upon confirmation..."
                              style={{ flex: 1, padding: '5px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.82rem' }}
                            />
                            <button
                              type="button"
                              onClick={() => removeTermPoint(idx, pIdx)}
                              style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px' }}
                              title="Delete point"
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ margin: '4px 0', fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>
                        No specific bullet points added for this section.
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* STEP 10: PREVIEW & FINALIZE */}
        {activeStep === 'preview' && (
          <div className="step-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Quotation Live Document Preview
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Print-ready A4 Portrait layout formatted precisely per reference quotation standard.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={printQuotationDocument}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#0c4e28',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <FiPrinter /> Print Document
                </button>
                <button
                  type="button"
                  onClick={() => downloadQuotationDoc(canonicalQuotation)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#ffffff',
                    color: '#0c4e28',
                    border: '1px solid #0c4e28',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <FiDownload /> Download Word DOC
                </button>
              </div>
            </div>

            {/* Embedded A4 Document View */}
            <div style={{ backgroundColor: '#f1f5f9', padding: '24px 12px', borderRadius: '10px', overflowX: 'auto' }}>
              <QuotationDocument quotation={canonicalQuotation} />
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Actions & Summary Bar */}
      <div
        className="builder-sticky-bottom-bar"
        style={{
          position: 'sticky',
          bottom: 0,
          backgroundColor: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          padding: '1rem 1.5rem',
          boxShadow: '0 -4px 12px rgba(0,0,0,0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
              Live Total Price
            </div>
            <div data-testid="items-total" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0c4e28' }}>
              {formatQuotationCurrency(finalTotal, currency)}
            </div>
          </div>

          <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '1rem', fontSize: '0.8rem', color: '#64748b' }}>
            <span>{hotels.length} Hotel • {transports.length} Transport • {activities.length} Tour</span>
            <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '2px' }}>
              Step {stepIdx + 1} of {BUILDER_STEPS.length}: {BUILDER_STEPS[stepIdx]?.label.replace(/^\d+\.\s*/, '')}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {prevStep && (
            <button
              type="button"
              onClick={() => setActiveStep(prevStep)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 14px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <FiArrowLeft /> Back
            </button>
          )}

          {nextStep && (
            <button
              type="button"
              onClick={() => setActiveStep(nextStep)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 14px',
                borderRadius: '6px',
                border: 'none',
                background: '#0c4e28',
                color: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Next Step <FiArrowRight />
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '6px',
              border: '1px solid #0284c7',
              background: '#f0f9ff',
              color: '#0369a1',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <FiEye /> Document Preview
          </button>

          <button
            type="button"
            onClick={handleDraftSave}
            disabled={isSubmitting}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#0f172a',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            <FiSave /> {submitLabel}
          </button>

          {activeStep === 'preview' && (
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                borderRadius: '6px',
                border: 'none',
                background: 'linear-gradient(135deg, #0c4e28 0%, #15803d 100%)',
                color: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              <FiSend /> Submit Quotation to Traveller
            </button>
          )}
        </div>
      </div>

      {/* Pop-up Live Document Preview Modal */}
      <QuotationPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        formData={canonicalQuotation}
        travelRequest={travelRequest}
        agencyProfile={agencyProfile}
      />
    </div>
  );
}
