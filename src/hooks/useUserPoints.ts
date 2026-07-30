import React, { useState, useEffect, useRef, createElement } from 'react';
import { getUserPoints, initializeUserPoints, getBadgeInfo, type UserPoints } from '@/services/pointsService';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { icons, Award } from 'lucide-react';

// Module-level guard so multiple hook instances (Profile + ProfileStats +
// PointsIndicator on the same page) don't each fire the same badge toast.
const toastedThisSession = new Set<string>();
let pointsChannelSequence = 0;

const fetchNotifiedBadges = async (userId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from('user_points')
    .select('notified_badges')
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) return [];
  const raw = (data as any).notified_badges;
  return Array.isArray(raw) ? (raw as string[]) : [];
};

const persistNotifiedBadges = async (userId: string, badges: string[]): Promise<void> => {
  const { error } = await supabase
    .from('user_points')
    .update({ notified_badges: badges as any })
    .eq('user_id', userId);
  if (error) console.warn('Failed to persist notified_badges:', error);
};

export const useUserPoints = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [points, setPoints] = useState<UserPoints | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasCheckedBadges = useRef(false);

  useEffect(() => {
    if (user) {
      hasCheckedBadges.current = false;
      loadPoints();
      
      // Several profile widgets can use this hook in the same render. Date.now()
      // alone can then produce the same channel name and Supabase returns the
      // same channel instance, which throws when subscribe() is called twice.
      const channelName = `${user.id}:user-points-${Date.now()}-${++pointsChannelSequence}`;
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_points',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Points updated:', payload);
            loadPoints();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setPoints(null);
      setLoading(false);
    }
  }, [user?.id]);

  const showNewBadgeToasts = async (userPoints: UserPoints) => {
    if (!user || hasCheckedBadges.current) return;
    hasCheckedBadges.current = true;

    const currentBadges = (userPoints.badges as string[]) ?? [];
    // Filter out internal markers like _profile_complete_awarded
    const visibleBadges = currentBadges.filter(b => !b.startsWith('_'));
    const seen = await fetchNotifiedBadges(user.id);
    const newBadges = visibleBadges.filter(
      b => !seen.includes(b) && !toastedThisSession.has(`${user.id}:${b}`)
    );

    if (newBadges.length > 0) {
      // Mark all as seen immediately (server-side + session guard)
      visibleBadges.forEach(b => toastedThisSession.add(`${user.id}:${b}`));
      await persistNotifiedBadges(user.id, visibleBadges);

      // Show toasts with a slight delay between each (max 3)
      newBadges.slice(0, 3).forEach((badgeId, index) => {
        const info = getBadgeInfo(badgeId);
        const pascalName = info.lucideIcon
          .split('-')
          .map((s: string) => s.charAt(0).toUpperCase() + s.slice(1))
          .join('') as keyof typeof icons;
        const IconComponent = icons[pascalName] || Award;

        setTimeout(() => {
          toast({
            title: createElement('span', { className: 'flex items-center gap-2' },
              createElement('span', { className: `${info.bg} rounded-md p-1 inline-flex` },
                createElement(IconComponent, { className: `h-4 w-4 ${info.color}` })
              ),
              `Neues Badge: ${info.name}`
            ) as unknown as string,
            description: info.description,
          });
        }, index * 1500);
      });

      if (newBadges.length > 3) {
        setTimeout(() => {
          toast({
            title: createElement('span', { className: 'flex items-center gap-2' },
              createElement('span', { className: 'bg-primary/15 rounded-md p-1 inline-flex' },
                createElement(Award, { className: 'h-4 w-4 text-primary' })
              ),
              'Weitere Badges freigeschaltet!'
            ) as unknown as string,
            description: `Du hast ${newBadges.length - 3} weitere Badges verdient. Schau in dein Profil!`,
          });
        }, 3 * 1500);
      }
    } else if (visibleBadges.length !== seen.length) {
      // Keep server list in sync (e.g., badges removed by admin)
      await persistNotifiedBadges(user.id, visibleBadges);
    }
  };

  const loadPoints = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let userPoints = await getUserPoints();
      
      if (!userPoints) {
        const initialized = await initializeUserPoints();
        if (initialized) {
          userPoints = await getUserPoints();
        }
      }
      
      setPoints(userPoints);

      // Check for new badges on initial load
      if (userPoints) {
        showNewBadgeToasts(userPoints);
      }
    } catch (err) {
      console.error('Error loading user points:', err);
      setError('Failed to load points data');
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    loadPoints();
  };

  return {
    points,
    loading,
    error,
    refresh
  };
};
