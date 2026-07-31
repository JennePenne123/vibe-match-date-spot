/** Shared helpers for group invite deep links (`/join-group?token=…`). */

export const GROUP_TOKEN_STORAGE_KEY = 'hioutz-pending-group-token';

/** Tokens are hex strings generated server-side. */
export const GROUP_TOKEN_REGEX = /^[A-Za-z0-9_-]{12,64}$/;

export const buildGroupJoinLink = (token: string, origin = window.location.origin) =>
  `${origin}/join-group?token=${encodeURIComponent(token)}`;

/** Extract a group invite token from a scanned QR payload or a pasted link. */
export const extractGroupToken = (raw: string): string | null => {
  const value = (raw || '').trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    const fromQuery =
      url.searchParams.get('token') ||
      url.searchParams.get('group') ||
      url.searchParams.get('joinGroup');
    if (fromQuery && GROUP_TOKEN_REGEX.test(fromQuery)) return fromQuery;
    // Support hash-router style links: …/#/join-group?token=…
    const hashQuery = url.hash.includes('?') ? url.hash.split('?')[1] : '';
    if (hashQuery) {
      const token = new URLSearchParams(hashQuery).get('token');
      if (token && GROUP_TOKEN_REGEX.test(token)) return token;
    }
  } catch {
    /* not a URL — fall through */
  }
  return GROUP_TOKEN_REGEX.test(value) ? value : null;
};

export const storeGroupToken = (token: string) => {
  try {
    localStorage.setItem(GROUP_TOKEN_STORAGE_KEY, token);
    sessionStorage.setItem(GROUP_TOKEN_STORAGE_KEY, token);
  } catch {
    /* ignore */
  }
};

export const readGroupToken = (): string | null => {
  try {
    return (
      sessionStorage.getItem(GROUP_TOKEN_STORAGE_KEY) ||
      localStorage.getItem(GROUP_TOKEN_STORAGE_KEY)
    );
  } catch {
    return null;
  }
};

export const clearGroupToken = () => {
  try {
    localStorage.removeItem(GROUP_TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(GROUP_TOKEN_STORAGE_KEY);
  } catch {
    /* ignore */
  }
};

/**
 * Capture a group invite token from the current URL, regardless of which route
 * the deep link landed on (`/join-group?token=`, `/?group=`, `/home?joinGroup=`).
 */
export const captureGroupTokenFromLocation = (): string | null => {
  const token = extractGroupToken(window.location.href);
  if (token) storeGroupToken(token);
  return token;
};
