/**
 * Lightweight HTML Sanitizer (Phase 9).
 *
 * Sanitizes rich HTML content in Travel Guide articles to prevent XSS script injection.
 * Strips script tags, event handlers (onload, onerror, onclick), iframe, object, and javascript: links.
 */
export function sanitizeHtml(htmlString) {
  if (typeof htmlString !== 'string') return '';

  return (
    htmlString
      // Remove script blocks
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove style blocks if needed or allow safe ones
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      // Remove iframe, object, embed tags
      .replace(/<\/?(iframe|object|embed|applet|form|input|button)[^>]*>/gi, '')
      // Remove inline event handlers (e.g. onerror=..., onclick=..., onload=...)
      .replace(/\s*on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      // Neutralize javascript: pseudo-protocol URIs in href or src
      .replace(/(href|src)\s*=\s*["']?\s*javascript:[^"'\s>]+/gi, '$1="#"')
  );
}
