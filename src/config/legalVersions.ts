// Zentrale Versions- und Datumsangaben für rechtliche Dokumente.
// Bei jeder inhaltlichen Änderung Version hochzählen und Datum aktualisieren.

export const LEGAL_VERSIONS = {
  agb: { version: '1.2.0', date: '2026-07-16' },
  datenschutz: { version: '1.3.0', date: '2026-07-16' },
  cookieConsent: { version: 2, date: '2026-07-16' },
} as const;

export function formatLegalDate(iso: string, locale = 'de-DE'): string {
  try {
    return new Date(iso).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
    });
  } catch {
    return iso;
  }
}
