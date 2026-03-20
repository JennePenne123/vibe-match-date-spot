import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFriends } from '@/hooks/useFriends';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Users, ArrowRight, MapPin, Calendar, Heart, Zap, Loader2 } from 'lucide-react';
import UpcomingDatesCard from '@/components/home/UpcomingDatesCard';
import { PendingRatingsCard } from '@/components/home/PendingRatingsCard';
import DateProposalsList from '@/components/date-planning/DateProposalsList';
import DateProposalCreation from '@/components/date-planning/DateProposalCreation';
import PartnerSelection from '@/components/date-planning/PartnerSelection';
import { useToast } from '@/hooks/use-toast';
import { useBreakpoint } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';

const QUOTES = [
  '„Das Leben ist zu kurz für schlechte Dates." ✨',
  '„Gemeinsame Erlebnisse sind das schönste Geschenk." 💫',
  '„Jeder Tag ist eine neue Chance, etwas Besonderes zu erleben." 🌟',
  '„Die besten Erinnerungen entstehen spontan." 🎯',
  '„Zusammen entdecken, zusammen wachsen." 🌱',
  '„Ein gutes Date beginnt mit Neugier." 💡',
  '„Kleine Abenteuer machen das Leben groß." 🚀',
];

const CITY_TIPS: { title: string; desc: string; icon: typeof MapPin; label: string }[] = [
  { icon: MapPin, label: 'Heute', title: 'Street-Food-Markt entdecken', desc: 'Probiert euch durch lokale Köstlichkeiten unter freiem Himmel' },
  { icon: Heart, label: 'Morgen', title: 'Sunset-Spaziergang am Fluss', desc: 'Golden Hour genießen — perfekt für entspannte Gespräche' },
  { icon: Zap, label: 'Heute', title: 'Pop-up Gallery besuchen', desc: 'Kunst & Kultur als Inspiration für euren Abend' },
  { icon: MapPin, label: 'Morgen', title: 'Geheimtipp-Café ausprobieren', desc: 'Specialty Coffee in gemütlichem Ambiente — ideal für ein Nachmittags-Date' },
  { icon: Heart, label: 'Heute', title: 'Rooftop-Bar mit Ausblick', desc: 'Cocktails mit Panoramablick auf die Stadt' },
  { icon: Zap, label: 'Morgen', title: 'Kochkurs für Zwei', desc: 'Gemeinsam kochen verbindet — und schmeckt!' },
  { icon: MapPin, label: 'Heute', title: 'Vintage-Markt durchstöbern', desc: 'Schätze finden und dabei Quality-Time genießen' },
  { icon: Heart, label: 'Morgen', title: 'Botanischer Garten erkunden', desc: 'Ruhe & Natur mitten in der Stadt — unterschätzt romantisch' },
  { icon: Zap, label: 'Heute', title: 'Live-Musik in der Altstadt', desc: 'Jazz, Indie oder Klassik — lasst euch überraschen' },
  { icon: MapPin, label: 'Morgen', title: 'Brunch-Spot entdecken', desc: 'Gemütlich in den Tag starten mit Avocado-Toast & Co.' },
];

const getDailyIndex = (offset: number) => {
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  return (dayOfYear + offset) % CITY_TIPS.length;
};

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
  const [loadingTipIndex, setLoadingTipIndex] = useState<number | null>(null);

  const handleTipClick = async (tip: typeof CITY_TIPS[0], index: number) => {
    if (loadingTipIndex !== null) return;
    setLoadingTipIndex(index);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('ai-quick-tip', {
        body: {
          tipTitle: tip.title,
          tipCategory: tip.label,
          userId: session?.user?.id || null,
        },
      });
      if (error) throw error;
      if (data?.venue_id) {
        toast({ title: t('home.aiTipTitle'), description: data.reason || t('home.aiTipFallback'), duration: 4000 });
        navigate(`/venue/${data.venue_id}`);
      } else {
        toast({ title: t('home.aiTipNoVenues'), description: t('home.aiTipNoVenuesDesc'), variant: 'destructive' });
      }
    } catch (err) {
      console.error('Quick tip error:', err);
      toast({ title: t('common.error'), description: t('home.aiTipError'), variant: 'destructive' });
    } finally {
      setLoadingTipIndex(null);
    }
  };

  const handleSoloPlanning = () => navigate('/preferences');
  const handleGroupPlanning = () => setShowPartnerSelection(true);
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
                  {t('home.heroTitle')}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                  {t('home.heroSubtitle')}
                </p>
              </div>
              {!isMobile && (
                <div className="p-4 rounded-2xl bg-primary/10">
                  <Calendar className="w-10 h-10 text-primary" />
                </div>
              )}
            </div>
            <Button
              onClick={handleSoloPlanning}
              size="lg"
              className="mt-4 w-full sm:w-auto shadow-glow-primary/30 hover:shadow-glow-primary/50 transition-all duration-300 gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              Date planen
            </Button>
            <button
              onClick={handleGroupPlanning}
              className="mt-2 w-full sm:w-auto text-sm text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5" />
              Oder als Gruppe einladen
            </button>
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

        {/* Daily Inspiration */}
        <div className="space-y-3">
          {/* Quote */}
          <Card className="border-0 bg-gradient-to-r from-accent/30 via-accent/10 to-transparent">
            <CardContent className="py-4 px-5">
              <p className="text-sm italic text-muted-foreground leading-relaxed text-center">
                {QUOTES[getDailyIndex(0) % QUOTES.length]}
              </p>
            </CardContent>
          </Card>

          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
            Was geht in deiner Stadt
          </h3>
          <div className={isDesktop ? "grid grid-cols-2 gap-4" : "grid grid-cols-1 gap-3"}>
            {[getDailyIndex(0), getDailyIndex(3)].map((idx, i) => {
              const tip = CITY_TIPS[idx];
              const isLoading = loadingTipIndex === i;
              return (
                <Card
                  key={i}
                  onClick={() => handleTipClick(tip, i)}
                  className="border-border/50 bg-card/60 backdrop-blur-sm hover:border-primary/30 hover:bg-card/80 transition-all duration-300 group cursor-pointer active:scale-[0.98]"
                >
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors shrink-0">
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 text-primary animate-spin" />
                      ) : (
                        <tip.icon className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                          {tip.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Tipp für dich →
                        </span>
                      </div>
                      <p className="text-sm font-medium text-foreground">{tip.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{tip.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

      </div>
    </main>
  );
};

export default HomeContent;
