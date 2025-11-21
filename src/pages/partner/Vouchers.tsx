import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Gift } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import VoucherCreationModal from '@/components/partner/VoucherCreationModal';
import VoucherEditModal from '@/components/partner/VoucherEditModal';
import VoucherAnalyticsModal from '@/components/partner/VoucherAnalyticsModal';
import VoucherActionsMenu from '@/components/partner/VoucherActionsMenu';
import { format } from 'date-fns';

interface Voucher {
  id: string;
  code: string;
  title: string;
  description: string;
  discount_type: string;
  discount_value: number;
  valid_from: string;
  valid_until: string;
  max_redemptions: number;
  min_booking_value: number;
  current_redemptions: number;
  status: string;
  applicable_days: string[];
  applicable_times: string[];
  terms_conditions: string;
}

export default function PartnerVouchers() {
  const { role, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);

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

  const getStatusBadge = (voucher: Voucher) => {
    const isExpired = new Date(voucher.valid_until) < new Date();
    
    if (isExpired) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    
    return voucher.status === 'active' ? (
      <Badge className="bg-gradient-to-r from-green-500 to-emerald-500">Active</Badge>
    ) : (
      <Badge variant="secondary">Inactive</Badge>
    );
  };

  const formatDiscount = (type: string, value: number) => {
    if (type === 'percentage') return `${value}%`;
    if (type === 'fixed') return `$${value}`;
    return 'Free Item';
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
        <Button className="gap-2" onClick={() => setCreateModalOpen(true)}>
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
            <Button className="gap-2" onClick={() => setCreateModalOpen(true)}>
              <Plus className="w-4 h-4" />
              Create Your First Voucher
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card variant="glass" className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title / Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Redemptions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vouchers.map((voucher) => (
                  <TableRow key={voucher.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <div>
                        <div className="font-medium">{voucher.title}</div>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {voucher.code}
                        </code>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">
                        {formatDiscount(voucher.discount_type, voucher.discount_value)}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(voucher)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(voucher.valid_until), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {voucher.current_redemptions}
                          {voucher.max_redemptions ? ` / ${voucher.max_redemptions}` : ' / ∞'}
                        </span>
                        {voucher.max_redemptions && (
                          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-primary-glow transition-all"
                              style={{
                                width: `${Math.min(
                                  (voucher.current_redemptions / voucher.max_redemptions) * 100,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <VoucherActionsMenu
                        voucherId={voucher.id}
                        voucherTitle={voucher.title}
                        currentStatus={voucher.status}
                        currentRedemptions={voucher.current_redemptions}
                        validUntil={voucher.valid_until}
                        onEdit={() => {
                          setSelectedVoucher(voucher);
                          setEditModalOpen(true);
                        }}
                        onViewAnalytics={() => {
                          setSelectedVoucher(voucher);
                          setAnalyticsModalOpen(true);
                        }}
                        onSuccess={fetchVouchers}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <VoucherCreationModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={fetchVouchers}
      />

      <VoucherEditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        voucher={selectedVoucher}
        onSuccess={fetchVouchers}
      />

      <VoucherAnalyticsModal
        open={analyticsModalOpen}
        onOpenChange={setAnalyticsModalOpen}
        voucherId={selectedVoucher?.id || null}
        voucherTitle={selectedVoucher?.title || ''}
      />
    </div>
  );
}
