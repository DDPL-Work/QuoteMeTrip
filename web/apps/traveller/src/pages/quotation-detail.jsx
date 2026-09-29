// Traveller quotation detail (Phase 6): compare + message + accept.

import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { StatusBadge } from '@troublefree/ui';
import { messagingApi, travellerQuotationApi } from '../lib/api.js';
import { QuotationDetail } from '../components/QuotationDetail.jsx';

export function QuotationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState(null);
  const [job, setJob] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await travellerQuotationApi.getById(id);
        if (!cancelled) setQuotation(data.quotation ?? data);
      } catch (e) {
        if (!cancelled) setError(e?.message ?? 'Failed to load quotation.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleMessageAgency() {
    if (!quotation) return;
    setError(null);
    try {
      const data = await messagingApi.createConversation({
        travelRequestId: quotation.travelRequestId,
        agencyId: quotation.agencyId,
      });
      const conversation = data.conversation ?? data;
      navigate(`/messages/${conversation.id}`);
    } catch (e) {
      setError(e?.message ?? 'Failed to open conversation.');
    }
  }

  async function handleAccept() {
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const data = await travellerQuotationApi.accept(id);
      setQuotation(data.quotation ?? quotation);
      setJob(data.job ?? null);
      setNotice('Quotation accepted. Your trip is booked.');
    } catch (e) {
      setError(e?.message ?? 'Failed to accept quotation.');
    } finally {
      setBusy(false);
    }
  }

  const accepted = quotation?.status === 'accepted' || job !== null;
  const agency = quotation?.agency ?? job?.agency ?? {};

  return (
    <main className="tf-page">
      <h1>
        Quotation #{id} {quotation ? <StatusBadge status={quotation.status} /> : null}
      </h1>
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      <QuotationDetail quotation={quotation} />
      {quotation && !accepted && (
        <div>
          <button type="button" className="tf-btn tf-btn-ghost" onClick={handleMessageAgency}>
            Message Agency
          </button>{' '}
          <button
            type="button"
            className="tf-btn tf-btn-primary"
            onClick={handleAccept}
            disabled={busy}
          >
            {busy ? 'Accepting…' : 'Accept Quotation'}
          </button>
        </div>
      )}
      {accepted && (
        <section className="tf-card" aria-label="Accepted contact">
          <h2>
            Accepted <StatusBadge status="accepted" />
          </h2>
          <p>
            Agency: {agency.agencyName ?? '—'}
            {agency.businessEmail ? ` — ${agency.businessEmail}` : ''}
            {agency.phone ? ` — ${agency.phone}` : ''}
            {agency.contactPerson ? ` (${agency.contactPerson})` : ''}
          </p>
          {job ? <Link to={`/jobs/${job.id}`}>View job #{job.id}</Link> : null}
        </section>
      )}
    </main>
  );
}
