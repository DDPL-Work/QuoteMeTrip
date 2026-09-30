// Traveller application shell (Phase 4 + Track B Public Website + Phase 1 Traveller Portal Shell).

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { I18nProvider } from '@troublefree/i18n';
import { AuthProvider } from './features/auth/AuthContext.jsx';
import { RequireAuth, RequireRole, PublicOnly } from './features/auth/ProtectedRoute.jsx';
import { TripProvider } from './features/trip/TripContext.jsx';
import { PublicLayout } from './layouts/PublicLayout.jsx';
import { TravellerAppLayout } from './layouts/TravellerAppLayout.jsx';

import { LoginPage, RegisterPage } from './pages/auth.jsx';
import { DashboardPage } from './pages/dashboard.jsx';
import { ProfilePage } from './pages/profile.jsx';
import { PlanTripPage } from './pages/plan-trip.jsx';
import { TravelRequestsPage } from './pages/travel-requests.jsx';
import { TravelRequestDetailPage } from './pages/travel-request-detail.jsx';
import { QuotationDetailPage } from './pages/quotation-detail.jsx';
import { MessagesPage } from './pages/messages.jsx';
import { ConversationDetailPage } from './pages/conversation-detail.jsx';
import { JobsPage } from './pages/jobs.jsx';
import { JobDetailPage } from './pages/job-detail.jsx';

import { PublicHomePage } from './pages/public/HomePage.jsx';
import { DestinationsPage } from './pages/public/DestinationsPage.jsx';
import { DestinationDetailPage } from './pages/public/DestinationDetailPage.jsx';
import { TravelGuidePage } from './pages/public/TravelGuidePage.jsx';
import { TravelGuideDetailPage } from './pages/public/TravelGuideDetailPage.jsx';
import { AgenciesPage } from './pages/public/AgenciesPage.jsx';
import { AgencyDetailPage } from './pages/public/AgencyDetailPage.jsx';
import { AboutPage } from './pages/public/AboutPage.jsx';
import { ContactPage } from './pages/public/ContactPage.jsx';

import { AppPreloader } from './components/loading/AppPreloader.jsx';
import { useAuth } from './features/auth/auth-context.js';

function AppBootstrapWrapper({ children }) {
  const { isLoading } = useAuth();
  return (
    <>
      <AppPreloader isLoading={isLoading} />
      {children}
    </>
  );
}

function Guarded({ children }) {
  return (
    <RequireAuth>
      <RequireRole roles={['traveller']}>{children}</RequireRole>
    </RequireAuth>
  );
}

function App() {
  return (
    <BrowserRouter>
      <I18nProvider>
        <AuthProvider role="traveller">
          <AppBootstrapWrapper>
            <TripProvider>
            <Routes>
              {/* Public Website Routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<PublicHomePage />} />
                <Route path="/destinations" element={<DestinationsPage />} />
                <Route path="/destinations/:slug" element={<DestinationDetailPage />} />
                <Route path="/travel-guide" element={<TravelGuidePage />} />
                <Route path="/travel-guide/:slug" element={<TravelGuideDetailPage />} />
                <Route path="/agencies" element={<AgenciesPage />} />
                <Route path="/agencies/:id" element={<AgencyDetailPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
              </Route>

              {/* Public Auth Entry */}
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

              {/* Authenticated Portal Routes */}
              <Route
                element={
                  <Guarded>
                    <TravellerAppLayout />
                  </Guarded>
                }
              >
                <Route path="/app" element={<DashboardPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/app/profile" element={<ProfilePage />} />
                <Route path="/plan-trip" element={<PlanTripPage />} />
                <Route path="/app/plan-trip" element={<PlanTripPage />} />
                <Route path="/travel-requests" element={<TravelRequestsPage />} />
                <Route path="/app/travel-requests" element={<TravelRequestsPage />} />
                <Route path="/travel-requests/:id" element={<TravelRequestDetailPage />} />
                <Route path="/app/travel-requests/:id" element={<TravelRequestDetailPage />} />
                <Route path="/quotations/:id" element={<QuotationDetailPage />} />
                <Route path="/app/quotations/:id" element={<QuotationDetailPage />} />
                <Route path="/messages" element={<MessagesPage />} />
                <Route path="/app/messages" element={<MessagesPage />} />
                <Route path="/messages/:id" element={<ConversationDetailPage />} />
                <Route path="/app/messages/:id" element={<ConversationDetailPage />} />
                <Route path="/jobs" element={<JobsPage />} />
                <Route path="/app/jobs" element={<JobsPage />} />
                <Route path="/jobs/:id" element={<JobDetailPage />} />
                <Route path="/app/jobs/:id" element={<JobDetailPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </TripProvider>
        </AppBootstrapWrapper>
      </AuthProvider>
      </I18nProvider>
    </BrowserRouter>
  );
}

export default App;
