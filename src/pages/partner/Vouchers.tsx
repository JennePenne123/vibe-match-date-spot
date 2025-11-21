import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Gift, Calendar, TrendingUp } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import VoucherCreationModal from '@/components/partner/VoucherCreationModal';

interface Voucher {
  id: string;
  code: string;
  title: string;
  description: string;
  discount_type: string;
  discount_value: number;
  valid_until: string;
  max_redemptions: number;
  current_redemptions: number;
  status: string;
}

export default function PartnerVouchers() {
  const { role, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!roleLoading && role !== 'venue_partner' && role !== 'admin') {
      navigate('/home');
    }
  }, [role, roleLoading, navigate]);

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('vouchers')
        .select('*')
        .eq('partner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVouchers(data || []);
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load vouchers',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (roleLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-romantic bg-clip-text text-transparent">
            Manage Vouchers
          </h1>
          <p className="text-muted-foreground mt-2">
            Create and manage special offers for your venues
          </p>
        </div>
        <Button className="gap-2" onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Create Voucher
        </Button>
      </div>

      {vouchers.length === 0 ? (
        <Card variant="elegant" className="text-center py-12">
          <CardContent>
            <Gift className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No vouchers yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first voucher to start attracting couples to your venue
            </p>
            <Button className="gap-2" onClick={() => setModalOpen(true)}>
              <Plus className="w-4 h-4" />
              Create Your First Voucher
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vouchers.map((voucher) => (
            <Card key={voucher.id} variant="glass" className="hover:scale-105 transition-all duration-300">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{voucher.title}</CardTitle>
                    <Badge 
                      variant={voucher.status === 'active' ? 'default' : 'secondary'}
                      className="mt-2"
                    >
                      {voucher.status}
                    </Badge>
                  </div>
                  <Gift className="w-5 h-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Code:</span>
                  <code className="bg-muted px-2 py-1 rounded">{voucher.code}</code>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Discount:</span>
                  <span className="font-semibold">
                    {voucher.discount_type === 'percentage' 
                      ? `${voucher.discount_value}%` 
                      : `$${voucher.discount_value}`}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Expires {new Date(voucher.valid_until).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="w-4 h-4" />
                  <span>
                    {voucher.current_redemptions} / {voucher.max_redemptions || '∞'} redeemed
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <VoucherCreationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={fetchVouchers}
      />
    </div>
  );
}
