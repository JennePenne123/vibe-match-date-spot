import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles, Users, Star } from 'lucide-react';
import AIVenueCard from '@/components/AIVenueCard';
import RealtimeContextBanner from '@/components/RealtimeContextBanner';
import AIProgressIndicator from '@/components/profile/AIProgressIndicator';
import { AIVenueRecommendation } from '@/services/aiVenueService';
import { useAuth } from '@/contexts/AuthContext';
import { useVenueVouchers } from '@/hooks/useVenueVouchers';
import { useUserPoints } from '@/hooks/useUserPoints';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

// Skeleton loader for venue cards
const VenueCardSkeleton = () => (
  <div className="rounded-xl overflow-hidden border border-border/50 bg-card">
    <Skeleton className="h-48 w-full" />
    <div className="p-4 space-y-3">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="h-9 w-full rounded-md" />
    </div>
  </div>
);

const Results = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { appState } = useApp();
  const { user } = useAuth();

  const smartPlanningState = location.state as {
    fromSmartDatePlanning?: boolean;
    sessionId?: string;
    partnerId?: string;
    compatibilityScore?: number;
    venues?: any[];
    venueRecommendations?: AIVenueRecommendation[];
  } | null;

  const isFromSmartPlanning = smartPlanningState?.fromSmartDatePlanning;
  const venues = isFromSmartPlanning ? (smartPlanningState.venues || []) : appState.venues;

  const recommendations: AIVenueRecommendation[] = (isFromSmartPlanning && smartPlanningState.venueRecommendations
    ? smartPlanningState.venueRecommendations
    : venues.map(venue => ({
        venue_id: venue.id,
        venue_name: venue.name,
        venue_address: venue.address || 'Address not available',
        venue_image: venue.image_url || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
        ai_score: (venue as any).matchScore ? (venue as any).matchScore / 100 : 0.5,
        match_factors: {
          cuisine_match: true,
          price_match: true,
          vibe_matches: venue.tags || [],
          rating: venue.rating || 0,
          price_range: venue.price_range || '$$',
        },
        contextual_score: 0,
        ai_reasoning: (venue as any).description || `${venue.cuisine_type || 'Restaurant'} in deiner Nähe`,
        confidence_level: 0.7
      }))
  ).sort((a, b) => b.ai_score - a.ai_score);

  const top3VenueIds = useMemo(() => 
    recommendations.slice(0, 3).map(r => r.venue_id).filter(Boolean),
    [recommendations]
  );
  useVenueVouchers(top3VenueIds);

  const handleVenueSelect = (venueId: string) => {
    if (isFromSmartPlanning) {
      navigate(`/plan-date/${smartPlanningState.sessionId}`, { 
        state: { selectedVenueId: venueId, returnToPlanning: true } 
      });
    } else {
      navigate(`/venue/${venueId}`);
    }
  };

  const handleBackNavigation = () => {
    if (isFromSmartPlanning && smartPlanningState.sessionId) {
      navigate(`/plan-date/${smartPlanningState.sessionId}`);
    } else {
      navigate('/preferences');
    }
  };

  if (venues.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-md mx-auto">
          <div className="bg-card p-4 pt-12 shadow-sm">
            <div className="flex items-center justify-between">
              <Button
                onClick={() => navigate(isFromSmartPlanning ? `/plan-date/${smartPlanningState?.sessionId}` : '/preferences')}
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:bg-muted"
              >
                <ArrowLeft className="w-6 h-6" />
              </Button>
              <h1 className="text-xl font-semibold text-foreground">{t('results.title')}</h1>
              <div className="w-10" />
            </div>
          </div>
          <div className="px-6 py-16 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold text-foreground">{t('results.noVenuesTitle')}</h2>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              {!user 
                ? t('results.noVenuesDescAnon')
                : t('results.noVenuesDescAuth')}
            </p>
            <div className="flex flex-col gap-3 pt-4">
              {!user && (
                <Button onClick={() => navigate('/')} className="bg-gradient-primary text-primary-foreground hover:opacity-90">
                  {t('results.signIn')}
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => navigate('/preferences?step=1')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('results.changeLocation')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card p-4 pt-12 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <Button
              onClick={handleBackNavigation}
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:bg-muted"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div className="text-center">
              <h1 className="text-xl font-semibold text-foreground">
                {isFromSmartPlanning ? t('results.dateVenues') : t('results.title')}
              </h1>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                {isFromSmartPlanning ? (
                  <>
                    <Users className="w-4 h-4 text-secondary" />
                    {t('results.collaborativeMatches', { count: recommendations.length })}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-primary" />
                    {t('results.perfectMatches', { count: recommendations.length })}
                  </>
                )}
              </p>
            </div>
            <div className="w-10" />
          </div>
        </motion.div>

        {/* AI-Powered Results */}
        <div className="p-4">
          {/* AI Progress + Realtime Context */}
          <div className="flex items-center gap-2 mb-3">
            <AIProgressIndicator variant="inline" className="flex-shrink-0" />
          </div>
          <RealtimeContextBanner
            userLocation={appState.userLocation}
            className="mb-4"
          />

          {(() => {
            const STORAGE_KEY = 'ai_matches_banner_views';
            const views = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
            if (views < 3) {
              localStorage.setItem(STORAGE_KEY, String(views + 1));
              return (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="mb-6 text-center bg-gradient-to-r from-primary/5 to-secondary/5 p-4 rounded-lg border border-primary/20"
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold text-foreground">
                      {t('results.aiMatchesTitle')}
                    </h2>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('results.aiMatchesDesc', { type: isFromSmartPlanning ? t('results.aiMatchesDescShared') : t('results.aiMatchesDescYour') })}
                  </p>
                </motion.div>
              );
            }
            return null;
          })()}

          {/* Premium Voucher Banner – hidden until premium launches */}

          {/* AIVenueCard Components with staggered animation */}
          <div className="space-y-6">
            {recommendations.map((recommendation, index) => {
              const isQualityVerified = (recommendation as any).qualityVerified === true;
              const qualityRank = (recommendation as any).qualityRank as number | undefined;
              const isTop3 = isQualityVerified && qualityRank !== undefined && qualityRank <= 3;
              const venueVouchers: any[] = [];
              
              return (
                <motion.div 
                  key={recommendation.venue_id} 
                  className="relative"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + index * 0.1, duration: 0.4 }}
                >
                  {/* Top 3 Premium Badge */}
                  {isTop3 && (
                    <div className="absolute -top-2 -left-1 z-10">
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold shadow-md bg-gradient-to-r from-primary/80 to-accent/80 text-white">
                        <Star className="w-3 h-3" />
                        Top {qualityRank} Match
                      </div>
                    </div>
                  )}
                  <AIVenueCard
                    recommendation={recommendation}
                    onSelect={handleVenueSelect}
                    showAIInsights={true}
                    compact={false}
                    isTopMatch={index === 0}
                    sessionContext={{
                      sessionId: isFromSmartPlanning ? smartPlanningState.sessionId : 'current-session',
                      partnerId: isFromSmartPlanning ? smartPlanningState.partnerId : 'current-partner'
                    }}
                    vouchers={venueVouchers}
                  />
                </motion.div>
              );
            })}
          </div>

          {/* No Results */}
          {recommendations.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No recommendations found
              </h3>
              <p className="text-muted-foreground">
                Try updating your preferences for better matches
              </p>
            </div>
          )}

          {/* Bottom Actions */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 space-y-3"
          >
            {isFromSmartPlanning ? (
              <>
                <Button
                  onClick={handleBackNavigation}
                  variant="outline"
                  className="w-full border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Continue Planning Together
                </Button>
                {smartPlanningState.compatibilityScore && (
                  <div className="text-center text-sm text-muted-foreground">
                    Compatibility Score: {Math.round(smartPlanningState.compatibilityScore * 100)}%
                  </div>
                )}
              </>
            ) : (
              <>
                <Button
                  onClick={() => navigate('/preferences')}
                  variant="outline"
                  className="w-full border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Empfehlungen verbessern
                </Button>
                <Button
                  onClick={() => navigate('/welcome')}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90"
                >
                  Neue Suche starten
                </Button>
              </>
            )}
          </motion.div>

          {/* AI Learning Notice */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-6 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
          >
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">KI lernt mit</h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Dein Feedback auf diese Venues hilft der KI, deine Präferenzen besser zu verstehen und zukünftige Empfehlungen zu verbessern.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Results;