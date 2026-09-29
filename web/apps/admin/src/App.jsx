import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './features/auth/AuthContext.jsx';
import { RequireAuth, RequireRole, PublicOnly } from './features/auth/ProtectedRoute.jsx';
import { LoginPage } from './pages/auth.jsx';
import { AdminLayout } from './layouts/AdminLayout.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { AgenciesPage } from './pages/AgenciesPage.jsx';
import { AgencyDetailPage } from './pages/AgencyDetailPage.jsx';
import { MembershipsPage } from './pages/MembershipsPage.jsx';
import { MembershipPlansPage } from './pages/MembershipPlansPage.jsx';
import { CommissionsPage } from './pages/CommissionsPage.jsx';
import { AdminTravelRequestsPage } from './pages/AdminTravelRequestsPage.jsx';
import { AdminJobsPage } from './pages/AdminJobsPage.jsx';
import { AuditLogsPage } from './pages/AuditLogsPage.jsx';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider role="admin">
        <Routes>
          <Route
            path="/login"
            element={
              <PublicOnly>
                <LoginPage />
              </PublicOnly>
            }
          />
          <Route path="/register" element={<Navigate to="/login" replace />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <RequireRole roles={['admin']}>
                  <AdminLayout />
                </RequireRole>
              </RequireAuth>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="agencies" element={<AgenciesPage />} />
            <Route path="agencies/:id" element={<AgencyDetailPage />} />
            <Route path="memberships" element={<MembershipsPage />} />
            <Route path="membership-plans" element={<MembershipPlansPage />} />
            <Route path="commissions" element={<CommissionsPage />} />
            <Route path="travel-requests" element={<AdminTravelRequestsPage />} />
            <Route path="jobs" element={<AdminJobsPage />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
