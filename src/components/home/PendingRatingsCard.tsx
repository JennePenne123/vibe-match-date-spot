import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Trophy, ChevronRight } from 'lucide-react';
import { getPendingRatings } from '@/services/feedbackService';
import { DateRatingModal } from '@/components/rating/DateRatingModal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export const PendingRatingsCard: React.FC = () => {
  const [pendingRatings, setPendingRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvitation, setSelectedInvitation] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadPendingRatings();
  }, []);

  const loadPendingRatings = async () => {
    setLoading(true);
    const ratings = await getPendingRatings();
    setPendingRatings(ratings);
    setLoading(false);
  };

  const handleRateClick = (invitation: any) => {
    setSelectedInvitation(invitation);
    setModalOpen(true);
  };

  const handleSuccess = () => {
    loadPendingRatings();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Pending Ratings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-muted rounded" />
            <div className="h-16 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pendingRatings.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="border-primary/20 shadow-md transition-all duration-300 ease-out hover:shadow-premium-lg hover:scale-[1.01] hover:-translate-y-1 hover:border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              <span>Rate Your Dates</span>
            </div>
            <Badge variant="secondary" className="gap-1">
              <Trophy className="h-3 w-3" />
              {pendingRatings.length} pending
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingRatings.slice(0, 3).map((invitation) => {
            const isReceived = invitation.sender_id !== invitation.recipient_id;
            const partner = isReceived ? invitation.sender : invitation.recipient;
            const venueName = invitation.venue?.name || 'the venue';

            return (
              <div
                key={invitation.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-all duration-200 ease-out hover:shadow-sm hover:scale-[1.01] hover:-translate-y-0.5 cursor-pointer group"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={partner?.avatar_url} referrerPolicy="no-referrer" />
                  <AvatarFallback>
                    {partner?.name?.charAt(0).toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    Date with {partner?.name || 'Unknown'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {venueName} • {format(new Date(invitation.proposed_date), 'MMM d')}
                  </p>
                </div>

                <Button
                  size="sm"
                  onClick={() => handleRateClick(invitation)}
                  className="gap-1"
                >
                  <Star className="h-3 w-3 transition-transform duration-200 group-hover:rotate-12" />
                  Rate
                  <ChevronRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Button>
              </div>
            );
          })}

          {pendingRatings.length > 3 && (
            <p className="text-xs text-center text-muted-foreground pt-2">
              +{pendingRatings.length - 3} more dates to rate
            </p>
          )}
        </CardContent>
      </Card>

      {selectedInvitation && (
        <DateRatingModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          invitationId={selectedInvitation.id}
          partnerName={
            selectedInvitation.sender_id !== selectedInvitation.recipient_id
              ? selectedInvitation.sender?.name || 'Unknown'
              : selectedInvitation.recipient?.name || 'Unknown'
          }
          venueName={selectedInvitation.venue?.name || 'the venue'}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
};
