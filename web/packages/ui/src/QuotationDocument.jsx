import React from 'react';

/**
 * Format currency using standard international formatters.
 */
export function formatQuotationCurrency(amount, currency = 'USD') {
  const num = Number(amount) || 0;
  try {
    if (currency === 'INR') {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(num);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(num);
  } catch {
    return `${currency} ${num.toLocaleString()}`;
  }
}

/**
 * Helper to format date into "25 Sept 2026" or similar readable format.
 */
export function formatDocDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Get weekday string for a date (e.g. "Friday").
 */
export function getWeekdayName(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}

/**
 * Generate ordinal string for day number (1 -> "1st Day", 2 -> "2nd Day", etc.)
 */
export function formatDayNumber(dayNum) {
  const n = Number(dayNum) || 1;
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]) + ' Day';
}

/**
 * Generate full HTML document string matching the reference `Quotation_QRY-1118_Guest.doc`
 */
export function generateQuotationDocHtml(quotation = {}) {
  const q = quotation || {};
  const items = q.items || [];
  const hotels = items.filter((i) => i.itemType === 'hotel');
  const transports = items.filter((i) => i.itemType === 'vehicle' || i.itemType === 'driver');
  const activities = items.filter((i) => i.itemType === 'guide' || i.itemType === 'service');
  const itineraryDays = Array.isArray(q.itineraryDays) ? q.itineraryDays : [];
  const inclusions = Array.isArray(q.inclusions) ? q.inclusions : [];
  const exclusions = Array.isArray(q.exclusions) ? q.exclusions : [];
  const termsSections = Array.isArray(q.termsSections) ? q.termsSections : [];
  const branding = q.branding || q.agency || {};
  const payment = q.paymentDetails || {};
  const greeting = q.greeting || {};
  const overview = q.packageOverview || {};

  const currency = q.currency || 'USD';
  const formattedTotal = formatQuotationCurrency(q.totalAmount, currency);

  // Agency branding
  const agencyName = branding.agencyName || 'QuoteMeTrip';
  const logoHtml = branding.logoUrl
    ? `<td style="vertical-align: middle; padding-right: 14px; width: 110px; text-align: left;">
        <img src="${branding.logoUrl}" alt="${agencyName}" width="110" height="75" style="width: 110px; height: 75px; max-width: 110px; max-height: 75px; object-fit: contain; display: block; border: 0;" />
       </td>`
    : '';
  const contactParts = [];
  if (branding.phone) contactParts.push(`Phone: ${branding.phone}`);
  if (branding.email) contactParts.push(`Email: ${branding.email}`);
  const contactLine = contactParts.join(' &bull; ');

  // Greeting
  const guestName = greeting.recipient || 'Guest';
  const greetTitle = greeting.title || `Greetings from ${agencyName} !!!`;
  const introMsg = greeting.message || `As per our discussion, following is the ${q.quotationType ? q.quotationType.replace(/_/g, ' ').toUpperCase() : 'Travel Package'} quotation details.`;

  // Package Overview
  const tripRef = overview.tripId || `QRY-${q.travelRequestId || q.id || '101'}`;
  const destination = overview.destination || 'Selected Destination';
  const startDate = overview.startDate ? formatDocDate(overview.startDate) : (q.validUntil ? formatDocDate(q.validUntil) : 'As Agreed');
  const durationText = overview.duration || `${hotels.reduce((s, h) => s + (Number(h.metadata?.nights) || 1), 0)} Nights`;
  const paxText = overview.adults
    ? `${overview.adults} Adults${overview.children ? `, ${overview.children} Children` : ''}${overview.infants ? `, ${overview.infants} Infants` : ''}`
    : 'As Requested';

  // Hotels Table HTML
  let hotelsHtml = '';
  if (hotels.length > 0) {
    const rows = hotels.map((h) => {
      const meta = h.metadata || {};
      const nights = meta.nights || 1;
      const checkIn = meta.checkIn ? formatDocDate(meta.checkIn) : '';
      const checkOut = meta.checkOut ? formatDocDate(meta.checkOut) : '';
      const dateSub = checkIn && checkOut ? `(${checkIn} - ${checkOut})` : '';
      const city = meta.city || destination;
      const hotelTitle = h.title || meta.property || 'Hotel Stay';
      const hotelProperty = meta.property || h.title || '';
      const stars = meta.starCategory || '4 Star';
      const mealPlan = meta.mealPlan || 'CP (Breakfast Included)';
      const roomCat = meta.roomCategory || 'Standard Room';
      const roomType = meta.roomType || 'Double';
      const rooms = meta.rooms || 1;
      const adults = meta.maxAdults || meta.adults || 2;
      const children = meta.maxChildren || meta.children || 0;
      const paxDesc = `${nights}N | ${rooms} Room | ${adults + children} Pax`;
      const amenities = meta.amenities || [roomCat, meta.mealPlan, hotelProperty, 'Wifi', 'Air Conditioning', 'Daily Housekeeping'].filter(Boolean).join(' | ');

      return `
      <tr>
        <td style="padding:10px 12px; border:1px solid #d1d5db; font-size:12px; color:#1e293b;">
          <strong>${nights} ${nights === 1 ? 'Night' : 'Nights'}</strong><br/>
          <span style="font-size:11px; color:#475569; display:inline-block; margin-top:2px;">${dateSub}</span>
        </td>
        <td style="padding:10px 12px; border:1px solid #d1d5db; font-size:12px; color:#1e293b; font-weight:bold;">
          ${city}
        </td>
        <td style="padding:10px 12px; border:1px solid #d1d5db; font-size:12px; color:#1e293b;">
          <strong>${hotelTitle}</strong><br/>
          <div style="font-size:11px; color:#334155; font-weight:600; margin-top:2px;">Hotel: ${hotelProperty}</div>
          <span style="font-size:11px; color:#d97706; font-weight:600; display:inline-block; margin-top:3px;">${stars}</span>
        </td>
        <td style="padding:10px 12px; border:1px solid #d1d5db; font-size:12px; color:#1e293b;">
          <strong>${mealPlan}</strong>
          <div style="font-size:11px; color:#475569; line-height:1.4; margin-top:3px;">
            <div style="margin-top:6px;font-size:11px;line-height:1.6;color:#334155;">
              ${amenities}
            </div>
          </div>
        </td>
        <td style="padding:10px 12px; border:1px solid #d1d5db; font-size:12px; color:#1e293b;">
          <div style="font-weight:600; color:#0f172a;">${paxDesc}</div>
          <div style="font-size:11px; color:#475569; font-weight:500; margin-top:3px;">${roomCat} (${roomType})</div>
        </td>
      </tr>`;
    }).join('');

    hotelsHtml = `
      <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 20px; border: 1px solid #d1d5db;">
        <thead>
          <tr>
            <th colspan="5" style="background-color: #ecfeff; color: #0f766e; padding: 8px 12px; font-size: 13px; font-weight: bold; text-align: center; border: 1px solid #7dd3c7;">
              Hotels
            </th>
          </tr>
          <tr style="background-color: #ffffff; text-align: left;">
            <th style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a; width: 18%; line-height: 1.3;">Service Date /<br/>Check-in - Check-out</th>
            <th style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a; width: 12%;">City</th>
            <th style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a; width: 22%;">Service Name / Hotel Name</th>
            <th style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a; width: 32%;">Meal / Accommodation</th>
            <th style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a; width: 16%;">Pax / Qty</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>`;
  }

  // Transports Table HTML
  let transportsHtml = '';
  if (transports.length > 0) {
    const rows = transports.map((t) => {
      const meta = t.metadata || {};
      const serviceDate = meta.serviceDate ? formatDocDate(meta.serviceDate) : (overview.startDate ? formatDocDate(overview.startDate) : 'On Service');
      const serviceTitle = t.title || 'Transport Service';
      const city = meta.city || destination;
      const vehicle = meta.vehicleType || 'AC Sedan';
      const serviceType = meta.serviceType || meta.usageType || 'Transfer';
      const details = meta.description || t.description || `${vehicle} | Driver Included`;
      const capacity = meta.passengerCapacity || '4 Pax';
      const paxDesc = `${serviceType} | ${capacity} | ${vehicle}`;

      return `
      <tr>
        <td style="padding:10px 12px; border:1px solid #d1d5db; font-size:12px; color:#1e293b;">
          <strong>${serviceDate}</strong>
        </td>
        <td style="padding:10px 12px; border:1px solid #d1d5db; font-size:12px; color:#1e293b;">
          <strong style="color: #0f172a; font-size: 13px;">${serviceTitle}</strong>
          <div style="font-size:11px; color:#64748b; font-weight:500; margin-top:2px;">📍 ${city}</div>
        </td>
        <td style="padding:10px 12px; border:1px solid #d1d5db; font-size:12px; color:#1e293b;">
          <div style="font-size:11px; line-height:1.6; color:#334155;">
            ${details}
          </div>
          <div style="margin-top:6px;">
            <span style="background-color:#f0fdf4; border:1px solid #bbf7d0; color:#15803d; font-weight:600; padding:2px 6px; border-radius:4px; font-size:11px; display:inline-block; margin-right:4px;">🚗 ${vehicle}</span>
            <span style="background-color:#f1f5f9; border:1px solid #cbd5e1; color:#475569; font-weight:500; padding:2px 6px; border-radius:4px; font-size:11px; display:inline-block;">✈️ ${serviceType}</span>
          </div>
        </td>
        <td style="padding:10px 12px; border:1px solid #d1d5db; font-size:12px; color:#1e293b;">
          <strong>${paxDesc}</strong>
        </td>
      </tr>`;
    }).join('');

    transportsHtml = `
      <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 20px; border: 1px solid #d1d5db;">
        <thead>
          <tr>
            <th colspan="4" style="background-color: #ecfeff; color: #0f766e; padding: 8px 12px; font-size: 13px; font-weight: bold; text-align: center; border: 1px solid #7dd3c7;">
              Transfers & Transport
            </th>
          </tr>
          <tr style="background-color: #ffffff; text-align: left;">
            <th style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a; width: 18%;">Service Date</th>
            <th style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a; width: 34%;">Service / Route</th>
            <th style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a; width: 34%;">Transport Details</th>
            <th style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a; width: 14%;">Pax / Qty</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>`;
  }

  // Activities Table HTML
  let activitiesHtml = '';
  if (activities.length > 0) {
    const rows = activities.map((a) => {
      const meta = a.metadata || {};
      const tourDate = meta.tourDate ? formatDocDate(meta.tourDate) : (overview.startDate ? formatDocDate(overview.startDate) : 'On Service');
      const actTitle = a.title || 'Sightseeing Excursion';
      const city = meta.city || destination;
      const tourType = meta.tourType || meta.category || 'Sightseeing Tour';
      const duration = meta.duration || 'Half Day (4 Hours)';
      const slot = meta.slotTime || meta.slot || 'Flexible';
      const operatingDays = meta.operatingDays || 'Daily';
      const desc = a.description || meta.inclusions || `${actTitle} | Guided Activity`;
      const paxCount = meta.paxCount || `${Number(a.quantity) || 1} Pax`;

      return `
      <tr>
        <td style="padding:10px 12px; border:1px solid #d1d5db; font-size:12px; color:#1e293b;">
          <strong>${tourDate}</strong>
        </td>
        <td style="padding:10px 12px; border:1px solid #d1d5db; font-size:12px; color:#1e293b;">
          <strong style="color: #0f172a; font-size: 13px;">${actTitle}</strong>
          <div style="font-size:11px; color:#64748b; font-weight:500; margin-top:2px;">📍 ${city}</div>
          <div style="font-size:11px; color:#2563eb; font-weight:600; margin-top:2px;">Tour Type: ${tourType}</div>
        </td>
        <td style="padding:10px 12px; border:1px solid #d1d5db; font-size:12px; color:#1e293b;">
          <div style="font-size:11px; line-height:1.6; color:#334155;">
            ${desc}
          </div>
          <div style="margin-top:6px;">
            <span style="background-color: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; font-weight: 600; padding: 2px 6px; border-radius: 4px; font-size: 11px; display: inline-block; margin-right: 4px;">👥 ${tourType}</span>
            <span style="background-color: #fef3c7; border: 1px solid #fde68a; color: #b45309; font-weight: 600; padding: 2px 6px; border-radius: 4px; font-size: 11px; display: inline-block; margin-right: 4px;">⏰ Slot: ${slot}</span>
            <span style="background-color: #f3e8ff; border: 1px solid #e9d5ff; color: #6b21a8; font-weight: 600; padding: 2px 6px; border-radius: 4px; font-size: 11px; display: inline-block; margin-right: 4px;">⏳ Duration: ${duration}</span>
            <span style="background-color: #f1f5f9; border: 1px solid #cbd5e1; color: #475569; font-weight: 500; padding: 2px 6px; border-radius: 4px; font-size: 11px; display: inline-block;">📅 ${operatingDays}</span>
          </div>
        </td>
        <td style="padding:10px 12px; border:1px solid #d1d5db; font-size:12px; color:#1e293b;">
          <strong style="color: #0f172a; font-size: 13px;">${paxCount}</strong>
        </td>
      </tr>`;
    }).join('');

    activitiesHtml = `
      <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 20px; border: 1px solid #d1d5db;">
        <thead>
          <tr>
            <th colspan="4" style="background-color: #ecfeff; color: #0f766e; padding: 8px 12px; font-size: 13px; font-weight: bold; text-align: center; border: 1px solid #7dd3c7;">
              Activities & Sightseeing
            </th>
          </tr>
          <tr style="background-color: #ffffff; text-align: left;">
            <th style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a; width: 18%;">Service Date</th>
            <th style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a; width: 34%;">Activity / Tour Name</th>
            <th style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a; width: 34%;">Inclusions & Description</th>
            <th style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a; width: 14%;">Pax / Qty</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>`;
  }

  // Day Wise Itinerary HTML
  let itineraryHtml = '';
  if (itineraryDays.length > 0) {
    const rows = itineraryDays.map((d, idx) => {
      const dayNum = d.dayNumber || idx + 1;
      const dayLabel = formatDayNumber(dayNum);
      const weekday = d.weekday || (d.date ? getWeekdayName(d.date) : '');
      const dateStr = d.date ? formatDocDate(d.date) : '';
      const title = d.title || `Day ${dayNum} Program`;
      const desc = d.description || '';
      const bgColor = idx % 2 === 1 ? '#f8fafc' : '#ffffff';

      return `
      <tr style="background-color: ${bgColor};">
        <td width="24%" style="padding: 10px 12px; border: 1px solid #d1d5db; font-size: 12px; line-height: 1.4; vertical-align: top;">
          <div style="color: #0284c7; font-weight: bold; font-size: 12px; margin-bottom: 2px;">${dayLabel}</div>
          ${weekday ? `<div style="color: #64748b; font-size: 11px;">${weekday}</div>` : ''}
          ${dateStr ? `<strong style="color: #0f172a; font-size: 12px;">${dateStr}</strong>` : ''}
        </td>
        <td width="76%" style="padding: 10px 12px; border: 1px solid #d1d5db; font-size: 12px; color: #1e293b; vertical-align: top; line-height: 1.5;">
          <strong style="color: #0f172a; font-size: 13px; text-decoration: underline;">${title}</strong>
          ${desc ? `<p style="margin: 6px 0 0 0; color: #334155; font-size: 12px;">${desc}</p>` : ''}
        </td>
      </tr>`;
    }).join('');

    itineraryHtml = `
      <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 20px; border: 1px solid #d1d5db;">
        <thead>
          <tr>
            <th colspan="2" style="background-color: #ecfeff; color: #0f766e; padding: 8px 12px; font-size: 13px; font-weight: bold; text-align: center; border: 1px solid #7dd3c7;">
              Day Wise Schedule
            </th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>`;
  }

  // Tax statement
  const taxStatement = q.taxLabel || (q.taxRate > 0 ? `(including ${q.taxRate}% Tax)` : '(Tax inclusive)');

  // Bank details HTML
  let bankHtml = '';
  if (payment && payment.includePaymentDetails && payment.bankName) {
    bankHtml = `
      <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 20px; border: 1px solid #d1d5db;">
        <thead>
          <tr>
            <th colspan="2" style="background-color: #ecfeff; color: #0f766e; padding: 8px 12px; font-size: 13px; font-weight: bold; text-align: center; border: 1px solid #7dd3c7;">
              Bank Account Details for Payment
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td width="35%" style="padding: 7px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: 500; color: #475569;">Bank Name</td>
            <td width="65%" style="padding: 7px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a;">${payment.bankName}</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td width="35%" style="padding: 7px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: 500; color: #475569;">A/c Holder Name</td>
            <td width="65%" style="padding: 7px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a;">${payment.accountHolder || agencyName}</td>
          </tr>
          <tr>
            <td width="35%" style="padding: 7px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: 500; color: #475569;">A/c No.</td>
            <td width="65%" style="padding: 7px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a;">${payment.accountNumber || '—'}</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td width="35%" style="padding: 7px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: 500; color: #475569;">IFSC / SWIFT</td>
            <td width="65%" style="padding: 7px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a;">${payment.ifsc || '—'}</td>
          </tr>
          ${payment.branch ? `
          <tr>
            <td width="35%" style="padding: 7px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: 500; color: #475569;">Branch</td>
            <td width="65%" style="padding: 7px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a;">${payment.branch}</td>
          </tr>` : ''}
        </tbody>
      </table>`;
  }

  // Inclusions & Exclusions HTML
  let incExcHtml = '';
  if (inclusions.length > 0 || exclusions.length > 0) {
    const incList = inclusions.map((i) => `<li style="margin-bottom:6px; list-style-type:none;"><span style="color:#059669; font-weight:bold; margin-right:6px;">✓</span>${i}</li>`).join('');
    const excList = exclusions.map((e) => `<li style="margin-bottom:6px; list-style-type:none;"><span style="color:#dc2626; font-weight:bold; margin-right:6px;">✗</span>${e}</li>`).join('');

    incExcHtml = `
      <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 20px; border: 1px solid #d1d5db;">
        <thead>
          <tr>
            <th width="50%" style="background-color: #ecfeff; color: #047857; padding: 8px 12px; font-size: 13px; font-weight: bold; text-align: center; border: 1px solid #7dd3c7;">
              Inclusions
            </th>
            <th width="50%" style="background-color: #ecfeff; color: #b91c1c; padding: 8px 12px; font-size: 13px; font-weight: bold; text-align: center; border: 1px solid #7dd3c7;">
              Exclusions
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td valign="top" style="padding: 12px 16px; border: 1px solid #d1d5db; font-size: 12px; color: #1e293b;">
              <ul style="margin: 0; padding-left: 0; line-height: 1.6;">
                ${incList || '<li style="color:#94a3b8; font-style:italic;">As specified in package services</li>'}
              </ul>
            </td>
            <td valign="top" style="padding: 12px 16px; border: 1px solid #d1d5db; font-size: 12px; color: #1e293b;">
              <ul style="margin: 0; padding-left: 0; line-height: 1.6;">
                ${excList || '<li style="color:#94a3b8; font-style:italic;">Personal expenses not mentioned</li>'}
              </ul>
              <p style="margin: 12px 0 0 0; font-weight: bold; color: #0f766e; font-size: 11px;">
                NOTE: Anything not mentioned in the inclusions is excluded.
              </p>
            </td>
          </tr>
        </tbody>
      </table>`;
  }

  // Terms and Conditions HTML
  let termsHtml = '';
  if (termsSections.length > 0) {
    const termsBody = termsSections
      .filter((s) => s.enabled !== false)
      .map((s) => {
        let pointsHtml = '';
        if (Array.isArray(s.points) && s.points.length > 0) {
          pointsHtml = `<ul style="margin: 4px 0 0 0; padding-left: 18px; list-style-type: disc;">
            ${s.points.map((p) => `<li style="margin-bottom: 4px;">${p}</li>`).join('')}
          </ul>`;
        }
        return `
        <li style="margin-bottom: 10px;">
          <strong style="color: #0f172a;">${s.title}:</strong>
          ${s.content ? `<p style="margin: 3px 0 4px 0;">${s.content}</p>` : ''}
          ${pointsHtml}
        </li>`;
      }).join('');

    termsHtml = `
      <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 20px; border: 1px solid #d1d5db;">
        <thead>
          <tr>
            <th style="background-color: #ecfeff; color: #0f766e; padding: 8px 12px; font-size: 13px; font-weight: bold; text-align: center; border: 1px solid #7dd3c7;">
              Terms and Conditions
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 14px 16px; font-size: 12px; color: #1e293b; line-height: 1.6;">
              <p style="font-weight: bold; font-size: 13px; margin: 0 0 10px 0; color: #0f172a; border-bottom: 1px dashed #cbd5e1; padding-bottom: 6px;">
                ${agencyName} Official Quotation Terms &amp; Conditions
              </p>
              <ol style="margin: 0; padding-left: 18px; color: #334155; font-size: 11.5px; line-height: 1.65;">
                ${termsBody}
              </ol>
            </td>
          </tr>
        </tbody>
      </table>`;
  }

  // Footer banner
  const footerBannerHtml = branding.footerBannerUrl
    ? `<div style="width: 100%; margin-top: 24px; text-align: center;">
         <img src="${branding.footerBannerUrl}" alt="Footer Banner" width="600" style="width: 600px; max-width: 100%; height: auto; display: block; margin: 0 auto; border: 0;" />
       </div>`
    : `<div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #64748b;">
         ${agencyName} &bull; Official Travel Proposal &bull; Valid Until: ${q.validUntil ? formatDocDate(q.validUntil) : 'As Agreed'}
       </div>`;

  return `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Quotation - ${tripRef}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page {
            size: A4;
            margin: 1.2cm 1.2cm 1.2cm 1.2cm;
            mso-page-orientation: portrait;
          }
          body {
            font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;
            font-size: 11pt;
            color: #1e293b;
            margin: 0;
            padding: 0;
            background-color: #ffffff;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
            margin-bottom: 14px;
          }
          th, td {
            font-family: Arial, sans-serif;
            vertical-align: top;
            padding: 6px 10px;
          }
          img {
            max-width: 110px;
            max-height: 75px;
          }
          p {
            margin: 0 0 6pt 0;
            line-height: 1.4;
          }
          ol, ul {
            margin-top: 4pt;
            margin-bottom: 6pt;
          }
          li {
            margin-bottom: 3pt;
            line-height: 1.4;
          }
        </style>
      </head>
      <body>
        <div style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.5; max-width: 100%; margin: 0 auto; background: #ffffff; padding: 16px;">
          <!-- AGENT BRAND HEADER BANNER -->
          <div style="background-color: #ffffff; border-bottom: 2px solid #e2e8f0; padding: 14px 20px; margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse; margin: 0; padding: 0;">
              <tr>
                ${logoHtml}
                <td style="vertical-align: middle; text-align: left; font-family: -apple-system, BlinkMacSystemFont, Arial, sans-serif; padding: 0;">
                  <h2 style="margin: 0 0 3px 0; font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.3px; line-height: 1.2;">
                    ${agencyName}
                  </h2>
                  <p style="margin: 0 0 4px 0; font-size: 12px; color: #475569; line-height: 1.4;">
                    ${branding.address || ''}
                  </p>
                  <p style="margin: 0; font-size: 12px; font-weight: 600; color: #3252C3; line-height: 1.4;">
                    ${contactLine}
                  </p>
                </td>
              </tr>
            </table>
          </div>

          <!-- Greeting Header -->
          <div style="margin-bottom: 20px; font-size: 13px; color: #1e293b;">
            <p style="margin: 0 0 8px 0;">Dear <strong>${guestName}</strong>,</p>
            <p style="margin: 0 0 8px 0;"><strong>${greetTitle}</strong></p>
            <p style="margin: 0;">${introMsg}</p>
          </div>

          <!-- 1. PACKAGE OVERVIEW -->
          <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 20px; border: 1px solid #d1d5db;">
            <thead>
              <tr>
                <th colspan="2" style="background-color: #ecfeff; color: #0f766e; padding: 8px 12px; font-size: 13px; font-weight: bold; text-align: center; border: 1px solid #7dd3c7;">
                  Package Overview
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td width="25%" style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: normal; color: #334155;">Trip ID</td>
                <td width="75%" style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a;">${tripRef}</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: normal; color: #334155;">Destination</td>
                <td style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; color: #0f172a;">
                  <strong>${destination}</strong><br/>
                  <span style="background-color: #fef08a; border: 1px solid #fde047; color: #854d0e; font-weight: bold; padding: 2px 6px; font-size: 11px; display: inline-block; margin-top: 4px; border-radius: 2px;">
                    ${destination} (${durationText})
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: normal; color: #334155;">Start Date</td>
                <td style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a;">${startDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: normal; color: #334155;">Trip Duration</td>
                <td style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a;">${durationText}</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: normal; color: #334155;">Pax</td>
                <td style="padding: 8px 12px; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; color: #0f172a;">${paxText}</td>
              </tr>
            </tbody>
          </table>

          <!-- 2. HOTELS -->
          ${hotelsHtml}

          <!-- 2.1 TRANSFERS & TRANSPORT -->
          ${transportsHtml}

          <!-- 2.2 ACTIVITIES & SIGHTSEEING -->
          ${activitiesHtml}

          <!-- DAY WISE SCHEDULE -->
          ${itineraryHtml}

          <!-- 3. TOTAL PRICE -->
          <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 20px; border: 1px solid #d1d5db;">
            <thead>
              <tr>
                <th style="background-color: #ecfeff; color: #0f766e; padding: 8px 12px; font-size: 13px; font-weight: bold; text-align: center; border: 1px solid #7dd3c7;">
                  Total Price
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 12px; font-size: 13px;">
                  <div style="display: inline-block; background-color: #fef08a; border: 1px solid #fde047; color: #854d0e; font-weight: bold; padding: 3px 8px; font-size: 12px; margin-bottom: 8px; border-radius: 2px;">
                    Prices (${currency})
                  </div>
                  <div style="font-size: 15px; font-weight: bold; color: #0f172a;">
                    Total: ${formattedTotal} /- <span style="font-weight: 600; font-style: italic; color: #2563eb; font-size: 12px;">${taxStatement}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- 3.1 BANK DETAILS FOR PAYMENT -->
          ${bankHtml}

          <!-- 4. INCLUSIONS & EXCLUSIONS -->
          ${incExcHtml}

          <!-- 5. TERMS AND CONDITIONS -->
          ${termsHtml}

          <!-- 6. AGENT BRAND FOOTER BANNER -->
          ${footerBannerHtml}
        </div>
      </body>
      </html>
  `;
}

/**
 * Trigger browser download of `.doc` matching reference format.
 */
export function downloadQuotationDoc(quotation, filename = null) {
  const htmlContent = generateQuotationDocHtml(quotation);
  const blob = new Blob([htmlContent], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const tripRef = quotation?.packageOverview?.tripId || `QRY-${quotation?.travelRequestId || quotation?.id || '101'}`;
  a.download = filename || `Quotation_${tripRef}_Guest.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Trigger print dialog with clean document styles.
 */
export function printQuotationDocument() {
  window.print();
}

/**
 * React Component: In-Browser Live A4 Quotation Document Renderer
 *
 * Provides pixel-perfect visual fidelity to `Quotation_QRY-1118_Guest.doc`
 * with print-safe margins, clean borders, professional typography, and responsive zoom.
 */
export function QuotationDocument({
  quotation = {},
  onPrint = null,
  onDownloadDoc = null,
  showControls = false,
  hideContactInfo = false,
}) {
  const q = quotation || {};
  const items = q.items || [];
  const hotels = items.filter((i) => i.itemType === 'hotel');
  const transports = items.filter((i) => i.itemType === 'vehicle' || i.itemType === 'driver');
  const activities = items.filter((i) => i.itemType === 'guide' || i.itemType === 'service');
  const itineraryDays = Array.isArray(q.itineraryDays) ? q.itineraryDays : [];
  const inclusions = Array.isArray(q.inclusions) ? q.inclusions : [];
  const exclusions = Array.isArray(q.exclusions) ? q.exclusions : [];
  const termsSections = Array.isArray(q.termsSections) ? q.termsSections : [];
  const branding = q.branding || q.agency || {};
  const payment = q.paymentDetails || {};
  const greeting = q.greeting || {};
  const overview = q.packageOverview || {};

  const currency = q.currency || 'USD';
  const formattedTotal = formatQuotationCurrency(q.totalAmount, currency);

  const agencyName = branding.agencyName || 'QuoteMeTrip';
  const tripRef = overview.tripId || `QRY-${q.travelRequestId || q.id || '101'}`;
  const destination = overview.destination || 'Selected Destination';
  const startDate = overview.startDate ? formatDocDate(overview.startDate) : (q.validUntil ? formatDocDate(q.validUntil) : 'As Agreed');
  const durationText = overview.duration || `${hotels.reduce((s, h) => s + (Number(h.metadata?.nights) || 1), 0)} Nights`;
  const paxText = overview.adults
    ? `${overview.adults} Adults${overview.children ? `, ${overview.children} Children` : ''}${overview.infants ? `, ${overview.infants} Infants` : ''}`
    : 'As Requested';

  const guestName = greeting.recipient || 'Guest';
  const greetTitle = greeting.title || `Greetings from ${agencyName} !!!`;
  const introMsg = greeting.message || `As per our discussion, following is the ${q.quotationType ? q.quotationType.replace(/_/g, ' ').toUpperCase() : 'Travel Package'} quotation details.`;
  const taxStatement = q.taxLabel || (q.taxRate > 0 ? `(including ${q.taxRate}% Tax)` : '(Tax inclusive)');

  return (
    <div className="quotation-document-wrapper" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {showControls && (
        <div
          className="no-print"
          style={{
            width: '100%',
            maxWidth: '210mm',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            padding: '0.75rem 1rem',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
          }}
        >
          <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>
            Official Guest Quotation Document (A4 Portrait Layout)
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={onPrint || printQuotationDocument}
              style={{
                background: '#0c4e28',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Print / Save PDF
            </button>
            <button
              type="button"
              onClick={() => (onDownloadDoc ? onDownloadDoc() : downloadQuotationDoc(q))}
              style={{
                background: '#ffffff',
                color: '#0c4e28',
                border: '1px solid #0c4e28',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Download Word DOC
            </button>
          </div>
        </div>
      )}

      {/* A4 Sheet Container */}
      <div
        className="quotation-a4-sheet"
        style={{
          width: '100%',
          maxWidth: '210mm',
          minHeight: '297mm',
          background: '#ffffff',
          color: '#1e293b',
          fontFamily: "Arial, 'Helvetica Neue', Helvetica, sans-serif",
          fontSize: '11pt',
          lineHeight: 1.5,
          padding: '1.2cm',
          boxSizing: 'border-box',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          borderRadius: '4px',
          margin: '0 auto',
        }}
      >
        {/* AGENT BRAND HEADER BANNER */}
        <div style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '14px', marginBottom: '20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', margin: 0 }}>
            <tbody>
              <tr>
                {branding.logoUrl && (
                  <td style={{ verticalAlign: 'middle', paddingRight: '14px', width: '110px', textAlign: 'left' }}>
                    <img
                      src={branding.logoUrl}
                      alt={agencyName}
                      style={{ width: '110px', height: '75px', maxWidth: '110px', maxHeight: '75px', objectFit: 'contain', display: 'block' }}
                    />
                  </td>
                )}
                <td style={{ verticalAlign: 'middle', textAlign: 'left' }}>
                  <h2 style={{ margin: '0 0 3px 0', fontSize: '20px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                    {agencyName}
                  </h2>
                  {branding.address && (
                    <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#475569', lineHeight: 1.4 }}>
                      {branding.address}
                    </p>
                  )}
                  {!hideContactInfo && (branding.phone || branding.email) && (
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: '#3252C3', lineHeight: 1.4 }}>
                      {[branding.phone && `Phone: ${branding.phone}`, branding.email && `Email: ${branding.email}`].filter(Boolean).join(' • ')}
                    </p>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Greeting Header */}
        <div style={{ marginBottom: '20px', fontSize: '13px', color: '#1e293b' }}>
          <p style={{ margin: '0 0 8px 0' }}>Dear <strong>{guestName}</strong>,</p>
          <p style={{ margin: '0 0 8px 0' }}><strong>{greetTitle}</strong></p>
          <p style={{ margin: 0 }}>{introMsg}</p>
        </div>

        {/* 1. PACKAGE OVERVIEW */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', border: '1px solid #d1d5db' }}>
          <thead>
            <tr>
              <th colSpan={2} style={{ backgroundColor: '#ecfeff', color: '#0f766e', padding: '8px 12px', fontSize: '13px', fontWeight: 'bold', textAlign: 'center', border: '1px solid #7dd3c7' }}>
                Package Overview
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ width: '25%', padding: '8px 12px', border: '1px solid #d1d5db', fontSize: '12px', color: '#334155' }}>Trip ID</td>
              <td style={{ width: '75%', padding: '8px 12px', border: '1px solid #d1d5db', fontSize: '12px', fontWeight: 'bold', color: '#0f172a' }}>{tripRef}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 12px', border: '1px solid #d1d5db', fontSize: '12px', color: '#334155' }}>Destination</td>
              <td style={{ padding: '8px 12px', border: '1px solid #d1d5db', fontSize: '12px', color: '#0f172a' }}>
                <strong>{destination}</strong><br />
                <span style={{ backgroundColor: '#fef08a', border: '1px solid #fde047', color: '#854d0e', fontWeight: 'bold', padding: '2px 6px', fontSize: '11px', display: 'inline-block', marginTop: '4px', borderRadius: '2px' }}>
                  {destination} ({durationText})
                </span>
              </td>
            </tr>
            <tr>
              <td style={{ padding: '8px 12px', border: '1px solid #d1d5db', fontSize: '12px', color: '#334155' }}>Start Date</td>
              <td style={{ padding: '8px 12px', border: '1px solid #d1d5db', fontSize: '12px', fontWeight: 'bold', color: '#0f172a' }}>{startDate}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 12px', border: '1px solid #d1d5db', fontSize: '12px', color: '#334155' }}>Trip Duration</td>
              <td style={{ padding: '8px 12px', border: '1px solid #d1d5db', fontSize: '12px', fontWeight: 'bold', color: '#0f172a' }}>{durationText}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 12px', border: '1px solid #d1d5db', fontSize: '12px', color: '#334155' }}>Pax</td>
              <td style={{ padding: '8px 12px', border: '1px solid #d1d5db', fontSize: '12px', fontWeight: 'bold', color: '#0f172a' }}>{paxText}</td>
            </tr>
          </tbody>
        </table>

        {/* 2. HOTELS (IF ANY) */}
        {hotels.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', border: '1px solid #d1d5db' }}>
            <thead>
              <tr>
                <th colSpan={5} style={{ backgroundColor: '#ecfeff', color: '#0f766e', padding: '8px 12px', fontSize: '13px', fontWeight: 'bold', textAlign: 'center', border: '1px solid #7dd3c7' }}>
                  Hotels
                </th>
              </tr>
              <tr style={{ backgroundColor: '#ffffff', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px', border: '1px solid #d1d5db', fontSize: '12px', fontWeight: 'bold', color: '#0f172a', width: '18%', lineHeight: 1.3 }}>Service Date /<br />Check-in - Check-out</th>
                <th style={{ padding: '8px 12px', border: '1px solid #d1d5db', fontSize: '12px', fontWeight: 'bold', color: '#0f172a', width: '12%' }}>City</th>
                <th style={{ padding: '8px 12px', border: '1px solid #d1d5db', fontSize: '12px', fontWeight: 'bold', color: '#0f172a', width: '22%' }}>Service Name / Hotel Name</th>
                <th style={{ padding: '8px 12px', border: '1px solid #d1d5db', fontSize: '12px', fontWeight: 'bold', color: '#0f172a', width: '32%' }}>Meal / Accommodation</th>
                <th style={{ padding: '8px 12px', border: '1px solid #d1d5db', fontSize: '12px', fontWeight: 'bold', color: '#0f172a', width: '16%' }}>Pax / Qty</th>
              </tr>
            </thead>
            <tbody>
              {hotels.map((h, idx) => {
                const meta = h.metadata || {};
                const nights = meta.nights || 1;
                const checkIn = meta.checkIn ? formatDocDate(meta.checkIn) : '';
                const checkOut = meta.checkOut ? formatDocDate(meta.checkOut) : '';
                const dateSub = checkIn && checkOut ? `(${checkIn} - ${checkOut})` : '';
                const city = meta.city || destination;
                const hotelTitle = h.title || meta.property || 'Hotel Stay';
                const hotelProperty = meta.property || h.title || '';
                const stars = meta.starCategory || '4 Star';
                const mealPlan = meta.mealPlan || 'CP (Breakfast Included)';
                const roomCat = meta.roomCategory || 'Standard Room';
                const roomType = meta.roomType || 'Double';
                const rooms = meta.rooms || 1;
                const adults = meta.maxAdults || meta.adults || 2;
                const children = meta.maxChildren || meta.children || 0;
                const paxDesc = `${nights}N | ${rooms} Room | ${adults + children} Pax`;
                const amenities = meta.amenities || [roomCat, meta.mealPlan, hotelProperty, 'Wifi', 'Air Conditioning', 'Daily Housekeeping'].filter(Boolean).join(' | ');

                return (
                  <tr key={h.id || idx}>
                    <td style={{ padding: '10px 12px', border: '1px solid #d1d5db', fontSize: '12px', color: '#1e293b' }}>
                      <strong>{nights} {nights === 1 ? 'Night' : 'Nights'}</strong><br />
                      <span style={{ fontSize: '11px', color: '#475569', display: 'inline-block', marginTop: '2px' }}>{dateSub}</span>
                    </td>
                    <td style={{ padding: '10px 12px', border: '1px solid #d1d5db', fontSize: '12px', color: '#1e293b', fontWeight: 'bold' }}>
                      {city}
                    </td>
                    <td style={{ padding: '10px 12px', border: '1px solid #d1d5db', fontSize: '12px', color: '#1e293b' }}>
                      <strong>{hotelTitle}</strong><br />
                      <div style={{ fontSize: '11px', color: '#334155', fontWeight: 600, marginTop: '2px' }}>Hotel: {hotelProperty}</div>
                      <span style={{ fontSize: '11px', color: '#d97706', fontWeight: 600, display: 'inline-block', marginTop: '3px' }}>{stars}</span>
                    </td>
                    <td style={{ padding: '10px 12px', border: '1px solid #d1d5db', fontSize: '12px', color: '#1e293b' }}>
                      <strong>{mealPlan}</strong>
                      <div style={{ fontSize: '11px', color: '#475569', lineHeight: 1.4, marginTop: '3px' }}>
                        <div style={{ marginTop: '6px', fontSize: '11px', lineHeight: 1.6, color: '#334155' }}>
                          {amenities}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', border: '1px solid #d1d5db', fontSize: '12px', color: '#1e293b' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{paxDesc}</div>
                      <div style={{ fontSize: '11px', color: '#475569', fontWeight: 500, marginTop: '3px' }}>{roomCat} ({roomType})</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* 2.1 TRANSFERS & TRANSPORT (IF ANY) */}
        {transports.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', border: '1px solid #d1d5db' }}>
            <thead>
              <tr>
                <th colSpan={4} style={{ backgroundColor: '#ecfeff', color: '#0f766e', padding: '8px 12px', fontSize: '13px', fontWeight: 'bold', textAlign: 'center', border: '1px solid #7dd3c7' }}>
                  Transfers & Transport
                </th>
              </tr>
              <tr style={{ backgroundColor: '#ffffff', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px', border: '1px solid #d1d5db', fontSize: '12px', fontWeight: 'bold', color: '#0f172a', width: '18%' }}>Service Date</th>
                <th style={{ padding: '8px 12px', border: '1px solid #d1d5db', fontSize: '12px', fontWeight: 'bold', color: '#0f172a', width: '34%' }}>Service / Route</th>
                <th style={{ padding: '8px 12px', border: '1px solid #d1d5db', fontSize: '12px', fontWeight: 'bold', color: '#0f172a', width: '34%' }}>Transport Details</th>
                <th style={{ padding: '8px 12px', border: '1px solid #d1d5db', fontSize: '12px', fontWeight: 'bold', color: '#0f172a', width: '14%' }}>Pax / Qty</th>
              </tr>
            </thead>
            <tbody>
              {transports.map((t, idx) => {
                const meta = t.metadata || {};
                const serviceDate = meta.serviceDate ? formatDocDate(meta.serviceDate) : (overview.startDate ? formatDocDate(overview.startDate) : 'On Service');
                const serviceTitle = t.title || 'Transport Service';
                const city = meta.city || destination;
                const vehicle = meta.vehicleType || 'AC Sedan';
                const serviceType = meta.serviceType || meta.usageType || 'Transfer';
                const details = meta.description || t.description || `${vehicle} | Driver Included`;
                const capacity = meta.passengerCapacity || '4 Pax';
                const paxDesc = `${serviceType} | ${capacity} | ${vehicle}`;

                return (
                  <tr key={t.id || idx}>
                    <td style={{ padding: '10px 12px', border: '1px solid #d1d5db', fontSize: '12px', color: '#1e293b' }}>
                      <strong>{serviceDate}</strong>
                    </td>
                    <td style={{ padding: '10px 12px', border: '1px solid #d1d5db', fontSize: '12px', color: '#1e293b' }}>
                      <strong style={{ color: '#0f172a', fontSize: '13px' }}>{serviceTitle}</strong>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500, marginTop: '2px' }}>📍 {city}</div>
                    </td>
                    <td style={{ padding: '10px 12px', border: '1px solid #d1d5db', fontSize: '12px', color: '#1e293b' }}>
                      <div style={{ fontSize: '11px', lineHeight: 1.6, color: '#334155' }}>
                        {details}
                      </div>
                      <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        <span style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', fontSize: '11px', display: 'inline-block' }}>🚗 {vehicle}</span>
                        <span style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', fontWeight: 500, padding: '2px 6px', borderRadius: '4px', fontSize: '11px', display: 'inline-block' }}>✈️ {serviceType}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', border: '1px solid #d1d5db', fontSize: '12px', color: '#1e293b' }}>
                      <strong>{paxDesc}</strong>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* 2.2 ACTIVITIES & SIGHTSEEING (IF ANY) */}
        {activities.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', border: '1px solid #d1d5db' }}>
            <thead>
              <tr>
                <th colSpan={4} style={{ backgroundColor: '#ecfeff', color: '#0f766e', padding: '8px 12px', fontSize: '13px', fontWeight: 'bold', textAlign: 'center', border: '1px solid #7dd3c7' }}>
                  Activities & Sightseeing
                </th>
              </tr>
              <tr style={{ backgroundColor: '#ffffff', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px', border: '1px solid #d1d5db', fontSize: '12px', fontWeight: 'bold', color: '#0f172a', width: '18%' }}>Service Date</th>
                <th style={{ padding: '8px 12px', border: '1px solid #d1d5db', fontSize: '12px', fontWeight: 'bold', color: '#0f172a', width: '34%' }}>Activity / Tour Name</th>
                <th style={{ padding: '8px 12px', border: '1px solid #d1d5db', fontSize: '12px', fontWeight: 'bold', color: '#0f172a', width: '34%' }}>Inclusions & Description</th>
                <th style={{ padding: '8px 12px', border: '1px solid #d1d5db', fontSize: '12px', fontWeight: 'bold', color: '#0f172a', width: '14%' }}>Pax / Qty</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((a, idx) => {
                const meta = a.metadata || {};
                const tourDate = meta.tourDate ? formatDocDate(meta.tourDate) : (overview.startDate ? formatDocDate(overview.startDate) : 'On Service');
                const actTitle = a.title || 'Sightseeing Excursion';
                const city = meta.city || destination;
                const tourType = meta.tourType || meta.category || 'Sightseeing Tour';
                const duration = meta.duration || 'Half Day (4 Hours)';
                const slot = meta.slotTime || meta.slot || 'Flexible';
                const operatingDays = meta.operatingDays || 'Daily';
                const desc = a.description || meta.inclusions || `${actTitle} | Guided Activity`;
                const paxCount = meta.paxCount || `${Number(a.quantity) || 1} Pax`;

                return (
                  <tr key={a.id || idx}>
                    <td style={{ padding: '10px 12px', border: '1px solid #d1d5db', fontSize: '12px', color: '#1e293b' }}>
                      <strong>{tourDate}</strong>
                    </td>
                    <td style={{ padding: '10px 12px', border: '1px solid #d1d5db', fontSize: '12px', color: '#1e293b' }}>
                      <strong style={{ color: '#0f172a', fontSize: '13px' }}>{actTitle}</strong>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500, marginTop: '2px' }}>📍 {city}</div>
                      <div style={{ fontSize: '11px', color: '#2563eb', fontWeight: 600, marginTop: '2px' }}>Tour Type: {tourType}</div>
                    </td>
                    <td style={{ padding: '10px 12px', border: '1px solid #d1d5db', fontSize: '12px', color: '#1e293b' }}>
                      <div style={{ fontSize: '11px', lineHeight: 1.6, color: '#334155' }}>
                        {desc}
                      </div>
                      <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        <span style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', fontSize: '11px', display: 'inline-block' }}>👥 {tourType}</span>
                        <span style={{ backgroundColor: '#fef3c7', border: '1px solid #fde68a', color: '#b45309', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', fontSize: '11px', display: 'inline-block' }}>⏰ Slot: {slot}</span>
                        <span style={{ backgroundColor: '#f3e8ff', border: '1px solid #e9d5ff', color: '#6b21a8', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', fontSize: '11px', display: 'inline-block' }}>⏳ Duration: {duration}</span>
                        <span style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', fontWeight: 500, padding: '2px 6px', borderRadius: '4px', fontSize: '11px', display: 'inline-block' }}>📅 {operatingDays}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', border: '1px solid #d1d5db', fontSize: '12px', color: '#1e293b' }}>
                      <strong style={{ color: '#0f172a', fontSize: '13px' }}>{paxCount}</strong>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* DAY WISE SCHEDULE */}
        {itineraryDays.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', border: '1px solid #d1d5db' }}>
            <thead>
              <tr>
                <th colSpan={2} style={{ backgroundColor: '#ecfeff', color: '#0f766e', padding: '8px 12px', fontSize: '13px', fontWeight: 'bold', textAlign: 'center', border: '1px solid #7dd3c7' }}>
                  Day Wise Schedule
                </th>
              </tr>
            </thead>
            <tbody>
              {itineraryDays.map((d, idx) => {
                const dayNum = d.dayNumber || idx + 1;
                const dayLabel = formatDayNumber(dayNum);
                const weekday = d.weekday || (d.date ? getWeekdayName(d.date) : '');
                const dateStr = d.date ? formatDocDate(d.date) : '';
                const title = d.title || `Day ${dayNum} Program`;
                const desc = d.description || '';
                const bgColor = idx % 2 === 1 ? '#f8fafc' : '#ffffff';

                return (
                  <tr key={idx} style={{ backgroundColor: bgColor }}>
                    <td style={{ width: '24%', padding: '10px 12px', border: '1px solid #d1d5db', fontSize: '12px', lineHeight: 1.4, verticalAlign: 'top' }}>
                      <div style={{ color: '#0284c7', fontWeight: 'bold', fontSize: '12px', marginBottom: '2px' }}>{dayLabel}</div>
                      {weekday && <div style={{ color: '#64748b', fontSize: '11px' }}>{weekday}</div>}
                      {dateStr && <strong style={{ color: '#0f172a', fontSize: '12px' }}>{dateStr}</strong>}
                    </td>
                    <td style={{ width: '76%', padding: '10px 12px', border: '1px solid #d1d5db', fontSize: '12px', color: '#1e293b', verticalAlign: 'top', lineHeight: 1.5 }}>
                      <strong style={{ color: '#0f172a', fontSize: '13px', textDecoration: 'underline' }}>{title}</strong>
                      {desc && <p style={{ margin: '6px 0 0 0', color: '#334155', fontSize: '12px' }}>{desc}</p>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* 3. TOTAL PRICE */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', border: '1px solid #d1d5db' }}>
          <thead>
            <tr>
              <th style={{ backgroundColor: '#ecfeff', color: '#0f766e', padding: '8px 12px', fontSize: '13px', fontWeight: 'bold', textAlign: 'center', border: '1px solid #7dd3c7' }}>
                Total Price
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '12px', fontSize: '13px' }}>
                <div style={{ display: 'inline-block', backgroundColor: '#fef08a', border: '1px solid #fde047', color: '#854d0e', fontWeight: 'bold', padding: '3px 8px', fontSize: '12px', marginBottom: '8px', borderRadius: '2px' }}>
                  Prices ({currency})
                </div>
                <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#0f172a' }}>
                  Total: {formattedTotal} /- <span style={{ fontWeight: 600, fontStyle: 'italic', color: '#2563eb', fontSize: '12px' }}>{taxStatement}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* 3.1 BANK DETAILS FOR PAYMENT */}
        {payment && payment.includePaymentDetails && payment.bankName && (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', border: '1px solid #d1d5db' }}>
            <thead>
              <tr>
                <th colSpan={2} style={{ backgroundColor: '#ecfeff', color: '#0f766e', padding: '8px 12px', fontSize: '13px', fontWeight: 'bold', textAlign: 'center', border: '1px solid #7dd3c7' }}>
                  Bank Account Details for Payment
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ width: '35%', padding: '7px 12px', border: '1px solid #d1d5db', fontSize: '12px', fontWeight: 500, color: '#475569' }}>Bank Name</td>
                <td style={{ width: '65%', padding: '7px 12px', border: '1px solid #d1d5db', fontSize: '12px', fontWeight: 'bold', color: '#0f172a' }}>{payment.bankName}</td>
              </tr>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <td style={{ width: '35%', padding: '7px 12px', border: '1px solid #d1d5db', fontSize: '12px', fontWeight: 500, color: '#475569' }}>A/c Holder Name</td>
                <td style={{ width: '65%', padding: '7px 12px', border: '1px solid #d1d5db', fontSize: '12px', fontWeight: 'bold', color: '#0f172a' }}>{payment.accountHolder || agencyName}</td>
              </tr>
              <tr>
                <td style={{ width: '35%', padding: '7px 12px', border: '1px solid #d1d5db', fontSize: '12px', fontWeight: 500, color: '#475569' }}>A/c No.</td>
                <td style={{ width: '65%', padding: '7px 12px', border: '1px solid #d1d5db', fontSize: '12px', fontWeight: 'bold', color: '#0f172a' }}>{payment.accountNumber || '—'}</td>
              </tr>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <td style={{ width: '35%', padding: '7px 12px', border: '1px solid #d1d5db', fontSize: '12px', fontWeight: 500, color: '#475569' }}>IFSC / SWIFT</td>
                <td style={{ width: '65%', padding: '7px 12px', border: '1px solid #d1d5db', fontSize: '12px', fontWeight: 'bold', color: '#0f172a' }}>{payment.ifsc || '—'}</td>
              </tr>
              {payment.branch && (
                <tr>
                  <td style={{ width: '35%', padding: '7px 12px', border: '1px solid #d1d5db', fontSize: '12px', fontWeight: 500, color: '#475569' }}>Branch</td>
                  <td style={{ width: '65%', padding: '7px 12px', border: '1px solid #d1d5db', fontSize: '12px', fontWeight: 'bold', color: '#0f172a' }}>{payment.branch}</td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* 4. INCLUSIONS & EXCLUSIONS */}
        {(inclusions.length > 0 || exclusions.length > 0) && (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', border: '1px solid #d1d5db' }}>
            <thead>
              <tr>
                <th style={{ width: '50%', backgroundColor: '#ecfeff', color: '#047857', padding: '8px 12px', fontSize: '13px', fontWeight: 'bold', textAlign: 'center', border: '1px solid #7dd3c7' }}>
                  Inclusions
                </th>
                <th style={{ width: '50%', backgroundColor: '#ecfeff', color: '#b91c1c', padding: '8px 12px', fontSize: '13px', fontWeight: 'bold', textAlign: 'center', border: '1px solid #7dd3c7' }}>
                  Exclusions
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ verticalAlign: 'top', padding: '12px 16px', border: '1px solid #d1d5db', fontSize: '12px', color: '#1e293b' }}>
                  <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', lineHeight: 1.6 }}>
                    {inclusions.map((inc, i) => (
                      <li key={i} style={{ marginBottom: '6px' }}>
                        <span style={{ color: '#059669', fontWeight: 'bold', marginRight: '6px' }}>✓</span>
                        {inc}
                      </li>
                    ))}
                  </ul>
                </td>
                <td style={{ verticalAlign: 'top', padding: '12px 16px', border: '1px solid #d1d5db', fontSize: '12px', color: '#1e293b' }}>
                  <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', lineHeight: 1.6 }}>
                    {exclusions.map((exc, i) => (
                      <li key={i} style={{ marginBottom: '6px' }}>
                        <span style={{ color: '#dc2626', fontWeight: 'bold', marginRight: '6px' }}>✗</span>
                        {exc}
                      </li>
                    ))}
                  </ul>
                  <p style={{ margin: '12px 0 0 0', fontWeight: 'bold', color: '#0f766e', fontSize: '11px' }}>
                    NOTE: Anything not mentioned in the inclusions is excluded.
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        )}

        {/* 5. TERMS AND CONDITIONS */}
        {termsSections.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', border: '1px solid #d1d5db' }}>
            <thead>
              <tr>
                <th style={{ backgroundColor: '#ecfeff', color: '#0f766e', padding: '8px 12px', fontSize: '13px', fontWeight: 'bold', textAlign: 'center', border: '1px solid #7dd3c7' }}>
                  Terms and Conditions
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '14px 16px', fontSize: '12px', color: '#1e293b', lineHeight: 1.6 }}>
                  <p style={{ fontWeight: 'bold', fontSize: '13px', margin: '0 0 10px 0', color: '#0f172a', borderBottom: '1px dashed #cbd5e1', paddingBottom: '6px' }}>
                    {agencyName} Official Terms and Conditions
                  </p>
                  <ol style={{ margin: 0, paddingLeft: '18px', color: '#334155', fontSize: '11.5px', lineHeight: 1.65 }}>
                    {termsSections.filter((s) => s.enabled !== false).map((sec, idx) => (
                      <li key={idx} style={{ marginBottom: '10px' }}>
                        <strong style={{ color: '#0f172a' }}>{sec.title}:</strong>
                        {sec.content && <p style={{ margin: '3px 0 4px 0' }}>{sec.content}</p>}
                        {Array.isArray(sec.points) && sec.points.length > 0 && (
                          <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px', listStyleType: 'disc' }}>
                            {sec.points.map((pt, pIdx) => (
                              <li key={pIdx} style={{ marginBottom: '4px' }}>{pt}</li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ol>
                </td>
              </tr>
            </tbody>
          </table>
        )}

        {/* 6. AGENT BRAND FOOTER BANNER */}
        {branding.footerBannerUrl ? (
          <div style={{ width: '100%', marginTop: '24px', textAlign: 'center' }}>
            <img
              src={branding.footerBannerUrl}
              alt="Footer Banner"
              style={{ width: '600px', maxWidth: '100%', height: 'auto', display: 'block', margin: '0 auto', border: 0 }}
            />
          </div>
        ) : (
          <div style={{ marginTop: '30px', paddingTop: '15px', borderTop: '1px solid #e2e8f0', textAlign: 'center', fontSize: '11px', color: '#64748b' }}>
            {agencyName} • Official Travel Proposal • Valid Until: {q.validUntil ? formatDocDate(q.validUntil) : 'As Agreed'}
          </div>
        )}
      </div>

      <style>{`
        @media print {
          body {
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .quotation-document-wrapper {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .quotation-a4-sheet {
            box-shadow: none !important;
            border-radius: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 1.2cm !important;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          thead {
            display: table-header-group;
          }
          tfoot {
            display: table-footer-group;
          }
        }
      `}</style>
    </div>
  );
}
