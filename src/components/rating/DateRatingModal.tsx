import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Star, ThumbsUp, ThumbsDown, Zap, Brain, TrendingUp, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDateRating, LearningImpact } from '@/hooks/useDateRating';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

interface DateRatingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invitationId: string;
  partnerName: string;
  venueName: string;
  dateTime?: string;
  venueId?: string;
  partnerId?: string;
  aiPredictedScore?: number | null;
  aiPredictedFactors?: Record<string, unknown> | null;
  onSuccess?: () => void;
}

const overallLabels = ['', 'Schlecht', 'Naja', 'Okay', 'Gut', 'Fantastisch'];

const StarRow = ({
  value,
  onChange,
  size = 'h-10 w-10',
}: {
  value: number;
  onChange: (v: number) => void;
  size?: string;
}) => (
  <div className="flex gap-2 justify-center">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => onChange(star)}
        className="transition-transform hover:scale-125 active:scale-95"
      >
        <Star
          className={cn(
            size,
            star <= value ? 'fill-accent text-accent' : 'text-muted-foreground/30'
          )}
        />
      </button>
    ))}
  </div>
);

const weightLabelMap: Record<string, string> = {
  cuisine: 'Küche',
  vibe: 'Stimmung',
  price: 'Preis',
  rating: 'Bewertungen',
  distance: 'Entfernung',
  time: 'Zeitpunkt',
};

const LearningImpactCard: React.FC<{ impact: LearningImpact }> = ({ impact }) => {
  const changes = Object.entries(impact.weightChanges || {});
  const hasChanges = changes.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3"
    >
      <div className="flex items-center gap-2">
        <Brain className="h-5 w-5 text-primary" />
        <span className="text-sm font-semibold text-primary">AI hat gelernt!</span>
      </div>

      {hasChanges ? (
        <div className="space-y-1.5">
          {changes.map(([key, change]) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-between text-xs"
            >
              <span className="text-muted-foreground">{weightLabelMap[key] || key}</span>
              <span className="font-mono text-foreground/80">{change}</span>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Neutrale Bewertung – Gewichtungen bleiben stabil.
        </p>
      )}

      <div className="flex items-center gap-2 pt-1 border-t border-primary/10">
        <TrendingUp className="h-3.5 w-3.5 text-primary/70" />
        <span className="text-xs text-muted-foreground">
          {impact.totalRatings} Bewertungen · {impact.aiAccuracy}% Genauigkeit · ~{impact.improvementPercent}% besser
        </span>
      </div>
    </motion.div>
  );
};

export const DateRatingModal: React.FC<DateRatingModalProps> = ({
  open,
  onOpenChange,
  invitationId,
  partnerName,
  venueName,
  dateTime,
  venueId,
  partnerId,
  aiPredictedScore,
  aiPredictedFactors,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);
  const {
    ratingData,
    isSubmitting,
    learningImpact,
    updateRatingData,
    canSubmit,
    submitRating,
  } = useDateRating(invitationId, {
    venueId,
    partnerId,
    aiPredictedScore,
    aiPredictedFactors,
  });

  const hoursSinceDate = dateTime
    ? (Date.now() - new Date(dateTime).getTime()) / (1000 * 60 * 60)
    : 999;
  const hasSpeedBonus = hoursSinceDate <= 24;

  const handleSubmit = async () => {
    const result = await submitRating();
    if (result.success) {
      setSubmitted(true);
      onSuccess?.();
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[440px] max-h-[90vh] overflow-y-auto">
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="space-y-5 py-4"
            >
              <div className="text-center space-y-2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                  className="text-4xl"
                >
                  🎉
                </motion.div>
                <h3 className="text-lg font-semibold">Danke für dein Feedback!</h3>
                <p className="text-sm text-muted-foreground">
                  Deine nächsten Empfehlungen werden besser sein.
                </p>
              </div>

              {learningImpact && <LearningImpactCard impact={learningImpact} />}

              <Button onClick={handleClose} className="w-full gap-2">
                <ArrowRight className="h-4 w-4" />
                Weiter
              </Button>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DialogHeader>
                <DialogTitle className="text-center">
                  {t('rating.title', 'Wie war euer Date?')}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-2">
                {hasSpeedBonus && (
                  <div className="flex items-center justify-center">
                    <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-xs bg-accent/10 text-accent border-accent/20">
                      <Zap className="h-3.5 w-3.5" />
                      {t('rating.speedBonus', '⚡ Speed-Bonus: +10 Extra-Punkte für schnelle Bewertung!')}
                    </Badge>
                  </div>
                )}

                <p className="text-sm text-center text-muted-foreground">
                  {t('rating.subtitle', 'Bewerte dein Date mit {{partner}} bei {{venue}}', {
                    partner: partnerName,
                    venue: venueName,
                  })}
                </p>

                <div className="flex flex-col items-center gap-2">
                  <label className="text-sm font-medium">
                    {t('rating.overallLabel', 'Gesamtbewertung')} *
                  </label>
                  <StarRow
                    value={ratingData.overallRating}
                    onChange={(v) => updateRatingData({ overallRating: v })}
                  />
                  {ratingData.overallRating > 0 && (
                    <span className="text-sm font-medium text-accent animate-fade-in">
                      {overallLabels[ratingData.overallRating]}
                    </span>
                  )}
                </div>

                <div className="border-t border-border" />

                <p className="text-xs text-muted-foreground text-center uppercase tracking-wide">
                  {t('rating.optionalSection', 'Optional – hilft uns, besser zu werden')}
                </p>

                <div className="flex flex-col items-center gap-2">
                  <label className="text-sm font-medium">
                    {t('rating.venueLabel', 'Wie war das Venue?')}
                  </label>
                  <StarRow
                    value={ratingData.venueRating}
                    onChange={(v) => updateRatingData({ venueRating: v })}
                    size="h-8 w-8"
                  />
                </div>

                <div className="flex flex-col items-center gap-2">
                  <label className="text-sm font-medium">
                    {t('rating.recommendLabel', 'Würdest du das Venue empfehlen?')}
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => updateRatingData({ wouldRecommendVenue: true })}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all',
                        ratingData.wouldRecommendVenue === true
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      <span className="text-sm font-medium">{t('common.yes', 'Ja')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateRatingData({ wouldRecommendVenue: false })}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all',
                        ratingData.wouldRecommendVenue === false
                          ? 'border-destructive bg-destructive/10 text-destructive'
                          : 'border-border hover:border-destructive/50'
                      )}
                    >
                      <ThumbsDown className="h-4 w-4" />
                      <span className="text-sm font-medium">{t('common.no', 'Nein')}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">
                    {t('rating.commentLabel', 'Kommentar (optional)')}
                  </label>
                  <Textarea
                    placeholder={t('rating.commentPlaceholder', 'Was hat dir besonders gefallen oder was könnte besser sein?')}
                    value={ratingData.feedbackText}
                    onChange={(e) => updateRatingData({ feedbackText: e.target.value })}
                    className="min-h-[70px] resize-none"
                    maxLength={500}
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit() || isSubmitting}
                  className="w-full gap-2"
                >
                  <Star className="h-4 w-4" />
                  {isSubmitting
                    ? t('rating.submitting', 'Wird gespeichert...')
                    : t('rating.submit', 'Bewertung abgeben')}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
