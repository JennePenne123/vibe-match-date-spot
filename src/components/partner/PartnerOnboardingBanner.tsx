import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { User, Store, Ticket, CheckCircle2, ArrowRight, Sparkles, PartyPopper, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PartnerOnboardingBannerProps {
  hasProfile: boolean;
  hasVenues: boolean;
  hasVouchers: boolean;
}

export default function PartnerOnboardingBanner({ hasProfile, hasVenues, hasVouchers }: PartnerOnboardingBannerProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  const allDone = hasProfile && hasVenues && hasVouchers;
  if (dismissed) return null;

  const steps = [
    {
      key: 'profile',
      done: hasProfile,
      icon: User,
      title: t('partner.onboarding.profileTitle', 'Firmenprofil anlegen'),
      desc: t('partner.onboarding.profileDesc', 'Name, Kontaktdaten und Beschreibung'),
      detail: t('partner.onboarding.profileDetail', 'Dein Firmenprofil ist die Basis für dein Partner-Dashboard. Hinterlege deinen Business-Namen, Kontaktperson, Steuernummer und eine kurze Beschreibung.'),
      action: () => navigate('/partner/profile'),
      actionLabel: t('partner.onboarding.profileAction', 'Profil erstellen'),
      estimate: '~2 Min.',
    },
    {
      key: 'venue',
      done: hasVenues,
      icon: Store,
      title: t('partner.onboarding.venueTitle', 'Erstes Venue hinzufügen'),
      desc: t('partner.onboarding.venueDesc', 'Registriere oder beanspruche dein Venue'),
      detail: t('partner.onboarding.venueDetail', 'Füge dein Venue hinzu, damit Paare es bei der Date-Planung finden können. Du kannst bestehende Venues beanspruchen oder ein neues registrieren.'),
      action: () => navigate('/partner/venues'),
      actionLabel: t('partner.onboarding.venueAction', 'Venue hinzufügen'),
      estimate: '~3 Min.',
    },
    {
      key: 'voucher',
      done: hasVouchers,
      icon: Ticket,
      title: t('partner.onboarding.voucherTitle', 'Ersten Gutschein erstellen'),
      desc: t('partner.onboarding.voucherDesc', 'Locke Paare mit einem Angebot'),
      detail: t('partner.onboarding.voucherDetail', 'Erstelle einen Gutschein mit Rabatt oder Gratis-Angebot. Deine Gutscheine erscheinen direkt bei der Date-Planung und machen dein Venue attraktiver.'),
      action: () => navigate('/partner/vouchers'),
      actionLabel: t('partner.onboarding.voucherAction', 'Gutschein erstellen'),
      estimate: '~1 Min.',
    },
  ];

  const completedCount = steps.filter(s => s.done).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);
  const nextStep = steps.find(s => !s.done);

  // Celebration state when all done
  if (allDone) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card variant="glass" className="border-primary/40 bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 overflow-hidden relative">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <PartyPopper className="w-8 h-8 text-primary" />
                  </motion.div>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg">
                      {t('partner.onboarding.allDone', 'Setup abgeschlossen! 🎉')}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t('partner.onboarding.allDoneDesc', 'Dein Venue ist bereit für Paare. Viel Erfolg!')}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setDismissed(true)} className="shrink-0">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <Card variant="glass" className="border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10 overflow-hidden">
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

        <div className="space-y-1">
          <Progress value={progressPercent} className="h-2" />
          <p className="text-[11px] text-muted-foreground">
            {t('partner.onboarding.progress', '{{done}} von {{total}} Schritten abgeschlossen', { done: completedCount, total: steps.length })}
          </p>
        </div>

        <div className="space-y-2">
          {steps.map((step, idx) => {
            const isNext = step === nextStep;
            const isExpanded = expandedStep === step.key;

            return (
              <motion.div
                key={step.key}
                layout
                initial={false}
                animate={{ opacity: 1 }}
                className={`rounded-xl transition-all ${
                  step.done
                    ? 'bg-muted/30 opacity-60'
                    : isNext
                      ? 'bg-primary/10 border border-primary/20'
                      : 'bg-muted/20'
                }`}
              >
                <div
                  className={`flex items-center gap-3 p-3 ${!step.done ? 'cursor-pointer' : ''}`}
                  onClick={() => {
                    if (!step.done) {
                      setExpandedStep(isExpanded ? null : step.key);
                    }
                  }}
                  role={step.done ? undefined : 'button'}
                  tabIndex={step.done ? undefined : 0}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    step.done ? 'bg-primary/20' : isNext ? 'bg-primary/30' : 'bg-muted/50'
                  }`}>
                    {step.done ? (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      </motion.div>
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
                  {!step.done && (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-muted-foreground hidden sm:inline">{step.estimate}</span>
                      <ArrowRight className={`w-4 h-4 text-primary transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {isExpanded && !step.done && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 pt-1 space-y-3">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {step.detail}
                        </p>
                        <Button
                          size="sm"
                          className="w-full sm:w-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            step.action();
                          }}
                        >
                          {step.actionLabel}
                          <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
