/**
 * In-session deduplication for venue search requests.
 *
 * Multiple components can trigger the same tiered venue search at (almost) the
 * same moment. Instead of firing several identical edge-function calls, all
 * callers share the first in-flight promise. A short result window additionally
 * serves instant repeats (e.g. remounts) from memory.
 */
const inFlight = new Map<string, Promise<any>>();
const recent = new Map<string, { value: any; at: number }>();

const RECENT_TTL_MS = 60 * 1000; // 1 minute

const keyFor = (payload: Record<string, unknown>): string => {
  try {
    return JSON.stringify(payload, Object.keys(payload).sort());
  } catch {
    return String(Date.now());
  }
};

export async function dedupeVenueSearch<T>(
  payload: Record<string, unknown>,
  run: () => Promise<T>,
): Promise<T> {
  const key = keyFor(payload);

  const cached = recent.get(key);
  if (cached && Date.now() - cached.at < RECENT_TTL_MS) {
    return cached.value as T;
  }

  const pending = inFlight.get(key);
  if (pending) return pending as Promise<T>;

  const promise = run()
    .then((value) => {
      recent.set(key, { value, at: Date.now() });
      return value;
    })
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, promise);
  return promise;
}

export function clearVenueSearchDedupe(): void {
  inFlight.clear();
  recent.clear();
}
