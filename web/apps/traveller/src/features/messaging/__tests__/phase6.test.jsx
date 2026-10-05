// Traveller Phase 6 tests: messaging, acceptance, jobs.

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
  resolveMediaUrl: (url) => url,
  apiClient: {
    setAccessToken: vi.fn(),
    clearAccessToken: vi.fn(),
    getAccessToken: vi.fn(() => 'token'),
  },
  authApi: { refresh: vi.fn(), me: vi.fn(), login: vi.fn(), logout: vi.fn() },
  setUnauthorizedListener: vi.fn(),
  travellerApi: { me: vi.fn(), updateMe: vi.fn() },
  routeApi: {
    calculate: vi.fn(),
    create: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
  travelRequestApi: {
    create: vi.fn(),
    list: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
    submit: vi.fn(),
    cancel: vi.fn(),
    addDay: vi.fn(),
    updateDay: vi.fn(),
    deleteDay: vi.fn(),
    listQuotations: vi.fn(),
  },
  travellerQuotationApi: { getById: vi.fn(), accept: vi.fn() },
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
import { QuotationDetailPage } from '../../../pages/quotation-detail.jsx';
import { JobsPage } from '../../../pages/jobs.jsx';
import { JobDetailPage } from '../../../pages/job-detail.jsx';
import { authApi, travellerQuotationApi, messagingApi, jobApi } from '../../../lib/api.js';

const travellerUser = { id: 11, email: 't@example.com', role: 'traveller', status: 'active' };

function authOk() {
  authApi.refresh.mockResolvedValue({ accessToken: 'a' });
  authApi.me.mockResolvedValue({ user: travellerUser });
}

function guard(element, path, routePath) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider role="traveller">
        <Routes>
          <Route
            path={routePath}
            element={
              <RequireAuth>
                <RequireRole roles={['traveller']}>{element}</RequireRole>
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

describe('traveller phase 6', () => {
  test('messages page lists conversations', async () => {
    authOk();
    messagingApi.listConversations.mockResolvedValue({
      conversations: [
        {
          id: 1,
          travelRequestId: 7,
          status: 'active',
          agency: { agencyName: 'Sun' },
          unreadCount: 2,
          lastMessage: { body: 'Hello' },
        },
      ],
    });
    guard(<MessagesPage />, '/messages', '/messages');
    await waitFor(() => expect(screen.getByText('Conversation #1')).toBeInTheDocument());
    expect(screen.getByText(/2 unread/)).toBeInTheDocument();
  });

  test('conversation loads history, sends, and receives socket messages', async () => {
    authOk();
    messagingApi.getConversation.mockResolvedValue({ conversation: { id: 1, travelRequestId: 7 } });
    messagingApi.listMessages.mockResolvedValue({
      messages: [
        {
          id: 1,
          conversationId: 1,
          senderUserId: 99,
          messageType: 'text',
          body: 'Hi',
          createdAt: 'x',
        },
      ],
    });
    messagingApi.markRead.mockResolvedValue({ marked: 1 });
    messagingApi.sendMessage.mockResolvedValue({
      message: { id: 2, conversationId: 1, senderUserId: 11, messageType: 'text', body: 'Reply' },
    });
    guard(<ConversationDetailPage />, '/messages/1', '/messages/:id');
    await waitFor(() => expect(screen.getByText('Hi')).toBeInTheDocument());
    expect(messagingApi.markRead).toHaveBeenCalledWith('1');
    const user = userEvent.setup({ delay: null });
    await user.type(screen.getByLabelText('Message'), 'Reply');
    await user.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(screen.getByText('Reply')).toBeInTheDocument());
    handlers['conversation:message']?.({
      message: {
        id: 3,
        conversationId: 1,
        senderUserId: 99,
        messageType: 'text',
        body: 'Live hello',
      },
    });
    await waitFor(() => expect(screen.getByText('Live hello')).toBeInTheDocument());
  });

  test('quotation detail accepts and reveals contact + job link', async () => {
    authOk();
    travellerQuotationApi.getById.mockResolvedValue({
      quotation: {
        id: 5,
        travelRequestId: 7,
        agencyId: 3,
        status: 'submitted',
        quotationType: 'hotel_only',
        agency: { agencyName: 'Sun' },
        items: [],
      },
    });
    travellerQuotationApi.accept.mockResolvedValue({
      quotation: {
        id: 5,
        status: 'accepted',
        agency: { agencyName: 'Sun', businessEmail: 'a@x.com' },
      },
      job: { id: 9, agency: { agencyName: 'Sun', businessEmail: 'a@x.com' } },
      requestStatus: 'accepted',
    });
    const user = userEvent.setup({ delay: null });
    guard(<QuotationDetailPage />, '/quotations/5', '/quotations/:id');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Accept Quotation' })).toBeInTheDocument(),
    );
    await user.click(screen.getByRole('button', { name: 'Accept Quotation' }));
    await waitFor(() =>
      expect(screen.getByText('Quotation accepted. Your trip is booked.')).toBeInTheDocument(),
    );
    expect(screen.getByText(/a@x\.com/)).toBeInTheDocument();
    expect(screen.getByText('View job #9')).toBeInTheDocument();
  });

  test('quotation detail message agency opens conversation', async () => {
    authOk();
    travellerQuotationApi.getById.mockResolvedValue({
      quotation: {
        id: 5,
        travelRequestId: 7,
        agencyId: 3,
        status: 'submitted',
        quotationType: 'hotel_only',
        agency: { agencyName: 'Sun' },
        items: [],
      },
    });
    messagingApi.createConversation.mockResolvedValue({ conversation: { id: 42 } });
    const user = userEvent.setup({ delay: null });
    render(
      <MemoryRouter initialEntries={['/quotations/5']}>
        <AuthProvider role="traveller">
          <Routes>
            <Route
              path="/quotations/:id"
              element={
                <RequireAuth>
                  <RequireRole roles={['traveller']}>
                    <QuotationDetailPage />
                  </RequireRole>
                </RequireAuth>
              }
            />
            <Route
              path="/messages/:id"
              element={
                <RequireAuth>
                  <RequireRole roles={['traveller']}>
                    <ConversationDetailPage />
                  </RequireRole>
                </RequireAuth>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );
    messagingApi.getConversation.mockResolvedValue({ conversation: { id: 42 } });
    messagingApi.listMessages.mockResolvedValue({ messages: [] });
    messagingApi.markRead.mockResolvedValue({ marked: 0 });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Message Agency' })).toBeInTheDocument(),
    );
    await user.click(screen.getByRole('button', { name: 'Message Agency' }));
    await waitFor(() =>
      expect(messagingApi.createConversation).toHaveBeenCalledWith({
        travelRequestId: 7,
        agencyId: 3,
      }),
    );
    await waitFor(() => expect(screen.getByText('Conversation #42')).toBeInTheDocument());
  });

  test('jobs list and detail status display', async () => {
    authOk();
    jobApi.list.mockResolvedValue({
      jobs: [{ id: 9, travelRequestId: 7, quotationId: 5, status: 'accepted' }],
    });
    guard(<JobsPage />, '/jobs', '/jobs');
    await waitFor(() => expect(screen.getByText('Job #9')).toBeInTheDocument());

    jobApi.getById.mockResolvedValue({
      job: { id: 9, travelRequestId: 7, quotationId: 5, status: 'accepted', agency: {} },
    });
    guard(<JobDetailPage />, '/jobs/9', '/jobs/:id');
    await waitFor(() => expect(screen.getByText('Job #9')).toBeInTheDocument());
    expect(screen.getAllByText('accepted').length).toBeGreaterThan(0);
  });
});
