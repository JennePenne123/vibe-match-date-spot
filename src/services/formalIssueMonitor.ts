import { supabase } from '@/integrations/supabase/client';
import i18n from '@/i18n';

type IssueKind =
  | 'i18n_missing_key'
  | 'image_broken'
  | 'image_missing_alt'
  | 'horizontal_overflow'
  | 'duplicate_h1'
  | 'empty_link';

interface FormalIssue {
  kind: IssueKind;
  message: string;
  details?: Record<string, unknown>;
}

// Debounce by (kind + key) within 60s to prevent spam
const recent = new Map<string, number>();
const DEBOUNCE_MS = 60_000;

function shouldLog(key: string): boolean {
  const now = Date.now();
  const last = recent.get(key);
  if (last && now - last < DEBOUNCE_MS) return false;
  recent.set(key, now);
  if (recent.size > 300) {
    for (const [k, t] of recent) if (now - t > DEBOUNCE_MS) recent.delete(k);
  }
  return true;
}

async function persist(issue: FormalIssue): Promise<void> {
  const dedupeKey = `${issue.kind}:${issue.message}`;
  if (!shouldLog(dedupeKey)) return;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    // Skip for logged-out users: anon has no privileges on error_logs (avoids 401).
    if (!user) return;
    await supabase.from('error_logs' as never).insert({
      user_id: user.id,
      error_type: 'ui_error',
      error_message: `[formal_issue:${issue.kind}] ${issue.message}`.slice(0, 2000),
      route: window.location.pathname,
      severity: 'warning',
      metadata: {
        kind: 'formal_issue',
        issue_kind: issue.kind,
        language: i18n.language,
        viewport: { w: window.innerWidth, h: window.innerHeight },
        ...(issue.details || {}),
      },
      user_agent: navigator.userAgent,
    } as never);
  } catch {
    // never throw from monitor
  }
}

/** Hook into i18next to catch missing translation keys */
function watchI18nMissingKeys() {
  // i18next emits 'missingKey' when fallback also misses
  i18n.on('missingKey', (lngs: string[], _ns: string, key: string) => {
    if (!key) return;
    persist({
      kind: 'i18n_missing_key',
      message: key,
      details: { missing_in: lngs },
    });
  });

  // Enable missing-key reporting if not already
  if (!i18n.options.saveMissing) {
    i18n.options.saveMissing = true;
  }
}

/** Capture broken <img> loads via window-level error event */
function watchBrokenImages() {
  window.addEventListener(
    'error',
    (event) => {
      const target = event.target as HTMLElement | null;
      if (!target || target.tagName !== 'IMG') return;
      const img = target as HTMLImageElement;
      persist({
        kind: 'image_broken',
        message: img.src || '(unknown src)',
        details: { alt: img.alt || null },
      });
    },
    true, // capture phase – image error events don't bubble
  );
}

/** Scan DOM periodically for missing alt attributes, duplicate H1, empty links */
function watchDomQuality() {
  const scan = () => {
    // Missing alt on visible images (skip decorative aria-hidden / role=presentation)
    document.querySelectorAll('img:not([alt])').forEach((el) => {
      const img = el as HTMLImageElement;
      if (img.getAttribute('aria-hidden') === 'true') return;
      if (img.getAttribute('role') === 'presentation') return;
      persist({
        kind: 'image_missing_alt',
        message: img.src || '(unknown src)',
        details: { route: window.location.pathname },
      });
    });

    // Duplicate H1
    const h1s = document.querySelectorAll('h1');
    if (h1s.length > 1) {
      persist({
        kind: 'duplicate_h1',
        message: `${h1s.length} <h1> on ${window.location.pathname}`,
        details: {
          texts: Array.from(h1s).slice(0, 5).map((h) => h.textContent?.trim().slice(0, 80)),
        },
      });
    }

    // Empty links (no text, no aria-label, no title, no image alt)
    document.querySelectorAll('a, button').forEach((el) => {
      const hasText = (el.textContent || '').trim().length > 0;
      const hasLabel = el.getAttribute('aria-label') || el.getAttribute('title');
      const hasImg = el.querySelector('img[alt]:not([alt=""])');
      const hasSvgLabel = el.querySelector('svg[aria-label], [aria-label]');
      if (!hasText && !hasLabel && !hasImg && !hasSvgLabel) {
        const id = el.id || el.className || el.tagName.toLowerCase();
        persist({
          kind: 'empty_link',
          message: `${el.tagName.toLowerCase()}:${id}`.slice(0, 200),
          details: { route: window.location.pathname },
        });
      }
    });
  };

  // Scan on route changes (history API) + initial
  let timer: number | undefined;
  const schedule = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(scan, 1500);
  };

  const origPush = history.pushState;
  const origReplace = history.replaceState;
  history.pushState = function (...args) {
    const r = origPush.apply(this, args as never);
    schedule();
    return r;
  };
  history.replaceState = function (...args) {
    const r = origReplace.apply(this, args as never);
    schedule();
    return r;
  };
  window.addEventListener('popstate', schedule);

  schedule();
}

/** Watch horizontal overflow on body (mobile-killer) */
function watchHorizontalOverflow() {
  if (!('ResizeObserver' in window)) return;
  let lastReported = 0;
  const obs = new ResizeObserver(() => {
    const overflow = document.documentElement.scrollWidth - window.innerWidth;
    if (overflow > 4 && Date.now() - lastReported > 30_000) {
      lastReported = Date.now();
      persist({
        kind: 'horizontal_overflow',
        message: `overflow ${overflow}px on ${window.location.pathname}`,
        details: { overflow_px: overflow, viewport_w: window.innerWidth },
      });
    }
  });
  obs.observe(document.documentElement);
}

let initialized = false;

/** Initialize the formal-issue runtime monitor. Idempotent. */
export function initFormalIssueMonitor(): void {
  if (initialized) return;
  initialized = true;

  try { watchI18nMissingKeys(); } catch { /* noop */ }
  try { watchBrokenImages(); } catch { /* noop */ }
  try { watchDomQuality(); } catch { /* noop */ }
  try { watchHorizontalOverflow(); } catch { /* noop */ }

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log('[FormalIssueMonitor] Initialized');
  }
}