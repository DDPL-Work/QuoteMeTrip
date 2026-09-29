import { useState, useEffect, useCallback } from 'react';
import { travelRequestApi, jobApi, messagingApi, notificationApi } from '../../lib/api.js';

export function useTravellerDashboard() {
  const [data, setData] = useState({
    requests: null,
    jobs: null,
    conversations: null,
    unreadNotifications: null,
  });

  const [loading, setLoading] = useState({
    requests: true,
    jobs: true,
    conversations: true,
    notifications: true,
  });

  const [error, setError] = useState({
    requests: null,
    jobs: null,
    conversations: null,
    notifications: null,
  });

  const fetchRequests = useCallback(async () => {
    setLoading((l) => ({ ...l, requests: true }));
    setError((e) => ({ ...e, requests: null }));
    try {
      const result = await travelRequestApi.list();
      setData((d) => ({ ...d, requests: result.requests || result || [] }));
    } catch (err) {
      setError((e) => ({ ...e, requests: err }));
    } finally {
      setLoading((l) => ({ ...l, requests: false }));
    }
  }, []);

  const fetchJobs = useCallback(async () => {
    setLoading((l) => ({ ...l, jobs: true }));
    setError((e) => ({ ...e, jobs: null }));
    try {
      const result = await jobApi.list();
      setData((d) => ({ ...d, jobs: result.jobs || result || [] }));
    } catch (err) {
      setError((e) => ({ ...e, jobs: err }));
    } finally {
      setLoading((l) => ({ ...l, jobs: false }));
    }
  }, []);

  const fetchConversations = useCallback(async () => {
    setLoading((l) => ({ ...l, conversations: true }));
    setError((e) => ({ ...e, conversations: null }));
    try {
      const result = await messagingApi.listConversations({ limit: 5 });
      setData((d) => ({ ...d, conversations: result.conversations || result || [] }));
    } catch (err) {
      setError((e) => ({ ...e, conversations: err }));
    } finally {
      setLoading((l) => ({ ...l, conversations: false }));
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading((l) => ({ ...l, notifications: true }));
    setError((e) => ({ ...e, notifications: null }));
    try {
      const result = await notificationApi.getUnreadCount();
      setData((d) => ({ ...d, unreadNotifications: result?.count ?? 0 }));
    } catch (err) {
      setError((e) => ({ ...e, notifications: err }));
    } finally {
      setLoading((l) => ({ ...l, notifications: false }));
    }
  }, []);

  const refreshAll = useCallback(() => {
    fetchRequests();
    fetchJobs();
    fetchConversations();
    fetchNotifications();
  }, [fetchRequests, fetchJobs, fetchConversations, fetchNotifications]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Derived state
  const requests = data.requests || [];
  const jobs = data.jobs || [];

  // Aggregate quotations from requests (this depends on backend schema)
  let quotations = [];
  requests.forEach((r) => {
    if (r.Quotations && Array.isArray(r.Quotations)) {
      quotations = quotations.concat(r.Quotations);
    }
  });

  const draftRequest = requests.find((r) => r.status === 'draft');

  return {
    data: {
      ...data,
      requests,
      jobs,
      conversations: data.conversations || [],
      quotations,
      draftRequest,
    },
    loading,
    error,
    actions: {
      fetchRequests,
      fetchJobs,
      fetchConversations,
      fetchNotifications,
      refreshAll,
    },
  };
}
