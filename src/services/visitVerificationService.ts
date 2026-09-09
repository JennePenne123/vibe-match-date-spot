import { supabase } from '@/integrations/supabase/client';

/** Radius in metres within which a user counts as "at the venue". */
export const VISIT_ARRIVAL_RADIUS_M = 150;
/** Hysteresis radius — user counts as "left" only beyond this. */
export const VISIT_DEPARTURE_RADIUS_M = 250;
/** Minimum stay before a visit counts as a real visit. */
export const VISIT_MIN_STAY_MINUTES = 15;

export interface VisitCandidate {
  invitationId: string;
  venueId: string;
  venueName: string;
  latitude: number;
  longitude: number;
  proposedDate: string | null;
}

export interface VenueVisit {
  id: string;
  user_id: string;
  invitation_id: string | null;
  venue_id: string;
  venue_name: string | null;
  venue_latitude: number | null;
  venue_longitude: number | null;
  arrived_at: string;
  left_at: string | null;
  verified: boolean;
  verification_method: 'manual' | 'auto';
  closest_distance_m: number | null;
  rating_prompt_at: string | null;
  rating_prompted: boolean;
}

/** Haversine distance in metres. */
export const distanceMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Rating prompt timing: later the same evening, or next morning if it is
 * already late. Never sooner than 45 minutes after leaving.
 */
export const computeRatingPromptAt = (departedAt: Date = new Date()): Date => {
  const earliest = new Date(departedAt.getTime() + 45 * 60 * 1000);
  const hour = departedAt.getHours();

  let target: Date;
  if (hour < 20) {
    target = new Date(departedAt);
    target.setHours(20, 30, 0, 0);
  } else if (hour < 23) {
    target = new Date(earliest);
  } else {
    target = new Date(departedAt);
    target.setDate(target.getDate() + 1);
    target.setHours(9, 0, 0, 0);
  }

  return target.getTime() < earliest.getTime() ? earliest : target;
};

/** Upcoming/ongoing dates (±6h around the planned time) that can be verified. */
export const getVisitCandidates = async (userId: string): Promise<VisitCandidate[]> => {
  const now = Date.now();
  const windowMs = 6 * 60 * 60 * 1000;

  const { data, error } = await supabase
    .from('date_invitations')
    .select('id, venue_id, proposed_date, actual_date_time, status, date_status')
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .eq('status', 'accepted')
    .not('venue_id', 'is', null);

  if (error || !data) return [];

  const relevant = data.filter((inv: any) => {
    if (inv.date_status === 'completed' || inv.date_status === 'cancelled') return false;
    const when = inv.actual_date_time || inv.proposed_date;
    if (!when) return true;
    return Math.abs(new Date(when).getTime() - now) <= windowMs;
  });

  if (relevant.length === 0) return [];

  const venueIds = Array.from(new Set(relevant.map((i: any) => i.venue_id))) as string[];
  const { data: venues } = await supabase
    .from('venues')
    .select('id, name, latitude, longitude')
    .in('id', venueIds);

  const venueMap = new Map((venues || []).map((v: any) => [v.id, v]));

  return relevant
    .map((inv: any) => {
      const venue = venueMap.get(inv.venue_id);
      if (!venue?.latitude || !venue?.longitude) return null;
      return {
        invitationId: inv.id,
        venueId: venue.id,
        venueName: venue.name,
        latitude: Number(venue.latitude),
        longitude: Number(venue.longitude),
        proposedDate: inv.actual_date_time || inv.proposed_date || null,
      } as VisitCandidate;
    })
    .filter(Boolean) as VisitCandidate[];
};

/** Currently open (not yet left) visit of the user, if any. */
export const getOpenVisit = async (userId: string): Promise<VenueVisit | null> => {
  const { data } = await supabase
    .from('venue_visits')
    .select('*')
    .eq('user_id', userId)
    .is('left_at', null)
    .order('arrived_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as VenueVisit) || null;
};

export const startVisit = async (
  userId: string,
  candidate: VisitCandidate,
  opts: { verified: boolean; method: 'manual' | 'auto'; distanceM?: number | null }
): Promise<VenueVisit | null> => {
  const existing = await getOpenVisit(userId);
  if (existing && existing.venue_id === candidate.venueId) return existing;

  const { data, error } = await supabase
    .from('venue_visits')
    .insert({
      user_id: userId,
      invitation_id: candidate.invitationId,
      venue_id: candidate.venueId,
      venue_name: candidate.venueName,
      venue_latitude: candidate.latitude,
      venue_longitude: candidate.longitude,
      verified: opts.verified,
      verification_method: opts.method,
      closest_distance_m: opts.distanceM ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error('Could not start visit:', error);
    return null;
  }
  return data as VenueVisit;
};

export const endVisit = async (visitId: string, departedAt: Date = new Date()) => {
  const { error } = await supabase
    .from('venue_visits')
    .update({
      left_at: departedAt.toISOString(),
      rating_prompt_at: computeRatingPromptAt(departedAt).toISOString(),
    })
    .eq('id', visitId);
  if (error) console.error('Could not end visit:', error);
};

export const updateClosestDistance = async (visitId: string, distanceM: number) => {
  await supabase
    .from('venue_visits')
    .update({ closest_distance_m: Math.round(distanceM) })
    .eq('id', visitId);
};

/** Finished visits whose rating prompt time has arrived. */
export const getDueRatingVisits = async (userId: string): Promise<VenueVisit[]> => {
  const { data } = await supabase
    .from('venue_visits')
    .select('*')
    .eq('user_id', userId)
    .eq('rating_prompted', false)
    .not('left_at', 'is', null)
    .lte('rating_prompt_at', new Date().toISOString())
    .order('left_at', { ascending: false });
  return (data as VenueVisit[]) || [];
};

export const markVisitPrompted = async (visitId: string) => {
  await supabase.from('venue_visits').update({ rating_prompted: true }).eq('id', visitId);
};

/** Verified visits for a set of invitations, keyed by invitation id. */
export const getVisitsForInvitations = async (
  userId: string,
  invitationIds: string[]
): Promise<Record<string, VenueVisit>> => {
  if (invitationIds.length === 0) return {};
  const { data } = await supabase
    .from('venue_visits')
    .select('*')
    .eq('user_id', userId)
    .in('invitation_id', invitationIds);

  const map: Record<string, VenueVisit> = {};
  for (const visit of (data as VenueVisit[]) || []) {
    if (!visit.invitation_id) continue;
    const current = map[visit.invitation_id];
    if (!current || (visit.verified && !current.verified)) {
      map[visit.invitation_id] = visit;
    }
  }
  return map;
};

/**
 * Invitations that are ready to be rated because a tracked visit has ended
 * and the (evening / next morning) prompt time has arrived.
 */
export const getDueVisitInvitations = async (userId: string): Promise<any[]> => {
  const visits = (await getDueRatingVisits(userId)).filter((v) => v.invitation_id);
  if (visits.length === 0) return [];

  const ids = Array.from(new Set(visits.map((v) => v.invitation_id))) as string[];
  const { data } = await supabase
    .from('date_invitations')
    .select(`
      *,
      sender:profiles!date_invitations_sender_id_fkey(id, name, avatar_url),
      recipient:profiles!date_invitations_recipient_id_fkey(id, name, avatar_url)
    `)
    .in('id', ids);

  const { data: rated } = await supabase
    .from('date_feedback')
    .select('invitation_id')
    .eq('user_id', userId)
    .in('invitation_id', ids);

  const ratedIds = new Set((rated || []).map((r: any) => r.invitation_id));
  return (data || []).filter((inv: any) => !ratedIds.has(inv.id));
};
