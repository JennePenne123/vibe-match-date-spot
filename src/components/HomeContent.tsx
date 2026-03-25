import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFriends } from '@/hooks/useFriends';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, Users, ArrowRight, MapPin, Calendar, Heart, Zap, Loader2, Lightbulb, Star, Compass } from 'lucide-react';
import { motion } from 'framer-motion';
import UpcomingDatesCard from '@/components/home/UpcomingDatesCard';
import AIConfidenceBanner from '@/components/home/AIConfidenceBanner';
import { PendingRatingsCard } from '@/components/home/PendingRatingsCard';
import DateProposalsList from '@/components/date-planning/DateProposalsList';
import DateProposalCreation from '@/components/date-planning/DateProposalCreation';
import PartnerSelection from '@/components/date-planning/PartnerSelection';
import FeedbackImpactBanner from '@/components/home/FeedbackImpactBanner';
import { useToast } from '@/hooks/use-toast';
import { useBreakpoint } from '@/hooks/use-mobile';
import { useHomeTipVenues } from '@/hooks/useHomeTipVenues';
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

const DAILY_TIPS = [
  { emoji: '☕', tip: 'Perfekter Tag für ein gemütliches Café-Date', category: 'relaxed' },
  { emoji: '🌅', tip: 'Golden Hour genießen — ideal für einen Spaziergang', category: 'outdoor' },
  { emoji: '🍷', tip: 'Wie wäre es mit einer Weinbar zum Feierabend?', category: 'evening' },
  { emoji: '🎨', tip: 'Kultur-Tipp: Galerie oder Museum als Date-Spot', category: 'culture' },
  { emoji: '🍜', tip: 'Lust auf was Neues? Probiert eine unbekannte Küche', category: 'food' },
  { emoji: '🎵', tip: 'Live-Musik macht jedes Date unvergesslich', category: 'entertainment' },
  { emoji: '🌿', tip: 'Natur tanken — Parks & Gärten sind unterschätzt', category: 'outdoor' },
];

const getDailyIndex = (offset: number) => {
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  return dayOfYear + offset;
};

const HomeContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { friends } = useFriends();
  const { isMobile, isDesktop } = useBreakpoint();
  const { dailyTipVenue, cityTipVenues, loading: tipsLoading } = useHomeTipVenues();

  const [showPartnerSelection, setShowPartnerSelection] = useState(false);
  const [showProposalCreation, setShowProposalCreation] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [selectedPartnerIds, setSelectedPartnerIds] = useState<string[]>([]);
  const [dateMode, setDateMode] = useState<'single' | 'group'>('single');
  const [invitationSentTrigger, setInvitationSentTrigger] = useState(0);
  const [loadingTipIndex, setLoadingTipIndex] = useState<number | null>(null);

  const handleVenueTipClick = (venueId: string) => {
    navigate(`/venue/${venueId}`);
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

        {/* Daily AI Tip — with real venue */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card 
            className="relative overflow-hidden border-border/50 bg-gradient-to-r from-primary/8 via-accent/5 to-transparent cursor-pointer hover:border-primary/30 transition-all duration-300 active:scale-[0.98] group"
            onClick={dailyTipVenue ? () => handleVenueTipClick(dailyTipVenue.id) : undefined}
          >
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
            <CardContent className="relative p-4 flex items-center gap-3.5">
              <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-lg overflow-hidden">
                {dailyTipVenue?.image_url ? (
                  <img src={dailyTipVenue.image_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
                ) : (
                  <span className="text-xl">{DAILY_TIPS[getDailyIndex(0) % DAILY_TIPS.length].emoji}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Lightbulb className="w-3 h-3 text-primary" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                    {t('home.dailyTipLabel')}
                  </span>
                  {dailyTipVenue?.rating && (
                    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      <Star className="w-2.5 h-2.5 fill-primary text-primary" />
                      {dailyTipVenue.rating.toFixed(1)}
                    </span>
                  )}
                </div>
                {dailyTipVenue ? (
                  <>
                    <p className="text-sm font-medium text-foreground leading-snug truncate">{dailyTipVenue.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {[dailyTipVenue.cuisine_type, dailyTipVenue.price_range].filter(Boolean).join(' · ')}
                    </p>
                  </>
                ) : (
                  <p className="text-sm font-medium text-foreground leading-snug">
                    {DAILY_TIPS[getDailyIndex(0) % DAILY_TIPS.length].tip}
                  </p>
                )}
                {dailyTipVenue && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary mt-1 group-hover:gap-1.5 transition-all">
                    {t('home.discoverNow')} <ArrowRight className="w-3 h-3" />
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Feedback Impact Banner */}
        <FeedbackImpactBanner />

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
        <motion.div 
          className="space-y-3"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {/* Quote */}
          <Card className="border-0 bg-gradient-to-r from-accent/20 via-primary/10 to-transparent overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <CardContent className="py-4 px-5 relative">
              <p className="text-sm italic text-muted-foreground leading-relaxed text-center">
                {QUOTES[getDailyIndex(0) % QUOTES.length]}
              </p>
            </CardContent>
          </Card>

          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
            {t('home.cityTipsTitle')}
          </h3>
          <div className={isDesktop ? "grid grid-cols-2 gap-4" : "grid grid-cols-1 gap-3"}>
            {tipsLoading ? (
              <>
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-24 w-full rounded-lg" />
              </>
            ) : cityTipVenues.length > 0 ? (
              cityTipVenues.map((venue, i) => (
                <motion.div
                  key={venue.id}
                  initial={{ opacity: 0, x: i === 0 ? -12 : 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
                >
                  <Card
                    onClick={() => handleVenueTipClick(venue.id)}
                    className="border-border/50 bg-card/60 backdrop-blur-sm hover:border-primary/30 hover:bg-card/80 transition-all duration-300 group cursor-pointer active:scale-[0.98] overflow-hidden"
                  >
                    {/* Venue photo banner */}
                    {venue.image_url && (
                      <div className="relative h-24 w-full overflow-hidden">
                        <img 
                          src={venue.image_url} 
                          alt={venue.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
                        <div className="absolute top-2 left-2">
                          {venue.isDiscovery ? (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-accent/50 text-accent-foreground bg-accent/80 backdrop-blur-sm">
                              ✨ {t('home.discoveryLabel')}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-primary/40 text-primary-foreground bg-primary/80 backdrop-blur-sm">
                              💡 {t('home.forYouLabel')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    <CardContent className={`p-3.5 flex items-center gap-3 ${!venue.image_url ? 'pt-4' : ''}`}>
                      {/* Fallback icon when no photo */}
                      {!venue.image_url && (
                        <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                          {venue.isDiscovery ? (
                            <Compass className="w-5 h-5 text-primary" />
                          ) : (
                            <MapPin className="w-5 h-5 text-primary" />
                          )}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        {/* Badge row for no-image cards */}
                        {!venue.image_url && (
                          <div className="flex items-center gap-2 mb-0.5">
                            {venue.isDiscovery ? (
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-accent text-accent-foreground bg-accent/10">
                                ✨ {t('home.discoveryLabel')}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-primary/30 text-primary bg-primary/10">
                                💡 {t('home.forYouLabel')}
                              </Badge>
                            )}
                          </div>
                        )}
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-foreground truncate">{venue.name}</p>
                          {venue.rating && (
                            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground shrink-0">
                              <Star className="w-2.5 h-2.5 fill-primary text-primary" />
                              {venue.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed truncate">
                          {[venue.cuisine_type, venue.price_range].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground col-span-full text-center py-4">
                {t('home.noVenueTips')}
              </p>
            )}
          </div>
        </motion.div>

      </div>
    </main>
  );
};

export default HomeContent;
