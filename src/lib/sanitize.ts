import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ALLOWED_ATTR: [
      'href', 'title', 'target', 'rel',
      'src', 'alt', 'width', 'height', 'loading',
      'class', 'scope', 'colspan', 'rowspan',
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):)/i,
  });
}
