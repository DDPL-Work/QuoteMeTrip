import { useState, useEffect } from 'react';
import { adminApi } from '../services/api.js';
import { StatusBadge } from '@troublefree/ui';

export function MembershipPlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null); // { mode: 'create'|'edit', plan }

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
    try {
      if (mode === 'create') {
        await adminApi.createMembershipPlan(plan);
      } else {
        await adminApi.updateMembershipPlan(plan.id, plan);
      }
      setModal(null);
      loadPlans();
    } catch (err) {
      alert(`Operation failed: ${err.message}`);
    }
  };

  return (
    <div
      className="admin-plans-page"
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', color: '#23272B', margin: 0 }}>Membership Plans</h1>
          <p style={{ color: '#718096', marginTop: '0.25rem' }}>
            Configure available agency subscription tiers and duration periods.
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
            padding: '0.5rem 1rem',
            background: '#2E9E5B',
            color: '#FFF',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          + Create New Plan
        </button>
      </div>

      {loading ? (
        <div>Loading plans...</div>
      ) : error ? (
        <div style={{ color: '#E53E3E' }}>Error: {error}</div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {plans.map((p) => (
            <div
              key={p.id}
              style={{
                background: '#FFFFFF',
                padding: '1.5rem',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem',
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#23272B' }}>{p.name}</h3>
                  <StatusBadge status={p.status} />
                </div>
                <div
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: 700,
                    color: '#2E9E5B',
                    marginBottom: '0.5rem',
                  }}
                >
                  ${p.price}{' '}
                  <small style={{ fontSize: '0.875rem', color: '#718096', fontWeight: 400 }}>
                    / {p.durationDays} days
                  </small>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#4A5568', margin: 0 }}>
                  {p.description || 'No description provided.'}
                </p>
                <div style={{ fontSize: '0.75rem', color: '#A0AEC0', marginTop: '0.5rem' }}>
                  Slug: <code>{p.slug}</code>
                </div>
              </div>
              <div
                style={{
                  marginTop: '1.5rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid #EDF2F7',
                  textAlign: 'right',
                }}
              >
                <button
                  type="button"
                  onClick={() => setModal({ mode: 'edit', plan: { ...p } })}
                  style={{
                    padding: '0.35rem 0.75rem',
                    background: '#EDF2F7',
                    border: '1px solid #CBD5E0',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  Edit Plan
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Plan Form Modal */}
      {modal && (
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
            onSubmit={handleSubmit}
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
            <h3 style={{ marginTop: 0, marginBottom: 0 }}>
              {modal.mode === 'create' ? 'Create Membership Plan' : 'Edit Plan'}
            </h3>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                Plan Name:
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
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  border: '1px solid #CBD5E0',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                Slug:
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
                  padding: '0.5rem',
                  borderRadius: '4px',
                  border: '1px solid #CBD5E0',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  Price ($):
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
                    padding: '0.5rem',
                    borderRadius: '4px',
                    border: '1px solid #CBD5E0',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  Duration (Days):
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
                    padding: '0.5rem',
                    borderRadius: '4px',
                    border: '1px solid #CBD5E0',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                Status:
              </label>
              <select
                value={modal.plan.status}
                onChange={(e) =>
                  setModal({ ...modal, plan: { ...modal.plan, status: e.target.value } })
                }
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  border: '1px solid #CBD5E0',
                }}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                Description:
              </label>
              <textarea
                value={modal.plan.description || ''}
                onChange={(e) =>
                  setModal({ ...modal, plan: { ...modal.plan, description: e.target.value } })
                }
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
                onClick={() => setModal(null)}
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
                Save Plan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
