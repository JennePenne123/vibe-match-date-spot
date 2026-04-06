import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPoints } from '@/hooks/useUserPoints';
import { useRewardShop } from '@/hooks/useRewardShop';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Gift, Ticket, Crown, Star, Lock, Loader2, Sparkles, History, Clock } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from '@/hooks/use-toast';



export default function Rewards() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const { points, loading: pointsLoading } = useUserPoints();
  const {
    vouchers,
    history,
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
  const handleRedeemVoucher = async (voucherId: string, pointsCost: number) => {
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

          {/* Points hint */}
          <div className="text-xs text-muted-foreground px-1">
            Sammle Punkte durch Dates, Bewertungen & Empfehlungen
          </div>
        </div>

        {/* Venue Vouchers – Coming Soon */}
        <div className="px-4 pb-2 mt-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {t('rewards.vouchers', 'Venue-Gutscheine')}
          </h2>
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-emerald-500/40 via-teal-400/40 to-emerald-500/40" />
            <CardContent className="p-5 text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 mx-auto mb-3">
                <Ticket className="w-6 h-6 text-emerald-500/60" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1">Bald verfügbar</h3>
              <p className="text-xs text-muted-foreground max-w-[260px] mx-auto">
                Löse deine Punkte bald gegen exklusive Venue-Gutscheine ein. Wir arbeiten daran!
              </p>
              <Badge variant="outline" className="mt-3 text-xs text-emerald-600 border-emerald-500/30">
                <Sparkles className="w-3 h-3 mr-1" />
                Coming Soon
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Premium Section – Coming Soon */}
        <div className="px-4 pb-6 mt-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {t('rewards.premium', 'Premium')}
          </h2>
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-amber-500/40 via-yellow-400/40 to-amber-500/40" />
            <CardContent className="p-5 text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 mx-auto mb-3">
                <Crown className="w-6 h-6 text-amber-500/60" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1">Bald verfügbar</h3>
              <p className="text-xs text-muted-foreground max-w-[260px] mx-auto">
                Premium-Mitgliedschaft mit exklusiven Gutscheinen und unbegrenzten Vorteilen kommt bald. Wir informieren dich!
              </p>
              <Badge variant="outline" className="mt-3 text-xs text-amber-600 border-amber-500/30">
                <Sparkles className="w-3 h-3 mr-1" />
                Coming Soon
              </Badge>
            </CardContent>
          </Card>
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
