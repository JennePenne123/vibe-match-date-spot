import React, { useMemo, useState, useEffect } from 'react';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, Check, X, DollarSign, Calendar, Info, MessageCircle, XCircle, Navigation, PartyPopper, Timer } from 'lucide-react';
import ShareDateButton from '@/components/ShareDateButton';
import type { ShareCardData } from '@/components/share/ShareCardGenerator';
import { DateRatingPrompt } from '@/components/DateRatingPrompt';
import { getInitials } from '@/lib/utils';
import { DisplayData } from './types';
import AddToCalendarButton from '@/components/AddToCalendarButton';
import { CalendarEvent } from '@/utils/calendarExport';

// Countdown hook
function useCountdown(targetDate: string | null) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number; isPast: boolean } | null>(null);

  useEffect(() => {
    if (!targetDate || targetDate === 'Time TBD') {
      setTimeLeft(null);
      return;
    }

    const target = new Date(targetDate).getTime();
    if (isNaN(target)) {
      setTimeLeft(null);
      return;
    }

    const update = () => {
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        isPast: false,
      });
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

interface DateInviteCardDetailsProps {
  displayData: DisplayData;
  direction: 'received' | 'sent';
  status: string;
  dateStatus: string | null;
  unreadCount: number;
  onAccept?: () => void;
  onDecline?: () => void;
  onOpenMessenger: () => void;
  onOpenCancelDialog: () => void;
  invitationId: string;
  hasCancel: boolean;
}

const CountdownUnit = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center">
    <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
      <span className="text-xl font-bold text-primary tabular-nums">{String(value).padStart(2, '0')}</span>
    </div>
    <span className="text-[10px] font-medium text-muted-foreground mt-1 uppercase tracking-wider">{label}</span>
  </div>
);

const DateInviteCardDetails = ({
  displayData,
  direction,
  status,
  dateStatus,
  unreadCount,
  onAccept,
  onDecline,
  onOpenMessenger,
  onOpenCancelDialog,
  invitationId,
  hasCancel
}: DateInviteCardDetailsProps) => {
  const countdown = useCountdown(status === 'accepted' ? displayData.time : null);

  const handleOpenDirections = () => {
    const address = displayData.venueAddress || displayData.location;
    if (!address || address === 'Address TBD') return;
    const encodedAddress = encodeURIComponent(address);
    // Try Google Maps first (works on all platforms), falls back to browser maps
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`, '_blank');
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-3">
          <Avatar className="w-10 h-10 border-2 border-primary/20">
            <AvatarImage src={displayData.friendAvatar} alt={displayData.friendName} referrerPolicy="no-referrer" />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {getInitials(displayData.friendName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-semibold text-foreground">{displayData.friendName}</div>
            <div className="text-sm text-muted-foreground font-normal">
              {direction === 'received' ? 'hat dich eingeladen' : 'wurde eingeladen'}
            </div>
          </div>
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        {/* Venue Photos */}
        <div className="relative">
          <div className="relative rounded-xl overflow-hidden">
            <img src={displayData.venueImage} alt={displayData.venueName} className="w-full h-48 object-cover" loading="lazy" />
            {status === 'accepted' && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            )}
          </div>
          <div className="absolute top-3 left-3">
            <Badge className="bg-primary text-primary-foreground shadow-md">
              {displayData.dateType}
            </Badge>
          </div>
          {status === 'accepted' && (
            <div className="absolute bottom-3 left-3 right-3">
              <h3 className="font-bold text-white text-lg drop-shadow-md">{displayData.venueName}</h3>
            </div>
          )}
        </div>

        {/* Message */}
        {displayData.message && (
          <div className="bg-muted/50 p-3 rounded-xl border border-border/30">
            <p className="text-foreground italic text-sm">"{displayData.message}"</p>
          </div>
        )}

        {/* Venue Details */}
        <div className="space-y-3">
          {status !== 'accepted' && (
            <h3 className="font-semibold text-foreground">{displayData.venueName}</h3>
          )}
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-foreground">{displayData.time !== 'Time TBD' 
                ? new Date(displayData.time).toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'Noch offen'}</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-foreground">{displayData.time !== 'Time TBD'
                ? new Date(displayData.time).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr'
                : displayData.duration}</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-foreground truncate">{displayData.location}</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
              <DollarSign className="w-4 h-4 text-primary" />
              <span className="text-foreground">{displayData.estimatedCost}</span>
            </div>
          </div>

          {displayData.specialNotes && (
            <div className="bg-accent/30 p-3 rounded-xl border border-accent/50">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-accent-foreground mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-foreground">Hinweis</div>
                  <div className="text-sm text-muted-foreground">{displayData.specialNotes}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Message Button */}
        <Button 
          variant="outline" 
          onClick={onOpenMessenger}
          className="w-full rounded-xl"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Nachricht an {displayData.friendName}
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadCount}
            </Badge>
          )}
        </Button>

        {/* Pending Actions */}
        {direction === 'received' && status === 'pending' && onAccept && onDecline && (
          <div className="flex gap-2 mt-4">
            <Button 
              onClick={onAccept} 
              className="flex-1 h-12 rounded-xl [background:var(--gradient-success)] hover:[background:var(--gradient-success-hover)] text-white border-0 text-base font-semibold"
            >
              <Check className="w-5 h-5 mr-2" />
              Annehmen
            </Button>
            <Button 
              onClick={onDecline} 
              variant="outline" 
              className="flex-1 h-12 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/5 text-base font-semibold"
            >
              <X className="w-5 h-5 mr-2" />
              Ablehnen
            </Button>
          </div>
        )}
        
        {/* ===== ACCEPTED STATE – Redesigned ===== */}
        {status === 'accepted' && (
          <div className="space-y-4 mt-2">
            {dateStatus === 'completed' ? (
              <DateRatingPrompt invitationId={invitationId} />
            ) : (
              <>
                {/* Confirmation Banner */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500/10 via-emerald-400/5 to-teal-500/10 border border-emerald-500/20 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center">
                      <PartyPopper className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-emerald-700 dark:text-emerald-300">
                        Date bestätigt! 🎉
                      </p>
                      <p className="text-sm text-emerald-600/80 dark:text-emerald-400/80">
                        Viel Spaß bei eurem Date!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Countdown Timer */}
                {countdown && !countdown.isPast && (
                  <div className="rounded-xl bg-card border border-border/50 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Timer className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">Countdown</span>
                    </div>
                    <div className="flex justify-center gap-3">
                      <CountdownUnit value={countdown.days} label="Tage" />
                      <div className="flex items-center text-muted-foreground/50 text-lg font-bold pt-[-8px]">:</div>
                      <CountdownUnit value={countdown.hours} label="Std" />
                      <div className="flex items-center text-muted-foreground/50 text-lg font-bold">:</div>
                      <CountdownUnit value={countdown.minutes} label="Min" />
                      <div className="flex items-center text-muted-foreground/50 text-lg font-bold">:</div>
                      <CountdownUnit value={countdown.seconds} label="Sek" />
                    </div>
                  </div>
                )}

                {countdown?.isPast && (
                  <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-center">
                    <p className="text-sm font-medium text-primary">Euer Date hat begonnen – genießt es! 💫</p>
                  </div>
                )}

                {/* Action Buttons Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <AddToCalendarButton
                    event={{
                      title: `Date mit ${displayData.friendName} – ${displayData.venueName}`,
                      description: displayData.message || undefined,
                      location: displayData.venueAddress || displayData.location || undefined,
                      startDate: displayData.time ? new Date(displayData.time) : new Date(),
                      durationMinutes: 120,
                    }}
                    variant="outline"
                    size="default"
                    className="h-12 rounded-xl"
                  />
                  <ShareDateButton
                    title={`Date: ${displayData.venueName}`}
                    venueName={displayData.venueName}
                    dateTime={displayData.time}
                    shareCardData={{
                      type: 'date-experience',
                      venueName: displayData.venueName,
                      venueImage: displayData.venueImage,
                      address: displayData.venueAddress || displayData.location,
                      dateTitle: `Date mit ${displayData.friendName}`,
                      dateMessage: displayData.message,
                    }}
                  />
                </div>

                {/* Directions Button */}
                {displayData.venueAddress && displayData.venueAddress !== 'Address TBD' && (
                  <Button
                    variant="outline"
                    onClick={handleOpenDirections}
                    className="w-full h-12 rounded-xl gap-2 bg-blue-500/5 border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10"
                  >
                    <Navigation className="w-4 h-4" />
                    Wegbeschreibung öffnen
                  </Button>
                )}
              </>
            )}
            
            {hasCancel && (
              <Button 
                onClick={onOpenCancelDialog}
                variant="ghost" 
                className="w-full text-destructive/70 hover:text-destructive hover:bg-destructive/5 text-sm"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Date absagen
              </Button>
            )}
          </div>
        )}

        {/* Cancelled Status */}
        {status === 'cancelled' && (
          <div className="text-center py-4 bg-destructive/5 rounded-xl border border-destructive/20 mt-4">
            <p className="text-sm text-destructive font-medium">
              🚫 Dieses Date wurde abgesagt
            </p>
          </div>
        )}
        
        {/* Sent Pending Status */}
        {direction === 'sent' && status === 'pending' && (
          <div className="mt-4 p-3 bg-muted/50 rounded-xl border border-border/30">
            <p className="text-sm text-muted-foreground">
              Einladung gesendet · <span className="capitalize font-medium">Wartet auf Antwort</span>
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default DateInviteCardDetails;