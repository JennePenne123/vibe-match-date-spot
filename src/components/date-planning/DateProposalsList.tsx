import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, CheckCircle, XCircle, Play } from 'lucide-react';
import { useDateProposals, DateProposal } from '@/hooks/useDateProposals';
import { useFriends } from '@/hooks/useFriends';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface DateProposalsListProps {
  onProposalAccepted?: (sessionId: string) => void;
}

const DateProposalsList: React.FC<DateProposalsListProps> = ({
  onProposalAccepted
}) => {
  const { user } = useAuth();
  const { proposals, getMyProposals, acceptProposal, updateProposalStatus, cancelProposal, loading } = useDateProposals();
  const { friends } = useFriends();
  const { toast } = useToast();
  const [hiddenProposals, setHiddenProposals] = useState<Set<string>>(new Set());

  useEffect(() => {
    getMyProposals();
  }, []);

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
    const success = await updateProposalStatus(proposalId, 'declined');
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

  // Filter out hidden proposals and separate by status
  const visibleProposals = proposals.filter(p => !hiddenProposals.has(p.id));
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
    <div className="space-y-6">
      {pendingProposals.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Pending Proposals</h3>
          <div className="space-y-4">
            {pendingProposals.map((proposal) => (
              <Card key={proposal.id} className="border-primary/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{proposal.title}</CardTitle>
                    {getStatusBadge(proposal.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
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
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {format(new Date(proposal.proposed_date), 'HH:mm')}
                    </div>
                  </div>

                  {proposal.message && (
                    <p className="text-sm text-muted-foreground italic">
                      "{proposal.message}"
                    </p>
                  )}

                  {proposal.recipient_id === user?.id && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => handleAcceptProposal(proposal)}
                        disabled={loading}
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Accept & Start Planning
                      </Button>
                      <Button
                        onClick={() => handleDeclineProposal(proposal.id)}
                        disabled={loading}
                        variant="outline"
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Decline
                      </Button>
                    </div>
                  )}

                  {proposal.proposer_id === user?.id && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => handleCancelProposal(proposal.id)}
                        disabled={loading}
                        variant="destructive"
                        className="flex-1"
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
          <h3 className="text-lg font-semibold text-foreground mb-4">Accepted Proposals</h3>
          <div className="space-y-4">
            {acceptedProposals.map((proposal) => (
              <Card key={proposal.id} className="border-green-200 bg-green-50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{proposal.title}</CardTitle>
                    {getStatusBadge(proposal.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
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
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {format(new Date(proposal.proposed_date), 'HH:mm')}
                    </div>
                  </div>

                  {proposal.message && (
                    <p className="text-sm text-muted-foreground italic">
                      "{proposal.message}"
                    </p>
                  )}

                  {proposal.planning_session_id && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => onProposalAccepted?.(proposal.planning_session_id!)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
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
          <h3 className="text-lg font-semibold text-foreground mb-4">Previous Proposals</h3>
          <div className="space-y-4">
            {otherProposals.map((proposal) => (
              <Card key={proposal.id} className="opacity-75">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{proposal.title}</CardTitle>
                    {getStatusBadge(proposal.status)}
                  </div>
                </CardHeader>
                <CardContent>
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