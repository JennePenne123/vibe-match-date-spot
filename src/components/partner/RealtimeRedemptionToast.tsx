import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import { Ticket } from 'lucide-react';

/**
 * Subscribes to realtime voucher redemptions for the current partner.
 * Shows a toast notification when a guest redeems a voucher.
 */
export default function RealtimeRedemptionToast() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('partner-redemptions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'voucher_redemptions',
        },
        async (payload) => {
          const redemption = payload.new as any;
          // Check if this redemption belongs to the current partner
          const { data: voucher } = await supabase
            .from('vouchers')
            .select('title, partner_id')
            .eq('id', redemption.voucher_id)
            .single();

          if (voucher?.partner_id === user.id) {
            toast.success(`Gutschein "${voucher.title}" eingelöst!`, {
              description: `${redemption.discount_applied}€ Rabatt gewährt`,
              duration: 8000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return null;
}
