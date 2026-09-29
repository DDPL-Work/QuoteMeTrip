// Agency dashboard (Phase 5 inbox + Phase 6 conversations/jobs).

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/auth-context.js';
import { agencyRequestApi, agencyQuotationApi, jobApi, messagingApi } from '../lib/api.js';

export function DashboardPage() {
  const { user, logout } = useAuth();
  const [counts, setCounts] = useState({
    inbox: null,
    quotations: null,
    conversations: null,
    jobs: null,
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const inbox = await agencyRequestApi.list({
          matchStatus: 'matched,viewed,quoted',
          pageSize: 1,
        });
        const quotes = await agencyQuotationApi.list();
        let conversations = null;
        let jobs = null;
        try {
          conversations = await messagingApi.listConversations({ page: 1, pageSize: 1 });
        } catch {
          conversations = null;
        }
        try {
          jobs = await jobApi.list();
        } catch {
          jobs = null;
        }
        if (cancelled) return;
        const inboxTotal =
          inbox?.pagination?.totalItems ?? inbox?.requests?.length ?? inbox?.data?.length ?? 0;
        const quoteList = quotes?.quotations ?? quotes ?? [];
        const conversationTotal =
          conversations?.pagination?.totalItems ?? conversations?.conversations?.length ?? null;
        const jobList = jobs?.jobs ?? jobs ?? [];
        setCounts({
          inbox: inboxTotal,
          quotations: quoteList.length,
          conversations: conversationTotal,
          jobs: Array.isArray(jobList) ? jobList.length : null,
        });
      } catch (e) {
        if (!cancelled) setError(e?.message ?? 'Failed to load dashboard.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="tf-page">
      <h1>Agency dashboard</h1>
      <p>
        Signed in as {user?.email} ({user?.role}).
      </p>
      {error && <p role="alert">{error}</p>}
      <ul>
        <li>
          <Link to="/requests">
            Incoming requests{counts.inbox !== null ? ` (${counts.inbox})` : ''}
          </Link>
        </li>
        <li>
          <Link to="/quotations">
            My quotations{counts.quotations !== null ? ` (${counts.quotations})` : ''}
          </Link>
        </li>
        <li>
          <Link to="/messages">
            Active Conversations{counts.conversations !== null ? ` (${counts.conversations})` : ''}
          </Link>
        </li>
        <li>
          <Link to="/jobs">Accepted Jobs{counts.jobs !== null ? ` (${counts.jobs})` : ''}</Link>
        </li>
      </ul>
      <button type="button" className="tf-btn tf-btn-ghost" onClick={logout}>
        Sign out
      </button>
    </main>
  );
}
