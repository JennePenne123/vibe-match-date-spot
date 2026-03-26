import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Crown, Sparkles, Check, Lock, Star } from 'lucide-react';
import { usePartnerMembership } from '@/hooks/usePartnerMembership';
import { useTranslation } from 'react-i18next';

const MembershipCard: React.FC = () => {
  const { tier, isPro, isFoundingPartner, membershipValidUntil, loading } = usePartnerMembership();
  const { t } = useTranslation();

  if (loading) return null;

  const proFeatures = [
    'Unbegrenzt Venues verwalten',
    'Unbegrenzt aktive Vouchers',
    'Erweiterte Analytics & Trends',
    'City Rankings Zugang',
    'Partner-Netzwerk & Map',
    'Sichtbarkeits-Boost im Matching',
    'Detaillierte Reports & PDF-Export',
  ];

  const freeFeatures = [
    '1 Venue verwalten',
    '2 aktive Vouchers',
    'Basis-KPIs im Dashboard',
  ];

  return (
    <Card variant="glass" className="relative overflow-hidden">
      {isPro && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/20 to-transparent rounded-bl-full" />
      )}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {isPro ? (
              <>
                <Crown className="w-5 h-5 text-amber-500" />
                Pro-Mitgliedschaft
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-muted-foreground" />
                Free-Mitgliedschaft
              </>
            )}
          </CardTitle>
          {isFoundingPartner && (
            <Badge className="bg-gradient-to-r from-amber-500 to-yellow-400 text-white border-0 gap-1">
              <Star className="w-3 h-3" />
              Founding Partner
            </Badge>
          )}
        </div>
        {isPro && membershipValidUntil && (
          <p className="text-xs text-muted-foreground">
            Aktiv bis {new Date(membershipValidUntil).toLocaleDateString('de-DE')}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isPro ? (
          <div className="space-y-2">
            {proFeatures.map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {freeFeatures.map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-4 space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Mit Pro bekommst du zusätzlich:</p>
              {proFeatures.filter(f => !freeFeatures.includes(f)).map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            <Button className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white hover:from-amber-600 hover:to-yellow-600 gap-2">
              <Crown className="w-4 h-4" />
              Upgrade auf Pro — €14,90/Monat
            </Button>
            <p className="text-[11px] text-center text-muted-foreground">
              Founding Partner? Erhalte das erste Jahr kostenlos!
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default MembershipCard;
