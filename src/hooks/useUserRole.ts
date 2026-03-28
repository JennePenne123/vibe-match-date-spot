import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type UserRole = 'regular' | 'venue_partner' | 'admin';

export const useUserRole = () => {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<UserRole>('regular');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const fetchUserRole = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId);

        if (!isActive) return;

        if (error) {
          console.error('Error fetching user role:', error);
          setRole('regular');
        } else if (data && data.length > 0) {
          // Prioritize: admin > venue_partner > regular
          const roles = data.map(d => d.role as UserRole);
          if (roles.includes('admin')) setRole('admin');
          else if (roles.includes('venue_partner')) setRole('venue_partner');
          else setRole('regular');
        } else {
          setRole('regular');
        }
      } catch (error) {
        if (!isActive) return;
        console.error('Error in fetchUserRole:', error);
        setRole('regular');
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    if (authLoading) {
      setLoading(true);
      return () => {
        isActive = false;
      };
    }

    if (!user?.id) {
      setRole('regular');
      setLoading(false);
      return () => {
        isActive = false;
      };
    }

    setLoading(true);
    void fetchUserRole(user.id);

    return () => {
      isActive = false;
    };
  }, [authLoading, user?.id]);

  return { role, loading, isPartner: role === 'venue_partner', isAdmin: role === 'admin' };
};
