import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

import OnboardingProgress from '@/components/onboarding/OnboardingProgress';
import LifestylePicks, { type LifestyleData } from '@/components/onboarding/LifestylePicks';
import FoodVibeQuickPick from '@/components/onboarding/FoodVibeQuickPick';
import VenueSwipeCards, { type VenueSwipeData, deriveSwipePreferences } from '@/components/onboarding/VenueSwipeCards';
import ReferralInspiration, { type AdoptedPreferences } from '@/components/onboarding/ReferralInspiration';

import onboarding1 from '@/assets/onboarding-1.png';
import { trackFunnelStep, ONBOARDING_FUNNEL_STEPS } from '@/services/funnelAnalyticsService';

// Reduced from 6 → 4 steps. Removed: Personality, RelationshipGoal, Scenarios
// (kept in DB schema with sensible defaults; can be set later in profile settings)
const TOTAL_STEPS = 4;

// Map UI step (0..4) to canonical funnel step keys.
const STEP_KEY_BY_INDEX: Record<number, { key: string; index: number }> = {
  0: ONBOARDING_FUNNEL_STEPS[0], // welcome
  1: ONBOARDING_FUNNEL_STEPS[1], // food_vibes
  2: ONBOARDING_FUNNEL_STEPS[2], // venue_swipe
  3: ONBOARDING_FUNNEL_STEPS[3], // lifestyle
  4: ONBOARDING_FUNNEL_STEPS[4], // distance_location
};

const Onboarding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [step, setStep] = useState(0); // 0 = welcome, 1-4 = steps
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [microFeedback, setMicroFeedback] = useState<string | null>(null);

  // Referral tracking
  const [referrerId, setReferrerId] = useState<string | null>(null);
  const [referralAdopted, setReferralAdopted] = useState(false);

  // Step 1: Food & Vibes (was step 5)
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);

  // Step 2: Venue Swipe (was step 6)
  const [venueSwipeData, setVenueSwipeData] = useState<VenueSwipeData>({
    liked: [], disliked: [],
  });

  // Step 3: Lifestyle (was step 3) — moved later, made lighter
  const [lifestyle, setLifestyle] = useState<LifestyleData>({
    chronotype: '', budget_style: '', mobility: '',
  });

  // Distance & Location
  const [distanceKm, setDistanceKm] = useState(5);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Resolve referral code to referrer ID
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (!refCode) return;

    const resolveReferrer = async () => {
      try {
        const { data } = await supabase
          .from('user_points')
          .select('user_id')
          .eq('referral_code', refCode.toUpperCase())
          .single();
        if (data?.user_id) {
          setReferrerId(data.user_id);
        }
      } catch { /* no referrer found */ }
    };
    resolveReferrer();
  }, [searchParams]);

  // Track entry into each funnel step.
  useEffect(() => {
    const def = STEP_KEY_BY_INDEX[step];
    if (!def) return;
    trackFunnelStep({
      stepKey: def.key,
      stepIndex: def.index,
      action: 'entered',
      metadata: { hasReferrer: !!referrerId },
    });
  }, [step, referrerId]);

  // Track unload as "abandoned" if user leaves before finishing.
  useEffect(() => {
    const handler = () => {
      if (step >= TOTAL_STEPS) return; // finished naturally
      const def = STEP_KEY_BY_INDEX[step];
      if (!def) return;
      // Best effort – browser may kill before insert resolves.
      void trackFunnelStep({
        stepKey: def.key,
        stepIndex: def.index,
        action: 'abandoned',
        metadata: { reason: 'page_unload' },
      });
    };
    window.addEventListener('pagehide', handler);
    return () => window.removeEventListener('pagehide', handler);
  }, [step]);

  const handleAdoptPreferences = (prefs: AdoptedPreferences) => {
    setSelectedCuisines(prev => Array.from(new Set([...prev, ...prefs.cuisines])));
    setSelectedVibes(prev => Array.from(new Set([...prev, ...prefs.vibes])));
    if (prefs.maxDistance) {
      setDistanceKm(prefs.maxDistance);
    }
    setReferralAdopted(true);
  };

  const stepFeedback: Record<number, string> = {
    1: '🍜 Geschmack erkannt!',
    2: '✨ KI lernt deine Vorlieben!',
    3: '🎯 Profil fast fertig!',
    4: '🎉 Alle Signale erfasst!',
  };

  const animateTransition = useCallback((nextStep: number) => {
    if (isAnimating) return;
    setIsAnimating(true);

    if (nextStep > step && step > 0) {
      const msg = stepFeedback[step];
      if (msg) {
        setMicroFeedback(msg);
        setTimeout(() => setMicroFeedback(null), 1800);
      }
    }

    setTimeout(() => {
      setStep(nextStep);
      setIsAnimating(false);
    }, 250);
  }, [isAnimating, step]);

  const handleFinish = async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      // Enrich from venue swipes
      const swipePrefs = deriveSwipePreferences(venueSwipeData);
      const enrichedCuisines = Array.from(new Set([...selectedCuisines, ...swipePrefs.likedCuisines]));
      const enrichedVibes = Array.from(new Set([...selectedVibes, ...swipePrefs.likedVibes]));
      const enrichedPrices = swipePrefs.inferredPrices;

      // Map lifestyle budget to price range (with sensible default)
      const priceRangeMap: Record<string, string[]> = {
        saver: ['budget'],
        balanced: ['budget', 'moderate'],
        spender: ['moderate', 'upscale', 'luxury'],
      };
      const basePriceRange = priceRangeMap[lifestyle.budget_style] || ['budget', 'moderate'];
      const derivedPriceRange = Array.from(new Set([...basePriceRange, ...enrichedPrices]));

      // Map chronotype to preferred times (with sensible default)
      const timeMap: Record<string, string[]> = {
        morning: ['brunch', 'lunch', 'afternoon'],
        evening: ['dinner', 'evening'],
      };
      const derivedTimes = timeMap[lifestyle.chronotype] || ['flexible'];

      if (user) {
        const currentUserId = user.id;

        const preferencePayload = {
          user_id: currentUserId,
          preferred_cuisines: enrichedCuisines.length > 0 ? enrichedCuisines : null,
          preferred_vibes: enrichedVibes.length > 0 ? enrichedVibes : null,
          preferred_price_range: derivedPriceRange,
          preferred_times: derivedTimes,
          dietary_restrictions: selectedDietary.length > 0 ? selectedDietary : null,
          // Default neutral personality (50/50/50) — user can fine-tune later in profile
          personality_traits: { spontaneity: 50, adventure: 50, social_energy: 50 },
          // No relationship_goal forced — keeps onboarding inclusive (solo + duo)
          relationship_goal: null,
          lifestyle_data: lifestyle,
          max_distance: distanceKm,
          excluded_cuisines: swipePrefs.dislikedCuisines.length > 0 ? swipePrefs.dislikedCuisines : null,
          ...(userLocation ? { home_latitude: userLocation.lat, home_longitude: userLocation.lng } : {}),
        };

        // Upsert preference (select-then-insert/update pattern per project memory)
        const { data: existing } = await supabase
          .from('user_preferences')
          .select('id')
          .eq('user_id', currentUserId)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('user_preferences')
            .update(preferencePayload)
            .eq('user_id', currentUserId);
        } else {
          await supabase
            .from('user_preferences')
            .insert(preferencePayload);
        }

        // Initialize AI preference vectors
        try {
          const { initializePreferenceVectors } = await import('@/services/preferenceInitService');
          await initializePreferenceVectors(currentUserId, {
            cuisines: enrichedCuisines,
            vibes: enrichedVibes,
            priceRange: derivedPriceRange,
            times: derivedTimes,
            dietary: selectedDietary,
            activities: [],
            swipeData: venueSwipeData,
            distanceKm,
          });
        } catch (e) {
          console.error('Failed to init vectors:', e);
        }

        // Award points
        try {
          const { awardPoints } = await import('@/services/awardPointsService');
          await awardPoints('preferences_set');
        } catch (e) {
          console.error('Failed to award points:', e);
        }
      }

      toast({
        title: '🎉 Profil komplett!',
        description: 'Die KI kennt dich jetzt – deine ersten Empfehlungen warten!',
      });

      navigate('/home', { replace: true });
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      toast({
        variant: 'destructive',
        title: 'Fehler beim Speichern',
        description: 'Bitte versuche es erneut.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = () => {
    if (step === TOTAL_STEPS) {
      handleFinish();
    } else {
      animateTransition(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) animateTransition(step - 1);
  };

  const handleSkip = () => navigate('/home', { replace: true });

  const getNextLabel = () => {
    if (step === 0) return 'Los geht\'s';
    if (step === TOTAL_STEPS) return isSaving ? 'Speichern...' : 'Fertig!';
    return 'Weiter';
  };

  const getStepLabel = () => {
    switch (step) {
      case 1: return 'Geschmack & Vibes';
      case 2: return 'Venue-Swipe';
      case 3: return 'Lifestyle (optional)';
      case 4: return 'Standort & Reichweite';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-between p-4 select-none relative overflow-hidden">
      {/* Subtle background */}
      <div className="absolute top-20 -left-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 -right-20 w-72 h-72 bg-accent/5 rounded-full blur-3xl" />

      {/* Micro-feedback toast */}
      {microFeedback && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="bg-card/90 backdrop-blur-md border border-primary/20 rounded-full px-4 py-2 shadow-lg">
            <span className="text-sm font-medium text-foreground">{microFeedback}</span>
          </div>
        </div>
      )}

      <div className="w-full max-w-md mx-auto relative z-10 flex flex-col flex-1">
        {/* Skip button */}
        {step > 0 && (
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-muted-foreground/60 font-medium">
              {getStepLabel()}
            </span>
            {step >= 2 && (
              <Button onClick={handleSkip} variant="ghost" size="sm" className="text-muted-foreground text-xs ml-auto">
                Überspringen
              </Button>
            )}
          </div>
        )}

        {/* Progress bar */}
        {step > 0 && (
          <div className="mb-4">
            <OnboardingProgress currentStep={step} totalSteps={TOTAL_STEPS} />
          </div>
        )}

        {/* Content area */}
        <div
          className={`flex-1 overflow-y-auto pb-4 transition-all duration-250 ease-out ${
            isAnimating ? 'opacity-0 translate-y-3' : 'opacity-100 translate-y-0'
          }`}
        >
          {step === 0 && <WelcomeScreen />}
          {step === 1 && (
            <>
              {/* Referral inspiration banner (if available) */}
              <ReferralInspiration
                referrerId={referrerId}
                onAdoptPreferences={handleAdoptPreferences}
                adopted={referralAdopted}
              />
              <FoodVibeQuickPick
                selectedCuisines={selectedCuisines}
                selectedVibes={selectedVibes}
                selectedDietary={selectedDietary}
                onCuisinesChange={setSelectedCuisines}
                onVibesChange={setSelectedVibes}
                onDietaryChange={setSelectedDietary}
              />
            </>
          )}
          {step === 2 && (
            <VenueSwipeCards
              data={venueSwipeData}
              onChange={setVenueSwipeData}
              distanceKm={distanceKm}
              onDistanceChange={setDistanceKm}
              onLocationCaptured={(lat, lng) => setUserLocation({ lat, lng })}
            />
          )}
          {step === 3 && <LifestylePicks data={lifestyle} onChange={setLifestyle} />}
          {step === 4 && (
            <FinalConfirmStep
              distanceKm={distanceKm}
              hasLocation={!!userLocation}
            />
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-3 border-t border-border/20">
          <Button
            onClick={handleBack}
            variant="ghost"
            size="sm"
            disabled={isAnimating || step === 0}
            className={`text-muted-foreground transition-opacity ${step === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Zurück
          </Button>

          <Button
            onClick={handleNext}
            disabled={isAnimating || isSaving}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-6 transition-transform active:scale-[0.96]"
          >
            {getNextLabel()}
            {step < TOTAL_STEPS && <ArrowRight className="w-4 h-4 ml-1.5" />}
            {step === TOTAL_STEPS && <Sparkles className="w-4 h-4 ml-1.5" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

function WelcomeScreen() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center flex-1 text-center px-4 py-12">
      <div className="relative w-40 h-40 mb-8">
        <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" />
        <img
          src={onboarding1}
          alt="Welcome"
          className="w-full h-full object-contain relative z-10"
        />
      </div>

      <h1 className="text-2xl font-bold text-foreground mb-3">
        Willkommen bei H!Outz
      </h1>

      <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
        Sag uns kurz, was dir gefällt – die KI entscheidet, wo du heute hingehst. Allein, zu zweit oder mit Freunden.
      </p>

      <div className="flex items-center gap-2 mt-6 text-xs text-muted-foreground/60">
        <Sparkles className="w-3.5 h-3.5" />
        <span>4 kurze Schritte · ca. 60 Sekunden</span>
      </div>

      {/* AI Profiling notice (GDPR Art. 22) */}
      <p className="mt-6 text-[11px] text-muted-foreground/50 max-w-xs leading-relaxed">
        {t('settings.aiProfilingOnboarding', 'Wir nutzen KI, um dir personalisierte Empfehlungen vorzuschlagen. Mehr in unserer')}{' '}
        <Link to="/datenschutz" className="text-primary/60 underline underline-offset-2 hover:text-primary/80">
          {t('settings.privacy', 'Datenschutzerklärung')}
        </Link>.
      </p>
    </div>
  );
}

function FinalConfirmStep({ distanceKm, hasLocation }: { distanceKm: number; hasLocation: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 text-center px-4 py-8 space-y-6">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
        <Sparkles className="w-10 h-10 text-primary" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">Fast geschafft!</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          Die KI hat genug Signale, um dir gute Empfehlungen zu geben. Sie wird mit jeder Bewertung besser.
        </p>
      </div>

      <div className="w-full max-w-xs space-y-3 bg-card/50 backdrop-blur-sm border border-border/40 rounded-xl p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Standort</span>
          <span className="text-foreground font-medium">
            {hasLocation ? '✓ Erfasst' : 'Später hinzufügen'}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Reichweite</span>
          <span className="text-foreground font-medium">{distanceKm} km</span>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground/60 max-w-xs">
        Du kannst jederzeit weitere Details (Persönlichkeit, Budget, Zeitfenster) in deinem Profil ergänzen.
      </p>
    </div>
  );
}

export default Onboarding;
