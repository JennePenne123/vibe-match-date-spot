import { useState, useEffect, useRef } from 'react';
import { getUserPoints, initializeUserPoints, getBadgeInfo, type UserPoints } from '@/services/pointsService';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const SEEN_BADGES_KEY = 'seen_badges';

const getSeenBadges = (userId: string): string[] => {
  try {
    const raw = localStorage.getItem(`${SEEN_BADGES_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const setSeenBadges = (userId: string, badges: string[]) => {
  localStorage.setItem(`${SEEN_BADGES_KEY}_${userId}`, JSON.stringify(badges));
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
      
      const channel = supabase
        .channel(`user-points-${user.id}-${Date.now()}`)
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

  const showNewBadgeToasts = (userPoints: UserPoints) => {
    if (!user || hasCheckedBadges.current) return;
    hasCheckedBadges.current = true;

    const currentBadges = (userPoints.badges as string[]) ?? [];
    // Filter out internal markers like _profile_complete_awarded
    const visibleBadges = currentBadges.filter(b => !b.startsWith('_'));
    const seen = getSeenBadges(user.id);
    const newBadges = visibleBadges.filter(b => !seen.includes(b));

    if (newBadges.length > 0) {
      // Mark all as seen immediately
      setSeenBadges(user.id, visibleBadges);

      // Show toasts with a slight delay between each (max 3)
      newBadges.slice(0, 3).forEach((badgeId, index) => {
        const info = getBadgeInfo(badgeId);
        setTimeout(() => {
          toast({
            title: `Neues Badge: ${info.name}`,
            description: info.description,
          });
        }, index * 1500);
      });

      if (newBadges.length > 3) {
        setTimeout(() => {
          toast({
            title: 'Weitere Badges freigeschaltet!',
            description: `Du hast ${newBadges.length - 3} weitere Badges verdient. Schau in dein Profil!`,
          });
        }, 3 * 1500);
      }
    } else {
      // Keep seen list in sync
      setSeenBadges(user.id, visibleBadges);
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
