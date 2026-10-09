import React, { useState } from 'react';
import {
  QuotationDocument,
  downloadQuotationDoc,
  printQuotationDocument,
} from '@troublefree/ui';
import {
  FiPrinter,
  FiDownload,
  FiZoomIn,
  FiZoomOut,
  FiX,
  FiFileText,
} from 'react-icons/fi';

export function QuotationPreviewModal({
  isOpen,
  onClose,
  formData = {},
  travelRequest = {},
  agencyProfile = null,
}) {
  const [zoom, setZoom] = useState(100);

  if (!isOpen) return null;

  // Build canonical document object from formData + request context
  const items = formData.items || [];
  const taxRate = Number(formData.taxRate || 0);
  const subtotal = items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0),
    0,
  );
  const taxAmount = taxRate > 0 ? Math.round(subtotal * (taxRate / 100) * 100) / 100 : 0;
  const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

  const quotationData = {
    ...formData,
    id: formData.id || 'DRAFT',
    travelRequestId: travelRequest?.id || formData.travelRequestId,
    subtotal,
    taxRate,
    taxAmount,
    taxLabel: formData.taxLabel || (taxRate > 0 ? `(including ${taxRate}% Tax)` : ''),
    totalAmount,
    currency: formData.currency || 'USD',
    greeting: formData.greeting || {
      recipient: travelRequest?.traveller?.firstName || 'Valued Guest',
      title: `Greetings from ${agencyProfile?.agencyName || formData.branding?.agencyName || 'QuoteMeTrip'} !!!`,
      message: 'As per our discussion, following is the travel package quotation details.',
    },
    packageOverview: formData.packageOverview || {
      tripId: `QRY-${travelRequest?.id || formData.id || '101'}`,
      destination: travelRequest?.route?.destination || formData.destination || 'Selected Tour Route',
      startDate: travelRequest?.travelStartDate || formData.startDate,
      endDate: travelRequest?.travelEndDate || formData.endDate,
      duration: travelRequest?.durationDays ? `${travelRequest.durationDays - 1} Nights / ${travelRequest.durationDays} Days` : 'Custom Duration',
      adults: travelRequest?.numberOfTravellers || 2,
      children: 0,
      infants: 0,
    },
    branding: formData.branding || {
      agencyName: agencyProfile?.agencyName || 'QuoteMeTrip',
      logoUrl: agencyProfile?.logoPath || null,
      phone: agencyProfile?.phone || null,
      email: agencyProfile?.businessEmail || null,
      address: [agencyProfile?.address, agencyProfile?.city, agencyProfile?.country].filter(Boolean).join(', ') || null,
    },
    items: formData.items || [],
    itineraryDays: formData.itineraryDays || [],
    paymentDetails: formData.paymentDetails || null,
    inclusions: formData.inclusions || [],
    exclusions: formData.exclusions || [],
    termsSections: formData.termsSections || [],
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 10, 150));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 10, 60));

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        flexDirection: 'column',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Official Quotation Document Preview"
    >
      {/* Modal Fixed Header */}
      <div
        className="no-print"
        style={{
          height: '64px',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          borderBottom: '1px solid #1e293b',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FiFileText style={{ fontSize: '1.4rem', color: '#38bdf8' }} />
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
              Official Travel Quotation Preview
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              A4 Portrait Printable Layout &bull; {quotationData.packageOverview?.tripId}
            </span>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#1e293b',
              borderRadius: '6px',
              padding: '2px 8px',
              marginRight: '8px',
              gap: '6px',
            }}
          >
            <button
              type="button"
              onClick={handleZoomOut}
              title="Zoom Out"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#cbd5e1',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <FiZoomOut />
            </button>
            <span style={{ fontSize: '0.75rem', color: '#e2e8f0', minWidth: '36px', textAlign: 'center' }}>
              {zoom}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              title="Zoom In"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#cbd5e1',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <FiZoomIn />
            </button>
          </div>

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
              padding: '7px 14px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <FiPrinter /> Print / PDF
          </button>

          <button
            type="button"
            onClick={() => downloadQuotationDoc(quotationData)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#1e293b',
              color: '#38bdf8',
              border: '1px solid #38bdf8',
              borderRadius: '6px',
              padding: '7px 14px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <FiDownload /> Download Word DOC
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Preview"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '8px',
              fontSize: '1.25rem',
              marginLeft: '8px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <FiX />
          </button>
        </div>
      </div>

      {/* Modal Scrollable Workspace */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          backgroundColor: '#334155',
          padding: '30px 16px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}
      >
        <div
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
            width: '100%',
            maxWidth: '210mm',
          }}
        >
          <QuotationDocument quotation={quotationData} />
        </div>
      </div>
    </div>
  );
}
