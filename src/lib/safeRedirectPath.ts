/**
 * Sikker intern redirect-sti (samme opprinnelse).
 * Blokkerer åpne redirects (https://…, //host, javascript:, osv.).
 */
export function safeRedirectPath(
  next: string | null | undefined,
  fallback = '/dashboard',
): string {
  if (next == null || typeof next !== 'string') return fallback
  const t = next.trim()
  if (!t) return fallback
  if (!t.startsWith('/') || t.startsWith('//')) return fallback
  if (/[\x00-\x1f\x7f\\]/.test(t)) return fallback
  if (t.includes('://')) return fallback
  return t
}
