// Agency Phase 6 tests: messaging, jobs, dashboard counts.

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const handlers = {};
const fakeSocket = {
  connected: false,
  connect: vi.fn(),
  disconnect: vi.fn(),
  on: vi.fn((event, handler) => {
    handlers[event] = handler;
  }),
  off: vi.fn((event) => {
    delete handlers[event];
  }),
  emit: vi.fn((event, _payload, ack) => {
    if (typeof ack === 'function') ack({ ok: true });
  }),
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => fakeSocket),
}));

vi.mock('../../../lib/api.js', () => ({
  apiClient: {
    setAccessToken: vi.fn(),
    clearAccessToken: vi.fn(),
    getAccessToken: vi.fn(() => 'token'),
  },
  authApi: { refresh: vi.fn(), me: vi.fn(), login: vi.fn(), logout: vi.fn() },
  setUnauthorizedListener: vi.fn(),
  agencyRequestApi: { list: vi.fn(), getById: vi.fn(), markViewed: vi.fn() },
  agencyQuotationApi: {
    createForRequest: vi.fn(),
    list: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
    submit: vi.fn(),
    withdraw: vi.fn(),
  },
  messagingApi: {
    listConversations: vi.fn(),
    createConversation: vi.fn(),
    getConversation: vi.fn(),
    listMessages: vi.fn(),
    sendMessage: vi.fn(),
    markRead: vi.fn(),
  },
  jobApi: { list: vi.fn(), getById: vi.fn(), updateStatus: vi.fn() },
  apiBaseUrl: 'http://localhost:5000',
}));

import { AuthProvider } from '../../auth/AuthContext.jsx';
import { RequireAuth, RequireRole } from '../../auth/ProtectedRoute.jsx';
import { MessagesPage } from '../../../pages/messages.jsx';
import { ConversationDetailPage } from '../../../pages/conversation-detail.jsx';
import { JobsPage } from '../../../pages/jobs.jsx';
import { JobDetailPage } from '../../../pages/job-detail.jsx';
import { DashboardPage } from '../../../pages/dashboard.jsx';
import {
  authApi,
  agencyRequestApi,
  agencyQuotationApi,
  messagingApi,
  jobApi,
} from '../../../lib/api.js';

const agencyUser = { id: 21, email: 'a@example.com', role: 'agency', status: 'active' };

function authOk() {
  authApi.refresh.mockResolvedValue({ accessToken: 'a' });
  authApi.me.mockResolvedValue({ user: agencyUser });
}

function guard(element, path, routePath) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider role="agency">
        <Routes>
          <Route
            path={routePath}
            element={
              <RequireAuth>
                <RequireRole roles={['agency']}>{element}</RequireRole>
              </RequireAuth>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  for (const key of Object.keys(handlers)) delete handlers[key];
});

describe('agency phase 6', () => {
  test('messages page lists conversations', async () => {
    authOk();
    messagingApi.listConversations.mockResolvedValue({
      conversations: [
        {
          id: 2,
          travelRequestId: 7,
          status: 'active',
          traveller: { firstName: 'Asha' },
          unreadCount: 1,
          lastMessage: { body: 'Hi' },
        },
      ],
    });
    guard(<MessagesPage />, '/messages', '/messages');
    await waitFor(() => expect(screen.getByText('Conversation #2')).toBeInTheDocument());
    expect(screen.getByText(/Asha/)).toBeInTheDocument();
  });

  test('conversation sends and receives live messages', async () => {
    authOk();
    messagingApi.listMessages.mockResolvedValue({
      messages: [
        { id: 1, conversationId: 2, senderUserId: 11, messageType: 'text', body: 'Hello' },
      ],
    });
    messagingApi.markRead.mockResolvedValue({ marked: 1 });
    messagingApi.sendMessage.mockResolvedValue({
      message: { id: 2, conversationId: 2, senderUserId: 21, messageType: 'text', body: 'Reply' },
    });
    guard(<ConversationDetailPage />, '/messages/2', '/messages/:id');
    await waitFor(() => expect(screen.getByText('Hello')).toBeInTheDocument());
    const user = userEvent.setup({ delay: null });
    await user.type(screen.getByLabelText('Message'), 'Reply');
    await user.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() =>
      expect(messagingApi.sendMessage).toHaveBeenCalledWith('2', { body: 'Reply' }),
    );
    handlers['conversation:message']?.({
      message: { id: 3, conversationId: 2, senderUserId: 11, messageType: 'text', body: 'Live' },
    });
    await waitFor(() => expect(screen.getByText('Live')).toBeInTheDocument());
  });

  test('jobs list and detail update', async () => {
    authOk();
    jobApi.list.mockResolvedValue({
      jobs: [{ id: 9, travelRequestId: 7, quotationId: 5, status: 'accepted' }],
    });
    guard(<JobsPage />, '/jobs', '/jobs');
    await waitFor(() => expect(screen.getByText('Job #9')).toBeInTheDocument());

    jobApi.getById.mockResolvedValue({
      job: {
        id: 9,
        travelRequestId: 7,
        quotationId: 5,
        status: 'in_progress',
        traveller: { firstName: 'Asha' },
      },
    });
    jobApi.updateStatus.mockResolvedValue({
      job: { id: 9, travelRequestId: 7, quotationId: 5, status: 'completed', traveller: {} },
    });
    const user = userEvent.setup({ delay: null });
    guard(<JobDetailPage />, '/jobs/9', '/jobs/:id');
    await waitFor(() => expect(screen.getByText(/Asha/)).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Complete trip' }));
    await waitFor(() => expect(jobApi.updateStatus).toHaveBeenCalledWith('9', 'completed'));
  });

  test('dashboard shows conversations and jobs counts', async () => {
    authOk();
    agencyRequestApi.list.mockResolvedValue({ pagination: { totalItems: 4 } });
    agencyQuotationApi.list.mockResolvedValue({ quotations: [{ id: 1 }] });
    messagingApi.listConversations.mockResolvedValue({
      pagination: { totalItems: 3 },
      conversations: [],
    });
    jobApi.list.mockResolvedValue({ jobs: [{ id: 9 }, { id: 10 }] });
    guard(<DashboardPage />, '/', '/');
    await waitFor(() => expect(screen.getByText(/Active Conversations \(3\)/)).toBeInTheDocument());
    expect(screen.getByText(/Accepted Jobs \(2\)/)).toBeInTheDocument();
  });
});
