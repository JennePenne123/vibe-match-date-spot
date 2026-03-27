import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'vybepulse_seen_nudges';

function getSeenNudges(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function markNudgeSeen(nudgeId: string) {
  const seen = getSeenNudges();
  if (!seen.includes(nudgeId)) {
    seen.push(nudgeId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
  }
}

/**
 * Returns `visible` (should we show this nudge?) and `dismiss` (mark as seen).
 * The nudge auto-shows after `delayMs` and only once per nudgeId.
 */
export function useFirstUseNudge(nudgeId: string, delayMs = 1200) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (getSeenNudges().includes(nudgeId)) return;

    const timer = setTimeout(() => setVisible(true), delayMs);
    return () => clearTimeout(timer);
  }, [nudgeId, delayMs]);

  const dismiss = useCallback(() => {
    setVisible(false);
    markNudgeSeen(nudgeId);
  }, [nudgeId]);

  return { visible, dismiss };
}
