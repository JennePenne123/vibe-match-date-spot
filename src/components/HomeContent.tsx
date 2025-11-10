import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFriends } from '@/hooks/useFriends';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Users, User } from 'lucide-react';
import { Heading, Text } from '@/design-system/components';
import UpcomingDatesCard from '@/components/home/UpcomingDatesCard';
import { PendingRatingsCard } from '@/components/home/PendingRatingsCard';
import DateProposalsList from '@/components/date-planning/DateProposalsList';
import DateProposalCreation from '@/components/date-planning/DateProposalCreation';
import PartnerSelection from '@/components/date-planning/PartnerSelection';
import { useToast } from '@/hooks/use-toast';
import { useBreakpoint } from '@/hooks/use-mobile';

const HomeContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { friends } = useFriends();
  const { isMobile, isDesktop } = useBreakpoint();

  // State for managing collaborative planning flow
  const [showPartnerSelection, setShowPartnerSelection] = useState(false);
  const [showProposalCreation, setShowProposalCreation] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [selectedPartnerIds, setSelectedPartnerIds] = useState<string[]>([]);
  const [dateMode, setDateMode] = useState<'single' | 'group'>('single');
  const [invitationSentTrigger, setInvitationSentTrigger] = useState(0);
  const handleCollaborativePlanning = () => {
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

  const handleInvitationSent = useCallback(() => {
    // Trigger a refresh of proposals list by incrementing the trigger
    setInvitationSentTrigger(prev => prev + 1);
  }, []);
  const handleBackToModeSelection = () => {
    setShowPartnerSelection(false);
    setShowProposalCreation(false);
    setSelectedPartnerId('');
  };
  const hasFriends = friends.length > 0;

  // Show success toast when returning from successful invitation sending
  useEffect(() => {
    if (location.state?.toastData) {
      const {
        title,
        description,
        duration
      } = location.state.toastData;
      toast({
        title,
        description,
        duration
      });
      
      // If returning from successful invitation, trigger proposal refresh
      if (title?.includes('Invitation') || title?.includes('sent')) {
        handleInvitationSent();
      }
      
      // Clear the state to prevent showing the toast again
      navigate('/home', {
        replace: true,
        state: {}
      });
    }
  }, [location.state, toast, navigate, handleInvitationSent]);

  // Show proposal creation flow
  if (showProposalCreation && selectedPartnerId) {
    const selectedFriend = friends.find(f => f.id === selectedPartnerId);
    return (
      <main className="p-6">
        <div className={isMobile ? "max-w-md mx-auto space-y-6" : "max-w-4xl mx-auto space-y-6"}>
          <DateProposalCreation 
            recipientId={selectedPartnerId} 
            recipientName={selectedFriend?.name || 'Friend'} 
            onProposalSent={handleProposalSent} 
            onBack={handleBackToModeSelection} 
          />
        </div>
      </main>
    );
  }

  // Show partner selection for collaborative mode
  if (showPartnerSelection) {
    return (
      <main className="p-6">
        <div className={isMobile ? "max-w-md mx-auto space-y-6" : "max-w-4xl mx-auto space-y-6"}>
          <div className="flex justify-start mb-4">
            <Button variant="outline" onClick={handleBackToModeSelection}>Back to the Start</Button>
          </div>
          <PartnerSelection 
            friends={friends} 
            selectedPartnerId={selectedPartnerId} 
            selectedPartnerIds={selectedPartnerIds} 
            dateMode={dateMode} 
            loading={false} 
            onPartnerChange={setSelectedPartnerId} 
            onPartnerIdsChange={setSelectedPartnerIds} 
            onDateModeChange={setDateMode} 
            onContinue={handlePartnerSelectionContinue} 
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50/80 via-rose-50/60 to-amber-50/40 px-4 py-6 md:px-6 lg:px-8">
      <div className={isMobile ? "max-w-md mx-auto space-y-5" : "max-w-7xl mx-auto"}>
        {isDesktop ? (
          // Desktop layout: Balanced 3-column grid (1-1-1 ratio)
          <div className="space-y-5 animate-fade-in">
            {/* Pending Ratings Card - Full Width */}
            <PendingRatingsCard />
            
            <div className="grid grid-cols-3 gap-5">
              {/* Date Proposals Section - 1 column */}
              <div className="col-span-1">
                <DateProposalsList 
                  onProposalAccepted={handleProposalAccepted}
                  onInvitationSent={handleInvitationSent}
                  key={invitationSentTrigger}
                />
              </div>
              
              {/* Recent Invitations - 1 column */}
              <div className="col-span-1">
                <UpcomingDatesCard key="upcoming-dates-v2" />
              </div>
              
              {/* Planning Mode Selection - 1 column */}
              <div className="col-span-1">
                <div className="space-y-4">
                  <div className="text-center">
                    <Heading size="h3" className="mb-2 bg-gradient-text bg-clip-text text-transparent">Plan a New Date</Heading>
                    <Text size="xs" className="text-muted-foreground leading-tight">
                      Choose how you'd like to plan your date
                    </Text>
                  </div>
                  
                  {/* Collaborative Planning Card */}
                  <Card 
                    variant="glass" 
                    className="cursor-pointer hover:scale-105 transition-all duration-300 shadow-glow-sm hover:shadow-glow-md animate-scale-in" 
                    onClick={handleCollaborativePlanning}
                  >
                    <CardHeader className="text-center pb-2 pt-4">
                      <div className="mx-auto mb-2 p-3 rounded-full bg-gradient-romantic shadow-glow-sm">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle className="text-base">Collaborative Planning</CardTitle>
                      <CardDescription className="text-xs leading-tight">
                        Send a proposal and plan together
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 pb-4">
                      <Button className="w-full shadow-glow-md hover:shadow-glow-lg transition-all" variant="default" size="sm">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Send Date Proposal
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Mobile layout: Single column with optimized spacing
          <div className="space-y-5 animate-fade-in">
            {/* Pending Ratings Card */}
            <PendingRatingsCard />
            
            {/* Date Proposals Section */}
            <DateProposalsList 
              onProposalAccepted={handleProposalAccepted}
              onInvitationSent={handleInvitationSent}
              key={invitationSentTrigger}
            />
            
            {/* Recent Invitations */}
            <UpcomingDatesCard key="upcoming-dates-v2" />
            
            {/* Planning Mode Selection */}
            <div className="space-y-4">
              <div className="text-center">
                <Heading size="h2" className="mb-2 bg-gradient-text bg-clip-text text-transparent">Plan a New Date</Heading>
                <Text size="sm" className="text-muted-foreground">
                  Choose how you'd like to plan your date
                </Text>
              </div>
              
              {/* Collaborative Planning Card */}
              <Card 
                variant="glass" 
                className="cursor-pointer hover:scale-[1.02] transition-all duration-300 shadow-glow-md animate-scale-in" 
                onClick={handleCollaborativePlanning}
              >
                <CardHeader className="text-center pb-3">
                  <div className="mx-auto mb-2 p-3 rounded-full bg-gradient-romantic shadow-glow-sm">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">Collaborative Planning</CardTitle>
                  <CardDescription className="text-sm">
                    Send a proposal and plan together
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button className="w-full shadow-glow-md hover:shadow-glow-lg transition-all" variant="default">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Send Date Proposal
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};
export default HomeContent;