import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
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

const starLabels = ['', 'Schlecht', 'Naja', 'Okay', 'Gut', 'Fantastisch'];

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
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-center">
            {t('rating.title', 'Wie war euer Date?')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Context */}
          <p className="text-sm text-center text-muted-foreground">
            {t('rating.subtitle', 'Bewerte dein Date mit {{partner}} bei {{venue}}', {
              partner: partnerName,
              venue: venueName,
            })}
          </p>

          {/* Star Rating */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex gap-3 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => updateRatingData({ overallRating: star })}
                  className="transition-transform hover:scale-125 active:scale-95"
                >
                  <Star
                    className={cn(
                      'h-10 w-10',
                      star <= ratingData.overallRating
                        ? 'fill-accent text-accent'
                        : 'text-muted-foreground/30'
                    )}
                  />
                </button>
              ))}
            </div>
            {ratingData.overallRating > 0 && (
              <span className="text-sm font-medium text-accent animate-fade-in">
                {starLabels[ratingData.overallRating]}
              </span>
            )}
          </div>

          {/* Optional Comment */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              {t('rating.commentLabel', 'Kommentar (optional)')}
            </label>
            <Textarea
              placeholder={t('rating.commentPlaceholder', 'Was hat dir besonders gefallen oder was könnte besser sein?')}
              value={ratingData.feedbackText}
              onChange={(e) => updateRatingData({ feedbackText: e.target.value })}
              className="min-h-[80px] resize-none"
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
