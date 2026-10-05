import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminApi } from '../services/api.js';
import { StatusBadge } from '@troublefree/ui';

export function AgencyDetailPage() {
  const { id } = useParams();
  const [agency, setAgency] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Document rejection modal
  const [rejectDocModal, setRejectDocModal] = useState(null); // { doc, note }
  // Create membership modal
  const [createMemModal, setCreateMemModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [memReference, setMemReference] = useState('');

  const loadAgencyData = useCallback(() => {
    setLoading(true);
    Promise.all([adminApi.getAgencyById(id), adminApi.listMembershipPlans()])
      .then(([agencyData, plansData]) => {
        setAgency(agencyData);
        setPlans(plansData || []);
        if (plansData?.length > 0) setSelectedPlanId(String(plansData[0].id));
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    loadAgencyData();
  }, [loadAgencyData]);

  const handleApprove = async () => {
    if (!window.confirm('Approve this agency profile?')) return;
    try {
      await adminApi.approveAgency(id);
      loadAgencyData();
    } catch (err) {
      alert(`Approval failed: ${err.message}`);
    }
  };

  const handleReject = async () => {
    const reason = window.prompt('Reason for rejection:');
    if (reason === null) return;
    try {
      await adminApi.rejectAgency(id, reason);
      loadAgencyData();
    } catch (err) {
      alert(`Rejection failed: ${err.message}`);
    }
  };

  const handleSuspend = async () => {
    const reason = window.prompt('Reason for suspension:');
    if (reason === null) return;
    try {
      await adminApi.suspendAgency(id, reason);
      loadAgencyData();
    } catch (err) {
      alert(`Suspension failed: ${err.message}`);
    }
  };

  const handleReactivate = async () => {
    if (!window.confirm('Reactivate this agency profile?')) return;
    try {
      await adminApi.reactivateAgency(id);
      loadAgencyData();
    } catch (err) {
      alert(`Reactivation failed: ${err.message}`);
    }
  };

  const handleVerifyDocument = async (docId) => {
    try {
      await adminApi.verifyDocument(id, docId);
      loadAgencyData();
    } catch (err) {
      alert(`Document verification failed: ${err.message}`);
    }
  };

  const handleRejectDocumentConfirm = async () => {
    if (!rejectDocModal) return;
    try {
      await adminApi.rejectDocument(id, rejectDocModal.doc.id, rejectDocModal.note);
      setRejectDocModal(null);
      loadAgencyData();
    } catch (err) {
      alert(`Document rejection failed: ${err.message}`);
    }
  };

  const handleCreateMembership = async (e) => {
    e.preventDefault();
    if (!selectedPlanId) return;
    try {
      await adminApi.createAgencyMembership(id, {
        planId: parseInt(selectedPlanId, 10),
        paymentReference: memReference,
        status: 'pending',
      });
      setCreateMemModal(false);
      setMemReference('');
      loadAgencyData();
    } catch (err) {
      alert(`Creating membership failed: ${err.message}`);
    }
  };

  if (loading) return <div>Loading agency details...</div>;
  if (error) return <div style={{ color: '#E53E3E' }}>Error: {error}</div>;
  if (!agency) return <div>Agency not found.</div>;

  return (
    <div
      className="admin-agency-detail-page"
      style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#FFFFFF',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <div>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.25rem' }}
          >
            <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#23272B' }}>
              {agency.agencyName}
            </h1>
            <StatusBadge status={agency.status} />
          </div>
          <p style={{ color: '#718096', margin: 0 }}>
            Registered on {new Date(agency.createdAt || Date.now()).toLocaleDateString()} — User ID
            #{agency.userId}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {agency.status === 'pending' && (
            <>
              <button
                type="button"
                onClick={handleApprove}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#2E9E5B',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Approve Agency
              </button>
              <button
                type="button"
                onClick={handleReject}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#E53E3E',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Reject Agency
              </button>
            </>
          )}
          {agency.status === 'approved' && (
            <button
              type="button"
              onClick={handleSuspend}
              style={{
                padding: '0.5rem 1rem',
                background: '#DD6B20',
                color: '#FFF',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Suspend Agency
            </button>
          )}
          {agency.status === 'suspended' && (
            <button
              type="button"
              onClick={handleReactivate}
              style={{
                padding: '0.5rem 1rem',
                background: '#3182CE',
                color: '#FFF',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Reactivate Agency
            </button>
          )}
        </div>
      </div>

      {/* Grid: Profile info & Documents */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {/* Profile Info */}
        <div
          style={{
            background: '#FFFFFF',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <h2
            style={{
              fontSize: '1.25rem',
              marginTop: 0,
              marginBottom: '1rem',
              borderBottom: '1px solid #E2E8F0',
              paddingBottom: '0.5rem',
            }}
          >
            Profile Overview
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '140px 1fr',
              gap: '0.75rem',
              fontSize: '0.875rem',
            }}
          >
            <span style={{ color: '#718096' }}>Contact Person:</span>
            <span>{agency.contactPerson || '—'}</span>

            <span style={{ color: '#718096' }}>Business Email:</span>
            <span>{agency.businessEmail || agency.user?.email || '—'}</span>

            <span style={{ color: '#718096' }}>Phone:</span>
            <span>{agency.phone || '—'}</span>

            <span style={{ color: '#718096' }}>Location:</span>
            <span>
              {[agency.address, agency.city, agency.country].filter(Boolean).join(', ') || '—'}
            </span>

            <span style={{ color: '#718096' }}>Website:</span>
            <span>
              {agency.website ? (
                <a href={agency.website} target="_blank" rel="noreferrer">
                  {agency.website}
                </a>
              ) : (
                '—'
              )}
            </span>

            <span style={{ color: '#718096' }}>Description:</span>
            <span>{agency.description || '—'}</span>

            <span style={{ color: '#718096' }}>Agreement:</span>
            <span>
              {agency.agreementAccepted ? (
                <span style={{ color: '#2E9E5B', fontWeight: 600 }}>
                  Accepted ({agency.agreementVersion || 'v1'})
                </span>
              ) : (
                <span style={{ color: '#E53E3E' }}>Not Accepted</span>
              )}
            </span>

            <span style={{ color: '#718096' }}>Coverage Areas:</span>
            <div>
              {!agency.coverages || agency.coverages.length === 0 ? (
                <span style={{ color: '#E53E3E', fontStyle: 'italic' }}>
                  No operating areas configured
                </span>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {agency.coverages.map((c) => (
                    <span
                      key={c.id || c.locationName}
                      style={{
                        padding: '0.2rem 0.55rem',
                        background: '#EDF2F7',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: '#2B6CB0',
                      }}
                    >
                      📍 {c.locationName}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <span style={{ color: '#718096' }}>Services Offered:</span>
            <div>
              {!agency.capabilities || agency.capabilities.length === 0 ? (
                <span style={{ color: '#E53E3E', fontStyle: 'italic' }}>
                  No services configured
                </span>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {agency.capabilities.map((cap) => (
                    <span
                      key={cap.id || cap.serviceType}
                      style={{
                        padding: '0.2rem 0.55rem',
                        background: '#EBF8FF',
                        border: '1px solid #BEE3F8',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: '#2B6CB0',
                      }}
                    >
                      ✓ {cap.serviceType.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Verification Documents */}
        <div
          style={{
            background: '#FFFFFF',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <h2
            style={{
              fontSize: '1.25rem',
              marginTop: 0,
              marginBottom: '1rem',
              borderBottom: '1px solid #E2E8F0',
              paddingBottom: '0.5rem',
            }}
          >
            Document Verification
          </h2>
          {!agency.documents || agency.documents.length === 0 ? (
            <p style={{ color: '#718096' }}>No documents uploaded by this agency yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {agency.documents.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    padding: '0.75rem',
                    background: '#F7FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <strong>{doc.documentType?.toUpperCase()}</strong>
                    <StatusBadge status={doc.status} />
                  </div>
                  <div style={{ color: '#4A5568', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                    Filename: {doc.originalName || doc.filePath}
                  </div>
                  {doc.verificationNote ? (
                    <div style={{ color: '#E53E3E', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                      Note: {doc.verificationNote}
                    </div>
                  ) : null}
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    {doc.status !== 'approved' && (
                      <button
                        type="button"
                        onClick={() => handleVerifyDocument(doc.id)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          background: '#2E9E5B',
                          color: '#FFF',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                        }}
                      >
                        Verify Doc
                      </button>
                    )}
                    {doc.status !== 'rejected' && (
                      <button
                        type="button"
                        onClick={() => setRejectDocModal({ doc, note: '' })}
                        style={{
                          padding: '0.25rem 0.5rem',
                          background: '#E53E3E',
                          color: '#FFF',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                        }}
                      >
                        Reject Doc
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Memberships Section */}
      <div
        style={{
          background: '#FFFFFF',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Agency Memberships</h2>
          <button
            type="button"
            onClick={() => setCreateMemModal(true)}
            style={{
              padding: '0.5rem 1rem',
              background: '#2E9E5B',
              color: '#FFF',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            + Assign Plan Membership
          </button>
        </div>

        {!agency.memberships || agency.memberships.length === 0 ? (
          <p style={{ color: '#718096' }}>
            No active or past memberships associated with this agency.
          </p>
        ) : (
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: '0.875rem',
            }}
          >
            <thead>
              <tr style={{ background: '#EDF2F7' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Plan</th>
                <th style={{ padding: '0.75rem 1rem' }}>Period</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem' }}>Payment Ref</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {agency.memberships.map((mem) => (
                <tr key={mem.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                    {mem.plan?.name || `Plan #${mem.planId}`}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {new Date(mem.startsAt).toLocaleDateString()} —{' '}
                    {mem.endsAt ? new Date(mem.endsAt).toLocaleDateString() : 'Indefinite'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <StatusBadge status={mem.status} />
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>{mem.paymentReference || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    <Link
                      to={`/memberships/${mem.id}`}
                      style={{
                        padding: '0.25rem 0.5rem',
                        background: '#EDF2F7',
                        borderRadius: '4px',
                        textDecoration: 'none',
                        color: '#2D3748',
                        fontSize: '0.75rem',
                      }}
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Reject Document Modal */}
      {rejectDocModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#FFF',
              padding: '2rem',
              borderRadius: '8px',
              maxWidth: '400px',
              width: '100%',
            }}
          >
            <h3 style={{ marginTop: 0 }}>Reject Document</h3>
            <p>
              Specify reason for rejecting document{' '}
              <strong>{rejectDocModal.doc.documentType}</strong>:
            </p>
            <textarea
              value={rejectDocModal.note}
              onChange={(e) => setRejectDocModal({ ...rejectDocModal, note: e.target.value })}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '4px',
                border: '1px solid #CBD5E0',
                marginBottom: '1rem',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setRejectDocModal(null)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  border: '1px solid #CBD5E0',
                  background: '#FFF',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectDocumentConfirm}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  border: 'none',
                  background: '#E53E3E',
                  color: '#FFF',
                  cursor: 'pointer',
                }}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Membership Modal */}
      {createMemModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <form
            onSubmit={handleCreateMembership}
            style={{
              background: '#FFF',
              padding: '2rem',
              borderRadius: '8px',
              maxWidth: '450px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 0 }}>Assign Membership Plan</h3>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                Membership Plan:
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  border: '1px solid #CBD5E0',
                }}
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (${p.price} / {p.durationDays} days)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                Payment Reference / Notes:
              </label>
              <input
                type="text"
                placeholder="e.g. Bank Transfer #12345"
                value={memReference}
                onChange={(e) => setMemReference(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  border: '1px solid #CBD5E0',
                }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.5rem',
                marginTop: '1rem',
              }}
            >
              <button
                type="button"
                onClick={() => setCreateMemModal(false)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  border: '1px solid #CBD5E0',
                  background: '#FFF',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  border: 'none',
                  background: '#2E9E5B',
                  color: '#FFF',
                  cursor: 'pointer',
                }}
              >
                Create Membership
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
