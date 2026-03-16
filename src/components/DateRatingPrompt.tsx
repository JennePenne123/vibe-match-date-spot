import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, CheckCheck } from 'lucide-react';
import { DateRatingModal } from './rating/DateRatingModal';
import { checkDateFeedbackStatus } from '@/services/feedbackService';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';

interface DateRatingPromptProps {
  invitationId: string;
  onRatingComplete?: () => void;
}

export const DateRatingPrompt: React.FC<DateRatingPromptProps> = ({
  invitationId,
  onRatingComplete,
}) => {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState<{
    hasRated: boolean;
    partnerHasRated: boolean;
  } | null>(null);
  const [invitationData, setInvitationData] = useState<{
    partnerName: string;
    venueName: string;
    dateTime?: string;
    venueId?: string;
    partnerId?: string;
    aiPredictedScore?: number | null;
    aiPredictedFactors?: Record<string, unknown> | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [invitationId]);

  const loadData = async () => {
    setLoading(true);
    const status = await checkDateFeedbackStatus(invitationId);
    setFeedbackStatus(status);

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
      const isUserSender = user?.id === invitation.sender_id;
      const partnerName = isUserSender
        ? invitation.recipient?.name || 'Partner'
        : invitation.sender?.name || 'Partner';
      const partnerId = isUserSender ? invitation.recipient_id : invitation.sender_id;

      setInvitationData({
        partnerName,
        venueName: invitation.venue?.name || 'Venue',
        dateTime: invitation.actual_date_time || invitation.proposed_date || undefined,
        venueId: invitation.venue_id || undefined,
        partnerId,
        aiPredictedScore: invitation.ai_compatibility_score,
        aiPredictedFactors: invitation.venue_match_factors as Record<string, unknown> | null,
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

  if (feedbackStatus?.hasRated) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">{t('rating.alreadyRated', 'Du hast dieses Date bewertet')}</p>
              <p className="text-xs text-muted-foreground">
                {feedbackStatus.partnerHasRated
                  ? t('rating.bothRated', '{{partner}} hat auch bewertet!', { partner: invitationData.partnerName })
                  : t('rating.waitingPartner', 'Warte auf {{partner}}s Bewertung', { partner: invitationData.partnerName })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-primary shadow-lg hover:shadow-xl transition-shadow animate-fade-in">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-5 w-5 fill-accent text-accent" />
                <h3 className="font-semibold">{t('rating.title')}</h3>
              </div>

              <p className="text-sm text-muted-foreground mb-3">
                {t('rating.subtitle', { partner: invitationData.partnerName, venue: invitationData.venueName })}
              </p>

              <Button
                onClick={() => setModalOpen(true)}
                className="w-full sm:w-auto gap-2"
              >
                <Star className="h-4 w-4" />
                {t('rating.submit')}
              </Button>
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
        dateTime={invitationData.dateTime}
        venueId={invitationData.venueId}
        partnerId={invitationData.partnerId}
        aiPredictedScore={invitationData.aiPredictedScore}
        aiPredictedFactors={invitationData.aiPredictedFactors}
        onSuccess={handleSuccess}
      />
    </>
  );
};
