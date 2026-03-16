import { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Wallet, Ticket, Clock, XCircle, CheckCircle2, Percent, Gift, ChevronRight, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { VoucherQRDetail } from './VoucherQRDetail';

interface WalletVoucher {
  id: string;
  title: string;
  code: string;
  discount_type: 'percentage' | 'fixed' | 'free_item';
  discount_value: number;
  venue_name: string;
  venue_id: string;
  valid_until: string;
  created_at: string;
  redeemed_at?: string | null;
  status: 'active' | 'redeemed' | 'expired';
  ai_match_score?: number;
}

type WalletTab = 'active' | 'expiring' | 'redeemed' | 'expired';

// Mock data for now – will be replaced with real Supabase queries when subscription system is built
const mockVouchers: WalletVoucher[] = [
  {
    id: '1',
    title: '20% Off Dinner',
    code: 'VYBE20A',
    discount_type: 'percentage',
    discount_value: 20,
    venue_name: 'Osteria Francescana',
    venue_id: 'v1',
    valid_until: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    ai_match_score: 96,
  },
  {
    id: '2',
    title: 'Free Dessert',
    code: 'VYBEFREE',
    discount_type: 'free_item',
    discount_value: 0,
    venue_name: 'Le Petit Bistro',
    venue_id: 'v2',
    valid_until: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 26 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    ai_match_score: 92,
  },
  {
    id: '3',
    title: '€15 Off',
    code: 'VYBE15',
    discount_type: 'fixed',
    discount_value: 15,
    venue_name: 'Sakura Garden',
    venue_id: 'v3',
    valid_until: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    ai_match_score: 89,
  },
  {
    id: '4',
    title: '10% Off Brunch',
    code: 'VYBE10B',
    discount_type: 'percentage',
    discount_value: 10,
    venue_name: 'Golden Brunch Club',
    venue_id: 'v4',
    valid_until: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 33 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'expired',
    ai_match_score: 87,
  },
  {
    id: '5',
    title: '25% Off Date Night',
    code: 'VYBEDATE',
    discount_type: 'percentage',
    discount_value: 25,
    venue_name: 'Moonlight Lounge',
    venue_id: 'v5',
    valid_until: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    redeemed_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'redeemed',
    ai_match_score: 94,
  },
];

const EXPIRING_THRESHOLD_DAYS = 7;

function getDaysRemaining(validUntil: string): number {
  return Math.ceil((new Date(validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function categorizeVouchers(vouchers: WalletVoucher[]) {
  const active: WalletVoucher[] = [];
  const expiring: WalletVoucher[] = [];
  const expired: WalletVoucher[] = [];
  const redeemed: WalletVoucher[] = [];

  for (const v of vouchers) {
    if (v.status === 'redeemed') {
      redeemed.push(v);
    } else if (v.status === 'expired' || getDaysRemaining(v.valid_until) <= 0) {
      expired.push(v);
    } else if (getDaysRemaining(v.valid_until) <= EXPIRING_THRESHOLD_DAYS) {
      expiring.push(v);
    } else {
      active.push(v);
    }
  }

  return { active, expiring, expired, redeemed };
}

function VoucherIcon({ type }: { type: string }) {
  switch (type) {
    case 'percentage':
      return <Percent className="w-4 h-4" />;
    case 'free_item':
      return <Gift className="w-4 h-4" />;
    default:
      return <Ticket className="w-4 h-4" />;
  }
}

function DiscountDisplay({ voucher }: { voucher: WalletVoucher }) {
  switch (voucher.discount_type) {
    case 'percentage':
      return <span className="text-lg font-bold">{voucher.discount_value}%</span>;
    case 'fixed':
      return <span className="text-lg font-bold">€{voucher.discount_value}</span>;
    case 'free_item':
      return <Gift className="w-5 h-5" />;
    default:
      return null;
  }
}

function VoucherCard({ voucher, variant, onTap }: { voucher: WalletVoucher; variant: WalletTab; onTap?: () => void }) {
  const daysLeft = getDaysRemaining(voucher.valid_until);
  const isExpiring = variant === 'expiring';
  const isExpired = variant === 'expired';
  const isRedeemed = variant === 'redeemed';
  const isTappable = !isExpired && !isRedeemed;

  return (
    <div
      onClick={isTappable ? onTap : undefined}
      role={isTappable ? 'button' : undefined}
      tabIndex={isTappable ? 0 : undefined}
      className={cn(
        'relative flex items-stretch gap-0 rounded-xl border overflow-hidden transition-all duration-200',
        isTappable && 'cursor-pointer active:scale-[0.98]',
        isExpired && 'opacity-60',
        isRedeemed && 'opacity-75',
        isExpiring
          ? 'border-orange-500/40 bg-orange-500/5'
          : isExpired
            ? 'border-border/30 bg-muted/30'
            : isRedeemed
              ? 'border-emerald-500/30 bg-emerald-500/5'
              : 'border-border/50 bg-card/80 hover:border-primary/30 hover:shadow-md'
      )}
    >
      {/* Discount strip */}
      <div
        className={cn(
          'flex flex-col items-center justify-center w-16 shrink-0 text-white',
          isExpired
            ? 'bg-muted-foreground/60'
            : isRedeemed
              ? 'bg-gradient-to-b from-emerald-500 to-emerald-600'
              : isExpiring
                ? 'bg-gradient-to-b from-orange-500 to-amber-500'
                : 'bg-gradient-to-b from-primary to-primary/80'
        )}
      >
        <VoucherIcon type={voucher.discount_type} />
        <DiscountDisplay voucher={voucher} />
        {voucher.discount_type !== 'free_item' && (
          <span className="text-[10px] uppercase tracking-wider opacity-80">Off</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-3 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{voucher.title}</p>
            <p className="text-xs text-muted-foreground truncate">{voucher.venue_name}</p>
          </div>
          {voucher.ai_match_score && !isExpired && !isRedeemed && (
            <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-0">
              <Sparkles className="w-2.5 h-2.5 mr-0.5" />
              {voucher.ai_match_score}%
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          <code className="text-[10px] font-mono bg-muted/80 px-1.5 py-0.5 rounded text-muted-foreground">
            {voucher.code}
          </code>

          {isRedeemed ? (
            <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3 h-3" />
              Eingelöst
            </span>
          ) : isExpired ? (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
              <XCircle className="w-3 h-3" />
              Abgelaufen
            </span>
          ) : isExpiring ? (
            <span className="flex items-center gap-1 text-[10px] text-orange-600 dark:text-orange-400 font-medium animate-pulse">
              <Clock className="w-3 h-3" />
              Noch {daysLeft} {daysLeft === 1 ? 'Tag' : 'Tage'}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="w-3 h-3" />
              {daysLeft} Tage übrig
            </span>
          )}
        </div>
      </div>

      {!isExpired && !isRedeemed && (
        <div className="flex items-center pr-2 text-muted-foreground/40">
          <ChevronRight className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}

function EmptyState({ tab }: { tab: WalletTab }) {
  const messages: Record<WalletTab, { icon: React.ReactNode; text: string }> = {
    active: { icon: <Ticket className="w-8 h-8 text-muted-foreground/40" />, text: 'Keine aktiven Vouchers. Starte einen AI-Match um exklusive Deals zu erhalten!' },
    expiring: { icon: <Clock className="w-8 h-8 text-muted-foreground/40" />, text: 'Keine Vouchers laufen bald ab.' },
    redeemed: { icon: <CheckCircle2 className="w-8 h-8 text-muted-foreground/40" />, text: 'Noch keine Vouchers eingelöst.' },
    expired: { icon: <XCircle className="w-8 h-8 text-muted-foreground/40" />, text: 'Keine abgelaufenen Vouchers.' },
  };

  const msg = messages[tab];
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
      {msg.icon}
      <p className="text-xs text-muted-foreground max-w-[200px]">{msg.text}</p>
    </div>
  );
}

export function PremiumWalletCard() {
  const [activeTab, setActiveTab] = useState<WalletTab>('active');
  const [direction, setDirection] = useState(0);
  const [selectedVoucher, setSelectedVoucher] = useState<WalletVoucher | null>(null);
  const { user } = useAuth();
  const tabOrder: WalletTab[] = ['active', 'expiring', 'redeemed', 'expired'];

  const handleTabChange = (newTab: string) => {
    const oldIndex = tabOrder.indexOf(activeTab);
    const newIndex = tabOrder.indexOf(newTab as WalletTab);
    setDirection(newIndex > oldIndex ? 1 : -1);
    setActiveTab(newTab as WalletTab);
  };

  // TODO: Replace with real data from Supabase when subscription system is built
  const { active, expiring, expired, redeemed } = categorizeVouchers(mockVouchers);

  const counts = {
    active: active.length,
    expiring: expiring.length,
    redeemed: redeemed.length,
    expired: expired.length,
  };

  const tabVouchers: Record<WalletTab, WalletVoucher[]> = { active, expiring, redeemed, expired };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
      {/* Premium header accent */}
      <div className="h-1 bg-gradient-to-r from-primary via-primary/60 to-accent" />

      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
            <Wallet className="h-4 w-4 text-primary" />
          </div>
          Meine Wallet
          <Badge variant="secondary" className="ml-auto text-[10px] bg-primary/10 text-primary border-0 font-semibold">
            Premium
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="w-full grid grid-cols-4 h-9 bg-muted/50 p-0.5">
            <TabsTrigger value="active" className="text-[10px] data-[state=active]:bg-card data-[state=active]:shadow-sm px-1">
              Aktiv {counts.active > 0 && <span className="ml-0.5 text-primary">({counts.active})</span>}
            </TabsTrigger>
            <TabsTrigger value="expiring" className="text-[10px] data-[state=active]:bg-card data-[state=active]:shadow-sm px-1 relative">
              Bald ab
              {counts.expiring > 0 && (
                <span className="ml-0.5 text-orange-500">({counts.expiring})</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="redeemed" className="text-[10px] data-[state=active]:bg-card data-[state=active]:shadow-sm px-1">
              Eingelöst {counts.redeemed > 0 && <span className="ml-0.5">({counts.redeemed})</span>}
            </TabsTrigger>
            <TabsTrigger value="expired" className="text-[10px] data-[state=active]:bg-card data-[state=active]:shadow-sm px-1">
              Abgelaufen {counts.expired > 0 && <span className="ml-0.5">({counts.expired})</span>}
            </TabsTrigger>
          </TabsList>

          <div className="relative overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={activeTab}
                custom={direction}
                initial={{ x: direction * 80, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: direction * -80, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="mt-3 space-y-2.5"
              >
                {tabVouchers[activeTab].length === 0 ? (
                  <EmptyState tab={activeTab} />
                ) : (
                  tabVouchers[activeTab].map((voucher, i) => (
                    <motion.div
                      key={voucher.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06, duration: 0.2 }}
                    >
                      <VoucherCard voucher={voucher} variant={activeTab} onTap={() => setSelectedVoucher(voucher)} />
                    </motion.div>
                  ))
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </Tabs>

        {/* 30-day validity info */}
        <p className="text-[10px] text-muted-foreground text-center mt-4 flex items-center justify-center gap-1">
          <Clock className="w-2.5 h-2.5" />
          Vouchers sind 30 Tage ab Erstellung gültig
        </p>
      </CardContent>
    </Card>
  );
}

export default PremiumWalletCard;
