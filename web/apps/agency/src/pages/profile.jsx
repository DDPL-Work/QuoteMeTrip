import { useState, useEffect } from 'react';
import {
  FiMail,
  FiMapPin,
  FiCheckCircle,
  FiShield,
  FiBriefcase,
  FiPhone,
  FiSave,
  FiPlus,
  FiX,
  FiGlobe,
  FiAlertCircle,
  FiClock,
  FiFileText,
  FiCheck,
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { AgencyAppLayout } from '../layouts/AgencyAppLayout.jsx';
import { useAuth } from '../features/auth/auth-context.js';
import { useI18n } from '@troublefree/i18n';
import { toast } from '@troublefree/ui';
import { agencyProfileApi } from '../lib/api.js';
import { AGENCY_SERVICE_TYPES, AGENCY_SERVICE_LABELS } from '@troublefree/types';
import AgencyOnboardingWizard from '../components/AgencyOnboardingWizard.jsx';

const POPULAR_DESTINATIONS = [
  'Istanbul',
  'Cappadocia',
  'Antalya',
  'Bodrum',
  'Fethiye',
  'Pamukkale',
  'Ephesus',
  'Izmir',
  'Marmaris',
  'Kas',
  'Trabzon',
  'Bursa',
];

export function ProfilePage() {
  const { user } = useAuth();
  const { t } = useI18n();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const [profileData, setProfileData] = useState(null);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [availableDestinations, setAvailableDestinations] = useState(POPULAR_DESTINATIONS);

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        setLoading(true);
        const config = await agencyProfileApi.getCoverage();
        if (active && config) {
          const locs = (config.coverages || []).map((c) => c.locationName).filter(Boolean);
          const srvs = (config.capabilities || [])
            .filter((c) => c.isEnabled !== false)
            .map((c) => c.serviceType);

          setSelectedLocations(locs);
          setSelectedServices(srvs);

          if (config.availableDestinations && config.availableDestinations.length > 0) {
            const fetched = config.availableDestinations.map((d) => d.name);
            const combined = [...new Set([...POPULAR_DESTINATIONS, ...fetched])];
            setAvailableDestinations(combined);
          }
        }
        const profile = await agencyProfileApi.getProfile();
        if (active && profile) {
          setProfileData(profile);
        }
      } catch (err) {
        if (active) {
          setErrorMessage(err?.message || 'Failed to load agency profile.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    loadData();
    return () => {
      active = false;
    };
  }, []);

  const agencyName =
    profileData?.agencyName ??
    user?.agencyName ??
    user?.companyName ??
    user?.name ??
    'Partner Travel Agency';
  const email = profileData?.businessEmail ?? user?.email ?? 'agency@example.com';
  const country = profileData?.country ?? profileData?.city ?? user?.country ?? 'Turkey';
  const phone = profileData?.phone ?? user?.phone ?? '+90 (555) 000-0000';
  const status = profileData?.status ?? 'approved';

  const documents = profileData?.documents || [];
  const memberships = profileData?.memberships || [];
  const activeMembership = memberships.find((m) => m.status === 'active') || memberships[0];

  function toggleService(serviceType) {
    setSelectedServices((prev) =>
      prev.includes(serviceType) ? prev.filter((s) => s !== serviceType) : [...prev, serviceType],
    );
  }

  function addLocation(loc) {
    if (!selectedLocations.includes(loc)) {
      setSelectedLocations((prev) => [...prev, loc]);
    }
  }

  function removeLocation(loc) {
    setSelectedLocations((prev) => prev.filter((l) => l !== loc));
  }

  function handleCustomAdd(e) {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    const clean = searchTerm.trim();
    addLocation(clean);
    setSearchTerm('');
  }

  async function handleSave() {
    try {
      setSaving(true);
      setErrorMessage(null);
      setSaveSuccess(false);

      const updated = await agencyProfileApi.updateCoverage({
        locations: selectedLocations,
        services: selectedServices,
      });

      if (updated) {
        setProfileData(updated);
        const locs = (updated.coverages || []).map((c) => c.locationName);
        const srvs = (updated.capabilities || []).map((c) => c.serviceType);
        setSelectedLocations(locs);
        setSelectedServices(srvs);
      }

      setSaveSuccess(true);
      toast.success('Settings saved successfully.');
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      const msg = err?.message || 'Failed to save settings.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  const filteredDestinations = availableDestinations.filter(
    (d) =>
      d.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !selectedLocations.map((l) => l.toLowerCase()).includes(d.toLowerCase()),
  );

  return (
    <AgencyAppLayout activeItem="profile">
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              margin: '0 0 0.35rem',
              letterSpacing: '-0.02em',
            }}
          >
            {t('agency.coverage.title', 'Agency Profile & Service Coverage')}
          </h1>
          <p style={{ color: 'var(--agency-text-muted)', margin: 0, fontSize: '0.95rem' }}>
            {t(
              'agency.coverage.subtitle',
              'Select the regions you operate in and the services your agency provides to receive relevant travel requests.',
            )}
          </p>
        </div>

        <button
          type="button"
          className="agency-btn agency-btn-primary"
          onClick={handleSave}
          disabled={saving || loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.7rem 1.4rem',
          }}
        >
          {saving ? <FiClock className="agency-spin" /> : <FiSave />}
          <span>
            {saving
              ? t('agency.coverage.saving', 'Saving...')
              : t('agency.coverage.save', 'Save Changes')}
          </span>
        </button>
      </div>

      <AnimatePresence>
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              padding: '0.9rem 1.25rem',
              borderRadius: '0.75rem',
              background: '#DCFCE7',
              border: '1px solid #86EFAC',
              color: '#166534',
              fontWeight: 600,
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              marginBottom: '1.5rem',
            }}
          >
            <FiCheckCircle style={{ fontSize: '1.2rem', color: '#15803D' }} />
            {t('agency.coverage.saved', 'Settings saved successfully!')}
          </motion.div>
        )}

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              padding: '0.9rem 1.25rem',
              borderRadius: '0.75rem',
              background: '#FEE2E2',
              border: '1px solid #FCA5A5',
              color: '#991B1B',
              fontWeight: 600,
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              marginBottom: '1.5rem',
            }}
          >
            <FiAlertCircle style={{ fontSize: '1.2rem', color: '#DC2626' }} />
            {errorMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <AgencyOnboardingWizard onComplete={() => {}} />

      <div className="agency-dashboard-grid" style={{ gap: '1.5rem' }}>
        {/* Main Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Identity & Profile Overview Card */}
          <div className="agency-section-card" style={{ marginBottom: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.25rem',
                marginBottom: '1.5rem',
                paddingBottom: '1.25rem',
                borderBottom: '1px solid var(--agency-border)',
              }}
            >
              <div
                className="agency-avatar-circle"
                style={{ width: '64px', height: '64px', fontSize: '1.75rem' }}
              >
                {agencyName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 0.35rem' }}>
                  {agencyName}
                </h2>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    flexWrap: 'wrap',
                    fontSize: '0.85rem',
                  }}
                >
                  <span
                    className={`agency-status-badge ${
                      status === 'approved'
                        ? 'agency-status-quoted'
                        : status === 'pending'
                          ? 'agency-status-viewed'
                          : 'agency-status-declined'
                    }`}
                    style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}
                  >
                    {status === 'approved' ? (
                      <>
                        <FiCheckCircle /> {t('agency.status.approved', 'Approved & Active')}
                      </>
                    ) : status === 'pending' ? (
                      <>
                        <FiClock /> {t('agency.status.pending', 'Pending Approval')}
                      </>
                    ) : (
                      <>
                        <FiAlertCircle /> {status}
                      </>
                    )}
                  </span>
                  <span style={{ color: 'var(--agency-text-muted)' }}>
                    Agency ID:{' '}
                    {profileData?.id ? `AGY-${profileData.id}` : `AGY-${user?.id || 101}`}
                  </span>
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.25rem',
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: 'var(--agency-text-muted)',
                    display: 'block',
                    marginBottom: '0.35rem',
                  }}
                >
                  Company Name
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                  }}
                >
                  <FiBriefcase style={{ color: 'var(--agency-secondary)' }} /> {agencyName}
                </div>
              </div>

              <div>
                <label
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: 'var(--agency-text-muted)',
                    display: 'block',
                    marginBottom: '0.35rem',
                  }}
                >
                  Official Business Email
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                  }}
                >
                  <FiMail style={{ color: 'var(--agency-secondary)' }} /> {email}
                </div>
              </div>

              <div>
                <label
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: 'var(--agency-text-muted)',
                    display: 'block',
                    marginBottom: '0.35rem',
                  }}
                >
                  Primary Head Office
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                  }}
                >
                  <FiMapPin style={{ color: 'var(--agency-secondary)' }} /> {country}
                </div>
              </div>

              <div>
                <label
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: 'var(--agency-text-muted)',
                    display: 'block',
                    marginBottom: '0.35rem',
                  }}
                >
                  Contact Phone
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                  }}
                >
                  <FiPhone style={{ color: 'var(--agency-secondary)' }} /> {phone}
                </div>
              </div>
            </div>
          </div>

          {/* Service Coverage Card */}
          <div className="agency-section-card" style={{ marginBottom: 0 }}>
            <h3 className="agency-section-title" style={{ marginBottom: '0.5rem' }}>
              <FiGlobe style={{ color: 'var(--agency-secondary)' }} />{' '}
              {t('agency.coverage.operatingAreas', 'Operating Areas / Geographic Coverage')}
            </h3>
            <p
              style={{
                fontSize: '0.88rem',
                color: 'var(--agency-text-muted)',
                marginBottom: '1.25rem',
              }}
            >
              Add the destinations and regions where your agency provides tours, transport, or hotel
              services.
            </p>

            {/* Selected Areas Chips */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: 'var(--agency-text-muted)',
                  display: 'block',
                  marginBottom: '0.5rem',
                }}
              >
                {t('agency.coverage.selectedAreas', 'Selected Operating Areas')} (
                {selectedLocations.length})
              </label>

              {selectedLocations.length === 0 ? (
                <div
                  style={{
                    padding: '1.25rem',
                    borderRadius: '0.75rem',
                    background: '#FFFBEB',
                    border: '1px solid #FDE68A',
                    color: '#92400E',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                  }}
                >
                  <FiAlertCircle style={{ color: '#D97706' }} />
                  {t(
                    'agency.coverage.noAreas',
                    'No operating areas selected yet. Add at least one destination to receive matching requests.',
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {selectedLocations.map((loc) => (
                    <span
                      key={loc}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.45rem 0.8rem',
                        background: '#EEF2FF',
                        border: '1px solid #C7D2FE',
                        color: '#3730A3',
                        borderRadius: '2rem',
                        fontSize: '0.88rem',
                        fontWeight: 600,
                      }}
                    >
                      <FiMapPin style={{ fontSize: '0.85rem' }} />
                      {loc}
                      <button
                        type="button"
                        onClick={() => removeLocation(loc)}
                        aria-label={`Remove ${loc}`}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '0.1rem',
                          color: '#4338CA',
                          marginLeft: '0.2rem',
                        }}
                      >
                        <FiX />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Add Destination Search & Custom Input */}
            <form
              onSubmit={handleCustomAdd}
              style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}
            >
              <input
                type="text"
                className="agency-input"
                placeholder={t(
                  'agency.coverage.searchPlaceholder',
                  'Search destinations (e.g. Istanbul, Cappadocia, Antalya...)',
                )}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                type="submit"
                className="agency-btn agency-btn-secondary"
                disabled={!searchTerm.trim()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <FiPlus /> Add Area
              </button>
            </form>

            {/* Popular/Suggested Chips */}
            {filteredDestinations.length > 0 && (
              <div>
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--agency-text-muted)',
                    display: 'block',
                    marginBottom: '0.4rem',
                  }}
                >
                  Suggested Popular Regions:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {filteredDestinations.slice(0, 10).map((dest) => (
                    <button
                      key={dest}
                      type="button"
                      onClick={() => addLocation(dest)}
                      style={{
                        background: 'var(--agency-bg)',
                        border: '1px dashed var(--agency-border)',
                        color: 'var(--agency-text)',
                        borderRadius: '1.5rem',
                        padding: '0.3rem 0.75rem',
                        fontSize: '0.82rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <FiPlus style={{ fontSize: '0.75rem' }} /> {dest}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Services Provided Card */}
          <div className="agency-section-card" style={{ marginBottom: 0 }}>
            <h3 className="agency-section-title" style={{ marginBottom: '0.5rem' }}>
              <FiBriefcase style={{ color: 'var(--agency-secondary)' }} />{' '}
              {t('agency.coverage.servicesProvided', 'Services Provided / Package Capabilities')}
            </h3>
            <p
              style={{
                fontSize: '0.88rem',
                color: 'var(--agency-text-muted)',
                marginBottom: '1.25rem',
              }}
            >
              Select the service types your agency is licensed and capable to fulfill.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '0.85rem',
              }}
            >
              {AGENCY_SERVICE_TYPES.map((serviceType) => {
                const active = selectedServices.includes(serviceType);
                const label = AGENCY_SERVICE_LABELS[serviceType] || serviceType;
                return (
                  <div
                    key={serviceType}
                    onClick={() => toggleService(serviceType)}
                    tabIndex={0}
                    role="checkbox"
                    aria-checked={active}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        toggleService(serviceType);
                      }
                    }}
                    style={{
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      border: active
                        ? '2px solid var(--agency-secondary)'
                        : '1px solid var(--agency-border)',
                      background: active ? 'rgba(79, 70, 229, 0.04)' : 'var(--agency-card-bg)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease',
                      userSelect: 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '4px',
                          border: active
                            ? '2px solid var(--agency-secondary)'
                            : '2px solid var(--agency-text-muted)',
                          background: active ? 'var(--agency-secondary)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFF',
                          fontSize: '0.75rem',
                        }}
                      >
                        {active && <FiCheck />}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>{label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Status & Documents */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Membership & Status Card */}
          <div className="agency-section-card" style={{ marginBottom: 0 }}>
            <h3 className="agency-section-title" style={{ marginBottom: '1rem' }}>
              <FiShield style={{ color: 'var(--agency-secondary)' }} /> Verification & Membership
            </h3>

            <div
              style={{
                background: 'var(--agency-bg)',
                border: '1px solid var(--agency-border)',
                borderRadius: '0.75rem',
                padding: '1rem',
                marginBottom: '1rem',
              }}
            >
              <span
                style={{ fontSize: '0.8rem', color: 'var(--agency-text-muted)', display: 'block' }}
              >
                Account Verification
              </span>
              <strong
                style={{
                  fontSize: '1rem',
                  color: status === 'approved' ? 'var(--agency-secondary)' : '#D97706',
                  textTransform: 'capitalize',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  marginTop: '0.2rem',
                }}
              >
                {status === 'approved' ? (
                  <>
                    <FiCheckCircle /> Verified & Active
                  </>
                ) : (
                  <>
                    <FiClock /> Pending Approval
                  </>
                )}
              </strong>
            </div>

            <div
              style={{
                background: 'var(--agency-bg)',
                border: '1px solid var(--agency-border)',
                borderRadius: '0.75rem',
                padding: '1rem',
                marginBottom: '1rem',
              }}
            >
              <span
                style={{ fontSize: '0.8rem', color: 'var(--agency-text-muted)', display: 'block' }}
              >
                Active Membership Plan
              </span>
              <strong
                style={{
                  fontSize: '1rem',
                  color: 'var(--agency-primary)',
                  display: 'block',
                  marginTop: '0.2rem',
                }}
              >
                {activeMembership?.plan?.name || 'Professional Agency Plan'}
              </strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--agency-text-muted)' }}>
                Status: {activeMembership?.status || 'Active'}
              </span>
            </div>
          </div>

          {/* Verification Documents Card */}
          <div className="agency-section-card" style={{ marginBottom: 0 }}>
            <h3 className="agency-section-title" style={{ marginBottom: '1rem' }}>
              <FiFileText style={{ color: 'var(--agency-secondary)' }} /> Required Documents
            </h3>

            {documents.length === 0 ? (
              <div style={{ fontSize: '0.88rem', color: 'var(--agency-text-muted)' }}>
                Documents uploaded during registration are verified by admin upon approval.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {documents.map((doc, idx) => (
                  <div
                    key={doc.id || `doc-${idx}`}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--agency-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.88rem',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        {doc.documentType || 'Operating License'}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--agency-text-muted)' }}>
                        {doc.fileName || 'document.pdf'}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        background:
                          doc.status === 'approved'
                            ? '#DCFCE7'
                            : doc.status === 'rejected'
                              ? '#FEE2E2'
                              : '#FEF3C7',
                        color:
                          doc.status === 'approved'
                            ? '#166534'
                            : doc.status === 'rejected'
                              ? '#991B1B'
                              : '#92400E',
                      }}
                    >
                      {doc.status || 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AgencyAppLayout>
  );
}
