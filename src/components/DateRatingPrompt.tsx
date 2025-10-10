import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Trophy, Clock, CheckCheck } from 'lucide-react';
import { DateRatingModal } from './rating/DateRatingModal';
import { checkDateFeedbackStatus } from '@/services/feedbackService';
import { supabase } from '@/integrations/supabase/client';

interface DateRatingPromptProps {
  invitationId: string;
  onRatingComplete?: () => void;
}

export const DateRatingPrompt: React.FC<DateRatingPromptProps> = ({
  invitationId,
  onRatingComplete,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState<{
    hasRated: boolean;
    partnerHasRated: boolean;
  } | null>(null);
  const [invitationData, setInvitationData] = useState<{
    partnerName: string;
    venueName: string;
    dateTime: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [invitationId]);

  const loadData = async () => {
    setLoading(true);
    
    // Load feedback status
    const status = await checkDateFeedbackStatus(invitationId);
    setFeedbackStatus(status);
    
    // Load invitation data for display
    const { data: invitation } = await supabase
      .from('date_invitations')
      .select(`
        *,
        sender:profiles!sender_id(name),
        recipient:profiles!recipient_id(name),
        venue:venues(name)
      `)
      .eq('id', invitationId)
      .single();
    
    if (invitation) {
      const { data: { user } } = await supabase.auth.getUser();
      const partnerName = user?.id === invitation.sender_id 
        ? invitation.recipient?.name || 'Your partner'
        : invitation.sender?.name || 'Your partner';
      
      setInvitationData({
        partnerName,
        venueName: invitation.venue?.name || 'the venue',
        dateTime: invitation.actual_date_time || invitation.proposed_date || '',
      });
    }
    
    setLoading(false);
  };

  const handleSuccess = () => {
    loadData();
    onRatingComplete?.();
  };

  if (loading || !invitationData) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-4">
          <div className="h-16 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  // Don't show if user already rated
  if (feedbackStatus?.hasRated) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">You rated this date</p>
                <p className="text-xs text-muted-foreground">
                  {feedbackStatus.partnerHasRated 
                    ? `${invitationData.partnerName} also rated - Both reviews complete!` 
                    : `Waiting for ${invitationData.partnerName} to rate`}
                </p>
              </div>
            </div>
            {feedbackStatus.partnerHasRated && (
              <Badge variant="secondary" className="gap-1">
                <Trophy className="h-3 w-3" />
                +20 bonus
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate time since date
  const dateObj = new Date(invitationData.dateTime);
  const now = new Date();
  const hoursSince = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60));
  const isWithin24h = hoursSince < 24;

  return (
    <>
      <Card className="border-primary shadow-lg hover:shadow-xl transition-shadow animate-fade-in">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                <h3 className="font-semibold">Rate Your Date</h3>
              </div>
              
              <p className="text-sm text-muted-foreground mb-3">
                How was your date with <span className="font-medium text-foreground">{invitationData.partnerName}</span> at{' '}
                <span className="font-medium text-foreground">{invitationData.venueName}</span>?
              </p>

              <div className="flex flex-wrap gap-2 mb-3">
                {isWithin24h && (
                  <Badge variant="secondary" className="gap-1">
                    <Clock className="h-3 w-3" />
                    24h bonus available
                  </Badge>
                )}
                {feedbackStatus?.partnerHasRated && (
                  <Badge variant="secondary" className="gap-1">
                    <Trophy className="h-3 w-3" />
                    {invitationData.partnerName} already rated!
                  </Badge>
                )}
                <Badge variant="outline" className="gap-1">
                  Up to 45 points
                </Badge>
              </div>

              <Button 
                onClick={() => setModalOpen(true)}
                className="w-full sm:w-auto gap-2"
              >
                <Star className="h-4 w-4" />
                Rate Now & Earn Points
              </Button>
            </div>

            <div className="hidden sm:flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5">
              <Trophy className="h-8 w-8 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      <DateRatingModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        invitationId={invitationId}
        partnerName={invitationData.partnerName}
        venueName={invitationData.venueName}
        onSuccess={handleSuccess}
      />
    </>
  );
};
