import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

import OnboardingProgress from '@/components/onboarding/OnboardingProgress';
import PersonalitySliders, { type PersonalityTraits } from '@/components/onboarding/PersonalitySliders';
import RelationshipGoal from '@/components/onboarding/RelationshipGoal';
import LifestylePicks, { type LifestyleData } from '@/components/onboarding/LifestylePicks';
import ExperienceScenarios, { type ScenarioAnswers, scenarios } from '@/components/onboarding/ExperienceScenarios';
import FoodVibeQuickPick from '@/components/onboarding/FoodVibeQuickPick';
import VenueSwipeCards, { type VenueSwipeData, deriveSwipePreferences } from '@/components/onboarding/VenueSwipeCards';
import ReferralInspiration, { type AdoptedPreferences } from '@/components/onboarding/ReferralInspiration';

import onboarding1 from '@/assets/onboarding-1.png';

const TOTAL_STEPS = 6;

const Onboarding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [step, setStep] = useState(0); // 0 = welcome, 1-6 = steps
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [microFeedback, setMicroFeedback] = useState<string | null>(null);

  // Referral tracking
  const [referrerId, setReferrerId] = useState<string | null>(null);
  const [referralAdopted, setReferralAdopted] = useState(false);

  // Step 1: Personality
  const [personality, setPersonality] = useState<PersonalityTraits>({
    spontaneity: 50, adventure: 50, social_energy: 50,
  });

  // Step 2: Relationship Goal
  const [relationshipGoal, setRelationshipGoal] = useState('');

  // Step 3: Lifestyle
  const [lifestyle, setLifestyle] = useState<LifestyleData>({
    chronotype: '', budget_style: '', mobility: '',
  });

  // Step 4: Scenarios
  const [scenarioAnswers, setScenarioAnswers] = useState<ScenarioAnswers>({});

  // Step 5: Food & Vibes
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);

  // Step 6: Venue Swipe (NEW)
  const [venueSwipeData, setVenueSwipeData] = useState<VenueSwipeData>({
    liked: [], disliked: [],
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

  const handleAdoptPreferences = (prefs: AdoptedPreferences) => {
    setSelectedCuisines(prev => Array.from(new Set([...prev, ...prefs.cuisines])));
    setSelectedVibes(prev => Array.from(new Set([...prev, ...prefs.vibes])));
    if (prefs.personalityTraits) {
      setPersonality(prefs.personalityTraits);
    }
    if (prefs.maxDistance) {
      setDistanceKm(prefs.maxDistance);
    }
    setReferralAdopted(true);
  };

  const stepFeedback: Record<number, string> = {
    1: '🧠 Die KI versteht deine Persönlichkeit!',
    2: '💕 Perfekt – dein Ziel ist gesetzt!',
    3: '🎯 Lifestyle-Daten erfasst!',
    4: '✨ Szenarien analysiert – schon 60% genauer!',
    5: '🍜 Geschmack erkannt – fast fertig!',
    6: '🎉 Alle Signale erfasst!',
  };

  const animateTransition = useCallback((nextStep: number) => {
    if (isAnimating) return;
    setIsAnimating(true);

    // Show micro-feedback for the step we're leaving (only when going forward)
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
  }, [isAnimating]);

  const derivePreferencesFromScenarios = (): { vibes: string[]; activities: string[] } => {
    const derivedVibes = new Set<string>();
    const derivedActivities = new Set<string>();

    for (const scenario of scenarios) {
      const choice = scenarioAnswers[scenario.id];
      if (!choice) continue;
      const opt = choice === 'a' ? scenario.optionA : scenario.optionB;
      opt.tags.forEach((tag) => {
        if (['romantic', 'casual', 'outdoor', 'nightlife', 'cultural', 'adventurous'].includes(tag)) {
          derivedVibes.add(tag);
        } else {
          derivedActivities.add(tag);
        }
      });
    }

    return { vibes: Array.from(derivedVibes), activities: Array.from(derivedActivities) };
  };

  const handleFinish = async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      const { vibes: scenarioVibes, activities: scenarioActivities } = derivePreferencesFromScenarios();

      // Merge scenario-derived vibes with explicitly selected vibes
      const mergedVibes = Array.from(new Set([...selectedVibes, ...scenarioVibes]));
      const mergedActivities = Array.from(new Set(scenarioActivities));

      // Enrich from venue swipes
      const swipePrefs = deriveSwipePreferences(venueSwipeData);
      const enrichedCuisines = Array.from(new Set([...selectedCuisines, ...swipePrefs.likedCuisines]));
      const enrichedVibes = Array.from(new Set([...mergedVibes, ...swipePrefs.likedVibes]));
      const enrichedPrices = swipePrefs.inferredPrices;

      // Map lifestyle budget to price range
      const priceRangeMap: Record<string, string[]> = {
        saver: ['budget'],
        balanced: ['budget', 'moderate'],
        spender: ['moderate', 'upscale', 'luxury'],
      };
      const basePriceRange = priceRangeMap[lifestyle.budget_style] || ['moderate'];
      const derivedPriceRange = Array.from(new Set([...basePriceRange, ...enrichedPrices]));

      // Map chronotype to preferred times
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
          preferred_activities: mergedActivities.length > 0 ? mergedActivities : null,
          dietary_restrictions: selectedDietary.length > 0 ? selectedDietary : null,
          personality_traits: personality,
          relationship_goal: relationshipGoal || null,
          lifestyle_data: lifestyle,
          max_distance: distanceKm,
          excluded_cuisines: swipePrefs.dislikedCuisines.length > 0 ? swipePrefs.dislikedCuisines : null,
          ...(userLocation ? { home_latitude: userLocation.lat, home_longitude: userLocation.lng } : {}),
        };

        // Upsert preference
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

        // Initialize AI preference vectors (now with swipe + distance data)
        try {
          const { initializePreferenceVectors } = await import('@/services/preferenceInitService');
          await initializePreferenceVectors(currentUserId, {
            cuisines: enrichedCuisines,
            vibes: enrichedVibes,
            priceRange: derivedPriceRange,
            times: derivedTimes,
            dietary: selectedDietary,
            activities: mergedActivities,
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
        description: 'Die KI kennt dich jetzt – deine ersten personalisierten Empfehlungen warten!',
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
      case 1: return 'Persönlichkeit';
      case 2: return 'Beziehungsziel';
      case 3: return 'Lifestyle';
      case 4: return 'Szenarien';
      case 5: return 'Essen & Vibes';
      case 6: return 'Venue-Geschmack';
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
            {step >= 3 && (
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
          {step === 1 && <PersonalitySliders traits={personality} onChange={setPersonality} />}
          {step === 2 && <RelationshipGoal selected={relationshipGoal} onChange={setRelationshipGoal} />}
          {step === 3 && <LifestylePicks data={lifestyle} onChange={setLifestyle} />}
          {step === 4 && <ExperienceScenarios answers={scenarioAnswers} onChange={setScenarioAnswers} />}
          {step === 5 && (
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
          {step === 6 && (
            <VenueSwipeCards data={venueSwipeData} onChange={setVenueSwipeData} distanceKm={distanceKm} onDistanceChange={setDistanceKm} onLocationCaptured={(lat, lng) => setUserLocation({ lat, lng })} />
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
        Willkommen bei HiOutz
      </h1>

      <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
        In unter 60 Sekunden lernen wir dich kennen – damit die KI dir sofort die besten Date-Ideen vorschlagen kann.
      </p>

      <div className="flex items-center gap-2 mt-6 text-xs text-muted-foreground/60">
        <Sparkles className="w-3.5 h-3.5" />
        <span>7 kurze Schritte · Kein richtig oder falsch</span>
      </div>
    </div>
  );
}

export default Onboarding;
