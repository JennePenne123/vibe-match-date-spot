import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  Heart, 
  Smile, 
  Meh, 
  Frown, 
  ThumbsDown,
  Star,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Trophy,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDateRating } from '@/hooks/useDateRating';

interface DateRatingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invitationId: string;
  partnerName: string;
  venueName: string;
  onSuccess?: () => void;
}

const sentimentOptions = [
  { value: 'loved' as const, icon: Heart, label: 'Loved it', color: 'text-red-500' },
  { value: 'good' as const, icon: Smile, label: 'Good', color: 'text-green-500' },
  { value: 'okay' as const, icon: Meh, label: 'Okay', color: 'text-yellow-500' },
  { value: 'meh' as const, icon: Frown, label: 'Meh', color: 'text-orange-500' },
  { value: 'bad' as const, icon: ThumbsDown, label: 'Bad', color: 'text-red-600' },
];

const venueTags = [
  'Great ambiance',
  'Good food',
  'Excellent service',
  'Perfect for dates',
  'Too loud',
  'Too expensive',
  'Long wait',
  'Intimate setting',
];

export const DateRatingModal: React.FC<DateRatingModalProps> = ({
  open,
  onOpenChange,
  invitationId,
  partnerName,
  venueName,
  onSuccess,
}) => {
  const {
    currentStep,
    ratingData,
    isSubmitting,
    updateRatingData,
    nextStep,
    prevStep,
    canProceed,
    calculatePoints,
    submitRating,
  } = useDateRating(invitationId);

  const progress = (currentStep / 5) * 100;
  const points = calculatePoints();

  const handleSubmit = async () => {
    const result = await submitRating();
    if (result.success) {
      onOpenChange(false);
      onSuccess?.();
    }
  };

  const StarRating = ({ 
    value, 
    onChange, 
    size = 'default' 
  }: { 
    value: number; 
    onChange: (value: number) => void;
    size?: 'default' | 'large';
  }) => {
    const starSize = size === 'large' ? 'h-10 w-10' : 'h-8 w-8';
    
    return (
      <div className="flex gap-2 justify-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={cn(
                starSize,
                star <= value
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground'
              )}
            />
          </button>
        ))}
      </div>
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">
                How was your date with {partnerName}?
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Give your overall experience a rating
              </p>
            </div>

            <StarRating
              value={ratingData.overallRating}
              onChange={(value) => updateRatingData({ overallRating: value })}
              size="large"
            />

            <div className="pt-4">
              <p className="text-sm text-center text-muted-foreground mb-4">
                Quick sentiment:
              </p>
              <div className="flex justify-center gap-3 flex-wrap">
                {sentimentOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateRatingData({ sentiment: option.value })}
                    className={cn(
                      'flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all hover:scale-105',
                      ratingData.sentiment === option.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <option.icon className={cn('h-6 w-6', option.color)} />
                    <span className="text-xs font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">
                How was {venueName}?
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Rate the venue specifically
              </p>
            </div>

            <StarRating
              value={ratingData.venueRating}
              onChange={(value) => updateRatingData({ venueRating: value })}
              size="large"
            />

            <div className="pt-4">
              <p className="text-sm text-center text-muted-foreground mb-3">
                Quick tags (optional):
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {venueTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={ratingData.venueTags.includes(tag) ? 'default' : 'outline'}
                    className="cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => {
                      const newTags = ratingData.venueTags.includes(tag)
                        ? ratingData.venueTags.filter(t => t !== tag)
                        : [...ratingData.venueTags, tag];
                      updateRatingData({ venueTags: newTags });
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">
                  How well did our AI match you?
                </h3>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                This helps us improve recommendations
              </p>
              <Badge variant="secondary" className="gap-1">
                <Trophy className="h-3 w-3" />
                +5 bonus points
              </Badge>
            </div>

            <div className="space-y-4 px-4">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Poor match</span>
                <span>Perfect match</span>
              </div>
              <Slider
                value={[ratingData.aiAccuracyRating || 5]}
                onValueChange={([value]) => updateRatingData({ aiAccuracyRating: value })}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
              <div className="text-center text-2xl font-bold text-primary">
                {ratingData.aiAccuracyRating || 5}/10
              </div>
            </div>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                updateRatingData({ aiAccuracyRating: null });
                nextStep();
              }}
            >
              Skip this step
            </Button>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">
                Tell us more about your experience
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                What made it special? What could be better?
              </p>
              <Badge variant="secondary" className="gap-1">
                <Trophy className="h-3 w-3" />
                +10 bonus points
              </Badge>
            </div>

            <div className="space-y-2">
              <Textarea
                placeholder="What made it special? What could be better?"
                value={ratingData.feedbackText}
                onChange={(e) => updateRatingData({ feedbackText: e.target.value })}
                className="min-h-[120px] resize-none"
                maxLength={500}
              />
              <div className="text-xs text-right text-muted-foreground">
                {ratingData.feedbackText.length}/500 characters
              </div>
            </div>

            <Button
              variant="ghost"
              className="w-full"
              onClick={nextStep}
            >
              Skip this step
            </Button>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">
                Final questions
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                Help us improve your experience
              </p>
              <Badge variant="secondary" className="gap-1">
                <Trophy className="h-3 w-3" />
                +15 bonus points
              </Badge>
            </div>

            <div className="space-y-4">
              <div className="p-4 border rounded-lg space-y-3">
                <p className="font-medium text-sm">
                  Would you recommend {venueName} to friends?
                </p>
                <div className="flex gap-2">
                  <Button
                    variant={ratingData.wouldRecommendVenue === true ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => updateRatingData({ wouldRecommendVenue: true })}
                  >
                    Yes
                  </Button>
                  <Button
                    variant={ratingData.wouldRecommendVenue === false ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => updateRatingData({ wouldRecommendVenue: false })}
                  >
                    No
                  </Button>
                </div>
              </div>

              <div className="p-4 border rounded-lg space-y-3">
                <p className="font-medium text-sm">
                  Would you use AI matching again?
                </p>
                <div className="flex gap-2">
                  <Button
                    variant={ratingData.wouldUseAiAgain === true ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => updateRatingData({ wouldUseAiAgain: true })}
                  >
                    Yes
                  </Button>
                  <Button
                    variant={ratingData.wouldUseAiAgain === false ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => updateRatingData({ wouldUseAiAgain: false })}
                  >
                    No
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Rate Your Date</span>
            <Badge variant="secondary" className="gap-1">
              <Zap className="h-3 w-3" />
              {points.total} pts
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {currentStep} of 5</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step content */}
          <div className="min-h-[320px]">
            {renderStep()}
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={isSubmitting}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            )}
            
            <div className="flex-1" />

            {currentStep < 5 ? (
              <Button
                onClick={nextStep}
                disabled={!canProceed() || isSubmitting}
                className="gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="gap-2"
              >
                {isSubmitting ? 'Submitting...' : 'Submit & Earn Points'}
                <Trophy className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Points breakdown preview */}
          {currentStep === 5 && (
            <div className="p-3 bg-muted rounded-lg space-y-2 text-xs">
              <p className="font-semibold text-sm">Points Breakdown:</p>
              <div className="grid grid-cols-2 gap-2">
                <div>✓ Basic rating: {points.basic} pts</div>
                <div>✓ AI accuracy: {points.aiAccuracy} pts</div>
                <div>✓ Detailed feedback: {points.detailedFeedback} pts</div>
                <div>✓ Complete all: {points.completeAll} pts</div>
              </div>
              <div className="pt-2 border-t border-border">
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span className="text-primary">{points.total} points</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
