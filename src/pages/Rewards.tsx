import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPoints } from '@/hooks/useUserPoints';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Gift, Ticket, Crown, Star, Lock } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from '@/hooks/use-toast';

interface RewardItem {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  cost: number;
  category: 'voucher' | 'premium';
  color: string;
  bg: string;
}

const rewards: RewardItem[] = [
  {
    id: 'voucher-10',
    icon: Ticket,
    title: '10% Venue-Rabatt',
    description: 'Erhalte einen 10% Gutschein für ein beliebiges Partner-Venue.',
    cost: 500,
    category: 'voucher',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    id: 'voucher-20',
    icon: Ticket,
    title: '20% Venue-Rabatt',
    description: 'Erhalte einen 20% Gutschein für ein beliebiges Partner-Venue.',
    cost: 1000,
    category: 'voucher',
    color: 'text-emerald-600',
    bg: 'bg-emerald-600/10',
  },
  {
    id: 'premium-week',
    icon: Crown,
    title: '7 Tage Premium',
    description: 'Schalte für eine Woche erweiterte AI-Empfehlungen frei.',
    cost: 750,
    category: 'premium',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  {
    id: 'premium-month',
    icon: Crown,
    title: '30 Tage Premium',
    description: 'Ein ganzer Monat Premium-Zugang mit allen Features.',
    cost: 2500,
    category: 'premium',
    color: 'text-amber-600',
    bg: 'bg-amber-600/10',
  },
];

export default function Rewards() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const { points, loading: pointsLoading } = useUserPoints();

  if (authLoading || pointsLoading) {
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

  const handleRedeem = (reward: RewardItem) => {
    if (totalPoints < reward.cost) {
      toast({
        title: t('rewards.notEnoughPoints', 'Nicht genug Punkte'),
        description: t('rewards.needMore', 'Dir fehlen {{count}} Punkte für diese Belohnung.', { count: reward.cost - totalPoints }),
        variant: 'destructive',
      });
      return;
    }
    // TODO: Implement actual redemption via Supabase
    toast({
      title: t('rewards.comingSoon', 'Bald verfügbar'),
      description: t('rewards.comingSoonDesc', 'Das Einlösen von Rewards wird bald freigeschaltet!'),
    });
  };

  const categoryLabels: Record<string, string> = {
    voucher: t('rewards.vouchers', 'Gutscheine'),
    premium: t('rewards.premium', 'Premium'),
  };

  const categories = ['voucher', 'premium'] as const;

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

        {/* Points Banner */}
        <div className="px-4 pt-4">
          <Card className="bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 border-primary/20">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">{t('rewards.yourPoints', 'Dein Guthaben')}</p>
              <p className="text-3xl font-bold text-foreground mt-1">{totalPoints.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('rewards.pointsHint', 'Sammle Punkte durch Dates, Bewertungen & Empfehlungen')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Rewards by category */}
        <div className="px-4 pb-6 space-y-5 mt-4">
          {categories.map((cat) => (
            <div key={cat}>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {categoryLabels[cat]}
              </h2>
              <div className="space-y-3">
                {rewards
                  .filter((r) => r.category === cat)
                  .map((reward) => {
                    const canAfford = totalPoints >= reward.cost;
                    return (
                      <Card key={reward.id} className={`bg-card/50 backdrop-blur-sm border-border/50 transition-all ${!canAfford ? 'opacity-60' : ''}`}>
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${reward.bg}`}>
                            <reward.icon className={`w-5 h-5 ${reward.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{reward.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{reward.description}</p>
                          </div>
                          <Button
                            size="sm"
                            variant={canAfford ? 'default' : 'outline'}
                            onClick={() => handleRedeem(reward)}
                            className={canAfford ? 'bg-primary text-primary-foreground' : ''}
                          >
                            {!canAfford && <Lock className="w-3 h-3 mr-1" />}
                            {reward.cost.toLocaleString()}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
