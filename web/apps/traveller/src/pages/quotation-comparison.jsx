import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiStar,
  FiCheck,
  FiX,
  FiInfo,
  FiCalendar,
  FiDollarSign,
  FiAward,
  FiEye,
  FiCheckCircle,
} from 'react-icons/fi';
import { StatusBadge } from '@troublefree/ui';
import { QUOTATION_TYPE_LABELS, QUOTATION_ITEM_TYPE_LABELS } from '@troublefree/types';
import { travelRequestApi, agencyRatingApi, travellerQuotationApi } from '../lib/api.js';

export function QuotationComparisonPage() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [request, setRequest] = useState(null);
  const [ratings, setRatings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [highlightDiff, setHighlightDiff] = useState(false);
  const [acceptingId, setAcceptingId] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [reqRes, quotesRes] = await Promise.all([
          travelRequestApi.getById(requestId),
          travelRequestApi.listQuotations(requestId),
        ]);
        if (cancelled) return;
        setRequest(reqRes.request ?? reqRes);
        const list = quotesRes.quotations ?? quotesRes ?? [];
        setQuotations(list);

        // Fetch agency rating summaries for each unique agency
        const agencyIds = [...new Set(list.map((q) => q.agencyId ?? q.agency?.id).filter(Boolean))];
        const ratingMap = {};
        await Promise.all(
          agencyIds.map(async (agencyId) => {
            try {
              const summary = await agencyRatingApi.getRatingSummary(agencyId);
              ratingMap[agencyId] = summary;
            } catch {
              // Ignore individual rating fetch error
            }
          }),
        );
        if (!cancelled) setRatings(ratingMap);
      } catch (e) {
        if (!cancelled) setError(e?.message ?? 'Failed to load quotation comparison data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [requestId]);

  async function handleAccept(quotationId) {
    if (
      !window.confirm(
        'Are you sure you want to accept this quotation? Other submitted proposals for this request will be declined.',
      )
    ) {
      return;
    }
    setAcceptingId(quotationId);
    setError(null);
    try {
      await travellerQuotationApi.accept(quotationId);
      navigate(`/quotations/${quotationId}`);
    } catch (e) {
      setError(e?.message ?? 'Failed to accept quotation.');
    } finally {
      setAcceptingId(null);
    }
  }

  // Factual indicators
  const lowestTotalQuoteId = quotations.length
    ? quotations.reduce(
        (min, q) =>
          Number(q.totalAmount ?? q.total) < Number(min.totalAmount ?? min.total) ? q : min,
        quotations[0],
      )?.id
    : null;

  const highestRatingAgencyId = Object.keys(ratings).length
    ? Object.keys(ratings).reduce(
        (maxId, id) =>
          Number(ratings[id]?.averageRating ?? 0) > Number(ratings[maxId]?.averageRating ?? 0)
            ? id
            : maxId,
        Object.keys(ratings)[0],
      )
    : null;

  return (
    <main
      className="tf-page"
      style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem 1rem' }}
    >
      <Link
        to={`/travel-requests/${requestId}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          color: '#0c4e28',
          fontWeight: 600,
          fontSize: '0.9rem',
          marginBottom: '1.25rem',
          textDecoration: 'none',
        }}
      >
        <FiArrowLeft /> Back to Request #{requestId}
      </Link>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.8rem',
              fontWeight: 800,
              margin: '0 0 0.35rem',
              color: '#0c4e28',
              letterSpacing: '-0.02em',
            }}
          >
            Compare Quotations
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>
            Side-by-side proposal comparison for Travel Request #{requestId} ({quotations.length}{' '}
            responses)
          </p>
        </div>

        {quotations.length > 1 && (
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#ffffff',
              padding: '0.5rem 1rem',
              borderRadius: '999px',
              border: '1px solid #cbd5e1',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={highlightDiff}
              onChange={(e) => setHighlightDiff(e.target.checked)}
            />
            Highlight Differences
          </label>
        )}
      </div>

      {error && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fca5a5',
            color: '#991b1b',
            borderRadius: '0.75rem',
            padding: '1rem',
            marginBottom: '1.5rem',
          }}
          role="alert"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div
          className="tf-card"
          style={{
            height: '300px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '1rem',
          }}
        >
          <p>Loading quotation comparison...</p>
        </div>
      ) : quotations.length === 0 ? (
        <div
          className="tf-card"
          style={{
            textStyle: 'center',
            padding: '3rem 1.5rem',
            textAlign: 'center',
            borderRadius: '1rem',
          }}
        >
          <FiInfo style={{ fontSize: '2.5rem', color: '#94a3b8', marginBottom: '0.75rem' }} />
          <h3
            style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.5rem', color: '#1e293b' }}
          >
            No Submitted Quotations Available
          </h3>
          <p
            style={{
              color: '#64748b',
              maxWidth: '480px',
              margin: '0 auto 1.5rem',
              fontSize: '0.95rem',
            }}
          >
            Agencies are currently reviewing your travel request. Check back soon for custom offers.
          </p>
          <Link to={`/travel-requests/${requestId}`} className="tf-btn tf-btn-primary">
            Return to Request Details
          </Link>
        </div>
      ) : (
        <>
          {/* Factual Highlights Banner */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
            {lowestTotalQuoteId && (
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  padding: '0.65rem 1rem',
                  borderRadius: '0.65rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#166534',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <FiAward /> Factual Indicator: Quote #{lowestTotalQuoteId} offers the lowest total
                price.
              </div>
            )}
            {highestRatingAgencyId && ratings[highestRatingAgencyId]?.averageRating && (
              <div
                style={{
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  padding: '0.65rem 1rem',
                  borderRadius: '0.65rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#b45309',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <FiStar style={{ fill: '#f59e0b', stroke: '#d97706' }} /> Factual Indicator: Highest
                agency rating is ★ {Number(ratings[highestRatingAgencyId].averageRating).toFixed(1)}
                .
              </div>
            )}
          </div>

          {/* Side by Side Desktop Matrix */}
          <div
            style={{
              overflowX: 'auto',
              background: '#ffffff',
              borderRadius: '1rem',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              marginBottom: '2rem',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: '800px',
                fontSize: '0.9rem',
              }}
            >
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
                  <th
                    style={{
                      padding: '1.25rem',
                      textAlign: 'left',
                      width: '220px',
                      color: '#475569',
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Comparison Feature
                  </th>
                  {quotations.map((q) => {
                    const agency = q.agency ?? {};
                    const agencyId = agency.id ?? q.agencyId;
                    const ratingObj = ratings[agencyId];
                    const avgRating = ratingObj?.averageRating
                      ? Number(ratingObj.averageRating).toFixed(1)
                      : null;
                    const isLowest = q.id === lowestTotalQuoteId;

                    return (
                      <th
                        key={q.id}
                        style={{
                          padding: '1.25rem',
                          textAlign: 'center',
                          background: isLowest ? '#f0fdf4' : '#ffffff',
                          borderLeft: '1px solid #e2e8f0',
                          minWidth: '240px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              color: '#0c4e28',
                              background: '#e2e8f0',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '999px',
                            }}
                          >
                            Quote #{q.id}
                          </span>
                          <strong style={{ fontSize: '1.1rem', color: '#1e293b' }}>
                            {agency.agencyName ?? 'Agency'}
                          </strong>
                          {avgRating ? (
                            <span
                              style={{
                                fontSize: '0.8rem',
                                color: '#b45309',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.2rem',
                              }}
                            >
                              <FiStar style={{ fill: '#f59e0b', stroke: '#d97706' }} /> ★{' '}
                              {avgRating}
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                              No ratings yet
                            </span>
                          )}

                          <div style={{ marginTop: '0.5rem' }}>
                            <span
                              style={{
                                fontSize: '1.4rem',
                                fontWeight: 900,
                                color: '#0c4e28',
                                display: 'block',
                              }}
                            >
                              {q.currency} {q.totalAmount ?? q.total}
                            </span>
                          </div>

                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                            <Link
                              to={`/quotations/${q.id}`}
                              className="tf-btn tf-btn-ghost"
                              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                            >
                              <FiEye /> View
                            </Link>
                            {q.status === 'submitted' && (
                              <button
                                type="button"
                                onClick={() => handleAccept(q.id)}
                                disabled={acceptingId === q.id}
                                style={{
                                  background: 'linear-gradient(135deg, #147d33 0%, #0c4e28 100%)',
                                  color: '#ffffff',
                                  border: 'none',
                                  padding: '0.4rem 0.85rem',
                                  borderRadius: '0.5rem',
                                  fontWeight: 700,
                                  fontSize: '0.8rem',
                                  cursor: 'pointer',
                                }}
                              >
                                {acceptingId === q.id ? 'Accepting…' : 'Accept'}
                              </button>
                            )}
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {/* Package Type */}
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: 700, color: '#334155' }}>
                    Package Type
                  </td>
                  {quotations.map((q) => (
                    <td
                      key={q.id}
                      style={{
                        padding: '1rem',
                        textAlign: 'center',
                        borderLeft: '1px solid #f1f5f9',
                      }}
                    >
                      <span style={{ fontWeight: 600, color: '#0c4e28' }}>
                        {QUOTATION_TYPE_LABELS[q.quotationType] ?? q.quotationType}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Total Price */}
                <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: 700, color: '#334155' }}>
                    Total Price
                  </td>
                  {quotations.map((q) => (
                    <td
                      key={q.id}
                      style={{
                        padding: '1rem',
                        textAlign: 'center',
                        borderLeft: '1px solid #f1f5f9',
                      }}
                    >
                      <strong style={{ fontSize: '1.1rem', color: '#0c4e28' }}>
                        {q.currency} {q.totalAmount ?? q.total}
                      </strong>
                    </td>
                  ))}
                </tr>

                {/* Validity */}
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: 700, color: '#334155' }}>
                    Valid Until
                  </td>
                  {quotations.map((q) => (
                    <td
                      key={q.id}
                      style={{
                        padding: '1rem',
                        textAlign: 'center',
                        borderLeft: '1px solid #f1f5f9',
                        color: '#475569',
                      }}
                    >
                      {q.validUntil ? (
                        <span
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <FiCalendar /> {q.validUntil}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  ))}
                </tr>

                {/* Services Check: Hotel */}
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: 700, color: '#334155' }}>
                    Hotel Included
                  </td>
                  {quotations.map((q) => {
                    const hasHotel = (q.items ?? []).some((item) => item.itemType === 'hotel');
                    return (
                      <td
                        key={q.id}
                        style={{
                          padding: '1rem',
                          textAlign: 'center',
                          borderLeft: '1px solid #f1f5f9',
                        }}
                      >
                        {hasHotel ? (
                          <span
                            style={{
                              color: '#166534',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                            }}
                          >
                            <FiCheck /> Yes
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* Services Check: Vehicle */}
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: 700, color: '#334155' }}>
                    Vehicle / Driver
                  </td>
                  {quotations.map((q) => {
                    const hasVehicle = (q.items ?? []).some((item) =>
                      ['vehicle', 'driver'].includes(item.itemType),
                    );
                    return (
                      <td
                        key={q.id}
                        style={{
                          padding: '1rem',
                          textAlign: 'center',
                          borderLeft: '1px solid #f1f5f9',
                        }}
                      >
                        {hasVehicle ? (
                          <span
                            style={{
                              color: '#166534',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                            }}
                          >
                            <FiCheck /> Yes
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* Services Check: Guide */}
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: 700, color: '#334155' }}>
                    Guide Included
                  </td>
                  {quotations.map((q) => {
                    const hasGuide = (q.items ?? []).some((item) => item.itemType === 'guide');
                    return (
                      <td
                        key={q.id}
                        style={{
                          padding: '1rem',
                          textAlign: 'center',
                          borderLeft: '1px solid #f1f5f9',
                        }}
                      >
                        {hasGuide ? (
                          <span
                            style={{
                              color: '#166534',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                            }}
                          >
                            <FiCheck /> Yes
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* Included Items Summary */}
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: 700, color: '#334155' }}>
                    Included Line Items
                  </td>
                  {quotations.map((q) => (
                    <td
                      key={q.id}
                      style={{
                        padding: '1rem',
                        textAlign: 'left',
                        borderLeft: '1px solid #f1f5f9',
                        verticalAlign: 'top',
                      }}
                    >
                      <ul
                        style={{
                          paddingLeft: '1.2rem',
                          margin: 0,
                          fontSize: '0.85rem',
                          color: '#475569',
                        }}
                      >
                        {(q.items ?? []).map((item, idx) => (
                          <li key={idx} style={{ marginBottom: '0.25rem' }}>
                            <strong>{item.title}</strong> ({item.quantity}×)
                          </li>
                        ))}
                      </ul>
                    </td>
                  ))}
                </tr>

                {/* Payment Terms */}
                <tr>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: 700, color: '#334155' }}>
                    Payment Terms
                  </td>
                  {quotations.map((q) => (
                    <td
                      key={q.id}
                      style={{
                        padding: '1rem',
                        textAlign: 'center',
                        borderLeft: '1px solid #f1f5f9',
                        fontSize: '0.8rem',
                        color: '#64748b',
                      }}
                    >
                      Direct payment to agency off-platform
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}
