import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Trophy, ChevronRight, ShieldCheck } from 'lucide-react';
import { getPendingRatings } from '@/services/feedbackService';
import { DateRatingModal } from '@/components/rating/DateRatingModal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import {
  getDueVisitInvitations,
  getVisitsForInvitations,
  markVisitPrompted,
  type VenueVisit,
} from '@/services/visitVerificationService';

export const PendingRatingsCard: React.FC = () => {
  const { t } = useTranslation();
  const [pendingRatings, setPendingRatings] = useState<any[]>([]);
  const [visits, setVisits] = useState<Record<string, VenueVisit>>({});
  const [loading, setLoading] = useState(true);
  const [selectedInvitation, setSelectedInvitation] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => { loadPendingRatings(); }, []);

  const loadPendingRatings = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const [ratings, dueByVisit] = await Promise.all([
      getPendingRatings(),
      user ? getDueVisitInvitations(user.id) : Promise.resolve([]),
    ]);

    // Merge both sources without duplicates
    const merged = [...ratings];
    for (const inv of dueByVisit) {
      if (!merged.some((r) => r.id === inv.id)) merged.push(inv);
    }

    setPendingRatings(merged);
    if (user && merged.length > 0) {
      setVisits(await getVisitsForInvitations(user.id, merged.map((r) => r.id)));
    } else {
      setVisits({});
    }
    setLoading(false);
  };

  const handleRateClick = (invitation: any) => {
    setSelectedInvitation(invitation);
    setModalOpen(true);
    const visit = visits[invitation.id];
    if (visit && !visit.rating_prompted) markVisitPrompted(visit.id);
  };
  const handleSuccess = () => { loadPendingRatings(); };

  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Star className="h-5 w-5 text-yellow-500" />{t('ratings.pendingRatings')}</CardTitle></CardHeader>
        <CardContent><div className="animate-pulse space-y-3"><div className="h-16 bg-muted rounded" /><div className="h-16 bg-muted rounded" /></div></CardContent>
      </Card>
    );
  }

  if (pendingRatings.length === 0) return null;

  const selectedVisit = selectedInvitation ? visits[selectedInvitation.id] : undefined;

  return (
    <>
      <Card className="border-primary/20 shadow-md transition-all duration-300 ease-out hover:shadow-premium-lg hover:scale-[1.01] hover:-translate-y-1 hover:border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2"><Star className="h-5 w-5 text-yellow-500 fill-yellow-500" /><span>{t('ratings.rateYourDates')}</span></div>
            <Badge variant="secondary" className="gap-1"><Trophy className="h-3 w-3" />{t('ratings.pending', { count: pendingRatings.length })}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingRatings.slice(0, 3).map((invitation) => {
            const isReceived = invitation.sender_id !== invitation.recipient_id;
            const partner = isReceived ? invitation.sender : invitation.recipient;
            const venueName = invitation.venue?.name || 'the venue';
            const visit = visits[invitation.id];
            return (
              <div key={invitation.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-all duration-200 ease-out hover:shadow-sm hover:scale-[1.01] hover:-translate-y-0.5 cursor-pointer group">
                <Avatar className="h-10 w-10"><AvatarImage src={partner?.avatar_url} referrerPolicy="no-referrer" /><AvatarFallback>{partner?.name?.charAt(0).toUpperCase() || '?'}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t('ratings.dateWith', { name: partner?.name || 'Unknown' })}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {venueName}
                    {invitation.proposed_date ? ` • ${format(new Date(invitation.proposed_date), 'MMM d')}` : ''}
                  </p>
                  <Badge
                    variant={visit?.verified ? 'default' : 'outline'}
                    className="mt-1 gap-1 px-1.5 py-0 text-[10px]"
                  >
                    <ShieldCheck className="h-2.5 w-2.5" />
                    {visit?.verified ? t('visit.verified') : t('visit.unverified')}
                  </Badge>
                </div>
                <Button size="sm" onClick={() => handleRateClick(invitation)} className="gap-1">
                  <Star className="h-3 w-3 transition-transform duration-200 group-hover:rotate-12" />{t('ratings.rate')}<ChevronRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Button>
              </div>
            );
          })}
          {pendingRatings.length > 3 && <p className="text-xs text-center text-muted-foreground pt-2">{t('ratings.moreDates', { count: pendingRatings.length - 3 })}</p>}
        </CardContent>
      </Card>
      {selectedInvitation && (
        <DateRatingModal open={modalOpen} onOpenChange={setModalOpen} invitationId={selectedInvitation.id}
          partnerName={selectedInvitation.sender_id !== selectedInvitation.recipient_id ? selectedInvitation.sender?.name || 'Unknown' : selectedInvitation.recipient?.name || 'Unknown'}
          venueName={selectedInvitation.venue?.name || 'the venue'}
          venueId={selectedInvitation.venue_id || undefined}
          visitVerified={!!selectedVisit?.verified}
          visitVerificationMethod={selectedVisit?.verification_method || null}
          onSuccess={handleSuccess} />
      )}
    </>
  );
};
