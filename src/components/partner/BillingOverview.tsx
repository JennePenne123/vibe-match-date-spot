import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { usePartnerMembership } from '@/hooks/usePartnerMembership';
import { Receipt, Crown, Calendar, CreditCard, Info } from 'lucide-react';

/**
 * Shows the partner their current billing overview:
 * - Current plan & price
 * - Next billing date
 * - Founding partner status
 * - Commission structure (placeholder for future Stripe integration)
 */
const BillingOverview: React.FC = () => {
  const { tier, isPro, isFoundingPartner, membershipValidUntil, loading } = usePartnerMembership();

  if (loading) return null;

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Receipt className="w-5 h-5 text-primary" />
          Abrechnung & Gebühren
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Current Plan */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
          <div>
            <p className="text-sm font-medium">Aktueller Plan</p>
            <div className="flex items-center gap-2 mt-1">
              {isPro ? (
                <Badge className="bg-gradient-to-r from-amber-500 to-yellow-400 text-white border-0 gap-1">
                  <Crown className="w-3 h-3" />
                  Pro
                </Badge>
              ) : (
                <Badge variant="secondary">Free</Badge>
              )}
              {isFoundingPartner && (
                <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-500">
                  Founding Partner
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">
              {isPro ? (isFoundingPartner ? '€0' : '€14,90') : '€0'}
            </p>
            <p className="text-xs text-muted-foreground">
              {isPro ? '/Monat' : 'kostenlos'}
            </p>
          </div>
        </div>

        {/* Billing Details */}
        {isPro && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                {isFoundingPartner ? 'Founding Partner bis' : 'Nächste Abrechnung'}
              </span>
              <span className="font-medium">
                {membershipValidUntil
                  ? new Date(membershipValidUntil).toLocaleDateString('de-DE')
                  : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <CreditCard className="w-4 h-4" />
                Zahlungsmethode
              </span>
              <span className="text-muted-foreground italic text-xs">
                Stripe-Integration folgt
              </span>
            </div>
          </div>
        )}

        <Separator />

        {/* Commission Structure */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Gebührenstruktur</h4>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm p-3 rounded-lg bg-muted/30">
              <span>Plattform-Grundgebühr</span>
              <span className="font-medium">{isPro ? '€14,90/Monat' : 'Kostenlos'}</span>
            </div>
            <div className="flex items-center justify-between text-sm p-3 rounded-lg bg-muted/30">
              <span>Provision pro Voucher-Einlösung</span>
              <span className="font-medium text-muted-foreground italic text-xs">[Wird festgelegt]</span>
            </div>
            <div className="flex items-center justify-between text-sm p-3 rounded-lg bg-muted/30">
              <span>Premium-Platzierung</span>
              <span className="font-medium">{isPro ? 'Inklusive' : 'Nur Pro'}</span>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-start gap-2">
          <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">
              Die Abrechnung erfolgt nach Integration von Stripe automatisch. 
              Bis dahin sind alle Features gemäß deinem aktuellen Plan nutzbar.
              {isFoundingPartner && ' Als Founding Partner genießt du das erste Jahr alle Pro-Features kostenlos.'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BillingOverview;
