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

const WEIGHT_LABEL_MAP: Record<string, string> = {
  cuisine: 'Küchen-Vorliebe',
  vibe: 'Atmosphäre-Gewichtung',
  price: 'Preis-Sensibilität',
  rating: 'Bewertungs-Vertrauen',
  distance: 'Entfernungs-Präferenz',
  time: 'Zeitfenster-Gewichtung',
};

const WEIGHT_LABEL_KEYS: Record<string, string> = {
  cuisine: 'rating.weightCuisine',
  vibe: 'rating.weightVibe',
  price: 'rating.weightPrice',
  rating: 'rating.weightRating',
  distance: 'rating.weightDistance',
  time: 'rating.weightTime',
};

/** Generate a human-readable summary of what the AI learned */
const getLearningSummary = (impact: LearningImpact): string => {
  const changes = Object.entries(impact.weightChanges || {});
  if (changes.length === 0) return 'Neutrales Feedback – deine Präferenzen bleiben unverändert.';

  const boosts = changes.filter(([, v]) => v.includes('+'));
  const reduces = changes.filter(([, v]) => v.includes('-') && !v.includes('+'));

  const parts: string[] = [];
  if (boosts.length > 0) {
    const labels = boosts.map(([k]) => WEIGHT_LABEL_MAP[k] || k).join(', ');
    parts.push(`${labels} wurde${boosts.length > 1 ? 'n' : ''} gestärkt`);
  }
  if (reduces.length > 0) {
    const labels = reduces.map(([k]) => WEIGHT_LABEL_MAP[k] || k).join(', ');
    parts.push(`${labels} wurde${reduces.length > 1 ? 'n' : ''} angepasst`);
  }

  return parts.join(' und ') + '.';
};

/** Calculate how many more ratings until the AI "knows" the user well */
const getRatingsUntilConfident = (totalRatings: number): { remaining: number; phase: string; percent: number } => {
  const TARGET = 10; // 10 ratings = "kennt dich gut"
  const remaining = Math.max(0, TARGET - totalRatings);
  const percent = Math.min(100, Math.round((totalRatings / TARGET) * 100));
  
  if (totalRatings === 0) return { remaining, phase: 'Startphase', percent };
  if (totalRatings < 3) return { remaining, phase: 'Lernphase', percent };
  if (totalRatings < 5) return { remaining, phase: 'Kennenlernen', percent };
  if (totalRatings < TARGET) return { remaining, phase: 'Wird besser', percent };
  return { remaining: 0, phase: 'Kennt dich gut', percent: 100 };
};

const LearningImpactCard: React.FC<{ impact: LearningImpact }> = ({ impact }) => {
  const { t } = useTranslation();
  const changes = Object.entries(impact.weightChanges || {});
  const hasChanges = changes.length > 0;
  const totalRatings = typeof impact.totalRatings === 'number' ? impact.totalRatings : parseInt(String(impact.totalRatings)) || 0;
  const confidence = getRatingsUntilConfident(totalRatings);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3"
    >
      {/* Human-readable summary */}
      <div className="flex items-start gap-2">
        <Brain className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div>
          <span className="text-sm font-semibold text-primary">{t('rating.aiLearned')}</span>
          <p className="text-xs text-foreground/80 mt-0.5">
            {getLearningSummary(impact)}
          </p>
        </div>
      </div>

      {/* Weight change details */}
      {hasChanges && (
        <div className="space-y-1.5">
          {changes.map(([key, change]) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-between text-xs"
            >
              <span className="text-muted-foreground">{t(WEIGHT_LABEL_KEYS[key] || key)}</span>
              <span className="font-mono text-foreground/80">{change}</span>
            </motion.div>
          ))}
        </div>
      )}

      {/* Confidence progress for new users */}
      {confidence.remaining > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="pt-2 border-t border-primary/10 space-y-1.5"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-primary/70" />
              KI-Personalisierung: {confidence.phase}
            </span>
            <span className="font-semibold text-primary">{confidence.percent}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60"
              initial={{ width: 0 }}
              animate={{ width: `${confidence.percent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.5 }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            {confidence.remaining === 1
              ? 'Noch 1 Bewertung bis die KI dich richtig kennt!'
              : `Noch ${confidence.remaining} Bewertungen bis die KI dich richtig kennt`}
          </p>
        </motion.div>
      )}

      {/* Stats for experienced users */}
      {confidence.remaining === 0 && (
        <div className="flex items-center gap-2 pt-1 border-t border-primary/10">
          <TrendingUp className="h-3.5 w-3.5 text-primary/70" />
          <span className="text-xs text-muted-foreground">
            {t('rating.totalRatingsStats', {
              total: impact.totalRatings,
              accuracy: impact.aiAccuracy,
              improvement: impact.improvementPercent,
            })}
          </span>
        </div>
      )}
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

  const overallLabelKeys = ['', 'rating.overallBad', 'rating.overallMeh', 'rating.overallOkay', 'rating.overallGood', 'rating.overallFantastic'];

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
                <h3 className="text-lg font-semibold">{t('rating.thankYou')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('rating.betterNext')}
                </p>
              </div>

              {learningImpact && <LearningImpactCard impact={learningImpact} />}

              <Button onClick={handleClose} className="w-full gap-2">
                <ArrowRight className="h-4 w-4" />
                {t('rating.continue')}
              </Button>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DialogHeader>
                <DialogTitle className="text-center">
                  {t('rating.title')}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-2">
                {hasSpeedBonus && (
                  <div className="flex items-center justify-center">
                    <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-xs bg-accent/10 text-accent border-accent/20">
                      <Zap className="h-3.5 w-3.5" />
                      {t('rating.speedBonus')}
                    </Badge>
                  </div>
                )}

                <p className="text-sm text-center text-muted-foreground">
                  {t('rating.subtitle', { partner: partnerName, venue: venueName })}
                </p>

                <div className="flex flex-col items-center gap-2">
                  <label className="text-sm font-medium">
                    {t('rating.overallLabel')} *
                  </label>
                  <StarRow
                    value={ratingData.overallRating}
                    onChange={(v) => updateRatingData({ overallRating: v })}
                  />
                  {ratingData.overallRating > 0 && (
                    <span className="text-sm font-medium text-accent animate-fade-in">
                      {t(overallLabelKeys[ratingData.overallRating])}
                    </span>
                  )}
                </div>

                <div className="border-t border-border" />

                <p className="text-xs text-muted-foreground text-center uppercase tracking-wide">
                  {t('rating.optionalSection')}
                </p>

                <div className="flex flex-col items-center gap-2">
                  <label className="text-sm font-medium">
                    {t('rating.venueLabel')}
                  </label>
                  <StarRow
                    value={ratingData.venueRating}
                    onChange={(v) => updateRatingData({ venueRating: v })}
                    size="h-8 w-8"
                  />
                </div>

                <div className="flex flex-col items-center gap-2">
                  <label className="text-sm font-medium">
                    {t('rating.recommendLabel')}
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
                    {t('rating.commentLabel')}
                  </label>
                  <Textarea
                    placeholder={t('rating.commentPlaceholder')}
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
                  {isSubmitting ? t('rating.submitting') : t('rating.submit')}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
