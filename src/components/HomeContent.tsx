import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFriends } from '@/hooks/useFriends';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Users, User } from 'lucide-react';
import { Heading, Text } from '@/design-system/components';
import RecentReceivedInvitationsCard from '@/components/home/RecentReceivedInvitationsCard';
import DateProposalsList from '@/components/date-planning/DateProposalsList';
import DateProposalCreation from '@/components/date-planning/DateProposalCreation';
import PartnerSelection from '@/components/date-planning/PartnerSelection';
import { VenueMatchingDebug } from '@/components/debug/VenueMatchingDebug';
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
      // Clear the state to prevent showing the toast again
      navigate('/home', {
        replace: true,
        state: {}
      });
    }
  }, [location.state, toast, navigate]);

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
    <main className="p-6">
      <div className={isMobile ? "max-w-md mx-auto space-y-6" : "max-w-6xl mx-auto"}>
        {isDesktop ? (
          // Desktop layout: Grid layout with multiple columns
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Date Proposals Section */}
            <div className="lg:col-span-1">
              <DateProposalsList onProposalAccepted={handleProposalAccepted} />
            </div>
            
            {/* Recent Invitations */}
            <div className="lg:col-span-1">
              <RecentReceivedInvitationsCard />
            </div>
            
            {/* Planning Mode Selection */}
            <div className="lg:col-span-1 xl:col-span-1">
              <div className="space-y-4">
                <div className="text-center">
                  <Heading size="h1" className="mb-2">Plan a New Date</Heading>
                  <Text size="sm" className="text-muted-foreground">
                    Choose how you'd like to plan your date
                  </Text>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {/* Collaborative Planning Card */}
                  <Card className="border-border hover:border-primary/50 transition-colors cursor-pointer" onClick={handleCollaborativePlanning}>
                    <CardHeader className="text-center pb-3">
                      <div className="mx-auto mb-2 p-2 rounded-full bg-secondary/10">
                        <Users className="h-6 w-6 text-secondary" />
                      </div>
                      <CardTitle className="text-lg">Collaborative Planning</CardTitle>
                      <CardDescription className="text-sm">
                        Send a proposal and plan together
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Button className="w-full" variant="default">
                        Send Date Proposal
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
            
            {/* Debug Tools for Development - Full width on desktop */}
            <div className="lg:col-span-2 xl:col-span-3">
              <VenueMatchingDebug />
            </div>
          </div>
        ) : (
          // Mobile layout: Single column
          <div className="space-y-6">
            {/* Date Proposals Section */}
            <DateProposalsList onProposalAccepted={handleProposalAccepted} />
            
            {/* Recent Invitations */}
            <RecentReceivedInvitationsCard />
            
            {/* Debug Tools for Development */}
            <VenueMatchingDebug />
            
            {/* Planning Mode Selection */}
            <div className="space-y-4">
              <div className="text-center">
                <Heading size="h1" className="mb-2">Plan a New Date</Heading>
                <Text size="sm" className="text-muted-foreground">
                  Choose how you'd like to plan your date
                </Text>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {/* Collaborative Planning Card */}
                <Card className="border-border hover:border-primary/50 transition-colors cursor-pointer" onClick={handleCollaborativePlanning}>
                  <CardHeader className="text-center pb-3">
                    <div className="mx-auto mb-2 p-2 rounded-full bg-secondary/10">
                      <Users className="h-6 w-6 text-secondary" />
                    </div>
                    <CardTitle className="text-lg">Collaborative Planning</CardTitle>
                    <CardDescription className="text-sm">
                      Send a proposal and plan together
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button className="w-full" variant="default">
                      Send Date Proposal
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};
export default HomeContent;