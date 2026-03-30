import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, CheckCircle, XCircle, Play } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import { useDateProposals, DateProposal } from '@/hooks/useDateProposals';
import { useFriends } from '@/hooks/useFriends';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useSessionManagement } from '@/hooks/useSessionManagement';
import { format, isValid } from 'date-fns';
import { useBreakpoint } from '@/hooks/use-mobile';

interface DateProposalsListProps {
  onProposalAccepted?: (sessionId: string) => void;
  onInvitationSent?: () => void;
}

const DateProposalsList: React.FC<DateProposalsListProps> = ({ onProposalAccepted, onInvitationSent }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { proposals, loading, getMyProposals, acceptProposal, cancelProposal } = useDateProposals();
  const { friends } = useFriends();
  const { createPlanningSession } = useSessionManagement();
  const { toast } = useToast();
  const [hiddenProposals, setHiddenProposals] = useState(new Set<string>());
  const { isMobile } = useBreakpoint();

  // Fetch proposals once on mount and when user changes — no unstable deps
  const hasFetchedRef = React.useRef(false);

  useEffect(() => {
    if (!user?.id || hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    getMyProposals().catch((err) => console.error('Failed to fetch proposals:', err));
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const getFriendName = (userId: string) => friends.find(f => f.id === userId)?.name || 'Unknown User';

  const formatProposalDate = (rawDate: string, pattern: string) => {
    const parsedDate = new Date(rawDate);
    if (!isValid(parsedDate)) {
      console.warn('[DateProposalsList] Invalid proposal date:', rawDate);
      return t('common.notAvailable', 'Nicht verfügbar');
    }
    return format(parsedDate, pattern);
  };

  const handleAcceptProposal = async (proposal: DateProposal) => {
    const sessionId = await acceptProposal(proposal.id);
    if (sessionId) {
      toast({ title: t('proposals.proposalAccepted'), description: t('proposals.startingSession'), variant: 'default' });
      onProposalAccepted?.(sessionId);
    }
  };

  const handleDeclineProposal = async (proposalId: string) => {
    const success = await cancelProposal(proposalId);
    if (success) {
      setHiddenProposals(prev => new Set([...prev, proposalId]));
      toast({ title: t('proposals.proposalDeclined'), description: t('proposals.declinedDesc'), variant: 'default' });
    }
  };

  const handleCancelProposal = async (proposalId: string) => {
    const success = await cancelProposal(proposalId);
    if (success) toast({ title: t('proposals.proposalCancelled'), description: t('proposals.cancelledDesc'), variant: 'default' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary">{t('proposals.pending')}</Badge>;
      case 'accepted': return <Badge variant="default">{t('proposals.accepted')}</Badge>;
      case 'declined': return <Badge variant="destructive">{t('proposals.declined')}</Badge>;
      case 'expired': return <Badge variant="outline">{t('proposals.expired')}</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const visibleProposals = proposals.filter(p => !hiddenProposals.has(p.id) && p.status !== 'converted' && p.status !== 'declined');
  const pendingProposals = visibleProposals.filter(p => p.status === 'pending');
  const acceptedProposals = visibleProposals.filter(p => p.status === 'accepted');
  const otherProposals = visibleProposals.filter(p => p.status !== 'pending' && p.status !== 'accepted');

  if (loading) return <div className="text-center py-8 text-muted-foreground">{t('proposals.loadingProposals')}</div>;

  if (visibleProposals.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title={t('proposals.noProposals')}
        description={t('proposals.noProposalsDesc', 'Sende oder empfange Date-Vorschläge um loszulegen.')}
        variant="minimal"
        className="py-6"
      />
    );
  }

  const renderProposalMeta = (proposal: DateProposal) => (
    <div className={`${isMobile ? 'flex-col space-y-2' : 'flex items-center gap-4'} text-sm text-muted-foreground`}>
      <div className="flex items-center gap-1.5">
        <User className="h-4 w-4 flex-shrink-0" />
        <span className="break-words">
          {proposal.proposer_id === user?.id ? `${t('proposals.to')} ${getFriendName(proposal.recipient_id)}` : `${t('proposals.from')} ${getFriendName(proposal.proposer_id)}`}
        </span>
      </div>
      <div className="flex items-center gap-1.5"><Calendar className="h-4 w-4 flex-shrink-0" /><span>{formatProposalDate(proposal.proposed_date, 'MMM dd, yyyy')}</span></div>
      <div className="flex items-center gap-1.5"><Clock className="h-4 w-4 flex-shrink-0" /><span>{formatProposalDate(proposal.proposed_date, 'HH:mm')}</span></div>
    </div>
  );

  return (
    <div className="space-y-5">
      {pendingProposals.length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-foreground mb-3">{t('proposals.pendingProposals')}</h3>
          <div className="space-y-3">
            {pendingProposals.map((proposal, index) => (
              <Card key={proposal.id} className="border-primary/20 transition-all duration-300 ease-out hover:shadow-premium-md hover:scale-[1.01] hover:border-primary/40 hover:-translate-y-0.5 cursor-pointer animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                <CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="text-base">{proposal.title}</CardTitle>{getStatusBadge(proposal.status)}</div></CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {renderProposalMeta(proposal)}
                  {proposal.message && <p className="text-sm text-muted-foreground italic break-words">"{proposal.message}"</p>}
                  {proposal.recipient_id === user?.id && (
                    <div className={`${isMobile ? 'flex-col space-y-2' : 'flex gap-2'} pt-2`}>
                      <Button onClick={() => handleAcceptProposal(proposal)} disabled={loading} className={`${isMobile ? 'w-full min-h-[44px]' : 'flex-1'}`} size={isMobile ? 'default' : 'sm'}>
                        <CheckCircle className="h-4 w-4 mr-2" />{isMobile ? t('proposals.accept') : t('proposals.acceptStartPlanning')}
                      </Button>
                      <Button onClick={() => handleDeclineProposal(proposal.id)} disabled={loading} variant="outline" className={`${isMobile ? 'w-full min-h-[44px]' : 'flex-1'}`} size={isMobile ? 'default' : 'sm'}>
                        <XCircle className="h-4 w-4 mr-2" />{t('proposals.decline')}
                      </Button>
                    </div>
                  )}
                  {proposal.proposer_id === user?.id && (
                    <div className="pt-2">
                      <Button onClick={() => handleCancelProposal(proposal.id)} disabled={loading} variant="destructive" className={`${isMobile ? 'w-full min-h-[44px]' : 'w-full'}`} size={isMobile ? 'default' : 'sm'}>
                        <XCircle className="h-4 w-4 mr-2" />{t('proposals.cancelProposal')}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {acceptedProposals.length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-foreground mb-3">{t('proposals.acceptedProposals')}</h3>
          <div className="space-y-3">
            {acceptedProposals.map((proposal, index) => (
              <Card key={proposal.id} className="border-success/30 bg-success/5 transition-all duration-300 ease-out hover:shadow-glow-sm hover:scale-[1.01] hover:border-success/50 hover:bg-success/10 hover:-translate-y-0.5 cursor-pointer animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                <CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="text-base">{proposal.title}</CardTitle>{getStatusBadge(proposal.status)}</div></CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {renderProposalMeta(proposal)}
                  {proposal.message && <p className="text-sm text-muted-foreground italic break-words">"{proposal.message}"</p>}
                  {proposal.planning_session_id && (
                    <div className="pt-2">
                      <Button onClick={async () => {
                        const partnerId = proposal.proposer_id === user?.id ? proposal.recipient_id : proposal.proposer_id;
                        try {
                          const newSession = await createPlanningSession(partnerId, undefined, 'collaborative', true);
                          if (newSession?.id) {
                            toast({ title: t('proposals.freshSession'), description: t('proposals.freshSessionDesc'), variant: 'default' });
                            onProposalAccepted?.(newSession.id);
                          }
                        } catch (error) {
                          console.error('Error creating fresh session:', error);
                          onProposalAccepted?.(proposal.planning_session_id!);
                        }
                      }} className={`bg-green-600 hover:bg-green-700 text-white ${isMobile ? 'w-full min-h-[44px]' : 'w-full'}`} size={isMobile ? 'default' : 'sm'}>
                        <Play className="h-4 w-4 mr-2" />{t('proposals.startAIPlanning')}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {otherProposals.length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-foreground mb-3">{t('proposals.previousProposals')}</h3>
          <div className="space-y-3">
            {otherProposals.map((proposal) => (
              <Card key={proposal.id} className="opacity-75">
                <CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="text-base">{proposal.title}</CardTitle>{getStatusBadge(proposal.status)}</div></CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1"><User className="h-4 w-4" />{proposal.proposer_id === user?.id ? `${t('proposals.to')} ${getFriendName(proposal.recipient_id)}` : `${t('proposals.from')} ${getFriendName(proposal.proposer_id)}`}</div>
                    <div className="flex items-center gap-1"><Calendar className="h-4 w-4" />{formatProposalDate(proposal.proposed_date, 'MMM dd, yyyy')}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DateProposalsList;
