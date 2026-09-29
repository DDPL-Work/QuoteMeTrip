// User-safe auth error messages (Phase 3).
//
// Backend auth messages are already safe to display; this helper only
// guarantees a fallback so the UI never renders an empty error.

export function friendlyAuthMessage(error) {
  if (error && typeof error.message === 'string' && error.message.trim()) {
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}
