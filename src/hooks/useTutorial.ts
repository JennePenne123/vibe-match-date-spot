import { useState, useCallback } from 'react';

const STORAGE_KEY = 'hioutz_tutorial_completed';

export function hasCompletedTutorial(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function useTutorial() {
  const [showTutorial, setShowTutorial] = useState(() => !hasCompletedTutorial());

  const completeTutorial = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch { /* ignore */ }
    setShowTutorial(false);
  }, []);

  return { showTutorial, completeTutorial };
}
