import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { StatusBadge, Button, ConfirmDialog, Spinner } from '@troublefree/ui';
import {
  FiArrowLeft,
  FiCheckCircle,
  FiMessageSquare,
  FiDollarSign,
  FiCalendar,
  FiShield,
  FiMail,
  FiPhone,
  FiUser,
  FiStar,
  FiFileText,
  FiBriefcase,
} from 'react-icons/fi';
import { travellerQuotationApi, agencyRatingApi, messagingApi } from '../lib/api.js';
import { QuotationDetail } from '../components/QuotationDetail.jsx';

export function QuotationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState(null);
  const [ratingSummary, setRatingSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [acceptResult, setAcceptResult] = useState(null);
  const [messagingError, setMessagingError] = useState('');
  const [messaging, setMessaging] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await travellerQuotationApi.getById(id);
      const q = res.quotation || res.data?.quotation || res;
      setQuotation(q);

      if (q?.agencyId) {
        try {
          const rRes = await agencyRatingApi.getRatingSummary(q.agencyId);
          setRatingSummary(rRes.data || rRes);
        } catch {
          // Non-blocking rating fetch
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load quotation details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const handleMessageAgency = async () => {
    if (!quotation) return;
    try {
      setMessaging(true);
      setMessagingError('');
      const res = await messagingApi.createConversation({
        travelRequestId: quotation.travelRequestId,
        agencyId: quotation.agencyId,
      });
      const convId = res.conversation?.id || res.id || res.data?.id;
      if (convId) {
        navigate(`/messages/${convId}`);
      } else {
        navigate('/messages');
      }
    } catch (err) {
      setMessagingError(err.message || 'Unable to open conversation.');
    } finally {
      setMessaging(false);
    }
  };

  const handleAccept = async () => {
    try {
      setAccepting(true);
      setError('');
      const res = await travellerQuotationApi.accept(id);
      setAcceptResult(res);
      const acceptedQuotation = res.quotation || res.data?.quotation || {};
      setQuotation((prev) => ({
        ...prev,
        ...acceptedQuotation,
        status: 'accepted',
      }));
    } catch (err) {
      setError(err.message || 'Failed to accept quotation.');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 20px' }}>
        <Spinner />
      </div>
    );
  }

  if (error && !quotation) {
    return (
      <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            padding: '24px',
            color: '#991b1b',
          }}
        >
          <h3>Unable to load quotation</h3>
          <p>{error}</p>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <FiArrowLeft style={{ marginRight: '8px' }} /> Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!quotation) return null;

  const agency = quotation.agency || {};
  const isAccepted = quotation.status === 'accepted';
  const isSubmitted = quotation.status === 'submitted';
  const revealedContact =
    quotation.revealedContact || acceptResult?.contact || agency.contact || null;
  const jobId =
    acceptResult?.jobId || acceptResult?.job?.id || quotation.jobId || quotation.job?.id || null;

  const formattedTotal = quotation.totalAmount
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: quotation.currency || 'USD',
      }).format(quotation.totalAmount)
    : `${quotation.currency || '$'}${quotation.totalAmount || 0}`;

  return (
    <div
      style={{
        maxWidth: '960px',
        margin: '32px auto',
        padding: '0 20px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Top Navigation */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            color: '#64748b',
            fontSize: '0.95rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <FiArrowLeft /> Back to Quotations
        </button>
      </div>

      {error && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
            color: '#991b1b',
          }}
        >
          {error}
        </div>
      )}

      {/* Acceptance Success Banner */}
      {isAccepted && (
        <div
          style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <FiCheckCircle size={24} style={{ color: '#16a34a' }} />
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#14532d', fontWeight: 700 }}>
              Quotation accepted. Your trip is booked.
            </h2>
          </div>
          <p style={{ margin: '0 0 16px 0', color: '#15803d', fontSize: '0.95rem' }}>
            Your trip with <strong>{agency.name || agency.agencyName || 'the agency'}</strong> has
            been confirmed. You can now contact the agency directly and track execution.
          </p>

          {jobId && (
            <Link
              to={`/jobs/${jobId}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#166534',
                color: '#ffffff',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <FiBriefcase /> View job #{jobId}
            </Link>
          )}
        </div>
      )}

      {/* Main Quotation Header */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}
            >
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
                Quotation Offer
              </h1>
              <StatusBadge status={quotation.status} />
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '0.9rem',
                color: '#64748b',
              }}
            >
              {ratingSummary?.averageRating ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: '#d97706',
                    fontWeight: 600,
                  }}
                >
                  <FiStar style={{ fill: '#d97706' }} />
                  {Number(ratingSummary.averageRating).toFixed(1)}
                  {ratingSummary.totalReviews > 0 && (
                    <span style={{ color: '#94a3b8' }}>({ratingSummary.totalReviews} reviews)</span>
                  )}
                </span>
              ) : (
                <span>No ratings yet</span>
              )}
              <span>•</span>
              <span>Quote #{quotation.id}</span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '2px' }}>
              Total Amount
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0c4e28' }}>
              {formattedTotal}
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid #f1f5f9',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              color: '#64748b',
              fontSize: '0.875rem',
            }}
          >
            {quotation.validUntil && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiCalendar /> Valid until: {new Date(quotation.validUntil).toLocaleDateString()}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Button variant="outline" onClick={handleMessageAgency} disabled={messaging}>
              <FiMessageSquare style={{ marginRight: '8px' }} />
              {messaging ? 'Opening...' : 'Message Agency'}
            </Button>

            {isSubmitted && (
              <Button variant="primary" onClick={handleAccept} disabled={accepting}>
                <FiCheckCircle style={{ marginRight: '8px' }} />
                {accepting ? 'Accepting...' : 'Accept Quotation'}
              </Button>
            )}
          </div>
        </div>

        {messagingError && (
          <div
            style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '8px', textAlign: 'right' }}
          >
            {messagingError}
          </div>
        )}
      </div>

      {/* Revealed Contact Details Section (If Accepted or Available) */}
      {(isAccepted || revealedContact) && (
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
          }}
        >
          <h3
            style={{
              margin: '0 0 12px 0',
              fontSize: '1.1rem',
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <FiShield style={{ color: '#166534' }} /> Revealed Agency Contact Information
          </h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              fontSize: '0.95rem',
            }}
          >
            {(revealedContact?.contactPerson || agency.contactPerson) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155' }}>
                <FiUser style={{ color: '#64748b' }} />
                <span>
                  <strong>Contact Person:</strong>{' '}
                  {revealedContact?.contactPerson || agency.contactPerson}
                </span>
              </div>
            )}

            {(revealedContact?.email || agency.businessEmail || agency.email) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155' }}>
                <FiMail style={{ color: '#64748b' }} />
                <span>
                  <strong>Email:</strong>{' '}
                  {revealedContact?.email || agency.businessEmail || agency.email}
                </span>
              </div>
            )}

            {(revealedContact?.phone || agency.phone) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155' }}>
                <FiPhone style={{ color: '#64748b' }} />
                <span>
                  <strong>Phone:</strong> {revealedContact?.phone || agency.phone}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detailed Offer View */}
      <QuotationDetail quotation={quotation} />

      {/* Confirm Accept Modal */}
      <ConfirmDialog
        isOpen={showAcceptModal}
        title="Accept this quotation?"
        message={`You are selecting ${agency.name || agency.agencyName || 'this agency'} for your trip at a total of ${formattedTotal}. Once accepted, other submitted quotes for this request will no longer be active.`}
        confirmText={accepting ? 'Accepting...' : 'Confirm Acceptance'}
        cancelText="Cancel"
        onConfirm={handleAccept}
        onCancel={() => setShowAcceptModal(false)}
      />
    </div>
  );
}
