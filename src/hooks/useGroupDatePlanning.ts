import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface GroupMember {
  id: string;
  user_id: string;
  group_id: string;
  role: string;
  invitation_status: string;
  preferences_submitted: boolean;
  preferences_data: any;
  profile?: { name: string; avatar_url: string | null };
}

export interface DateGroup {
  id: string;
  name: string;
  creator_id: string;
  venue_id: string | null;
  proposed_date: string | null;
  max_members: number;
  status: string;
  group_compatibility_score: number;
  merged_preferences: any;
  created_at: string;
  members?: GroupMember[];
}

export interface GroupMessage {
  id: string;
  group_id: string;
  sender_id: string;
  message: string;
  read_by: string[];
  created_at: string;
  sender_profile?: { name: string; avatar_url: string | null };
}

export const useGroupDatePlanning = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<DateGroup | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);

  const createGroup = useCallback(async (name: string, friendIds: string[]) => {
    if (!user) return null;
    if (friendIds.length < 1 || friendIds.length > 5) {
      toast.error('Gruppe muss 2-6 Personen haben (inkl. dir)');
      return null;
    }

    setLoading(true);
    try {
      // Create the group
      const { data: group, error: groupError } = await supabase
        .from('date_groups')
        .insert({
          name,
          creator_id: user.id,
          max_members: friendIds.length + 1,
          status: 'planning',
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as first member
      const memberInserts = [
        { group_id: group.id, user_id: user.id, role: 'creator', invitation_status: 'accepted' },
        ...friendIds.map(fid => ({ group_id: group.id, user_id: fid, role: 'member', invitation_status: 'pending' })),
      ];

      const { error: membersError } = await supabase
        .from('date_group_members')
        .insert(memberInserts);

      if (membersError) throw membersError;

      setCurrentGroup(group);
      toast.success(`Gruppe "${name}" erstellt! Einladungen verschickt.`);
      return group;
    } catch (err: any) {
      console.error('Failed to create group:', err);
      toast.error('Gruppe konnte nicht erstellt werden');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadGroup = useCallback(async (groupId: string) => {
    setLoading(true);
    try {
      const { data: group, error } = await supabase
        .from('date_groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (error) throw error;
      setCurrentGroup(group);

      // Load members with profiles
      const { data: members } = await supabase
        .from('date_group_members')
        .select('*')
        .eq('group_id', groupId);

      if (members) {
        // Fetch profiles for all members
        const userIds = members.map(m => m.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, avatar_url')
          .in('id', userIds);

        const membersWithProfiles = members.map(m => ({
          ...m,
          profile: profiles?.find(p => p.id === m.user_id) || undefined,
        }));
        setGroupMembers(membersWithProfiles);
      }

      return group;
    } catch (err) {
      console.error('Failed to load group:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const respondToInvitation = useCallback(async (groupId: string, accept: boolean) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('date_group_members')
        .update({ invitation_status: accept ? 'accepted' : 'declined' })
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success(accept ? 'Einladung angenommen!' : 'Einladung abgelehnt');
    } catch (err) {
      console.error('Failed to respond to invitation:', err);
      toast.error('Fehler beim Aktualisieren');
    }
  }, [user]);

  const submitPreferences = useCallback(async (groupId: string, preferences: any) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('date_group_members')
        .update({
          preferences_submitted: true,
          preferences_data: preferences,
        })
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Check if all accepted members have submitted
      const { data: members } = await supabase
        .from('date_group_members')
        .select('preferences_submitted, preferences_data, invitation_status')
        .eq('group_id', groupId)
        .eq('invitation_status', 'accepted');

      if (members?.every(m => m.preferences_submitted)) {
        // Merge all preferences
        const merged = mergeGroupPreferences(members.map(m => m.preferences_data));
        await supabase
          .from('date_groups')
          .update({ merged_preferences: merged })
          .eq('id', groupId);
      }

      toast.success('Präferenzen gespeichert!');
    } catch (err) {
      console.error('Failed to submit preferences:', err);
      toast.error('Fehler beim Speichern');
    }
  }, [user]);

  const sendGroupMessage = useCallback(async (groupId: string, message: string) => {
    if (!user || !message.trim()) return;
    try {
      const { error } = await supabase
        .from('date_group_messages')
        .insert({
          group_id: groupId,
          sender_id: user.id,
          message: message.trim(),
        });

      if (error) throw error;
    } catch (err) {
      console.error('Failed to send group message:', err);
      toast.error('Nachricht konnte nicht gesendet werden');
    }
  }, [user]);

  const loadGroupMessages = useCallback(async (groupId: string) => {
    try {
      const { data: messages } = await supabase
        .from('date_group_messages')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (messages) {
        const senderIds = [...new Set(messages.map(m => m.sender_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, avatar_url')
          .in('id', senderIds);

        const messagesWithProfiles = messages.map(m => ({
          ...m,
          sender_profile: profiles?.find(p => p.id === m.sender_id) || undefined,
        }));
        setGroupMessages(messagesWithProfiles);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }, []);

  const getUserGroups = useCallback(async () => {
    if (!user) return [];
    try {
      const { data: memberEntries } = await supabase
        .from('date_group_members')
        .select('group_id')
        .eq('user_id', user.id);

      if (!memberEntries?.length) return [];

      const groupIds = memberEntries.map(m => m.group_id);
      const { data: groups } = await supabase
        .from('date_groups')
        .select('*')
        .in('id', groupIds)
        .order('created_at', { ascending: false });

      return groups || [];
    } catch (err) {
      console.error('Failed to load user groups:', err);
      return [];
    }
  }, [user]);

  const selectVenue = useCallback(async (groupId: string, venueId: string) => {
    try {
      const { error } = await supabase
        .from('date_groups')
        .update({ venue_id: venueId, status: 'venue_selected' })
        .eq('id', groupId);

      if (error) throw error;
      toast.success('Venue ausgewählt!');
    } catch (err) {
      console.error('Failed to select venue:', err);
    }
  }, []);

  return {
    loading,
    currentGroup,
    groupMembers,
    groupMessages,
    createGroup,
    loadGroup,
    respondToInvitation,
    submitPreferences,
    sendGroupMessage,
    loadGroupMessages,
    getUserGroups,
    selectVenue,
  };
};

/** 
 * Merge preferences from all group members using consensus + veto logic.
 * - Dietary restrictions: union (ALL must be respected)
 * - Excluded cuisines: union (ANY member's veto applies)
 * - Cuisines/vibes: frequency-ranked, shared first
 * - Numeric values: averaged
 */
function mergeGroupPreferences(allPrefs: any[]): any {
  if (!allPrefs.length) return {};

  const merged: any = {};
  const n = allPrefs.length;

  // ── Dietary: union (respect ALL restrictions — hard veto) ──
  const dietary = new Set<string>();
  for (const pref of allPrefs) {
    for (const d of pref?.dietary_restrictions || []) {
      dietary.add(d);
    }
  }
  merged.dietary_restrictions = [...dietary];

  // ── Excluded cuisines: union (ANY member's exclusion = group veto) ──
  const excluded = new Set<string>();
  for (const pref of allPrefs) {
    for (const c of pref?.excluded_cuisines || []) {
      excluded.add(c.toLowerCase());
    }
  }
  merged.excluded_cuisines = [...excluded];

  // ── Array fields: frequency-ranked with consensus priority ──
  const arrayFields = ['cuisines', 'vibes', 'activities', 'price_range', 'times'];
  for (const field of arrayFields) {
    const counts: Record<string, number> = {};
    for (const pref of allPrefs) {
      const arr = pref?.[field] || [];
      for (const item of arr) {
        const key = item.toLowerCase();
        counts[key] = (counts[key] || 0) + 1;
      }
    }
    // Sort by frequency (shared items first)
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    
    // For cuisines: filter out vetoed ones
    if (field === 'cuisines') {
      merged[field] = sorted
        .filter(([item]) => !excluded.has(item))
        .slice(0, 6)
        .map(([item]) => item);
    } else {
      merged[field] = sorted.slice(0, 5).map(([item]) => item);
    }
  }

  // ── Numeric fields: averaged ──
  const numericFields = ['budget', 'max_distance', 'duration'];
  for (const field of numericFields) {
    const values = allPrefs.map(p => p?.[field]).filter(v => v != null);
    if (values.length) {
      merged[field] = Math.round(values.reduce((a: number, b: number) => a + b, 0) / values.length);
    }
  }

  // ── Mood: most common ──
  const moods: Record<string, number> = {};
  for (const pref of allPrefs) {
    if (pref?.mood) moods[pref.mood] = (moods[pref.mood] || 0) + 1;
  }
  merged.mood = Object.entries(moods).sort((a, b) => b[1] - a[1])[0]?.[0] || 'chill';

  // ── Date/time: creator's preference (first set) ──
  merged.date = allPrefs.find(p => p?.date)?.date;
  merged.time = allPrefs.find(p => p?.time)?.time;

  // ── Merge quality metadata ──
  const sharedCuisines = Object.entries(
    allPrefs.reduce((acc: Record<string, number>, p) => {
      for (const c of p?.cuisines || []) { acc[c] = (acc[c] || 0) + 1; }
      return acc;
    }, {})
  ).filter(([, count]) => count >= Math.ceil(n / 2)).map(([item]) => item);

  merged._consensusMetadata = {
    memberCount: n,
    sharedCuisines,
    vetoedCuisines: [...excluded],
    dietaryUnion: [...dietary],
    scoringStrategy: 'consensus_with_veto',
  };

  return merged;
}
