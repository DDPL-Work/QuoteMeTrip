import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { travelRequestApi } from '../lib/api.js';
import { TravelRequestForm } from '../components/TravelRequestForm.jsx';
import { DayByDayPlanner } from '../components/DayByDayPlanner.jsx';
import { TravelRequestSummary } from '../components/TravelRequestSummary.jsx';
import { QuotationList } from '../components/QuotationList.jsx';
import { QuotationDetail } from '../components/QuotationDetail.jsx';
import { travellerQuotationApi } from '../lib/api.js';

const QUOTATION_VISIBLE_STATUSES = ['submitted', 'matching', 'quoted', 'accepted', 'completed'];

export function TravelRequestDetailPage() {
  const { id } = useParams();
  const [draft, setDraft] = useState(null);
  const [days, setDays] = useState([]);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [quotations, setQuotations] = useState([]);
  const [selectedQuotation, setSelectedQuotation] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await travelRequestApi.getById(id);
        if (cancelled) return;
        const req = data.request ?? data;
        setDraft(req);
        setDays(req.days ?? []);
        if (QUOTATION_VISIBLE_STATUSES.includes(req.status)) {
          try {
            const q = await travelRequestApi.listQuotations(id);
            if (!cancelled) setQuotations(q.quotations ?? q ?? []);
          } catch {
            // Quotations are supplementary; the request view still renders.
          }
        }
      } catch (e) {
        if (!cancelled) setError(e?.message ?? 'Failed to load request.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleUpdate(form) {
    setNotice(null);
    try {
      const updated = await travelRequestApi.update(id, form);
      setDraft(updated.request ?? updated);
      setNotice('Draft saved.');
    } catch (e) {
      setError(e?.message ?? 'Failed to update request.');
    }
  }

  async function handleSubmit() {
    try {
      const updated = await travelRequestApi.submit(id);
      setDraft(updated.request ?? updated);
      setNotice('Request submitted.');
    } catch (e) {
      setError(e?.message ?? 'Failed to submit request.');
    }
  }

  async function handleCancel() {
    try {
      const updated = await travelRequestApi.cancel(id);
      setDraft(updated.request ?? updated);
      setNotice('Request cancelled.');
    } catch (e) {
      setError(e?.message ?? 'Failed to cancel request.');
    }
  }

  async function handleViewQuotation(quotationId) {
    try {
      const data = await travellerQuotationApi.getById(quotationId);
      setSelectedQuotation(data.quotation ?? data);
    } catch (e) {
      setError(e?.message ?? 'Failed to load quotation.');
    }
  }

  return (
    <main>
      <h1>Travel request #{id}</h1>
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      <TravelRequestSummary request={draft} />
      {draft && <TravelRequestForm initial={draft} onSubmit={handleUpdate} />}
      <DayByDayPlanner
        days={days}
        onAdd={async (day) => {
          const created = await travelRequestApi.addDay(id, day);
          const d = created.day ?? created;
          setDays((prev) => [...prev, d]);
        }}
        onUpdate={async (dayId, day) => {
          const updated = await travelRequestApi.updateDay(id, dayId, day);
          const d = updated.day ?? updated;
          setDays((prev) => prev.map((x) => (x.id === dayId ? d : x)));
        }}
        onDelete={async (dayId) => {
          await travelRequestApi.deleteDay(id, dayId);
          setDays((prev) => prev.filter((x) => x.id !== dayId));
        }}
      />
      <button type="button" onClick={handleSubmit}>
        Submit request
      </button>
      <button type="button" onClick={handleCancel}>
        Cancel request
      </button>
      {draft && QUOTATION_VISIBLE_STATUSES.includes(draft.status) && (
        <section aria-label="Request quotations">
          <h2>Quotations</h2>
          <QuotationList quotations={quotations} />
          {quotations.length > 0 && (
            <ul aria-label="Quotation quick view">
              {quotations.map((q) => (
                <li key={q.id}>
                  <button type="button" onClick={() => handleViewQuotation(q.id)}>
                    View quotation #{q.id}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {selectedQuotation && <QuotationDetail quotation={selectedQuotation} />}
        </section>
      )}
    </main>
  );
}
