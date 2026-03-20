import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFriends } from '@/hooks/useFriends';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Users, ArrowRight, MapPin, Calendar, Heart, Zap } from 'lucide-react';
import UpcomingDatesCard from '@/components/home/UpcomingDatesCard';
import { PendingRatingsCard } from '@/components/home/PendingRatingsCard';
import DateProposalsList from '@/components/date-planning/DateProposalsList';
import DateProposalCreation from '@/components/date-planning/DateProposalCreation';
import PartnerSelection from '@/components/date-planning/PartnerSelection';
import { useToast } from '@/hooks/use-toast';
import { useBreakpoint } from '@/hooks/use-mobile';

const DATE_TIPS = [
  { icon: MapPin, title: 'Neue Orte entdecken', desc: 'Unsere AI findet versteckte Perlen in deiner Nähe' },
  { icon: Heart, title: 'Gemeinsam planen', desc: 'Stimmt eure Vorlieben ab für das perfekte Date' },
  { icon: Zap, title: 'Spontan sein', desc: 'Lass dich von unseren Vorschlägen überraschen' },
];

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
    const params = new URLSearchParams({ sessionId, planningMode: 'collaborative', fromProposal: 'true' });
    navigate(`/plan-date?${params.toString()}`, {
      state: { sessionId, planningMode: 'collaborative', fromProposal: true }
    });
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
    if (location.state?.startPlanning && location.state?.preselectedPartnerId) {
      const partnerId = location.state.preselectedPartnerId;
      setSelectedPartnerId(partnerId);
      setShowProposalCreation(true);
      navigate('/home', { replace: true, state: {} });
    }
  }, [location.state, toast, navigate, handleInvitationSent]);

  // Sub-views for partner selection / proposal creation
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
    <main className="px-4 py-5 md:px-6 lg:px-8">
      <div className={isMobile ? "max-w-md mx-auto space-y-5" : "max-w-7xl mx-auto space-y-6"}>

        {/* Hero CTA — Plan Date */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary/15 via-primary/5 to-accent/10 shadow-lg">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,hsl(var(--primary)/0.12),transparent_60%)]" />
          <CardContent className="relative p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  <Sparkles className="w-3 h-3" />
                  AI-powered
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
                  Plane dein nächstes Date
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                  Finde den perfekten Ort — abgestimmt auf eure Vorlieben.
                </p>
              </div>
              {!isMobile && (
                <div className="p-4 rounded-2xl bg-primary/10">
                  <Calendar className="w-10 h-10 text-primary" />
                </div>
              )}
            </div>
            <Button
              onClick={handleCollaborativePlanning}
              size="lg"
              className="mt-4 w-full sm:w-auto shadow-glow-primary/30 hover:shadow-glow-primary/50 transition-all duration-300 gap-2"
            >
              <Users className="w-4 h-4" />
              Date planen
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Pending ratings — compact, above fold */}
        <PendingRatingsCard />

        {isDesktop ? (
          <div className="grid grid-cols-2 gap-5">
            {/* Upcoming Dates */}
            <UpcomingDatesCard key="upcoming-dates-v2" />
            {/* Proposals */}
            <DateProposalsList onProposalAccepted={handleProposalAccepted} onInvitationSent={handleInvitationSent} key={invitationSentTrigger} />
          </div>
        ) : (
          <>
            {/* Upcoming Dates — prominent */}
            <UpcomingDatesCard key="upcoming-dates-v2" />
            {/* Proposals */}
            <DateProposalsList onProposalAccepted={handleProposalAccepted} onInvitationSent={handleInvitationSent} key={invitationSentTrigger} />
          </>
        )}

        {/* AI Inspiration Tips */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
            Inspiration
          </h3>
          <div className={isDesktop ? "grid grid-cols-3 gap-4" : "grid grid-cols-1 gap-3"}>
            {DATE_TIPS.map((tip, i) => (
              <Card key={i} className="border-border/50 bg-card/60 backdrop-blur-sm hover:border-primary/30 hover:bg-card/80 transition-all duration-300 group cursor-default">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors shrink-0">
                    <tip.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{tip.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{tip.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
};

export default HomeContent;
