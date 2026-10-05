import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiMapPin,
  FiCalendar,
  FiUsers,
  FiArrowRight,
  FiEye,
  FiClock,
  FiCheck,
} from 'react-icons/fi';

export function AgencyRequestCard({ request, isNew = false }) {
  if (!request) return null;

  const id = request.id ?? request.travelRequestId ?? request.requestId;
  const matchStatus = request.matchStatus ?? request.match?.matchStatus ?? 'matched';
  const destination =
    request.destination ?? request.title ?? request.routeSummary ?? 'Custom Travel Route';
  const firstName = request.traveller?.firstName ?? request.travellerName ?? 'Traveller';
  const travellers = request.numberOfTravellers ?? request.groupSize ?? request.pax ?? 1;

  const startDate = request.travelStartDate ?? request.startDate ?? null;
  const endDate = request.travelEndDate ?? request.endDate ?? null;

  const isMatchedNew = matchStatus === 'matched' || isNew;

  function getStatusBadgeClass(st) {
    switch (st) {
      case 'matched':
        return 'agency-status-matched';
      case 'viewed':
        return 'agency-status-viewed';
      case 'quoted':
        return 'agency-status-quoted';
      case 'declined':
        return 'agency-status-declined';
      case 'expired':
        return 'agency-status-expired';
      default:
        return 'agency-status-matched';
    }
  }

  return (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Link
        to={`/requests/${id}`}
        className={`agency-request-card ${isMatchedNew ? 'is-new' : ''}`}
        aria-label={`Request #${id} to ${destination}`}
      >
        <div className="agency-request-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="agency-request-id-badge">Request #{id}</span>
            {isMatchedNew && <span className="agency-request-new-pill">NEW</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className={`agency-status-badge ${getStatusBadgeClass(matchStatus)}`}>
              {matchStatus === 'matched' && <FiClock />}
              {matchStatus === 'viewed' && <FiEye />}
              {matchStatus === 'quoted' && <FiCheck />}
              {matchStatus}
            </span>
            <FiArrowRight style={{ color: 'var(--agency-text-light)', fontSize: '1.1rem' }} />
          </div>
        </div>

        <div className="agency-request-destination">
          <FiMapPin style={{ color: 'var(--agency-secondary)', flexShrink: 0 }} />
          <span>{destination}</span>
        </div>

        <div className="agency-request-details-row">
          <div className="agency-detail-pill">
            <FiUsers />
            <span>
              {travellers} {travellers === 1 ? 'Traveller' : 'Travellers'} ({firstName})
            </span>
          </div>

          {(startDate || endDate) && (
            <div className="agency-detail-pill">
              <FiCalendar />
              <span>
                {startDate ? new Date(startDate).toLocaleDateString() : 'Flexible'}
                {endDate ? ` - ${new Date(endDate).toLocaleDateString()}` : ''}
              </span>
            </div>
          )}

          {request.hotelRequired && (
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--agency-primary)',
                background: 'var(--agency-primary-light)',
                padding: '0.2rem 0.5rem',
                borderRadius: '0.375rem',
              }}
            >
              Hotel
            </span>
          )}

          {request.driverRequired && (
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#92400e',
                background: '#fef3c7',
                padding: '0.2rem 0.5rem',
                borderRadius: '0.375rem',
              }}
            >
              Vehicle & Driver
            </span>
          )}

          {request.guideRequired && (
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#1e40af',
                background: '#dbeafe',
                padding: '0.2rem 0.5rem',
                borderRadius: '0.375rem',
              }}
            >
              Tour Guide
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
