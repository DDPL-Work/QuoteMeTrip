/**
 * Public Layout Wrapper for Troublefree Holiday Traveller Website (Track B).
 *
 * Renders the responsive PublicHeader, page content, and PublicFooter.
 * Automatically wires authenticated user state to header actions.
 */

import { Outlet } from 'react-router-dom';
import { PublicHeader, PublicFooter } from '@troublefree/ui';
import { useAuth } from '../features/auth/auth-context.js';

export function PublicLayout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="tf-public-shell">
      <PublicHeader user={user} onSignOut={logout} />
      <main className="tf-public-main">{children || <Outlet />}</main>
      <PublicFooter />
    </div>
  );
}
