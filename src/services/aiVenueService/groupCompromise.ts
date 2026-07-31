/**
 * Transparency layer for the collaborative hard filters.
 * `recommendations.ts` records how the group compromise was formed so the
 * results list can explain it to every participant.
 */

export type CompromiseStrategy = 'shared' | 'union' | 'single' | 'none';

export interface CompromiseGroup {
  /** 'venueTypes' | 'cuisines' */
  kind: 'venueTypes' | 'cuisines';
  strategy: CompromiseStrategy;
  /** Values that survived and were used as a hard filter */
  applied: string[];
  /** What each side originally picked */
  userPicks: string[];
  partnerPicks: string[];
}

export interface GroupCompromiseInfo {
  collaborative: boolean;
  groups: CompromiseGroup[];
  /** Cuisines vetoed by any participant */
  vetoed: string[];
  createdAt: number;
}

const STORAGE_KEY = 'hioutz-group-compromise';

export const combineWithStrategy = (
  a: string[],
  b: string[],
): { applied: string[]; strategy: CompromiseStrategy } => {
  if (!a.length && !b.length) return { applied: [], strategy: 'none' };
  if (!a.length) return { applied: b, strategy: 'single' };
  if (!b.length) return { applied: a, strategy: 'single' };
  const shared = a.filter(x => b.includes(x));
  if (shared.length) return { applied: shared, strategy: 'shared' };
  return { applied: [...new Set([...a, ...b])], strategy: 'union' };
};

export const storeGroupCompromise = (info: Omit<GroupCompromiseInfo, 'createdAt'>): void => {
  try {
    const hasContent = info.groups.some(g => g.applied.length) || info.vetoed.length > 0;
    if (!hasContent) {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...info, createdAt: Date.now() }));
  } catch {
    /* sessionStorage unavailable – transparency is best-effort */
  }
};

export const readGroupCompromise = (): GroupCompromiseInfo | null => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GroupCompromiseInfo;
    if (!parsed || !Array.isArray(parsed.groups)) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const clearGroupCompromise = (): void => {
  try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
};
