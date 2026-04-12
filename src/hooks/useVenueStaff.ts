import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface StaffMember {
  id: string;
  partner_id: string;
  venue_id: string | null;
  user_id: string | null;
  email: string;
  name: string;
  staff_role: string;
  status: string;
  invited_at: string;
  accepted_at: string | null;
  qr_code_token: string;
  last_scan_at: string | null;
}

export function useVenueStaff() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStaff = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('venue_staff')
        .select('*')
        .eq('partner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStaff((data as StaffMember[]) || []);
    } catch (err) {
      console.error('Error fetching staff:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const inviteStaff = async (email: string, name: string, role: 'manager' | 'staff', venueId?: string) => {
    if (!user) return false;
    try {
      const { error } = await supabase
        .from('venue_staff')
        .insert({
          partner_id: user.id,
          email,
          name,
          staff_role: role,
          venue_id: venueId || null,
        });

      if (error) {
        if (error.code === '23505') {
          toast({ title: 'Dieser Mitarbeiter wurde bereits eingeladen', variant: 'destructive' });
        } else {
          throw error;
        }
        return false;
      }

      toast({ title: 'Einladung gesendet', description: `${name} wurde eingeladen.` });
      await fetchStaff();
      return true;
    } catch (err) {
      console.error('Error inviting staff:', err);
      toast({ title: 'Fehler beim Einladen', variant: 'destructive' });
      return false;
    }
  };

  const updateStaffRole = async (staffId: string, newRole: 'manager' | 'staff') => {
    try {
      const { error } = await supabase
        .from('venue_staff')
        .update({ staff_role: newRole })
        .eq('id', staffId);
      if (error) throw error;
      toast({ title: 'Rolle aktualisiert' });
      await fetchStaff();
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' });
    }
  };

  const deactivateStaff = async (staffId: string) => {
    try {
      const { error } = await supabase
        .from('venue_staff')
        .update({ status: 'deactivated' })
        .eq('id', staffId);
      if (error) throw error;
      toast({ title: 'Mitarbeiter deaktiviert' });
      await fetchStaff();
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' });
    }
  };

  const reactivateStaff = async (staffId: string) => {
    try {
      const { error } = await supabase
        .from('venue_staff')
        .update({ status: 'active' })
        .eq('id', staffId);
      if (error) throw error;
      toast({ title: 'Mitarbeiter reaktiviert' });
      await fetchStaff();
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' });
    }
  };

  const removeStaff = async (staffId: string) => {
    try {
      const { error } = await supabase
        .from('venue_staff')
        .delete()
        .eq('id', staffId);
      if (error) throw error;
      toast({ title: 'Mitarbeiter entfernt' });
      await fetchStaff();
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' });
    }
  };

  const generateStaffInviteQR = () => {
    if (!user) return '';
    return JSON.stringify({
      type: 'vybe_staff_invite',
      partner_id: user.id,
      ts: Date.now(),
    });
  };

  return {
    staff,
    loading,
    inviteStaff,
    updateStaffRole,
    deactivateStaff,
    reactivateStaff,
    removeStaff,
    fetchStaff,
    generateStaffInviteQR,
  };
}
