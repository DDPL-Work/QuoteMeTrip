import { useState, useEffect } from 'react';
import { adminApi } from '../services/api.js';
import { ConfirmModal } from '../components/ConfirmModal.jsx';
import { AlertBanner } from '../components/AlertBanner.jsx';
import { FiPlus, FiTrash2, FiEdit2, FiClock, FiX } from 'react-icons/fi';

export function MembershipPlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', message }
  const [modal, setModal] = useState(null); // { mode: 'create'|'edit', plan }
  const [planToDelete, setPlanToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadPlans = () => {
    setLoading(true);
    adminApi
      .listMembershipPlans()
      .then((data) => {
        setPlans(data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { mode, plan } = modal;
    setIsSubmitting(true);
    setFeedback(null);
    try {
      if (mode === 'create') {
        await adminApi.createMembershipPlan(plan);
        setFeedback({ type: 'success', message: `Membership plan "${plan.name}" created successfully.` });
      } else {
        await adminApi.updateMembershipPlan(plan.id, plan);
        setFeedback({ type: 'success', message: `Membership plan "${plan.name}" updated successfully.` });
      }
      setModal(null);
      loadPlans();
    } catch (err) {
      setFeedback({ type: 'error', message: `Operation failed: ${err.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeDelete = async () => {
    if (!planToDelete) return;
    setIsDeleting(true);
    setFeedback(null);
    try {
      await adminApi.deleteMembershipPlan(planToDelete.id);
      setFeedback({
        type: 'success',
        message: `Membership plan "${planToDelete.name}" has been deleted.`,
      });
      if (modal?.plan?.id === planToDelete.id) {
        setModal(null);
      }
      setPlanToDelete(null);
      loadPlans();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: `Delete failed: ${err.message}`,
      });
      setPlanToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="admin-plans-page"
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: '#0F172A',
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            Membership Plans
          </h1>
          <p style={{ color: '#64748B', marginTop: '0.25rem', marginBottom: 0, fontSize: '0.95rem' }}>
            Configure available agency subscription tiers, pricing, and active durations.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            setModal({
              mode: 'create',
              plan: {
                name: '',
                slug: '',
                price: 99.0,
                currency: 'USD',
                durationDays: 30,
                status: 'active',
                description: '',
              },
            })
          }
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1.25rem',
            background: '#0C4E28',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.9rem',
            boxShadow: '0 2px 4px rgba(12, 78, 40, 0.2)',
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#093C1F')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#0C4E28')}
        >
          <FiPlus style={{ fontSize: '1.1rem' }} />
          Create New Plan
        </button>
      </div>

      {/* Inline Feedback Banner */}
      {feedback && (
        <AlertBanner
          type={feedback.type}
          message={feedback.message}
          onClose={() => setFeedback(null)}
        />
      )}

      {loading ? (
        <div
          style={{
            background: '#FFFFFF',
            padding: '3rem',
            borderRadius: '12px',
            textAlign: 'center',
            color: '#64748B',
            border: '1px solid #E2E8F0',
          }}
        >
          <div
            style={{
              display: 'inline-block',
              width: '28px',
              height: '28px',
              border: '3px solid #CBD5E1',
              borderTopColor: '#0C4E28',
              borderRadius: '50%',
              animation: 'spin 0.6s linear infinite',
              marginBottom: '0.75rem',
            }}
          />
          <div>Loading membership plans...</div>
        </div>
      ) : error ? (
        <div
          style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#991B1B',
            padding: '1rem',
            borderRadius: '8px',
          }}
        >
          Error loading plans: {error}
        </div>
      ) : plans.length === 0 ? (
        <div
          style={{
            background: '#FFFFFF',
            padding: '3rem',
            textAlign: 'center',
            color: '#64748B',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
          }}
        >
          <p style={{ margin: 0, fontSize: '1rem', fontWeight: 500 }}>No membership plans configured yet.</p>
          <p style={{ margin: '0.5rem 0 1.25rem 0', fontSize: '0.875rem', color: '#94A3B8' }}>
            Click &quot;Create New Plan&quot; to define your first subscription tier.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {plans.map((p) => {
            const isActive = p.status === 'active';
            return (
              <div
                key={p.id}
                style={{
                  background: '#FFFFFF',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.08)';
                  e.currentTarget.style.borderColor = '#CBD5E1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.02)';
                  e.currentTarget.style.borderColor = '#E2E8F0';
                }}
              >
                <div>
                  {/* Card Header: Title & Status Badge */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '1.2rem',
                        fontWeight: 700,
                        color: '#0F172A',
                      }}
                    >
                      {p.name}
                    </h3>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'capitalize',
                        background: isActive ? '#ECFDF5' : '#F1F5F9',
                        color: isActive ? '#059669' : '#64748B',
                        border: `1px solid ${isActive ? '#A7F3D0' : '#CBD5E1'}`,
                      }}
                    >
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: isActive ? '#10B981' : '#94A3B8',
                        }}
                      />
                      {p.status}
                    </span>
                  </div>

                  {/* Price and Duration */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '0.35rem',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '1.75rem',
                        fontWeight: 800,
                        color: '#0C4E28',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      ${parseFloat(p.price).toFixed(2)}
                    </span>
                    <span
                      style={{
                        fontSize: '0.875rem',
                        color: '#64748B',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <FiClock style={{ fontSize: '0.8rem', opacity: 0.7 }} />
                      / {p.durationDays} days
                    </span>
                  </div>

                  {/* Description */}
                  <p
                    style={{
                      fontSize: '0.875rem',
                      color: '#475569',
                      margin: 0,
                      lineHeight: 1.5,
                      minHeight: '2.5rem',
                    }}
                  >
                    {p.description || 'No description provided.'}
                  </p>

                  {/* Slug */}
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: '#94A3B8',
                      marginTop: '0.75rem',
                    }}
                  >
                    Slug:{' '}
                    <code
                      style={{
                        background: '#F1F5F9',
                        padding: '0.15rem 0.35rem',
                        borderRadius: '4px',
                        color: '#334155',
                      }}
                    >
                      {p.slug}
                    </code>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div
                  style={{
                    marginTop: '1.5rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid #F1F5F9',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '0.625rem',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setPlanToDelete(p)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.45rem 0.85rem',
                      background: '#FFF',
                      color: '#DC2626',
                      border: '1px solid #FECACA',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#FEF2F2';
                      e.currentTarget.style.borderColor = '#FCA5A5';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#FFF';
                      e.currentTarget.style.borderColor = '#FECACA';
                    }}
                  >
                    <FiTrash2 style={{ fontSize: '0.9rem' }} />
                    Delete Plan
                  </button>
                  <button
                    type="button"
                    onClick={() => setModal({ mode: 'edit', plan: { ...p } })}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.45rem 0.85rem',
                      background: '#F8FAFC',
                      color: '#1E293B',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#F1F5F9';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#F8FAFC';
                    }}
                  >
                    <FiEdit2 style={{ fontSize: '0.9rem' }} />
                    Edit Plan
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Plan Form Modal (Create / Edit) */}
      {modal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <form
            onSubmit={handleSubmit}
            style={{
              background: '#FFFFFF',
              padding: '2rem',
              borderRadius: '16px',
              maxWidth: '480px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #E2E8F0',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #F1F5F9',
                paddingBottom: '0.75rem',
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#0F172A',
                }}
              >
                {modal.mode === 'create' ? 'Create Membership Plan' : 'Edit Membership Plan'}
              </h3>
              <button
                type="button"
                onClick={() => setModal(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  fontSize: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <FiX />
              </button>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#334155',
                  marginBottom: '0.35rem',
                }}
              >
                Plan Name <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                required
                value={modal.plan.name}
                onChange={(e) => {
                  const name = e.target.value;
                  const slug = name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)/g, '');
                  setModal({
                    ...modal,
                    plan: {
                      ...modal.plan,
                      name,
                      slug: modal.mode === 'create' ? slug : modal.plan.slug,
                    },
                  });
                }}
                placeholder="e.g. Gold Subscription"
                style={{
                  width: '100%',
                  padding: '0.625rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#334155',
                  marginBottom: '0.35rem',
                }}
              >
                Slug <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                required
                value={modal.plan.slug}
                onChange={(e) =>
                  setModal({ ...modal, plan: { ...modal.plan, slug: e.target.value } })
                }
                style={{
                  width: '100%',
                  padding: '0.625rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: '#334155',
                    marginBottom: '0.35rem',
                  }}
                >
                  Price (USD $) <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={modal.plan.price}
                  onChange={(e) =>
                    setModal({
                      ...modal,
                      plan: { ...modal.plan, price: parseFloat(e.target.value) || 0 },
                    })
                  }
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: '#334155',
                    marginBottom: '0.35rem',
                  }}
                >
                  Duration (Days) <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="number"
                  required
                  value={modal.plan.durationDays}
                  onChange={(e) =>
                    setModal({
                      ...modal,
                      plan: { ...modal.plan, durationDays: parseInt(e.target.value, 10) || 30 },
                    })
                  }
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#334155',
                  marginBottom: '0.35rem',
                }}
              >
                Status
              </label>
              <select
                value={modal.plan.status}
                onChange={(e) =>
                  setModal({ ...modal, plan: { ...modal.plan, status: e.target.value } })
                }
                style={{
                  width: '100%',
                  padding: '0.625rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  background: '#FFFFFF',
                }}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#334155',
                  marginBottom: '0.35rem',
                }}
              >
                Description
              </label>
              <textarea
                rows={3}
                value={modal.plan.description || ''}
                onChange={(e) =>
                  setModal({ ...modal, plan: { ...modal.plan, description: e.target.value } })
                }
                placeholder="Brief summary of subscription benefits..."
                style={{
                  width: '100%',
                  padding: '0.625rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: modal.mode === 'edit' ? 'space-between' : 'flex-end',
                alignItems: 'center',
                gap: '0.75rem',
                marginTop: '0.5rem',
                paddingTop: '1rem',
                borderTop: '1px solid #F1F5F9',
              }}
            >
              {modal.mode === 'edit' && (
                <button
                  type="button"
                  onClick={() => setPlanToDelete(modal.plan)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.625rem 1rem',
                    borderRadius: '6px',
                    border: '1px solid #FECACA',
                    background: '#FEF2F2',
                    color: '#DC2626',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  <FiTrash2 />
                  Delete Plan
                </button>
              )}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  disabled={isSubmitting}
                  style={{
                    padding: '0.625rem 1.25rem',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#475569',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '0.625rem 1.25rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#0C4E28',
                    color: '#FFFFFF',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    opacity: isSubmitting ? 0.75 : 1,
                  }}
                >
                  {isSubmitting ? 'Saving...' : 'Save Plan'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Modern Custom Delete Confirmation Dialog (Replaces native browser alert/confirm) */}
      <ConfirmModal
        isOpen={Boolean(planToDelete)}
        title="Delete Membership Plan"
        message={
          planToDelete
            ? `Are you sure you want to permanently delete the membership plan "${planToDelete.name}"? This action will remove the plan from agency selection.`
            : ''
        }
        confirmText="Delete Plan"
        cancelText="Cancel"
        variant="danger"
        loading={isDeleting}
        onConfirm={executeDelete}
        onCancel={() => !isDeleting && setPlanToDelete(null)}
      />
    </div>
  );
}
