import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mail, Check, X, UserPlus, CalendarHeart, Clock, RefreshCw } from 'lucide-react';
import { useInvitations } from '@/hooks/useInvitations';
import { useFriends } from '@/hooks/useFriends';

/**
 * Shows all actionable, still-open invitations directly on Home:
 * - incoming friend requests
 * - incoming date invitations (pending)
 * - outgoing date invitations still waiting for a response
 */
const PendingInvitesCard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { invitations, acceptInvitation, declineInvitation, cancelInvitation, fetchInvitations } = useInvitations();
  const { pendingRequests, acceptFriendRequest, declineFriendRequest, fetchFriends } = useFriends();
  const [refreshing, setRefreshing] = React.useState(false);

  const refresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchInvitations(), fetchFriends()]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchInvitations, fetchFriends]);

  // React to global pull-to-refresh
  React.useEffect(() => {
    const handler = () => { void refresh(); };
    window.addEventListener('hioutz-refresh', handler);
    return () => window.removeEventListener('hioutz-refresh', handler);
  }, [refresh]);

  // Refresh when the app comes back to the foreground
  React.useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [refresh]);

  const pendingReceived = React.useMemo(
    () => (invitations || []).filter(inv => inv.direction === 'received' && inv.status === 'pending'),
    [invitations]
  );
  const pendingSent = React.useMemo(
    () => (invitations || []).filter(inv => inv.direction === 'sent' && inv.status === 'pending'),
    [invitations]
  );

  const total = pendingRequests.length + pendingReceived.length + pendingSent.length;
  if (total === 0) return null;

  const initials = (name?: string) => (name || '?').charAt(0).toUpperCase();

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="h-5 w-5 text-primary" />
          {t('home.pendingInvitesTitle')}
          <Badge variant="secondary" className="ml-auto">{total}</Badge>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 shrink-0"
            aria-label={t('common.refresh', 'Aktualisieren')}
            disabled={refreshing}
            onClick={() => void refresh()}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {pendingRequests.map(req => (
          <div key={`fr-${req.friendship_id}`} className="flex items-center gap-3 rounded-lg border border-border/60 bg-card/70 p-2.5">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarImage src={req.avatar_url || undefined} alt="" />
              <AvatarFallback>{initials(req.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{req.name}</p>
              <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <UserPlus className="h-3 w-3" /> {t('home.pendingInvitesFriend')}
              </p>
            </div>
            <div className="flex shrink-0 gap-1.5">
              <Button size="icon" variant="secondary" className="h-8 w-8" aria-label={t('home.pendingInvitesAccept')}
                onClick={() => req.friendship_id && acceptFriendRequest(req.friendship_id)}>
                <Check className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={t('home.pendingInvitesDecline')}
                onClick={() => req.friendship_id && declineFriendRequest(req.friendship_id)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        {pendingReceived.map(inv => (
          <div key={`in-${inv.id}`} className="flex items-center gap-3 rounded-lg border border-border/60 bg-card/70 p-2.5">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarImage src={(inv as any).sender?.avatar_url || undefined} alt="" />
              <AvatarFallback>{initials((inv as any).sender?.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {(inv as any).sender?.name || t('common.friend', 'Friend')}
              </p>
              <p className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                <CalendarHeart className="h-3 w-3 shrink-0" />
                {t('home.pendingInvitesDateReceived')}
                {(inv as any).venue?.name ? ` · ${(inv as any).venue.name}` : ''}
              </p>
            </div>
            <div className="flex shrink-0 gap-1.5">
              <Button size="icon" variant="secondary" className="h-8 w-8" aria-label={t('home.pendingInvitesAccept')}
                onClick={() => acceptInvitation(inv.id)}>
                <Check className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={t('home.pendingInvitesDecline')}
                onClick={() => declineInvitation(inv.id)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        {pendingSent.map(inv => (
          <div key={`out-${inv.id}`} className="flex items-center gap-3 rounded-lg border border-border/60 bg-card/50 p-2.5">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarImage src={(inv as any).recipient?.avatar_url || undefined} alt="" />
              <AvatarFallback>{initials((inv as any).recipient?.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {(inv as any).recipient?.name || t('common.friend', 'Friend')}
              </p>
              <p className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3 shrink-0" /> {t('home.pendingInvitesDateSent')}
              </p>
            </div>
            <Button size="sm" variant="ghost" className="h-8 shrink-0 px-2 text-xs"
              onClick={() => cancelInvitation(inv.id)}>
              {t('home.pendingInvitesDecline')}
            </Button>
          </div>
        ))}

        <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/invitations')}>
          {t('home.pendingInvitesViewAll')}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PendingInvitesCard;