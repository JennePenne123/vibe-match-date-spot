import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPoints } from '@/hooks/useUserPoints';
import { useRewardShop, type RedemptionHistoryItem } from '@/hooks/useRewardShop';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Gift, Ticket, Crown, Star, Lock, Loader2, Sparkles, History, Clock } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from '@/hooks/use-toast';

const PREMIUM_7_DAY_COST = 750;

export default function Rewards() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const { points, loading: pointsLoading } = useUserPoints();
  const {
    vouchers,
    history,
    monthlyUsed,
    monthlyLimit,
    isPremium,
    premiumUntil,
    loading: shopLoading,
    redeeming,
    redeemReward,
  } = useRewardShop();

  if (authLoading || pointsLoading || shopLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    navigate('/');
    return null;
  }

  const totalPoints = points?.total_points ?? 0;
  const remainingRedemptions = isPremium ? Infinity : monthlyLimit - monthlyUsed;

  const handleRedeemVoucher = async (voucherId: string, pointsCost: number) => {
    if (!isPremium && remainingRedemptions <= 0) {
      toast({
        title: 'Monatslimit erreicht',
        description: `Du hast diesen Monat bereits ${monthlyLimit} Rewards eingelöst. Werde Premium für unbegrenztes Einlösen!`,
        variant: 'destructive',
      });
      return;
    }
    if (totalPoints < pointsCost) {
      toast({
        title: 'Nicht genug Punkte',
        description: `Dir fehlen ${pointsCost - totalPoints} Punkte.`,
        variant: 'destructive',
      });
      return;
    }

    const result = await redeemReward('voucher', voucherId);
    if (result.success) {
      toast({
        title: '🎉 Voucher eingelöst!',
        description: `Code: ${result.data?.voucher?.code}. Du findest ihn in deinem Profil.`,
      });
    } else {
      toast({ title: 'Fehler', description: result.error, variant: 'destructive' });
    }
  };

  const handleRedeemPremium = async () => {
    if (!isPremium && remainingRedemptions <= 0) {
      toast({
        title: 'Monatslimit erreicht',
        description: 'Diesen Monat sind keine Einlösungen mehr möglich.',
        variant: 'destructive',
      });
      return;
    }
    if (totalPoints < PREMIUM_7_DAY_COST) {
      toast({
        title: 'Nicht genug Punkte',
        description: `Dir fehlen ${PREMIUM_7_DAY_COST - totalPoints} Punkte.`,
        variant: 'destructive',
      });
      return;
    }

    const result = await redeemReward('premium');
    if (result.success) {
      toast({
        title: '👑 Premium aktiviert!',
        description: `Premium läuft bis ${new Date(result.data?.premium_until).toLocaleDateString('de-DE')}.`,
      });
    } else {
      toast({ title: 'Fehler', description: result.error, variant: 'destructive' });
    }
  };

  const formatDiscount = (type: string, value: number) => {
    if (type === 'percentage') return `${value}%`;
    if (type === 'fixed') return `${value}€`;
    return 'Gratis-Item';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg border-b border-border/50 px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Gift className="w-5 h-5 text-primary" />
                {t('rewards.title', 'Reward Shop')}
              </h1>
            </div>
            <Badge variant="secondary" className="text-sm font-semibold gap-1">
              <Star className="w-3.5 h-3.5 text-amber-500" />
              {totalPoints.toLocaleString()}
            </Badge>
          </div>
        </div>

        {/* Points & Status Banner */}
        <div className="px-4 pt-4 space-y-3">
          <Card className="bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 border-primary/20">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">{t('rewards.yourPoints', 'Dein Guthaben')}</p>
              <p className="text-3xl font-bold text-foreground mt-1">{totalPoints.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('rewards.pointsHint', 'Sammle Punkte durch Dates, Bewertungen & Empfehlungen')}
              </p>
            </CardContent>
          </Card>

          {/* Monthly limit indicator */}
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>
              {isPremium ? (
                <span className="flex items-center gap-1 text-amber-500 font-medium">
                  <Crown className="w-3 h-3" /> Premium – unbegrenzt einlösen
                </span>
              ) : (
                `${monthlyUsed}/${monthlyLimit} Einlösungen diesen Monat`
              )}
            </span>
            {isPremium && premiumUntil && (
              <span>bis {new Date(premiumUntil).toLocaleDateString('de-DE')}</span>
            )}
          </div>
        </div>

        {/* Venue Vouchers */}
        <div className="px-4 pb-2 mt-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {t('rewards.vouchers', 'Venue-Gutscheine')}
          </h2>

          {vouchers.length === 0 ? (
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-6 text-center">
                <Ticket className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Aktuell keine Voucher verfügbar. Schau bald wieder vorbei!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {vouchers.map((voucher) => {
                const canAfford = totalPoints >= voucher.points_cost;
                const canRedeem = isPremium || remainingRedemptions > 0;
                const disabled = !canAfford || !canRedeem;

                return (
                  <Card
                    key={voucher.id}
                    className={`bg-card/50 backdrop-blur-sm border-border/50 transition-all ${disabled ? 'opacity-60' : ''}`}
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10">
                        <Ticket className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {formatDiscount(voucher.discount_type, voucher.discount_value)} Rabatt
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {voucher.venue_name} · {voucher.title}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant={canAfford && canRedeem ? 'default' : 'outline'}
                        disabled={disabled || redeeming}
                        onClick={() => handleRedeemVoucher(voucher.id, voucher.points_cost)}
                        className={canAfford && canRedeem ? 'bg-primary text-primary-foreground' : ''}
                      >
                        {redeeming ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            {!canAfford && <Lock className="w-3 h-3 mr-1" />}
                            {voucher.points_cost.toLocaleString()}
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Premium Section */}
        <div className="px-4 pb-6 mt-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {t('rewards.premium', 'Premium')}
          </h2>
          <div className="space-y-3">
            {/* 7 Days via Points */}
            <Card className={`bg-card/50 backdrop-blur-sm border-border/50 transition-all ${totalPoints < PREMIUM_7_DAY_COST ? 'opacity-60' : ''}`}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/10">
                  <Crown className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">7 Tage Premium</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    Exklusive Venue-Rabatte bei deinen Top-Matches & kein monatliches Einlöse-Limit
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={totalPoints >= PREMIUM_7_DAY_COST ? 'default' : 'outline'}
                  disabled={totalPoints < PREMIUM_7_DAY_COST || redeeming}
                  onClick={handleRedeemPremium}
                  className={totalPoints >= PREMIUM_7_DAY_COST ? 'bg-primary text-primary-foreground' : ''}
                >
                  {redeeming ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <>
                      {totalPoints < PREMIUM_7_DAY_COST && <Lock className="w-3 h-3 mr-1" />}
                      {PREMIUM_7_DAY_COST.toLocaleString()}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* 30 Days via Stripe (coming soon) */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50 opacity-60">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-600/10">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">30 Tage Premium</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    Per Abo · Punkte-Rabatt möglich
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  Bald
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Redemption History */}
        {history.length > 0 && (
          <div className="px-4 pb-6 mt-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              Letzte Einlösungen
            </h2>
            <div className="space-y-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 py-2 px-3 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted/50">
                    {item.reward_type === 'premium' ? (
                      <Crown className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Ticket className="w-4 h-4 text-emerald-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {item.reward_type === 'premium'
                        ? '7 Tage Premium'
                        : item.voucher_title
                          ? `${item.venue_name} · ${item.voucher_title}`
                          : 'Venue-Voucher'}
                    </p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(item.created_at).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    -{item.points_spent.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
