// Agency application shell (Phase 5.1).

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from '@troublefree/ui';
import { AuthProvider } from './features/auth/AuthContext.jsx';
import { RequireAuth, RequireRole, PublicOnly } from './features/auth/ProtectedRoute.jsx';
import { LoginPage, RegisterPage } from './pages/auth.jsx';
import { DashboardPage } from './pages/dashboard.jsx';
import { IncomingRequestsPage } from './pages/incoming-requests.jsx';
import { AgencyRequestDetailPage } from './pages/request-detail.jsx';
import { CreateQuotationPage } from './pages/create-quotation.jsx';
import { MyQuotationsPage } from './pages/my-quotations.jsx';
import { QuotationDetailPage } from './pages/quotation-detail.jsx';
import { QuotationEditPage } from './pages/quotation-edit.jsx';
import { MessagesPage } from './pages/messages.jsx';
import { ConversationDetailPage } from './pages/conversation-detail.jsx';
import { JobsPage } from './pages/jobs.jsx';
import { JobDetailPage } from './pages/job-detail.jsx';
import { ProfilePage } from './pages/profile.jsx';

function Guarded({ children }) {
  return (
    <RequireAuth>
      <RequireRole roles={['agency']}>{children}</RequireRole>
    </RequireAuth>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider role="agency">
        <ToastProvider>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicOnly>
                  <LoginPage />
                </PublicOnly>
              }
            />
            <Route
              path="/register"
              element={
                <PublicOnly>
                  <RegisterPage />
                </PublicOnly>
              }
            />
            <Route
              path="/"
              element={
                <Guarded>
                  <DashboardPage />
                </Guarded>
              }
            />
            <Route
              path="/dashboard"
              element={
                <Guarded>
                  <DashboardPage />
                </Guarded>
              }
            />
            <Route
              path="/requests"
              element={
                <Guarded>
                  <IncomingRequestsPage />
                </Guarded>
              }
            />
            <Route
              path="/requests/:id"
              element={
                <Guarded>
                  <AgencyRequestDetailPage />
                </Guarded>
              }
            />
            <Route
              path="/requests/:id/quotations/new"
              element={
                <Guarded>
                  <CreateQuotationPage />
                </Guarded>
              }
            />
            <Route
              path="/quotations"
              element={
                <Guarded>
                  <MyQuotationsPage />
                </Guarded>
              }
            />
            <Route
              path="/quotations/:id"
              element={
                <Guarded>
                  <QuotationDetailPage />
                </Guarded>
              }
            />
            <Route
              path="/quotations/:id/edit"
              element={
                <Guarded>
                  <QuotationEditPage />
                </Guarded>
              }
            />
            <Route
              path="/messages"
              element={
                <Guarded>
                  <MessagesPage />
                </Guarded>
              }
            />
            <Route
              path="/messages/:id"
              element={
                <Guarded>
                  <ConversationDetailPage />
                </Guarded>
              }
            />
            <Route
              path="/jobs"
              element={
                <Guarded>
                  <JobsPage />
                </Guarded>
              }
            />
            <Route
              path="/jobs/:id"
              element={
                <Guarded>
                  <JobDetailPage />
                </Guarded>
              }
            />
            <Route
              path="/profile"
              element={
                <Guarded>
                  <ProfilePage />
                </Guarded>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
