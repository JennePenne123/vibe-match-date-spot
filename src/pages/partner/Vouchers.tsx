import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Gift } from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoadingSpinner from '@/components/LoadingSpinner';
import SkeletonLoader from '@/components/SkeletonLoader';
import { useToast } from '@/hooks/use-toast';
import VoucherCreationModal from '@/components/partner/VoucherCreationModal';
import VoucherEditModal from '@/components/partner/VoucherEditModal';
import VoucherAnalyticsModal from '@/components/partner/VoucherAnalyticsModal';
import VoucherActionsMenu from '@/components/partner/VoucherActionsMenu';
import VoucherMobileCard from '@/components/partner/VoucherMobileCard';
import { format } from 'date-fns';
import { useRealtimeVouchers } from '@/hooks/useRealtimeVouchers';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePartnerVerificationGuard } from '@/hooks/usePartnerVerificationGuard';
import VerificationLockOverlay from '@/components/partner/VerificationLockOverlay';

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

type VoucherTab = 'active' | 'expired' | 'inactive';

export default function PartnerVouchers() {
  const { role, loading: roleLoading } = useUserRole();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [activeTab, setActiveTab] = useState<VoucherTab>('active');

  const { vouchers, loading, connected } = useRealtimeVouchers(user?.id);
  const { isLocked } = usePartnerVerificationGuard();
  const isPageLoading = roleLoading || authLoading;

  useEffect(() => {
    if (!isPageLoading && !user) {
      navigate('/?auth=partner', { replace: true });
      return;
    }

    if (!isPageLoading && user && role !== 'venue_partner' && role !== 'admin') {
      navigate('/home');
    }
  }, [role, isPageLoading, user, navigate]);

  const filteredVouchers = useMemo(() => {
    const now = new Date();
    return vouchers.filter((v) => {
      const isExpired = new Date(v.valid_until) < now;
      if (activeTab === 'active') return !isExpired && v.status === 'active';
      if (activeTab === 'expired') return isExpired;
      return v.status !== 'active' && !isExpired; // inactive
    });
  }, [vouchers, activeTab]);

  const tabCounts = useMemo(() => {
    const now = new Date();
    return {
      active: vouchers.filter(v => !new Date(v.valid_until).valueOf() || (new Date(v.valid_until) >= now && v.status === 'active')).length,
      expired: vouchers.filter(v => new Date(v.valid_until) < now).length,
      inactive: vouchers.filter(v => v.status !== 'active' && new Date(v.valid_until) >= now).length,
    };
  }, [vouchers]);

  const getStatusBadge = (voucher: Voucher) => {
    const isExpired = new Date(voucher.valid_until) < new Date();
    if (isExpired) return <Badge variant="destructive">Abgelaufen</Badge>;
    return voucher.status === 'active' ? (
      <Badge className="bg-gradient-to-r from-green-500 to-emerald-500">Aktiv</Badge>
    ) : (
      <Badge variant="secondary">Inaktiv</Badge>
    );
  };

  const formatDiscount = (type: string, value: number) => {
    if (type === 'percentage') return `${value}%`;
    if (type === 'fixed') return `${value}€`;
    return 'Free Item';
  };

  if (isPageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  const renderVoucherTable = (items: Voucher[]) => (
    <Card variant="glass" className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titel / Code</TableHead>
              <TableHead>Rabatt</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ablauf</TableHead>
              <TableHead>Einlösungen</TableHead>
              <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((voucher, index) => (
              <TableRow
                key={voucher.id}
                className="hover:bg-muted/50 transition-colors opacity-0 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}
              >
                <TableCell>
                  <div>
                    <div className="font-medium">{voucher.title}</div>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{voucher.code}</code>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-semibold">{formatDiscount(voucher.discount_type, voucher.discount_value)}</span>
                </TableCell>
                <TableCell>{getStatusBadge(voucher)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(voucher.valid_until), 'dd.MM.yyyy')}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {voucher.current_redemptions}
                      {voucher.max_redemptions ? ` / ${voucher.max_redemptions}` : ' / ∞'}
                    </span>
                    {voucher.max_redemptions > 0 && (
                      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all"
                          style={{
                            width: `${Math.min((voucher.current_redemptions / voucher.max_redemptions) * 100, 100)}%`,
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
                    onEdit={() => { setSelectedVoucher(voucher); setEditModalOpen(true); }}
                    onViewAnalytics={() => { setSelectedVoucher(voucher); setAnalyticsModalOpen(true); }}
                    onSuccess={() => {}}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );

  const renderMobileCards = (items: Voucher[]) => (
    <div className="space-y-3">
      {items.map((voucher) => (
        <VoucherMobileCard
          key={voucher.id}
          voucher={voucher}
          onEdit={() => { setSelectedVoucher(voucher); setEditModalOpen(true); }}
          onViewAnalytics={() => { setSelectedVoucher(voucher); setAnalyticsModalOpen(true); }}
        />
      ))}
    </div>
  );

  const renderEmptyTab = () => (
    <Card variant="glass" className="text-center py-8">
      <CardContent>
        <p className="text-muted-foreground text-sm">Keine Gutscheine in dieser Kategorie</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 space-y-6 overflow-x-hidden">
      {isLocked && <VerificationLockOverlay feature="Gutscheine" />}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-romantic bg-clip-text text-transparent">
            Gutscheine
          </h1>
          <Button size="sm" className="gap-1.5 shrink-0" onClick={() => setCreateModalOpen(true)}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Gutschein erstellen</span>
            <span className="sm:hidden">Neu</span>
          </Button>
        </div>
        <p className="text-muted-foreground text-sm">
          Erstelle und verwalte Angebote für deine Venues
        </p>
      </div>

      {loading ? (
        <Card variant="glass" className="overflow-hidden">
          <SkeletonLoader variant="voucher-table" count={5} />
        </Card>
      ) : vouchers.length === 0 ? (
        <Card variant="elegant" className="text-center py-12">
          <CardContent>
            <Gift className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Noch keine Gutscheine</h3>
            <p className="text-muted-foreground mb-6">
              Erstelle deinen ersten Gutschein, um Paare in dein Venue zu locken
            </p>
            <Button className="gap-2" onClick={() => setCreateModalOpen(true)}>
              <Plus className="w-4 h-4" />
              Ersten Gutschein erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as VoucherTab)}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="active" className="text-xs sm:text-sm">
              Aktiv {tabCounts.active > 0 && <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">{tabCounts.active}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="expired" className="text-xs sm:text-sm">
              Abgelaufen {tabCounts.expired > 0 && <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">{tabCounts.expired}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="inactive" className="text-xs sm:text-sm">
              Inaktiv {tabCounts.inactive > 0 && <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">{tabCounts.inactive}</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {filteredVouchers.length === 0
              ? renderEmptyTab()
              : isMobile
                ? renderMobileCards(filteredVouchers)
                : renderVoucherTable(filteredVouchers)
            }
          </TabsContent>
        </Tabs>
      )}

      <VoucherCreationModal open={createModalOpen} onOpenChange={setCreateModalOpen} onSuccess={() => setCreateModalOpen(false)} />
      <VoucherEditModal open={editModalOpen} onOpenChange={setEditModalOpen} voucher={selectedVoucher} onSuccess={() => setEditModalOpen(false)} />
      <VoucherAnalyticsModal open={analyticsModalOpen} onOpenChange={setAnalyticsModalOpen} voucherId={selectedVoucher?.id || null} voucherTitle={selectedVoucher?.title || ''} />
    </div>
  );
}
