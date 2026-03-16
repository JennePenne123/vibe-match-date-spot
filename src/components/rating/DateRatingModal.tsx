import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Star, ThumbsUp, ThumbsDown, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDateRating } from '@/hooks/useDateRating';
import { useTranslation } from 'react-i18next';

interface DateRatingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invitationId: string;
  partnerName: string;
  venueName: string;
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

export const DateRatingModal: React.FC<DateRatingModalProps> = ({
  open,
  onOpenChange,
  invitationId,
  partnerName,
  venueName,
  venueId,
  partnerId,
  aiPredictedScore,
  aiPredictedFactors,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const {
    ratingData,
    isSubmitting,
    updateRatingData,
    canSubmit,
    submitRating,
  } = useDateRating(invitationId, {
    venueId,
    partnerId,
    aiPredictedScore,
    aiPredictedFactors,
  });

  const handleSubmit = async () => {
    const result = await submitRating();
    if (result.success) {
      onOpenChange(false);
      onSuccess?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">
            {t('rating.title', 'Wie war euer Date?')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Subtitle */}
          <p className="text-sm text-center text-muted-foreground">
            {t('rating.subtitle', 'Bewerte dein Date mit {{partner}} bei {{venue}}', {
              partner: partnerName,
              venue: venueName,
            })}
          </p>

          {/* Overall Rating — required */}
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

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Optional section header */}
          <p className="text-xs text-muted-foreground text-center uppercase tracking-wide">
            {t('rating.optionalSection', 'Optional – hilft uns, besser zu werden')}
          </p>

          {/* Venue Rating — optional */}
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

          {/* Would Recommend — optional */}
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

          {/* Comment — optional */}
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

          {/* Submit */}
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
      </DialogContent>
    </Dialog>
  );
};
