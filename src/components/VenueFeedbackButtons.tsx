
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, ThumbsUp, ThumbsDown, Skip, MapPin, Star } from 'lucide-react';
import { recordVenueFeedback, FeedbackType } from '@/services/feedbackService';
import { useToast } from '@/components/ui/use-toast';

interface VenueFeedbackButtonsProps {
  venueId: string;
  currentFeedback?: FeedbackType | null;
  onFeedbackChange?: (feedbackType: FeedbackType | null) => void;
  variant?: 'default' | 'compact';
  disabled?: boolean;
}

const VenueFeedbackButtons: React.FC<VenueFeedbackButtonsProps> = ({
  venueId,
  currentFeedback,
  onFeedbackChange,
  variant = 'default',
  disabled = false
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFeedback = async (feedbackType: FeedbackType) => {
    if (disabled || isLoading) return;

    setIsLoading(true);
    
    try {
      const result = await recordVenueFeedback(venueId, feedbackType, {
        source: 'venue_card',
        timestamp: new Date().toISOString()
      });

      if (result) {
        onFeedbackChange?.(feedbackType);
        toast({
          title: "Feedback recorded",
          description: `You ${feedbackType.replace('_', ' ')} this venue.`,
        });
      } else {
        throw new Error('Failed to record feedback');
      }
    } catch (error) {
      console.error('Error recording venue feedback:', error);
      toast({
        title: "Error",
        description: "Failed to record your feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const feedbackButtons = [
    {
      type: 'super_like' as FeedbackType,
      icon: Star,
      label: 'Super Like',
      color: 'text-yellow-500',
      activeColor: 'bg-yellow-500 text-white'
    },
    {
      type: 'like' as FeedbackType,
      icon: ThumbsUp,
      label: 'Like',
      color: 'text-green-500',
      activeColor: 'bg-green-500 text-white'
    },
    {
      type: 'dislike' as FeedbackType,
      icon: ThumbsDown,
      label: 'Dislike',
      color: 'text-red-500',
      activeColor: 'bg-red-500 text-white'
    },
    {
      type: 'interested' as FeedbackType,
      icon: Heart,
      label: 'Interested',
      color: 'text-pink-500',
      activeColor: 'bg-pink-500 text-white'
    },
    {
      type: 'visited' as FeedbackType,
      icon: MapPin,
      label: 'Visited',
      color: 'text-blue-500',
      activeColor: 'bg-blue-500 text-white'
    },
    {
      type: 'skip' as FeedbackType,
      icon: Skip,
      label: 'Skip',
      color: 'text-gray-500',
      activeColor: 'bg-gray-500 text-white'
    }
  ];

  if (variant === 'compact') {
    return (
      <div className="flex gap-1">
        {feedbackButtons.slice(0, 4).map(({ type, icon: Icon, color, activeColor }) => {
          const isActive = currentFeedback === type;
          return (
            <Button
              key={type}
              variant="ghost"
              size="sm"
              disabled={disabled || isLoading}
              onClick={() => handleFeedback(type)}
              className={`p-2 h-8 w-8 ${
                isActive 
                  ? activeColor 
                  : `hover:${color.replace('text-', 'bg-').replace('-500', '-100')} ${color}`
              }`}
            >
              <Icon className="w-4 h-4" />
            </Button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {feedbackButtons.map(({ type, icon: Icon, label, color, activeColor }) => {
        const isActive = currentFeedback === type;
        return (
          <Button
            key={type}
            variant={isActive ? "default" : "outline"}
            size="sm"
            disabled={disabled || isLoading}
            onClick={() => handleFeedback(type)}
            className={`flex items-center gap-2 ${
              isActive 
                ? activeColor 
                : `hover:${color.replace('text-', 'bg-').replace('-500', '-100')} ${color}`
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Button>
        );
      })}
    </div>
  );
};

export default VenueFeedbackButtons;
