import { supabase } from '@/integrations/supabase/client';

export const BOARD_VOTER_KEY_STORAGE = 'hioutz-board-voter-key';
export const BOARD_VOTER_NAME_STORAGE = 'hioutz-board-voter-name';

export interface SharedBoardVenue {
  key: string;
  name: string;
  address?: string;
  image?: string;
  score?: number;
  reason?: string;
  cuisine?: string;
  priceRange?: string;
  rating?: number;
  latitude?: number;
  longitude?: number;
}

export interface SharedBoard {
  id: string;
  slug: string;
  owner_id: string;
  title: string;
  city: string | null;
  note: string | null;
  venues: SharedBoardVenue[];
  is_active: boolean;
  view_count: number;
  expires_at: string | null;
  created_at: string;
}

export interface SharedBoardVote {
  id: string;
  board_id: string;
  venue_key: string;
  voter_key: string;
  voter_name: string | null;
  vote: number;
}

const SLUG_ALPHABET = 'abcdefghijkmnopqrstuvwxyz23456789';

export const generateSlug = (length = 10): string => {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => SLUG_ALPHABET[b % SLUG_ALPHABET.length]).join('');
};

/** Stable per-device identifier so guests can change or withdraw their own vote. */
export const getVoterKey = (): string => {
  try {
    const existing = localStorage.getItem(BOARD_VOTER_KEY_STORAGE);
    if (existing && existing.length >= 8) return existing;
    const fresh = generateSlug(24);
    localStorage.setItem(BOARD_VOTER_KEY_STORAGE, fresh);
    return fresh;
  } catch {
    return generateSlug(24);
  }
};

export const getVoterName = (): string => {
  try {
    return localStorage.getItem(BOARD_VOTER_NAME_STORAGE) || '';
  } catch {
    return '';
  }
};

export const setVoterName = (name: string) => {
  try {
    localStorage.setItem(BOARD_VOTER_NAME_STORAGE, name.slice(0, 40));
  } catch {
    /* ignore */
  }
};

export const buildBoardUrl = (slug: string, origin = window.location.origin) =>
  `${origin}/b/${slug}`;

const normalizeBoard = (row: any): SharedBoard => ({
  ...row,
  venues: Array.isArray(row?.venues) ? (row.venues as SharedBoardVenue[]) : [],
});

export const createSharedBoard = async (input: {
  title: string;
  city?: string | null;
  note?: string | null;
  venues: SharedBoardVenue[];
  expiresInDays?: number | null;
}): Promise<SharedBoard> => {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) throw new Error('NOT_AUTHENTICATED');

  const expiresAt = input.expiresInDays
    ? new Date(Date.now() + input.expiresInDays * 86_400_000).toISOString()
    : null;

  const { data, error } = await supabase
    .from('shared_boards')
    .insert({
      slug: generateSlug(),
      owner_id: userId,
      title: input.title.slice(0, 120),
      city: input.city ?? null,
      note: input.note ? input.note.slice(0, 300) : null,
      venues: input.venues.slice(0, 12) as any,
      expires_at: expiresAt,
    })
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('BOARD_CREATE_FAILED');
  return normalizeBoard(data);
};

export const fetchSharedBoard = async (slug: string): Promise<SharedBoard | null> => {
  const { data, error } = await supabase
    .from('shared_boards')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  return data ? normalizeBoard(data) : null;
};

export const fetchMySharedBoards = async (): Promise<SharedBoard[]> => {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) return [];

  const { data, error } = await supabase
    .from('shared_boards')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(normalizeBoard);
};

export const deactivateSharedBoard = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('shared_boards')
    .update({ is_active: false })
    .eq('id', id);
  if (error) throw error;
};

export const registerBoardView = async (slug: string): Promise<void> => {
  try {
    await supabase.rpc('increment_shared_board_view', { _slug: slug });
  } catch {
    /* view counting must never break the page */
  }
};

export const fetchBoardVotes = async (boardId: string): Promise<SharedBoardVote[]> => {
  const { data, error } = await supabase
    .from('shared_board_votes')
    .select('*')
    .eq('board_id', boardId);
  if (error) throw error;
  return (data || []) as SharedBoardVote[];
};

export const castBoardVote = async (params: {
  boardId: string;
  venueKey: string;
  voterName?: string;
}): Promise<void> => {
  const voterKey = getVoterKey();
  const { error } = await supabase.from('shared_board_votes').insert({
    board_id: params.boardId,
    venue_key: params.venueKey,
    voter_key: voterKey,
    voter_name: params.voterName?.slice(0, 40) || null,
    vote: 1,
  });
  if (error && error.code !== '23505') throw error;
};

export const withdrawBoardVote = async (params: {
  boardId: string;
  venueKey: string;
}): Promise<void> => {
  const voterKey = getVoterKey();
  const { error } = await supabase
    .from('shared_board_votes')
    .delete()
    .eq('board_id', params.boardId)
    .eq('venue_key', params.venueKey)
    .eq('voter_key', voterKey);
  if (error) throw error;
};
