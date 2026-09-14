import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mocks -----------------------------------------------------------------

const state = {
  roles: [] as { role: string }[],
  rolesError: null as unknown,
  preferences: null as Record<string, unknown> | null,
  preferencesThrows: false,
  groupToken: null as string | null,
  moodToday: true,
};

vi.mock('@/integrations/supabase/client', () => {
  const rolesQuery = () => {
    const promise = {
      eq: () => promise,
      then: (resolve: (v: unknown) => unknown) => {
        if (state.rolesError) return Promise.resolve({ data: null, error: state.rolesError }).then(resolve);
        return Promise.resolve({ data: state.roles, error: null }).then(resolve);
      },
    };
    return promise;
  };

  const preferencesQuery = () => {
    const promise = {
      eq: () => promise,
      maybeSingle: async () => {
        if (state.preferencesThrows) throw new Error('prefs down');
        return { data: state.preferences, error: null };
      },
    };
    return promise;
  };

  return {
    supabase: {
      from: (table: string) => ({
        select: () => (table === 'user_roles' ? rolesQuery() : preferencesQuery()),
      }),
    },
  };
});

vi.mock('@/lib/groupInviteLink', () => ({
  readGroupToken: () => state.groupToken,
  buildGroupJoinLink: (token: string) =>
    `https://app.test/join-group?token=${encodeURIComponent(token)}`,
}));

vi.mock('@/utils/moodStorage', () => ({
  hasMoodToday: () => state.moodToday,
}));

import { resolvePostLoginPath } from './postLoginRedirect';

const USER_ID = '11111111-1111-1111-1111-111111111111';

const COMPLETE_PREFS = { preferred_cuisines: ['italian'] };

beforeEach(() => {
  state.roles = [];
  state.rolesError = null;
  state.preferences = COMPLETE_PREFS;
  state.preferencesThrows = false;
  state.groupToken = null;
  state.moodToday = true;
});

describe('resolvePostLoginPath', () => {
  it('prioritises a pending group invite over everything else', async () => {
    state.groupToken = 'abc123def456';
    state.roles = [{ role: 'admin' }];
    state.preferences = null;

    await expect(resolvePostLoginPath(USER_ID)).resolves.toBe(
      '/join-group?token=abc123def456'
    );
  });

  it('sends admins to the partner area', async () => {
    state.roles = [{ role: 'admin' }];
    await expect(resolvePostLoginPath(USER_ID)).resolves.toBe('/partner');
  });

  it('sends venue partners to the partner area', async () => {
    state.roles = [{ role: 'venue_partner' }];
    await expect(resolvePostLoginPath(USER_ID)).resolves.toBe('/partner');
  });

  it('sends users without finished onboarding to /welcome', async () => {
    state.preferences = null;
    await expect(resolvePostLoginPath(USER_ID)).resolves.toBe('/welcome');
  });

  it('treats empty preference arrays as incomplete onboarding', async () => {
    state.preferences = { preferred_cuisines: [], preferred_vibes: [] };
    await expect(resolvePostLoginPath(USER_ID)).resolves.toBe('/welcome');
  });

  it('sends fully onboarded users with a mood today to /home', async () => {
    await expect(resolvePostLoginPath(USER_ID)).resolves.toBe('/home');
  });

  it('sends fully onboarded users without a mood today to /mood', async () => {
    state.moodToday = false;
    await expect(resolvePostLoginPath(USER_ID)).resolves.toBe('/mood');
  });

  it('never blocks login when the role lookup fails', async () => {
    state.rolesError = new Error('roles down');
    await expect(resolvePostLoginPath(USER_ID)).resolves.toBe('/home');
  });

  it('falls back to /home when the preference lookup throws', async () => {
    state.preferencesThrows = true;
    await expect(resolvePostLoginPath(USER_ID)).resolves.toBe('/home');
  });

  it('ignores regular roles and keeps normal routing', async () => {
    state.roles = [{ role: 'regular' }];
    state.moodToday = false;
    await expect(resolvePostLoginPath(USER_ID)).resolves.toBe('/mood');
  });
});
