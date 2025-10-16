import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, CheckCircle, XCircle, Play } from 'lucide-react';
import { useDateProposals, DateProposal } from '@/hooks/useDateProposals';
import { useFriends } from '@/hooks/useFriends';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useSessionManagement } from '@/hooks/useSessionManagement';
import { format } from 'date-fns';
import { useBreakpoint } from '@/hooks/use-mobile';

interface DateProposalsListProps {
  onProposalAccepted?: (sessionId: string) => void;
  onInvitationSent?: () => void; // New callback for when an invitation is sent
}

const DateProposalsList: React.FC<DateProposalsListProps> = ({
  onProposalAccepted,
  onInvitationSent
}) => {
  const { user } = useAuth();
  const { proposals, loading, getMyProposals, acceptProposal, cancelProposal } = useDateProposals();
  const { friends } = useFriends();
  const { createPlanningSession } = useSessionManagement();
  const { toast } = useToast();
  const [hiddenProposals, setHiddenProposals] = useState(new Set<string>());
  const { isMobile } = useBreakpoint();

  // Refresh proposals function with error handling
  const refreshProposals = useCallback(async () => {
    if (!user?.id) return;
    try {
      await getMyProposals();
    } catch (error) {
      console.error('Failed to refresh proposals:', error);
    }
  }, [getMyProposals, user?.id]);

  // Fetch proposals on component mount - only once when user is available
  useEffect(() => {
    if (user?.id) {
      refreshProposals();
    }
  }, [user?.id]); // Only depend on user.id, not the refresh function

  // Listen for invitation sent events to refresh proposals
  useEffect(() => {
    if (onInvitationSent) {
      // Set up a timer to refresh proposals shortly after invitation is sent
      const timeoutId = setTimeout(() => {
        if (user?.id) {
          refreshProposals();
        }
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [onInvitationSent, user?.id]); // Remove refreshProposals from dependencies

  const getFriendName = (userId: string) => {
    const friend = friends.find(f => f.id === userId);
    return friend?.name || 'Unknown User';
  };

  const handleAcceptProposal = async (proposal: DateProposal) => {
    const sessionId = await acceptProposal(proposal.id);
    if (sessionId) {
      toast({
        title: "Proposal Accepted!",
        description: "Starting collaborative planning session...",
        variant: "default"
      });
      onProposalAccepted?.(sessionId);
    }
  };

  const handleDeclineProposal = async (proposalId: string) => {
    const success = await cancelProposal(proposalId);
    if (success) {
      // Hide the proposal card immediately
      setHiddenProposals(prev => new Set([...prev, proposalId]));
      toast({
        title: "Proposal Declined",
        description: "The proposal has been declined",
        variant: "default"
      });
    }
  };

  const handleCancelProposal = async (proposalId: string) => {
    const success = await cancelProposal(proposalId);
    if (success) {
      toast({
        title: "Proposal Cancelled",
        description: "Your proposal has been cancelled",
        variant: "default"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'accepted':
        return <Badge variant="default">Accepted</Badge>;
      case 'declined':
        return <Badge variant="destructive">Declined</Badge>;
      case 'expired':
        return <Badge variant="outline">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Filter out hidden proposals, converted proposals, declined proposals, and separate by status
  const visibleProposals = proposals.filter(p => !hiddenProposals.has(p.id) && p.status !== 'converted' && p.status !== 'declined');
  const pendingProposals = visibleProposals.filter(p => p.status === 'pending');
  const acceptedProposals = visibleProposals.filter(p => p.status === 'accepted');
  const otherProposals = visibleProposals.filter(p => p.status !== 'pending' && p.status !== 'accepted');

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading proposals...</div>;
  }

  if (visibleProposals.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No date proposals yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {pendingProposals.length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-foreground mb-3">Pending Proposals</h3>
          <div className="space-y-3">
            {pendingProposals.map((proposal) => (
              <Card key={proposal.id} className="border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{proposal.title}</CardTitle>
                    {getStatusBadge(proposal.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className={`${isMobile ? 'flex-col space-y-2' : 'flex items-center gap-4'} text-sm text-muted-foreground`}>
                    <div className="flex items-center gap-1.5">
                      <User className="h-4 w-4 flex-shrink-0" />
                      <span className="break-words">
                        {proposal.proposer_id === user?.id 
                          ? `To: ${getFriendName(proposal.recipient_id)}`
                          : `From: ${getFriendName(proposal.proposer_id)}`
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span>{format(new Date(proposal.proposed_date), 'MMM dd, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      <span>{format(new Date(proposal.proposed_date), 'HH:mm')}</span>
                    </div>
                  </div>

                  {proposal.message && (
                    <p className="text-sm text-muted-foreground italic break-words">
                      "{proposal.message}"
                    </p>
                  )}

                  {proposal.recipient_id === user?.id && (
                    <div className={`${isMobile ? 'flex-col space-y-2' : 'flex gap-2'} pt-2`}>
                      <Button
                        onClick={() => handleAcceptProposal(proposal)}
                        disabled={loading}
                        className={`${isMobile ? 'w-full min-h-[44px]' : 'flex-1'}`}
                        size={isMobile ? "default" : "sm"}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {isMobile ? 'Accept' : 'Accept & Start Planning'}
                      </Button>
                      <Button
                        onClick={() => handleDeclineProposal(proposal.id)}
                        disabled={loading}
                        variant="outline"
                        className={`${isMobile ? 'w-full min-h-[44px]' : 'flex-1'}`}
                        size={isMobile ? "default" : "sm"}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Decline
                      </Button>
                    </div>
                  )}

                  {proposal.proposer_id === user?.id && (
                    <div className="pt-2">
                      <Button
                        onClick={() => handleCancelProposal(proposal.id)}
                        disabled={loading}
                        variant="destructive"
                        className={`${isMobile ? 'w-full min-h-[44px]' : 'w-full'}`}
                        size={isMobile ? "default" : "sm"}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancel Proposal
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
          <h3 className="text-base font-semibold text-foreground mb-3">Accepted Proposals</h3>
          <div className="space-y-3">
            {acceptedProposals.map((proposal) => (
              <Card key={proposal.id} className="border-success/30 bg-success/5">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{proposal.title}</CardTitle>
                    {getStatusBadge(proposal.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className={`${isMobile ? 'flex-col space-y-2' : 'flex items-center gap-4'} text-sm text-muted-foreground`}>
                    <div className="flex items-center gap-1.5">
                      <User className="h-4 w-4 flex-shrink-0" />
                      <span className="break-words">
                        {proposal.proposer_id === user?.id 
                          ? `To: ${getFriendName(proposal.recipient_id)}`
                          : `From: ${getFriendName(proposal.proposer_id)}`
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span>{format(new Date(proposal.proposed_date), 'MMM dd, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      <span>{format(new Date(proposal.proposed_date), 'HH:mm')}</span>
                    </div>
                  </div>

                  {proposal.message && (
                    <p className="text-sm text-muted-foreground italic break-words">
                      "{proposal.message}"
                    </p>
                  )}

                  {proposal.planning_session_id && (
                    <div className="pt-2">
                      <Button
                        onClick={async () => {
                          // Create a fresh session to ensure clean state
                          const partnerId = proposal.proposer_id === user?.id 
                            ? proposal.recipient_id 
                            : proposal.proposer_id;
                          
                          try {
                            const newSession = await createPlanningSession(
                              partnerId, 
                              undefined, 
                              'collaborative', 
                              true // forceNew = true for clean state
                            );
                            
                            if (newSession?.id) {
                              toast({
                                title: "Fresh Session Created",
                                description: "Starting with clean preferences...",
                                variant: "default"
                              });
                              onProposalAccepted?.(newSession.id);
                            }
                          } catch (error) {
                            console.error('Error creating fresh session:', error);
                            // Fallback to existing session
                            onProposalAccepted?.(proposal.planning_session_id!);
                          }
                        }}
                        className={`bg-green-600 hover:bg-green-700 text-white ${isMobile ? 'w-full min-h-[44px]' : 'w-full'}`}
                        size={isMobile ? "default" : "sm"}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start AI Planning
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
          <h3 className="text-base font-semibold text-foreground mb-3">Previous Proposals</h3>
          <div className="space-y-3">
            {otherProposals.map((proposal) => (
              <Card key={proposal.id} className="opacity-75">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{proposal.title}</CardTitle>
                    {getStatusBadge(proposal.status)}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {proposal.proposer_id === user?.id 
                        ? `To: ${getFriendName(proposal.recipient_id)}`
                        : `From: ${getFriendName(proposal.proposer_id)}`
                      }
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(proposal.proposed_date), 'MMM dd, yyyy')}
                    </div>
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