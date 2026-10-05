import { AgencyAppLayout } from '../layouts/AgencyAppLayout.jsx';
import { useAuth } from '../features/auth/auth-context.js';
import { ChatWorkspace } from '../components/ChatWorkspace.jsx';

export function MessagesPage() {
  const { user } = useAuth();

  return (
    <AgencyAppLayout activeItem="messages">
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', minHeight: 0 }}>
        <div className="agency-page-header" style={{ marginBottom: '12px', flexShrink: 0 }}>
          <div>
            <h1 className="agency-page-title" style={{ fontSize: '1.4rem' }}>
              Messages & Conversations
            </h1>
            <p className="agency-page-subtitle">
              Communicate directly with travellers regarding customized travel requests and confirmed
              bookings.
            </p>
          </div>
        </div>

        <ChatWorkspace currentUserId={user?.id} currentUserRole="agency" />
      </div>
    </AgencyAppLayout>
  );
}
