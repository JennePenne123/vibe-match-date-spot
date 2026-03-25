import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { recordVenueFeedback, type FeedbackType } from '@/services/feedbackService';
import { toast } from 'sonner';

interface VenueQuickReactionProps {
  venueId: string;
  className?: string;
  onReaction?: (type: FeedbackType) => void;
}

const VenueQuickReaction: React.FC<VenueQuickReactionProps> = ({ venueId, className, onReaction }) => {
  const [reaction, setReaction] = useState<'like' | 'not_interested' | null>(null);
  const [loading, setLoading] = useState(false);

  const handleReaction = async (type: 'like' | 'not_interested') => {
    if (loading || reaction) return;
    setLoading(true);

    try {
      await recordVenueFeedback(venueId, type, { source: 'quick_reaction' });
      setReaction(type);
      onReaction?.(type);
    } catch {
      toast.error('Feedback konnte nicht gespeichert werden');
    } finally {
      setLoading(false);
    }
  };

  if (reaction) {
    return (
      <span className={cn('text-xs text-muted-foreground/60 italic', className)}>
        {reaction === 'like' ? '👍 Gemerkt' : '👎 Weniger davon'}
      </span>
    );
  }

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
      ) : (
        <>
          <button
            onClick={() => handleReaction('like')}
            className="p-1.5 rounded-full hover:bg-primary/10 transition-colors group"
            title="Gefällt mir"
          >
            <ThumbsUp className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>
          <button
            onClick={() => handleReaction('not_interested')}
            className="p-1.5 rounded-full hover:bg-destructive/10 transition-colors group"
            title="Nicht mein Ding"
          >
            <ThumbsDown className="w-3.5 h-3.5 text-muted-foreground group-hover:text-destructive transition-colors" />
          </button>
        </>
      )}
    </div>
  );
};

export default VenueQuickReaction;
