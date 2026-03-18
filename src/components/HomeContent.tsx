import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const { toast } = useToast();
  const { friends } = useFriends();
  const { isMobile, isDesktop } = useBreakpoint();

  const [showPartnerSelection, setShowPartnerSelection] = useState(false);
  const [showProposalCreation, setShowProposalCreation] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [selectedPartnerIds, setSelectedPartnerIds] = useState<string[]>([]);
  const [dateMode, setDateMode] = useState<'single' | 'group'>('single');
  const [invitationSentTrigger, setInvitationSentTrigger] = useState(0);

  const handleCollaborativePlanning = () => setShowPartnerSelection(true);
  const handlePartnerSelectionContinue = () => {
    if (selectedPartnerId) { setShowPartnerSelection(false); setShowProposalCreation(true); }
  };
  const handleProposalSent = () => {
    setShowProposalCreation(false); setSelectedPartnerId('');
    toast({ title: t('home.proposalSentTitle'), description: t('home.proposalSentDesc'), duration: 3000 });
  };
  const handleProposalAccepted = (sessionId: string) => {
    navigate('/plan-date', { state: { sessionId, planningMode: 'collaborative', fromProposal: true } });
  };
  const handleInvitationSent = useCallback(() => {
    setInvitationSentTrigger(prev => prev + 1);
  }, []);
  const handleBackToModeSelection = () => {
    setShowPartnerSelection(false); setShowProposalCreation(false); setSelectedPartnerId('');
  };

  useEffect(() => {
    if (location.state?.toastData) {
      const { title, description, duration } = location.state.toastData;
      toast({ title, description, duration });
      if (title?.includes('Invitation') || title?.includes('sent')) handleInvitationSent();
      navigate('/home', { replace: true, state: {} });
    }

    // Handle preselected partner from chat "New Date" action
    if (location.state?.startPlanning && location.state?.preselectedPartnerId) {
      const partnerId = location.state.preselectedPartnerId;
      setSelectedPartnerId(partnerId);
      setShowProposalCreation(true);
      navigate('/home', { replace: true, state: {} });
    }
  }, [location.state, toast, navigate, handleInvitationSent]);

  if (showProposalCreation && selectedPartnerId) {
    const selectedFriend = friends.find(f => f.id === selectedPartnerId);
    return (
      <main className="p-6">
        <div className={isMobile ? "max-w-md mx-auto space-y-6" : "max-w-4xl mx-auto space-y-6"}>
          <DateProposalCreation recipientId={selectedPartnerId} recipientName={selectedFriend?.name || 'Friend'} onProposalSent={handleProposalSent} onBack={handleBackToModeSelection} />
        </div>
      </main>
    );
  }

  if (showPartnerSelection) {
    return (
      <main className="p-6">
        <div className={isMobile ? "max-w-md mx-auto space-y-6" : "max-w-4xl mx-auto space-y-6"}>
          <div className="flex justify-start mb-4">
            <Button variant="outline" onClick={handleBackToModeSelection}>{t('home.backToStart')}</Button>
          </div>
          <PartnerSelection friends={friends} selectedPartnerId={selectedPartnerId} selectedPartnerIds={selectedPartnerIds} dateMode={dateMode} loading={false} onPartnerChange={setSelectedPartnerId} onPartnerIdsChange={setSelectedPartnerIds} onDateModeChange={setDateMode} onContinue={handlePartnerSelectionContinue} />
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 py-6 md:px-6 lg:px-8">
      <div className={isMobile ? "max-w-md mx-auto space-y-5" : "max-w-7xl mx-auto"}>
        {isDesktop ? (
          <div className="space-y-5">
            <PendingRatingsCard />
            <div className="grid grid-cols-5 gap-4 lg:gap-5">
              <div className="col-span-2">
                <DateProposalsList onProposalAccepted={handleProposalAccepted} onInvitationSent={handleInvitationSent} key={invitationSentTrigger} />
              </div>
              <div className="col-span-2">
                <UpcomingDatesCard key="upcoming-dates-v2" />
              </div>
              <div className="col-span-1">
                <div className="space-y-4">
                  <div className="text-center">
                    <Heading size="h3" className="mb-2">{t('home.planNewDate')}</Heading>
                    <Text size="xs" className="text-muted-foreground leading-tight">{t('home.choosePlanningMode')}</Text>
                  </div>
                  <Card className="border-border hover:border-primary/50 transition-all duration-300 ease-out cursor-pointer hover:shadow-glow-md hover:scale-[1.03] hover:-translate-y-1 bg-gradient-to-br from-background to-muted/10 group" onClick={handleCollaborativePlanning}>
                    <CardHeader className="text-center pb-2 pt-4">
                      <div className="mx-auto mb-2 p-2.5 rounded-full bg-primary/10 transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-110">
                        <Users className="h-5 w-5 text-primary transition-transform duration-300 group-hover:scale-110" />
                      </div>
                      <CardTitle className="text-base">{t('home.collaborativePlanning')}</CardTitle>
                      <CardDescription className="text-xs leading-tight">{t('home.collaborativeDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 pb-4">
                      <Button className="w-full" variant="default" size="sm">{t('home.sendDateProposal')}</Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <PendingRatingsCard />
            <DateProposalsList onProposalAccepted={handleProposalAccepted} onInvitationSent={handleInvitationSent} key={invitationSentTrigger} />
            <UpcomingDatesCard key="upcoming-dates-v2" />
            <div className="space-y-4">
              <div className="text-center">
                <Heading size="h2" className="mb-2">{t('home.planNewDate')}</Heading>
                <Text size="sm" className="text-muted-foreground">{t('home.choosePlanningMode')}</Text>
              </div>
              <Card className="border-border hover:border-primary/50 transition-all duration-300 ease-out cursor-pointer hover:shadow-glow-md hover:scale-[1.02] hover:-translate-y-1 bg-gradient-to-br from-background to-muted/10 group" onClick={handleCollaborativePlanning}>
                <CardHeader className="text-center pb-3">
                  <div className="mx-auto mb-2 p-3 rounded-full bg-primary/10 transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-110">
                    <Users className="h-6 w-6 text-primary transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <CardTitle className="text-lg">{t('home.collaborativePlanning')}</CardTitle>
                  <CardDescription className="text-sm">{t('home.collaborativeDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button className="w-full" variant="default">{t('home.sendDateProposal')}</Button>
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
