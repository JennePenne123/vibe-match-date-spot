import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFriends } from '@/hooks/useFriends';
import { useDateProposals } from '@/hooks/useDateProposals';
import { useInvitations } from '@/hooks/useInvitations';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import DateProposalCreation from '@/components/date-planning/DateProposalCreation';
import PartnerSelection from '@/components/date-planning/PartnerSelection';
import HeroSection from '@/components/home/HeroSection';
import ActivityFeed from '@/components/home/ActivityFeed';
import StatusDashboard from '@/components/home/StatusDashboard';
import PlanningActionCenter from '@/components/home/PlanningActionCenter';
import { useToast } from '@/hooks/use-toast';
const HomeContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { friends } = useFriends();
  const { proposals, getMyProposals, acceptProposal, updateProposalStatus } = useDateProposals();
  const { invitations, acceptInvitation, declineInvitation } = useInvitations();

  // State for managing different flows
  const [selectedMode, setSelectedMode] = useState<'solo' | 'collaborative' | null>(null);
  const [showPartnerSelection, setShowPartnerSelection] = useState(false);
  const [showProposalCreation, setShowProposalCreation] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [selectedPartnerIds, setSelectedPartnerIds] = useState<string[]>([]);
  const [dateMode, setDateMode] = useState<'single' | 'group'>('single');
  const handleCollaborativePlanning = () => {
    setSelectedMode('collaborative');
    setShowPartnerSelection(true);
  };
  const handlePartnerSelectionContinue = () => {
    if (selectedPartnerId) {
      setShowPartnerSelection(false);
      setShowProposalCreation(true);
    }
  };
  const handleProposalSent = () => {
    setShowProposalCreation(false);
    setSelectedMode(null);
    setSelectedPartnerId('');
    toast({
      title: "Proposal Sent!",
      description: "Your date proposal has been sent successfully.",
      duration: 3000
    });
  };
  const handleProposalAccepted = (sessionId: string) => {
    navigate('/plan-date', {
      state: {
        sessionId,
        planningMode: 'collaborative',
        fromProposal: true
      }
    });
  };
  const handleBackToModeSelection = () => {
    setSelectedMode(null);
    setShowPartnerSelection(false);
    setShowProposalCreation(false);
    setSelectedPartnerId('');
  };
  const hasFriends = friends.length > 0;

  // Load data on mount
  useEffect(() => {
    getMyProposals();
  }, []);

  // Show success toast when returning from successful invitation sending
  useEffect(() => {
    if (location.state?.toastData) {
      const { title, description, duration } = location.state.toastData;
      toast({ title, description, duration });
      navigate('/home', { replace: true, state: {} });
    }
  }, [location.state, toast, navigate]);

  // Calculate stats for dashboard
  const pendingProposals = proposals.filter(p => p.status === 'pending').length;
  const receivedInvitations = invitations?.filter(inv => 'direction' in inv && inv.direction === 'received') || [];
  const pendingInvitations = receivedInvitations.filter(inv => inv.status === 'pending').length;
  const acceptedCount = [...proposals, ...receivedInvitations].filter(item => item.status === 'accepted').length;
  const totalPending = pendingProposals + pendingInvitations;

  // Handle actions
  const handleProposalAction = async (proposalId: string, action: 'accept' | 'decline') => {
    if (action === 'accept') {
      const sessionId = await acceptProposal(proposalId);
      if (sessionId) {
        handleProposalAccepted(sessionId);
      }
    } else {
      await updateProposalStatus(proposalId, 'declined');
      getMyProposals(); // Refresh
    }
  };

  const handleInvitationAction = async (invitationId: string, action: 'accept' | 'decline') => {
    if (action === 'accept') {
      await acceptInvitation(invitationId);
    } else {
      await declineInvitation(invitationId);
    }
  };

  const handleViewAllActivity = () => {
    navigate('/invitations');
  };

  // Show proposal creation flow
  if (showProposalCreation && selectedPartnerId) {
    const selectedFriend = friends.find(f => f.id === selectedPartnerId);
    return <main className="p-6">
        <div className="max-w-md mx-auto space-y-6">
          <DateProposalCreation recipientId={selectedPartnerId} recipientName={selectedFriend?.name || 'Friend'} onProposalSent={handleProposalSent} onBack={handleBackToModeSelection} />
        </div>
      </main>;
  }

  // Show partner selection for collaborative mode
  if (showPartnerSelection) {
    return <main className="p-6">
        <div className="max-w-md mx-auto space-y-6">
          <div className="flex justify-start mb-4">
            <Button variant="outline" onClick={handleBackToModeSelection}>Back to the Start</Button>
          </div>
          <PartnerSelection friends={friends} selectedPartnerId={selectedPartnerId} selectedPartnerIds={selectedPartnerIds} dateMode={dateMode} loading={false} onPartnerChange={setSelectedPartnerId} onPartnerIdsChange={setSelectedPartnerIds} onDateModeChange={setDateMode} onContinue={handlePartnerSelectionContinue} />
        </div>
      </main>;
  }
  if (!user) return null;

  const firstName = user.name?.split(' ')[0] || user.email?.split('@')[0] || 'there';

  return (
    <main className="p-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Hero Section with personalized greeting */}
        <HeroSection 
          user={user}
          firstName={firstName}
          pendingProposals={pendingProposals}
          pendingInvitations={pendingInvitations}
        />
        
        {/* Status Dashboard */}
        {(proposals.length > 0 || receivedInvitations.length > 0) && (
          <StatusDashboard
            totalProposals={proposals.length}
            totalInvitations={receivedInvitations.length}
            acceptedCount={acceptedCount}
            pendingCount={totalPending}
          />
        )}
        
        {/* Activity Feed */}
        <ActivityFeed
          proposals={proposals}
          invitations={receivedInvitations as any}
          onProposalAction={handleProposalAction}
          onInvitationAction={handleInvitationAction}
          onViewAll={handleViewAllActivity}
        />
        
        {/* Planning Action Center */}
        <PlanningActionCenter
          onCollaborativePlanning={handleCollaborativePlanning}
          hasFriends={hasFriends}
        />
      </div>
    </main>
  );
};
export default HomeContent;