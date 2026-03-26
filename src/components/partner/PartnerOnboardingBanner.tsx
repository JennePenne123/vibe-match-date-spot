import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { User, Store, Ticket, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';

interface PartnerOnboardingBannerProps {
  hasProfile: boolean;
  hasVenues: boolean;
  hasVouchers: boolean;
}

export default function PartnerOnboardingBanner({ hasProfile, hasVenues, hasVouchers }: PartnerOnboardingBannerProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  // All done or dismissed
  if ((hasProfile && hasVenues && hasVouchers) || dismissed) return null;

  const steps = [
    {
      key: 'profile',
      done: hasProfile,
      icon: User,
      title: t('partner.onboarding.profileTitle', 'Firmenprofil anlegen'),
      desc: t('partner.onboarding.profileDesc', 'Name, Kontaktdaten und Beschreibung'),
      action: () => navigate('/partner/profile'),
    },
    {
      key: 'venue',
      done: hasVenues,
      icon: Store,
      title: t('partner.onboarding.venueTitle', 'Erstes Venue hinzufügen'),
      desc: t('partner.onboarding.venueDesc', 'Registriere oder beanspruche dein Venue'),
      action: () => navigate('/partner/venues'),
    },
    {
      key: 'voucher',
      done: hasVouchers,
      icon: Ticket,
      title: t('partner.onboarding.voucherTitle', 'Ersten Gutschein erstellen'),
      desc: t('partner.onboarding.voucherDesc', 'Locke Paare mit einem Angebot'),
      action: () => navigate('/partner/vouchers'),
    },
  ];

  const completedCount = steps.filter(s => s.done).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);
  const nextStep = steps.find(s => !s.done);

  return (
    <Card variant="glass" className="border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
      <CardContent className="p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-sm sm:text-base">
              {t('partner.onboarding.title', 'Starte durch!')}
            </h3>
            <Badge variant="secondary" className="text-[10px]">
              {completedCount}/{steps.length}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setDismissed(true)}>
            {t('common.dismiss', 'Ausblenden')}
          </Button>
        </div>

        <Progress value={progressPercent} className="h-2" />

        <div className="space-y-2">
          {steps.map((step) => (
            <div
              key={step.key}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                step.done
                  ? 'bg-muted/30 opacity-60'
                  : step === nextStep
                    ? 'bg-primary/10 border border-primary/20 cursor-pointer hover:bg-primary/15'
                    : 'bg-muted/20'
              }`}
              onClick={step.done ? undefined : step.action}
              role={step.done ? undefined : 'button'}
              tabIndex={step.done ? undefined : 0}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                step.done ? 'bg-primary/20' : step === nextStep ? 'bg-primary/30' : 'bg-muted/50'
              }`}>
                {step.done ? (
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                ) : (
                  <step.icon className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${step.done ? 'line-through text-muted-foreground' : ''}`}>
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">{step.desc}</p>
              </div>
              {!step.done && step === nextStep && (
                <ArrowRight className="w-4 h-4 text-primary shrink-0" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
