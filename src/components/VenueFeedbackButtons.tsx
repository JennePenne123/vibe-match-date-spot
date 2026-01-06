// components/VenueFeedbackButtons.tsx
// Complete optimized venue feedback buttons with AI learning

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, HeartOff, Sparkles, SkipForward, Loader2, Eye, ThumbsUp } from 'lucide-react';
import { 
  recordVenueFeedback, 
  getUserVenueFeedback, 
  getVenuePopularityStats,
  removeVenueFeedback,
  type FeedbackType,
  type FeedbackContext,
  type VenuePopularityStats
} from '@/services/feedbackService';
import { toast } from 'sonner';

interface VenueFeedbackButtonsProps {
  venueId: string;
  venueType?: 'recommendations' | 'search' | 'favorites';
  context?: FeedbackContext;
  onFeedbackChange?: (feedbackType: FeedbackType | null) => void;
  compact?: boolean;
  showStats?: boolean;
  className?: string;
}

const VenueFeedbackButtons: React.FC<VenueFeedbackButtonsProps> = ({
  venueId,
  venueType = 'recommendations',
  context = {},
  onFeedbackChange,
  compact = false,
  showStats = false,
  className = ''
}) => {
  const [currentFeedback, setCurrentFeedback] = useState<FeedbackType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [popularityStats, setPopularityStats] = useState<VenuePopularityStats>({
    likes: 0,
    dislikes: 0,
    superLikes: 0,
    skips: 0,
    visited: 0,
    interested: 0,
    notInterested: 0,
    totalFeedback: 0,
    popularityScore: 0
  });

  // Load existing feedback on mount
  useEffect(() => {
    loadExistingFeedback();
    if (showStats) {
      loadPopularityStats();
    }
  }, [venueId]);

  const loadExistingFeedback = async () => {
    try {
      const feedback = await getUserVenueFeedback(venueId);
      if (feedback) {
        setCurrentFeedback(feedback.feedback_type as FeedbackType);
      }
    } catch (error) {
      console.error('Error loading existing feedback:', error);
    }
  };

  const loadPopularityStats = async () => {
    try {
      const stats = await getVenuePopularityStats(venueId);
      setPopularityStats(stats);
    } catch (error) {
      console.error('Error loading popularity stats:', error);
    }
  };

  const handleFeedback = async (feedbackType: FeedbackType) => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      // If clicking the same feedback type, remove it
      const newFeedbackType = currentFeedback === feedbackType ? null : feedbackType;
      
      if (newFeedbackType) {
        // Record new feedback with enhanced context
        const feedbackContext: FeedbackContext = {
          ...context,
          source: venueType,
          timestamp: new Date().toISOString(),
          session_id: context.session_id,
          partner_id: context.partner_id
        };
        
        const result = await recordVenueFeedback(venueId, newFeedbackType, feedbackContext);
        
        if (result) {
          // Show success message with personalized text
          const messages = {
            like: '❤️ Added to liked venues! We\'ll show you more places like this.',
            super_like: '✨ Super liked! This will significantly improve your recommendations.',
            dislike: '👎 Noted - we\'ll show you fewer places like this.',
            skip: '⏭️ Skipped for now - you can always come back to this later.',
            visited: '✅ Marked as visited! How was your experience?',
            interested: '👀 Marked as interested! We\'ll prioritize similar venues.',
            not_interested: '❌ Noted - we\'ll filter out similar venues.'
          };
          
          toast.success(messages[newFeedbackType] || 'Feedback recorded!');
        }
      } else {
        // Remove feedback
        const removed = await removeVenueFeedback(venueId);
        if (removed) {
          toast.success('Feedback removed');
        }
      }
      
      setCurrentFeedback(newFeedbackType);
      onFeedbackChange?.(newFeedbackType);
      
      // Reload stats if showing them
      if (showStats) {
        await loadPopularityStats();
      }
      
    } catch (error) {
      console.error('Error recording feedback:', error);
      toast.error('Failed to record feedback. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get button style based on feedback type and state
  const getButtonStyle = (feedbackType: FeedbackType) => {
    const isSelected = currentFeedback === feedbackType;
    const isLoadingThis = isLoading && currentFeedback === feedbackType;
    
    const styles = {
      super_like: {
        selected: 'bg-purple-500 hover:bg-purple-600 text-white',
        unselected: 'hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-300 dark:hover:border-purple-700'
      },
      like: {
        selected: 'bg-red-500 hover:bg-red-600 text-white',
        unselected: 'hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-700'
      },
      interested: {
        selected: 'bg-blue-500 hover:bg-blue-600 text-white',
        unselected: 'hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-500 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700'
      },
      visited: {
        selected: 'bg-green-500 hover:bg-green-600 text-white',
        unselected: 'hover:bg-green-50 dark:hover:bg-green-950/30 hover:text-green-500 dark:hover:text-green-400 hover:border-green-300 dark:hover:border-green-700'
      },
      skip: {
        selected: 'bg-yellow-500 hover:bg-yellow-600 text-white',
        unselected: 'hover:bg-yellow-50 dark:hover:bg-yellow-950/30 hover:text-yellow-600 dark:hover:text-yellow-400 hover:border-yellow-300 dark:hover:border-yellow-700'
      },
      dislike: {
        selected: 'bg-gray-500 hover:bg-gray-600 text-white',
        unselected: 'hover:bg-muted hover:border-border'
      },
      not_interested: {
        selected: 'bg-gray-600 hover:bg-gray-700 text-white',
        unselected: 'hover:bg-muted hover:border-border'
      }
    };

    return isSelected ? styles[feedbackType].selected : styles[feedbackType].unselected;
  };

  // Compact version for venue cards
  if (compact) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <Button
          variant={currentFeedback === 'like' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleFeedback('like')}
          disabled={isLoading}
          className={`h-8 w-8 p-0 ${getButtonStyle('like')}`}
          title="Like this venue"
        >
          {isLoading && currentFeedback === 'like' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Heart className={`h-4 w-4 ${currentFeedback === 'like' ? 'fill-current' : ''}`} />
          )}
        </Button>
        
        <Button
          variant={currentFeedback === 'super_like' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleFeedback('super_like')}
          disabled={isLoading}
          className={`h-8 w-8 p-0 ${getButtonStyle('super_like')}`}
          title="Super like this venue"
        >
          {isLoading && currentFeedback === 'super_like' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className={`h-4 w-4 ${currentFeedback === 'super_like' ? 'fill-current' : ''}`} />
          )}
        </Button>
        
        <Button
          variant={currentFeedback === 'dislike' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleFeedback('dislike')}
          disabled={isLoading}
          className={`h-8 w-8 p-0 ${getButtonStyle('dislike')}`}
          title="Not interested in this venue"
        >
          {isLoading && currentFeedback === 'dislike' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <HeartOff className="h-4 w-4" />
          )}
        </Button>
      </div>
    );
  }

  // Full version with all options
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Main Feedback Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Super Like */}
        <Button
          variant={currentFeedback === 'super_like' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleFeedback('super_like')}
          disabled={isLoading}
          className={getButtonStyle('super_like')}
        >
          {isLoading && currentFeedback === 'super_like' ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Sparkles className={`h-4 w-4 mr-1 ${currentFeedback === 'super_like' ? 'fill-current' : ''}`} />
          )}
          Super Like
        </Button>

        {/* Like */}
        <Button
          variant={currentFeedback === 'like' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleFeedback('like')}
          disabled={isLoading}
          className={getButtonStyle('like')}
        >
          {isLoading && currentFeedback === 'like' ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Heart className={`h-4 w-4 mr-1 ${currentFeedback === 'like' ? 'fill-current' : ''}`} />
          )}
          Like
        </Button>

        {/* Interested */}
        <Button
          variant={currentFeedback === 'interested' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleFeedback('interested')}
          disabled={isLoading}
          className={getButtonStyle('interested')}
        >
          {isLoading && currentFeedback === 'interested' ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Eye className="h-4 w-4 mr-1" />
          )}
          Interested
        </Button>

        {/* Visited */}
        <Button
          variant={currentFeedback === 'visited' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleFeedback('visited')}
          disabled={isLoading}
          className={getButtonStyle('visited')}
        >
          {isLoading && currentFeedback === 'visited' ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <ThumbsUp className="h-4 w-4 mr-1" />
          )}
          Visited
        </Button>
      </div>

      {/* Secondary Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Skip */}
        <Button
          variant={currentFeedback === 'skip' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleFeedback('skip')}
          disabled={isLoading}
          className={getButtonStyle('skip')}
        >
          {isLoading && currentFeedback === 'skip' ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <SkipForward className="h-4 w-4 mr-1" />
          )}
          Maybe Later
        </Button>

        {/* Not Interested */}
        <Button
          variant={currentFeedback === 'not_interested' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleFeedback('not_interested')}
          disabled={isLoading}
          className={getButtonStyle('not_interested')}
        >
          {isLoading && currentFeedback === 'not_interested' ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <HeartOff className="h-4 w-4 mr-1" />
          )}
          Not for me
        </Button>
      </div>

      {/* Popularity Stats */}
      {showStats && popularityStats.totalFeedback > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {popularityStats.superLikes > 0 && (
            <Badge variant="secondary" className="text-xs bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300">
              <Sparkles className="h-3 w-3 mr-1 fill-current" />
              {popularityStats.superLikes} super like{popularityStats.superLikes !== 1 ? 's' : ''}
            </Badge>
          )}
          
          {popularityStats.likes > 0 && (
            <Badge variant="secondary" className="text-xs bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-300">
              <Heart className="h-3 w-3 mr-1 fill-current" />
              {popularityStats.likes} like{popularityStats.likes !== 1 ? 's' : ''}
            </Badge>
          )}

          {popularityStats.visited > 0 && (
            <Badge variant="secondary" className="text-xs bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300">
              <ThumbsUp className="h-3 w-3 mr-1" />
              {popularityStats.visited} visited
            </Badge>
          )}
          
          {popularityStats.popularityScore > 0.7 && (
            <Badge variant="secondary" className="text-xs bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-300">
              <Sparkles className="h-3 w-3 mr-1" />
              Popular Choice
            </Badge>
          )}
          
          <span className="text-xs text-muted-foreground">
            {popularityStats.totalFeedback} total feedback{popularityStats.totalFeedback !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Current feedback status */}
      {currentFeedback && (
        <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
          <span className="font-medium">Your feedback:</span> {currentFeedback.replace('_', ' ')}
          {currentFeedback === 'super_like' && ' ✨'}
          {currentFeedback === 'like' && ' ❤️'}
          {currentFeedback === 'visited' && ' ✅'}
          {currentFeedback === 'interested' && ' 👀'}
        </div>
      )}

      {/* AI Learning Note */}
      {currentFeedback && ['like', 'super_like', 'dislike', 'not_interested'].includes(currentFeedback) && (
        <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-2 py-1 rounded flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          <span>Your feedback helps improve AI recommendations</span>
        </div>
      )}
    </div>
  );
};

export default VenueFeedbackButtons;