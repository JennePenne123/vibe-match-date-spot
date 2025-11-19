import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'regular' | 'venue_partner' | 'admin';

export const useUserRole = () => {
  const [role, setRole] = useState<UserRole>('regular');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setRole('regular');
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error fetching user role:', error);
          setRole('regular');
        } else {
          setRole((data?.role as UserRole) || 'regular');
        }
      } catch (error) {
        console.error('Error in fetchUserRole:', error);
        setRole('regular');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  return { role, loading, isPartner: role === 'venue_partner', isAdmin: role === 'admin' };
};
