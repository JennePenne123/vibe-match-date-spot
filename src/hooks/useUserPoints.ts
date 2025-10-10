import { useState, useEffect } from 'react';
import { getUserPoints, initializeUserPoints, type UserPoints } from '@/services/pointsService';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useUserPoints = () => {
  const { user } = useAuth();
  const [points, setPoints] = useState<UserPoints | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadPoints();
      
      // Set up realtime subscription for points updates
      const channel = supabase
        .channel('user-points-changes')
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
  }, [user]);

  const loadPoints = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let userPoints = await getUserPoints();
      
      // If no points record exists, initialize one
      if (!userPoints) {
        const initialized = await initializeUserPoints();
        if (initialized) {
          userPoints = await getUserPoints();
        }
      }
      
      setPoints(userPoints);
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
