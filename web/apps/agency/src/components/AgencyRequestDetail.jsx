import { Link } from 'react-router-dom';
import {
  FiMapPin,
  FiCalendar,
  FiUsers,
  FiPackage,
  FiCheckCircle,
  FiShield,
  FiArrowLeft,
  FiClock,
  FiCheck,
  FiFileText,
} from 'react-icons/fi';

export function AgencyRequestDetail({ request, match, onMarkViewed, isViewed }) {
  if (!request) {
    return (
      <div className="agency-empty-state">
        <h3 className="agency-empty-title">Request Not Found</h3>
        <p className="agency-empty-subtitle">
          The requested travel opportunity could not be retrieved.
        </p>
        <Link to="/requests" className="agency-btn agency-btn-secondary">
          <FiArrowLeft /> Back to Incoming Requests
        </Link>
      </div>
    );
  }

  const id = request.id ?? request.travelRequestId;
  const matchStatus =
    match?.matchStatus ?? request.match?.matchStatus ?? request.matchStatus ?? 'matched';
  const isActuallyViewed = isViewed || matchStatus === 'viewed';
  const destination =
    request.destination ?? request.title ?? request.routeSummary ?? 'Custom Travel Route';
  const firstName = request.traveller?.firstName ?? request.travellerName ?? 'Traveller';
  const travellers = request.numberOfTravellers ?? request.groupSize ?? 1;

  const startDate = request.travelStartDate ?? request.startDate ?? null;
  const endDate = request.travelEndDate ?? request.endDate ?? null;

  const packageType = request.packageType ?? request.tripType ?? 'Custom Itinerary';

  const services =
    request.services ??
    request.serviceRequirements ??
    [
      request.hotelRequired ? 'Hotel Accommodation' : null,
      request.driverRequired ? 'Private Vehicle & Driver' : null,
      request.guideRequired ? 'Licensed Tour Guide' : null,
    ].filter(Boolean);

  const dayPlan = request.dayPlan ?? request.itineraryDays ?? request.stops ?? [];
  const notes = request.specialRequests ?? request.notes ?? request.comments;
  const myQuotation = request.myQuotation || null;
  const myQuotations = request.myQuotations || (myQuotation ? [myQuotation] : []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header Card */}
      <div className="agency-section-card" style={{ marginBottom: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1rem',
          }}
        >
          <div>
            <Link
              to="/requests"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: 'var(--agency-secondary)',
                fontWeight: 600,
                fontSize: '0.875rem',
                textDecoration: 'none',
                marginBottom: '0.75rem',
              }}
            >
              <FiArrowLeft /> Back to Requests
            </Link>
            <h1
              style={{
                fontSize: '1.6rem',
                fontWeight: 800,
                margin: 0,
                letterSpacing: '-0.02em',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
              }}
            >
              <FiMapPin style={{ color: 'var(--agency-secondary)' }} />
              Request #{id} — {destination}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span
              className="agency-request-id-badge"
              style={{ fontSize: '0.9rem', padding: '0.3rem 0.75rem' }}
            >
              Request #{id}
            </span>
            <span
              className={`agency-status-badge agency-status-${matchStatus}`}
              style={{ fontSize: '0.85rem', padding: '0.3rem 0.75rem' }}
            >
              {matchStatus === 'matched' && <FiClock />}
              {matchStatus === 'viewed' && <FiCheckCircle />}
              {matchStatus === 'quoted' && <FiCheck />}
              {matchStatus.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--agency-border)',
          }}
        >
          {!isActuallyViewed && matchStatus === 'matched' && (
            <button type="button" className="agency-btn agency-btn-primary" onClick={onMarkViewed}>
              <FiCheckCircle /> Mark as viewed
            </button>
          )}

          <Link to={`/requests/${id}/quotations/new`} className="agency-btn agency-btn-accent">
            <FiFileText /> {myQuotations.length > 0 ? 'Create revised quotation' : 'Create quotation'}
          </Link>
        </div>
      </div>

      {/* Phase 5 Contact Protection Notice */}
      <div className="agency-protection-banner">
        <FiShield className="agency-protection-icon" />
        <div>
          <strong style={{ display: 'block', marginBottom: '0.15rem' }}>
            Traveller Privacy Protection Active
          </strong>
          <span>
            Direct contact details (email, phone number, WhatsApp) for <strong>{firstName}</strong>{' '}
            remain protected. Communication is unlocked automatically upon quotation submission &
            acceptance.
          </span>
        </div>
      </div>

      {/* Visual Route Graph */}
      {destination && (
        <div className="agency-route-graph">
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'var(--agency-text-muted)',
              marginRight: '0.5rem',
            }}
          >
            ROUTE:
          </span>
          {destination.split(/→|->|-/).map((city, idx, arr) => (
            <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="agency-route-node">
                <FiMapPin style={{ color: 'var(--agency-secondary)', fontSize: '0.9rem' }} />
                {city.trim()}
              </span>
              {idx < arr.length - 1 && <span className="agency-route-arrow">→</span>}
            </span>
          ))}
        </div>
      )}

      {/* Grid of Details */}
      <div className="agency-dashboard-grid">
        {/* Main Left Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Overview Section */}
          <div className="agency-section-card" style={{ marginBottom: 0 }}>
            <h2 className="agency-section-title" style={{ marginBottom: '1rem' }}>
              <FiPackage style={{ color: 'var(--agency-secondary)' }} />
              Travel Overview
            </h2>

            <p
              style={{
                margin: '0 0 1.25rem',
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--agency-text)',
              }}
            >
              Traveller: {firstName}
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1.25rem',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--agency-text-muted)',
                    display: 'block',
                  }}
                >
                  Group Size
                </span>
                <strong
                  style={{
                    fontSize: '1rem',
                    color: 'var(--agency-text)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    marginTop: '0.2rem',
                  }}
                >
                  <FiUsers /> {travellers} {travellers === 1 ? 'Person' : 'People'}
                </strong>
              </div>

              <div>
                <span
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--agency-text-muted)',
                    display: 'block',
                  }}
                >
                  Travel Dates
                </span>
                <strong
                  style={{
                    fontSize: '1rem',
                    color: 'var(--agency-text)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    marginTop: '0.2rem',
                  }}
                >
                  <FiCalendar />
                  {startDate ? new Date(startDate).toLocaleDateString() : 'Flexible'}
                  {endDate ? ` - ${new Date(endDate).toLocaleDateString()}` : ''}
                </strong>
              </div>

              <div>
                <span
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--agency-text-muted)',
                    display: 'block',
                  }}
                >
                  Package Category
                </span>
                <strong
                  style={{
                    fontSize: '1rem',
                    color: 'var(--agency-text)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    marginTop: '0.2rem',
                  }}
                >
                  <FiPackage /> {packageType}
                </strong>
              </div>

              {request.accommodationPreference && (
                <div>
                  <span
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--agency-text-muted)',
                      display: 'block',
                    }}
                  >
                    Accommodation
                  </span>
                  <strong
                    style={{
                      fontSize: '0.95rem',
                      color: 'var(--agency-text)',
                      display: 'block',
                      marginTop: '0.2rem',
                    }}
                  >
                    {request.accommodationPreference}
                  </strong>
                </div>
              )}

              {request.luggage && (
                <div>
                  <span
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--agency-text-muted)',
                      display: 'block',
                    }}
                  >
                    Luggage
                  </span>
                  <strong
                    style={{
                      fontSize: '0.95rem',
                      color: 'var(--agency-text)',
                      display: 'block',
                      marginTop: '0.2rem',
                    }}
                  >
                    {request.luggage}
                  </strong>
                </div>
              )}
            </div>
          </div>

          {/* Requested Services */}
          {services.length > 0 && (
            <div className="agency-section-card" style={{ marginBottom: 0 }}>
              <h2 className="agency-section-title" style={{ marginBottom: '1rem' }}>
                Required Agency Services
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                {services.map((srv, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: 'var(--agency-primary-light)',
                      color: 'var(--agency-primary)',
                      border: '1px solid rgba(12, 78, 40, 0.2)',
                      borderRadius: '999px',
                      padding: '0.35rem 0.85rem',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    <FiCheckCircle /> {srv}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Day Plan / Stops Breakdown */}
          {dayPlan.length > 0 && (
            <div className="agency-section-card" style={{ marginBottom: 0 }}>
              <h2 className="agency-section-title" style={{ marginBottom: '1rem' }}>
                Route Day Breakdown & Stops
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {dayPlan.map((day, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--agency-bg)',
                      border: '1px solid var(--agency-border)',
                      borderRadius: '0.5rem',
                      padding: '0.85rem 1rem',
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        color: 'var(--agency-primary)',
                        marginBottom: '0.25rem',
                      }}
                    >
                      Day {day.dayNumber ?? idx + 1}:{' '}
                      {day.location ?? day.destination ?? day.title ?? 'Route Stop'}
                    </div>
                    {day.description && (
                      <p
                        style={{
                          margin: 0,
                          fontSize: '0.85rem',
                          color: 'var(--agency-text-muted)',
                        }}
                      >
                        {day.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar Notes */}
        <div>
          <div className="agency-section-card">
            <h2 className="agency-section-title" style={{ marginBottom: '1rem' }}>
              Special Instructions
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: '0.9rem',
                color: 'var(--agency-text-muted)',
                lineHeight: 1.5,
              }}
            >
              {notes || 'No special requests specified for this travel itinerary.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
