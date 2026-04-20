import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const LEGACY_KEY = 'hioutz_tutorial_completed';
const keyFor = (userId?: string | null) =>
  userId ? `hioutz_tutorial_completed:${userId}` : LEGACY_KEY;

export function hasCompletedTutorial(userId?: string | null): boolean {
  try {
    if (localStorage.getItem(keyFor(userId)) === 'true') return true;
    if (userId && localStorage.getItem(LEGACY_KEY) === 'true') return true;
    return false;
  } catch {
    return false;
  }
}

/**
 * Tutorial visibility rules:
 *  - Skip entirely for returning users (auto-marked complete when `alreadyOnboarded`).
 *  - Persist completion per user-id so logging in on a fresh device doesn't replay it.
 */
export function useTutorial(opts?: { alreadyOnboarded?: boolean }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [showTutorial, setShowTutorial] = useState<boolean>(
    () => !hasCompletedTutorial(userId),
  );

  useEffect(() => {
    if (!userId) {
      setShowTutorial(false);
      return;
    }
    if (opts?.alreadyOnboarded) {
      try {
        localStorage.setItem(keyFor(userId), 'true');
      } catch { /* ignore */ }
      setShowTutorial(false);
      return;
    }
    setShowTutorial(!hasCompletedTutorial(userId));
  }, [userId, opts?.alreadyOnboarded]);

  const completeTutorial = useCallback(() => {
    try {
      localStorage.setItem(keyFor(userId), 'true');
    } catch { /* ignore */ }
    setShowTutorial(false);
  }, [userId]);

  return { showTutorial, completeTutorial };
}
