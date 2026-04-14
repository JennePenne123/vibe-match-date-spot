import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useFavorites = () => {
  const { user } = useAuth();
  const [likedVenues, setLikedVenues] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Load favorites from DB or localStorage
  useEffect(() => {
    const loadFavorites = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('user_favorites')
            .select('venue_id')
            .eq('user_id', user.id);

          if (error) throw error;
          const venueIds = (data || []).map(f => f.venue_id);
          setLikedVenues(venueIds);

          // Migrate localStorage favorites to DB (one-time)
          const saved = localStorage.getItem('likedVenues');
          if (saved) {
            const localFavs: string[] = JSON.parse(saved);
            const newFavs = localFavs.filter(id => !venueIds.includes(id));
            if (newFavs.length > 0) {
              const rows = newFavs.map(venue_id => ({ user_id: user.id, venue_id }));
              await supabase.from('user_favorites').insert(rows);
              setLikedVenues(prev => [...prev, ...newFavs]);
            }
            localStorage.removeItem('likedVenues');
          }
        } catch (err) {
          console.error('Error loading favorites:', err);
          // Fallback to localStorage
          const saved = localStorage.getItem('likedVenues');
          if (saved) setLikedVenues(JSON.parse(saved));
        }
      } else {
        const saved = localStorage.getItem('likedVenues');
        if (saved) setLikedVenues(JSON.parse(saved));
      }
      setLoading(false);
    };

    loadFavorites();
  }, [user]);

  const toggleLike = useCallback(async (venueId: string) => {
    const isLiked = likedVenues.includes(venueId);
    
    // Optimistic update
    const newLikedVenues = isLiked
      ? likedVenues.filter(id => id !== venueId)
      : [...likedVenues, venueId];
    setLikedVenues(newLikedVenues);

    if (user) {
      try {
        if (isLiked) {
          const { error } = await supabase
            .from('user_favorites')
            .delete()
            .eq('user_id', user.id)
            .eq('venue_id', venueId);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('user_favorites')
            .insert({ user_id: user.id, venue_id: venueId });
          if (error) throw error;
        }
      } catch (err) {
        console.error('Error toggling favorite:', err);
        // Revert optimistic update
        setLikedVenues(likedVenues);
        toast.error('Favorit konnte nicht gespeichert werden');
      }
    } else {
      localStorage.setItem('likedVenues', JSON.stringify(newLikedVenues));
    }
  }, [likedVenues, user]);

  const isLiked = useCallback((venueId: string) => {
    return likedVenues.includes(venueId);
  }, [likedVenues]);

  return { likedVenues, toggleLike, isLiked, loading };
};
