import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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

import onboarding1 from '@/assets/onboarding-1.png';

const TOTAL_STEPS = 5;

const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0); // 0 = welcome, 1-5 = steps
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  const animateTransition = useCallback((nextStep: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
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

      // Map lifestyle budget to price range
      const priceRangeMap: Record<string, string[]> = {
        saver: ['budget'],
        balanced: ['budget', 'moderate'],
        spender: ['moderate', 'upscale', 'luxury'],
      };
      const derivedPriceRange = priceRangeMap[lifestyle.budget_style] || ['moderate'];

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
          preferred_cuisines: selectedCuisines.length > 0 ? selectedCuisines : null,
          preferred_vibes: mergedVibes.length > 0 ? mergedVibes : null,
          preferred_price_range: derivedPriceRange,
          preferred_times: derivedTimes,
          preferred_activities: mergedActivities.length > 0 ? mergedActivities : null,
          personality_traits: personality,
          relationship_goal: relationshipGoal || null,
          lifestyle_data: lifestyle,
        };

        // Upsert preference (select → update/insert pattern per memory)
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
            cuisines: selectedCuisines,
            vibes: mergedVibes,
            priceRange: derivedPriceRange,
            times: derivedTimes,
            dietary: [],
            activities: mergedActivities,
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

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-between p-4 select-none relative overflow-hidden">
      {/* Subtle background */}
      <div className="absolute top-20 -left-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 -right-20 w-72 h-72 bg-accent/5 rounded-full blur-3xl" />

      <div className="w-full max-w-md mx-auto relative z-10 flex flex-col flex-1">
        {/* Skip button */}
        {step > 0 && (
          <div className="flex justify-end mb-2">
            <Button onClick={handleSkip} variant="ghost" size="sm" className="text-muted-foreground text-xs">
              Überspringen
            </Button>
          </div>
        )}

        {/* Progress bar (only on actual steps) */}
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
            <FoodVibeQuickPick
              selectedCuisines={selectedCuisines}
              selectedVibes={selectedVibes}
              onCuisinesChange={setSelectedCuisines}
              onVibesChange={setSelectedVibes}
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
        Willkommen bei VybePulse
      </h1>

      <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
        In 2 Minuten lernen wir dich kennen – damit wir dir von Anfang an die besten Date-Ideen vorschlagen können.
      </p>

      <div className="flex items-center gap-2 mt-6 text-xs text-muted-foreground/60">
        <Sparkles className="w-3.5 h-3.5" />
        <span>5 kurze Schritte · Kein richtig oder falsch</span>
      </div>
    </div>
  );
}

export default Onboarding;
