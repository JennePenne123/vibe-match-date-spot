import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, ShieldCheck, LogOut, Loader2 } from 'lucide-react';
import { useVisitVerification } from '@/hooks/useVisitVerification';
import { useToast } from '@/hooks/use-toast';

/**
 * Shows today's planned venues with a manual check-in, or the currently
 * running visit. Automatic detection runs in the background via the hook.
 */
export const VisitCheckInCard: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { candidates, openVisit, loading, checkingIn, checkIn, checkOut } =
    useVisitVerification();

  if (loading) return null;
  if (!openVisit && candidates.length === 0) return null;

  const handleCheckIn = async (candidate: (typeof candidates)[number]) => {
    const visit = await checkIn(candidate);
    if (!visit) return;
    toast({
      title: visit.verified ? t('visit.confirmedTitle') : t('visit.unconfirmedTitle'),
      description: visit.verified
        ? t('visit.confirmedDesc', { venue: candidate.venueName })
        : t('visit.unconfirmedDesc'),
    });
  };

  const handleCheckOut = async () => {
    await checkOut();
    toast({ title: t('visit.leftTitle'), description: t('visit.leftDesc') });
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="h-5 w-5 text-primary" />
          {t('visit.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {openVisit ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {openVisit.venue_name || t('visit.unknownVenue')}
                </p>
                <p className="text-xs text-muted-foreground">{t('visit.ongoing')}</p>
              </div>
              <Badge variant={openVisit.verified ? 'default' : 'secondary'} className="gap-1 shrink-0">
                <ShieldCheck className="h-3 w-3" />
                {openVisit.verified ? t('visit.verified') : t('visit.unverified')}
              </Badge>
            </div>
            <Button variant="outline" size="sm" className="w-full gap-2" onClick={handleCheckOut}>
              <LogOut className="h-4 w-4" />
              {t('visit.checkOut')}
            </Button>
            <p className="text-[11px] text-muted-foreground">{t('visit.ratingLater')}</p>
          </div>
        ) : (
          <>
            {candidates.map((candidate) => (
              <div
                key={candidate.invitationId}
                className="flex items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{candidate.venueName}</p>
                  <p className="text-xs text-muted-foreground">{t('visit.checkInHint')}</p>
                </div>
                <Button
                  size="sm"
                  className="gap-1 shrink-0"
                  disabled={checkingIn}
                  onClick={() => handleCheckIn(candidate)}
                >
                  {checkingIn ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <MapPin className="h-3 w-3" />
                  )}
                  {t('visit.checkIn')}
                </Button>
              </div>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default VisitCheckInCard;
