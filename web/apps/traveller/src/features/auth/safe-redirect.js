// Safe internal redirect validator (Phase 2).
//
// Prevents open redirect security vulnerabilities by ensuring the target
// URL is a relative internal path starting with '/' and not '//' or '://'.

export function getSafeRedirect(target) {
  if (!target || typeof target !== 'string') return '/';
  const trimmed = target.trim();
  if (
    trimmed.startsWith('/') &&
    !trimmed.startsWith('//') &&
    !trimmed.startsWith('/\\') &&
    !trimmed.includes('://')
  ) {
    return trimmed;
  }
  return '/';
}
