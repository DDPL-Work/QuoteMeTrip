import { PageHeader } from '@troublefree/ui';
import { useAuth } from '../features/auth/auth-context.js';
import { ChatWorkspace } from '../components/ChatWorkspace.jsx';
import { MotionPage } from '../components/motion/MotionPage.jsx';

export function MessagesPage() {
  const { user } = useAuth();

  return (
    <MotionPage style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', minHeight: 0 }}>
      <main
        className="tf-portal-page"
        aria-label="Messages"
        style={{ paddingBottom: 0, display: 'flex', flexDirection: 'column', flex: 1, height: '100%', minHeight: 0 }}
      >
        <PageHeader
          title="Messages"
          subtitle="Real-time messaging with licensed travel agencies regarding your trip quotations."
        />

        {/* Retain standard h1 for testing and SEO accessibility */}
        <h1
          style={{
            position: 'absolute',
            width: '1px',
            height: '1px',
            padding: 0,
            margin: '-1px',
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            border: 0,
          }}
        >
          Messages
        </h1>

        <ChatWorkspace currentUserId={user?.id} currentUserRole="traveller" />
      </main>
    </MotionPage>
  );
}
