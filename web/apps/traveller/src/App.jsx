// Traveller application shell (Phase 4 + Track B Public Website + Phase 1 Traveller Portal Shell).

import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { ToastProvider } from '@troublefree/ui';
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
import { QuotationComparisonPage } from './pages/quotation-comparison.jsx';

import { MessagesPage } from './pages/messages.jsx';
import { ConversationDetailPage } from './pages/conversation-detail.jsx';
import { JobsPage } from './pages/jobs.jsx';
import { JobDetailPage } from './pages/job-detail.jsx';

import { PublicHomePage } from './pages/public/HomePage.jsx';
import { DestinationsPage } from './pages/public/DestinationsPage.jsx';
import { CountryDestinationPage } from './pages/public/CountryDestinationPage.jsx';
import { DestinationDetailPage } from './pages/public/DestinationDetailPage.jsx';
import { TravelServicesPage } from './pages/public/TravelServicesPage.jsx';
import { TravelServiceDetailPage } from './pages/public/TravelServiceDetailPage.jsx';
import { TravelGuidePage } from './pages/public/TravelGuidePage.jsx';
import { TravelGuideDetailPage } from './pages/public/TravelGuideDetailPage.jsx';
import { AgenciesPage } from './pages/public/AgenciesPage.jsx';
import { AgencyDetailPage } from './pages/public/AgencyDetailPage.jsx';
import { HowItWorksPage } from './pages/public/HowItWorksPage.jsx';
import { AboutPage } from './pages/public/AboutPage.jsx';
import { ContactPage } from './pages/public/ContactPage.jsx';
import { NotFoundPage } from './pages/public/NotFoundPage.jsx';

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

function DestinationCountryOrRedirect() {
  const { countrySlug } = useParams();
  const lower = (countrySlug || '').toLowerCase();
  if (lower === 'turkey') {
    return <CountryDestinationPage />;
  }
  const knownDestinations = [
    'istanbul',
    'cappadocia',
    'antalya',
    'pamukkale',
    'efes',
    'bodrum',
    'ephesus-izmir',
    'ephesus',
    'trabzon-rize',
  ];
  if (knownDestinations.includes(lower)) {
    const canonicalSlug = lower === 'ephesus-izmir' || lower === 'ephesus' ? 'efes' : lower;
    return <Navigate to={`/destinations/turkey/${canonicalSlug}`} replace />;
  }
  return <NotFoundPage />;
}

function AgencyRouteResolver() {
  const { locationOrId } = useParams();
  if (!locationOrId) return <AgenciesPage />;
  if (/^\d+$/.test(locationOrId)) {
    return <AgencyDetailPage agencyId={locationOrId} />;
  }
  return <AgenciesPage locationFilter={locationOrId} />;
}

function LegacyTravelGuideRedirect() {
  const { slug } = useParams();
  const aliasMap = {
    'first-time-turkey-itinerary': 'istanbul',
    'cappadocia-balloon-guide': 'cappadocia',
    'best-mediterranean-beaches': 'antalya',
    'turkish-cuisine-foodie-guide': 'ephesus',
  };
  const target = aliasMap[slug] || slug;
  return <Navigate to={`/travel-guides/${target}`} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <I18nProvider>
        <AuthProvider role="traveller">
          <ToastProvider>
            <AppBootstrapWrapper>
              <TripProvider>
                <Routes>
                  {/* Public Website Routes */}
                  <Route element={<PublicLayout />}>
                    {/* Main public pages */}
                    <Route path="/" element={<PublicHomePage />} />
                    <Route path="/how-it-works" element={<HowItWorksPage />} />
                    <Route path="/about-us" element={<AboutPage />} />
                    <Route path="/contact" element={<ContactPage />} />

                    {/* Destinations */}
                    <Route path="/destinations" element={<DestinationsPage />} />
                    <Route path="/destinations/:countrySlug" element={<DestinationCountryOrRedirect />} />
                    <Route
                      path="/destinations/:countrySlug/:destinationSlug"
                      element={<DestinationDetailPage />}
                    />

                    {/* Travel services */}
                    <Route path="/travel-services" element={<TravelServicesPage />} />
                    <Route
                      path="/travel-services/:serviceSlug"
                      element={<TravelServiceDetailPage />}
                    />

                    {/* Travel guides */}
                    <Route path="/travel-guides" element={<TravelGuidePage />} />
                    <Route
                      path="/travel-guides/:guideSlug"
                      element={<TravelGuideDetailPage />}
                    />

                    {/* Agencies */}
                    <Route path="/agencies" element={<AgenciesPage />} />
                    <Route
                      path="/agencies/turkey"
                      element={<AgenciesPage locationFilter="turkey" />}
                    />
                    <Route
                      path="/agencies/istanbul"
                      element={<AgenciesPage locationFilter="istanbul" />}
                    />
                    <Route
                      path="/agencies/cappadocia"
                      element={<AgenciesPage locationFilter="cappadocia" />}
                    />
                    <Route path="/agencies/:locationOrId" element={<AgencyRouteResolver />} />

                    {/* Backward compatibility redirects */}
                    <Route path="/about" element={<Navigate to="/about-us" replace />} />
                    <Route path="/travel-guide" element={<Navigate to="/travel-guides" replace />} />
                    <Route path="/travel-guide/:slug" element={<LegacyTravelGuideRedirect />} />

                    {/* Public 404 Catch-All */}
                    <Route path="*" element={<NotFoundPage />} />
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
                    <Route
                      path="/travel-requests/:requestId/compare"
                      element={<QuotationComparisonPage />}
                    />
                    <Route
                      path="/app/travel-requests/:requestId/compare"
                      element={<QuotationComparisonPage />}
                    />
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
                </Routes>
              </TripProvider>
            </AppBootstrapWrapper>
          </ToastProvider>
        </AuthProvider>
      </I18nProvider>
    </BrowserRouter>
  );
}

export default App;
