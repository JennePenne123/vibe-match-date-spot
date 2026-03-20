import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Heart, Clock, Sparkles, Loader2, Check, DollarSign, MapPin, Coffee, Settings, CalendarIcon, CheckCircle, AlertCircle, X, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import SafeComponent from '@/components/SafeComponent';
import CollaborativeWaitingState from '@/components/date-planning/CollaborativeWaitingState';

interface Preference {
  id: string;
  name: string;
  emoji: string;
  desc?: string;
}

interface UserPreferences {
  preferred_cuisines: string[];
  preferred_vibes: string[];
  preferred_price_range: string[];
  preferred_times: string[];
  max_distance: number;
  dietary_restrictions: string[];
}

interface CompatibilityScore {
  overall_score: number;
  cuisine_score: number;
  vibe_score: number;
  price_score: number;
  timing_score: number;
  compatibility_factors: string[];
}

export interface PreferencesStepProps {
  sessionId: string;
  partnerId: string;
  partnerName: string;
  compatibilityScore: CompatibilityScore | number | null;
  aiAnalyzing: boolean;
  onPreferencesComplete: (preferences: DatePreferences) => void;
  initialProposedDate?: string;
  planningMode?: 'solo' | 'collaborative';
  collaborativeSession?: {
    hasUserSetPreferences: boolean;
    hasPartnerSetPreferences: boolean;
    canShowResults: boolean;
  };
  onManualContinue?: () => void;
  onDisplayVenues?: () => void;
  venueRecommendations?: any[];
}

interface DatePreferences {
  preferred_cuisines: string[];
  preferred_vibes: string[];
  preferred_price_range: string[];
  preferred_times: string[];
  max_distance: number;
  dietary_restrictions: string[];
  preferred_date?: Date;
  preferred_time?: string;
}

const PreferencesStep: React.FC<PreferencesStepProps> = (props) => {
  const {
    sessionId,
    partnerId,
    partnerName,
    compatibilityScore,
    aiAnalyzing,
    onPreferencesComplete,
    initialProposedDate,
    planningMode = 'solo',
    collaborativeSession,
    onManualContinue,
    onDisplayVenues,
    venueRecommendations = []
  } = props;

  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // 0 = confirm onboarding prefs, 1 = all-in-one preferences
  const [hasCompletedAllSteps, setHasCompletedAllSteps] = useState(false);
  const [onboardingPrefs, setOnboardingPrefs] = useState<UserPreferences | null>(null);
  const [onboardingLoaded, setOnboardingLoaded] = useState(false);
  
  // Duration model state
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);
  
  // Timeout fallback state
  const [aiAnalysisStartTime, setAiAnalysisStartTime] = useState<number | null>(null);
  const [timeoutTriggered, setTimeoutTriggered] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const NAVIGATION_TIMEOUT_MS = 10000;

  // State for all preferences
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string[]>([]);
  const [selectedTimePreferences, setSelectedTimePreferences] = useState<string[]>([]);
  const [maxDistance, setMaxDistance] = useState<number>(15);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [partnerPreferences, setPartnerPreferences] = useState<UserPreferences | null>(null);
  const [autoNavigating, setAutoNavigating] = useState(false);
  const [hasAutoNavigated, setHasAutoNavigated] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [learnedTemplate, setLearnedTemplate] = useState<{ id: string; title: string; emoji: string; description: string; cuisines: string[]; vibes: string[]; priceRange: string[]; timePreferences: string[] } | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Track user modifications
  const [userModifiedDate, setUserModifiedDate] = useState(false);
  const [userModifiedTime, setUserModifiedTime] = useState(false);
  const [userModifiedTimePrefs, setUserModifiedTimePrefs] = useState(false);
  const [prefilledFromProposal, setPrefilledFromProposal] = useState(false);

  // Helper function to map time string to time preference ID
  const getTimePreferenceFromTime = (timeString: string): string | null => {
    if (!timeString) return null;
    const [hours] = timeString.split(':').map(Number);
    if (hours >= 9 && hours < 12) return 'morning';
    if (hours >= 12 && hours < 15) return 'lunch';
    if (hours >= 15 && hours < 18) return 'afternoon';
    if (hours >= 18 && hours < 21) return 'evening';
    if (hours >= 21 || hours < 9) return 'night';
    return null;
  };

  // Prefill date/time from proposal
  useEffect(() => {
    if (initialProposedDate && !prefilledFromProposal) {
      const dt = new Date(initialProposedDate);
      if (!isNaN(dt.getTime())) {
        if (!userModifiedDate) setSelectedDate(dt);
        if (!userModifiedTime) {
          try {
            const hhmm = format(dt, 'HH:mm');
            setSelectedTime(hhmm);
            if (!userModifiedTimePrefs) {
              const timePref = getTimePreferenceFromTime(hhmm);
              if (timePref && !selectedTimePreferences.includes(timePref)) {
                setSelectedTimePreferences(prev => [...prev, timePref]);
              }
            }
          } catch (err) {
            console.error('Failed to format time:', err);
          }
        }
        setPrefilledFromProposal(true);
      }
    }
  }, [initialProposedDate, prefilledFromProposal, userModifiedDate, userModifiedTime, userModifiedTimePrefs, selectedTimePreferences]);

  // Track AI analysis timing
  useEffect(() => {
    if (aiAnalyzing && !aiAnalysisStartTime) {
      setAiAnalysisStartTime(Date.now());
    } else if (!aiAnalyzing && aiAnalysisStartTime) {
      setAiAnalysisStartTime(null);
    }
  }, [aiAnalyzing, aiAnalysisStartTime]);

  // Auto-navigation for collaborative mode
  useEffect(() => {
    if (planningMode === 'collaborative' && collaborativeSession && onDisplayVenues && !hasAutoNavigated && !autoNavigating) {
      const userReady = collaborativeSession.hasUserSetPreferences;
      const partnerReady = collaborativeSession.hasPartnerSetPreferences;
      
      const shouldAutoNavigate = userReady && partnerReady && hasCompletedAllSteps && !aiAnalyzing && venueRecommendations.length > 0;
      
      if (shouldAutoNavigate) {
        setAutoNavigating(true);
        setHasAutoNavigated(true);
        if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
        const timer = setTimeout(() => onDisplayVenues(), 2000);
        return () => clearTimeout(timer);
      }
      
      if (userReady && partnerReady && hasCompletedAllSteps && !timeoutRef.current) {
        timeoutRef.current = setTimeout(() => {
          if (!hasAutoNavigated) {
            setTimeoutTriggered(true);
            setAutoNavigating(true);
            setHasAutoNavigated(true);
            onDisplayVenues();
          }
        }, NAVIGATION_TIMEOUT_MS);
      }
      
      return () => {
        if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
        setTimeoutTriggered(false);
      };
    }
  }, [planningMode, collaborativeSession, hasCompletedAllSteps, aiAnalyzing, venueRecommendations.length, onDisplayVenues, hasAutoNavigated, autoNavigating, aiAnalysisStartTime, NAVIGATION_TIMEOUT_MS]);

  // ── Data definitions ──────────────────────────────────────────────

  const cuisines: Preference[] = [
    { id: 'Italian', name: 'Italian', emoji: '🍝' },
    { id: 'Japanese', name: 'Japanese', emoji: '🍣' },
    { id: 'Mexican', name: 'Mexican', emoji: '🌮' },
    { id: 'French', name: 'French', emoji: '🥐' },
    { id: 'Indian', name: 'Indian', emoji: '🍛' },
    { id: 'Mediterranean', name: 'Mediterranean', emoji: '🫒' },
    { id: 'American', name: 'American', emoji: '🍔' },
    { id: 'Thai', name: 'Thai', emoji: '🍜' },
    { id: 'Chinese', name: 'Chinese', emoji: '🥢' },
    { id: 'Korean', name: 'Korean', emoji: '🍲' }
  ];

  const durationModels = [
    { id: 'quick', title: 'Quick & Sweet', emoji: '⚡', desc: '1–2 Stunden – Kaffee, Lunch, Snack', excludeVibes: ['lively'], suggestTimes: ['morning', 'lunch', 'afternoon'], suggestPrice: ['$', '$$'] },
    { id: 'relaxed', title: 'Relaxed Afternoon', emoji: '☀️', desc: '2–4 Stunden – Brunch, Café, Spaziergang', excludeVibes: [] as string[], suggestTimes: ['lunch', 'afternoon'], suggestPrice: ['$$', '$$$'] },
    { id: 'evening', title: 'Full Evening', emoji: '🌆', desc: '4+ Stunden – Dinner, Drinks, Bar', excludeVibes: [] as string[], suggestTimes: ['evening', 'night'], suggestPrice: ['$$', '$$$', '$$$$'] },
    { id: 'adventure', title: 'All-Day Adventure', emoji: '🗺️', desc: 'Ganzer Tag – Mehrere Stops, Entdecken', excludeVibes: [] as string[], suggestTimes: ['morning', 'lunch', 'afternoon', 'evening'], suggestPrice: ['$', '$$', '$$$'] }
  ];

  const selectedDurationModel = durationModels.find(d => d.id === selectedDuration);

  const allVibes: Preference[] = [
    { id: 'romantic', name: 'Romantic', emoji: '💕' },
    { id: 'casual', name: 'Casual', emoji: '😊' },
    { id: 'outdoor', name: 'Outdoor', emoji: '🌳' },
    { id: 'upscale', name: 'Upscale', emoji: '✨' },
    { id: 'lively', name: 'Lively', emoji: '🎉' },
    { id: 'cozy', name: 'Cozy', emoji: '🕯️' }
  ];

  const vibes = selectedDurationModel
    ? allVibes.filter(v => !selectedDurationModel.excludeVibes.includes(v.id))
    : allVibes;

  const priceRanges: Preference[] = [
    { id: '$', name: 'Budget', emoji: '💰' },
    { id: '$$', name: 'Moderate', emoji: '💳' },
    { id: '$$$', name: 'Upscale', emoji: '💎' },
    { id: '$$$$', name: 'Luxury', emoji: '👑' }
  ];

  const timePreferences: Preference[] = [
    { id: 'morning', name: 'Morning', emoji: '🌅' },
    { id: 'lunch', name: 'Lunch', emoji: '☀️' },
    { id: 'afternoon', name: 'Afternoon', emoji: '🌤️' },
    { id: 'evening', name: 'Evening', emoji: '🌆' },
    { id: 'night', name: 'Night', emoji: '🌙' }
  ];

  const dietaryRequirements: Preference[] = [
    { id: 'vegetarian', name: 'Vegetarian', emoji: '🥬' },
    { id: 'vegan', name: 'Vegan', emoji: '🌱' },
    { id: 'gluten-free', name: 'Gluten-Free', emoji: '🚫' },
    { id: 'dairy-free', name: 'Dairy-Free', emoji: '🥛' },
    { id: 'halal', name: 'Halal', emoji: '☪️' },
    { id: 'kosher', name: 'Kosher', emoji: '✡️' }
  ];

  const allQuickStartTemplates = [
    { id: 'romantic-dinner', title: 'Romantic Dinner', emoji: '💕', description: 'Candlelight & fine dining', cuisines: ['Italian', 'French'], vibes: ['romantic', 'upscale'], priceRange: ['$$$', '$$$$'], timePreferences: ['evening'], fitsDuration: ['evening', 'adventure'] },
    { id: 'casual-brunch', title: 'Casual Brunch', emoji: '☕', description: 'Relaxed & social', cuisines: ['American', 'Mediterranean'], vibes: ['casual', 'cozy'], priceRange: ['$', '$$'], timePreferences: ['morning', 'lunch'], fitsDuration: ['quick', 'relaxed', 'adventure'] },
    { id: 'trendy-cocktail', title: 'Cocktail Bar', emoji: '🍸', description: 'Stylish drinks & vibes', cuisines: ['American'], vibes: ['lively', 'upscale'], priceRange: ['$$', '$$$'], timePreferences: ['evening', 'night'], fitsDuration: ['evening'] },
    { id: 'coffee-walk', title: 'Coffee & Walk', emoji: '☕🚶', description: 'Quick & spontaneous', cuisines: ['American', 'Italian'], vibes: ['casual', 'outdoor'], priceRange: ['$'], timePreferences: ['morning', 'afternoon'], fitsDuration: ['quick'] }
  ];

  const quickStartTemplates = selectedDuration
    ? allQuickStartTemplates.filter(t => t.fitsDuration.includes(selectedDuration))
    : allQuickStartTemplates;

  // ── Data loading ──────────────────────────────────────────────────

  useEffect(() => { loadPartnerPreferences(); }, [user?.id, partnerId]);

  // Load onboarding preferences to show confirmation screen
  useEffect(() => {
    const loadOnboardingPreferences = async () => {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase.from('user_preferences').select('*').eq('user_id', user.id).single();
        if (error || !data) {
          setOnboardingLoaded(true);
          setCurrentStep(1); // No prefs → skip to customize
          return;
        }
        const has = (arr: any) => arr && arr.length > 0;
        if (has(data.preferred_cuisines) || has(data.preferred_vibes) || has(data.preferred_price_range) || has(data.preferred_times)) {
          setOnboardingPrefs({
            preferred_cuisines: data.preferred_cuisines || [],
            preferred_vibes: data.preferred_vibes || [],
            preferred_price_range: data.preferred_price_range || [],
            preferred_times: data.preferred_times || [],
            max_distance: data.max_distance || 15,
            dietary_restrictions: data.dietary_restrictions || []
          });
          setLearnedTemplate({
            id: 'ai-learned', title: 'Für dich', emoji: '🤖',
            description: 'Basierend auf deinen bisherigen Vorlieben',
            cuisines: data.preferred_cuisines || [], vibes: data.preferred_vibes || [],
            priceRange: data.preferred_price_range || [], timePreferences: data.preferred_times || []
          });
          // Stay on step 0 (confirmation)
        } else {
          setCurrentStep(1); // No meaningful prefs → skip to customize
        }
        setOnboardingLoaded(true);
      } catch (err) {
        console.error('Error loading onboarding preferences:', err);
        setOnboardingLoaded(true);
        setCurrentStep(1);
      }
    };
    loadOnboardingPreferences();
  }, [user?.id]);

  const loadPartnerPreferences = async () => {
    try {
      const { data, error } = await supabase.from('user_preferences').select('*').eq('user_id', partnerId).single();
      if (error && error.code !== 'PGRST116') return;
      if (data) {
        setPartnerPreferences({
          preferred_cuisines: data.preferred_cuisines || [], preferred_vibes: data.preferred_vibes || [],
          preferred_price_range: data.preferred_price_range || [], preferred_times: data.preferred_times || [],
          max_distance: data.max_distance || 15, dietary_restrictions: data.dietary_restrictions || []
        });
      }
    } catch (error) { console.error('Error loading partner preferences:', error); }
  };

  // ── Interaction handlers ──────────────────────────────────────────

  const toggleSelection = (
    item: string, selectedItems: string[],
    setSelectedItems: React.Dispatch<React.SetStateAction<string[]>>,
    category?: keyof UserPreferences
  ) => {
    setSelectedItems(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
    setSelectedTemplateId(null);
    if (category === 'preferred_times') setUserModifiedTimePrefs(true);
  };

  const haveSameSelections = (a: string[], b: string[]) => {
    if (a.length !== b.length) return false;
    const sa = [...a].sort(), sb = [...b].sort();
    return sa.every((v, i) => v === sb[i]);
  };

  const isTemplateCurrentlySelected = (t: { id: string; cuisines: string[]; vibes: string[]; priceRange: string[]; timePreferences: string[] }) => {
    return selectedTemplateId === t.id || (
      haveSameSelections(selectedCuisines, t.cuisines) &&
      haveSameSelections(selectedVibes, t.vibes) &&
      haveSameSelections(selectedPriceRange, t.priceRange) &&
      haveSameSelections(selectedTimePreferences, t.timePreferences)
    );
  };

  const applyQuickStartTemplate = (t: { id: string; title: string; cuisines: string[]; vibes: string[]; priceRange: string[]; timePreferences: string[] }) => {
    if (isTemplateCurrentlySelected(t)) {
      setSelectedTemplateId(null); setSelectedCuisines([]); setSelectedVibes([]); setSelectedPriceRange([]); setSelectedTimePreferences([]);
      toast({ title: 'Template deselected', description: 'All preferences cleared.' });
    } else {
      setSelectedTemplateId(t.id); setSelectedCuisines(t.cuisines); setSelectedVibes(t.vibes); setSelectedPriceRange(t.priceRange); setSelectedTimePreferences(t.timePreferences);
      toast({ title: `${t.title} applied!`, description: 'You can still customize your preferences.' });
    }
  };

  const handleDurationSelect = (durationId: string) => {
    const isDeselecting = selectedDuration === durationId;
    setSelectedDuration(isDeselecting ? null : durationId);
    if (!isDeselecting) {
      const model = durationModels.find(d => d.id === durationId);
      if (model) {
        if (!userModifiedTimePrefs) setSelectedTimePreferences(model.suggestTimes);
        if (selectedPriceRange.length === 0) setSelectedPriceRange(model.suggestPrice);
        if (model.excludeVibes.length > 0) setSelectedVibes(prev => prev.filter(v => !model.excludeVibes.includes(v)));
        if (selectedTemplateId) {
          const ct = allQuickStartTemplates.find(t => t.id === selectedTemplateId);
          if (ct && !ct.fitsDuration.includes(durationId)) setSelectedTemplateId(null);
        }
      }
    }
  };

  // ── Submit ────────────────────────────────────────────────────────

  const submitPreferences = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) throw authError || new Error('Not authenticated');

      const currentUserId = authData.user.id;
      const preferencePayload = {
        user_id: currentUserId,
        preferred_cuisines: selectedCuisines, preferred_vibes: selectedVibes,
        preferred_price_range: selectedPriceRange, preferred_times: selectedTimePreferences,
        max_distance: maxDistance, dietary_restrictions: selectedDietary,
        updated_at: new Date().toISOString()
      };

      const { data: existing } = await supabase.from('user_preferences').select('id').eq('user_id', currentUserId).maybeSingle();
      const mutation = existing
        ? await supabase.from('user_preferences').update(preferencePayload).eq('user_id', currentUserId)
        : await supabase.from('user_preferences').insert(preferencePayload);
      if (mutation.error) throw mutation.error;

      if (planningMode === 'collaborative' && sessionId) {
        const { data: sessionData } = await supabase.from('date_planning_sessions').select('initiator_id').eq('id', sessionId).single();
        if (sessionData) {
          const isInitiator = sessionData.initiator_id === user.id;
          const updateField = isInitiator ? 'initiator_preferences_complete' : 'partner_preferences_complete';
          const prefsField = isInitiator ? 'initiator_preferences' : 'partner_preferences';
          await supabase.from('date_planning_sessions').update({
            [updateField]: true,
            [prefsField]: { preferred_cuisines: selectedCuisines, preferred_vibes: selectedVibes, preferred_price_range: selectedPriceRange, preferred_times: selectedTimePreferences, max_distance: maxDistance, dietary_restrictions: selectedDietary },
            updated_at: new Date().toISOString()
          }).eq('id', sessionId);
        }
      }

      if (planningMode === 'collaborative' && collaborativeSession && !collaborativeSession.hasPartnerSetPreferences) {
        toast({ title: 'Gespeichert!', description: `Warte auf ${partnerName}...` });
      } else {
        toast({ title: 'Gespeichert!', description: 'KI-Analyse startet...' });
      }

      onPreferencesComplete({
        preferred_cuisines: selectedCuisines, preferred_vibes: selectedVibes,
        preferred_price_range: selectedPriceRange, preferred_times: selectedTimePreferences,
        max_distance: maxDistance, dietary_restrictions: selectedDietary,
        preferred_date: selectedDate, preferred_time: selectedTime
      });
      setHasCompletedAllSteps(true);
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({ title: 'Fehler', description: 'Präferenzen konnten nicht gespeichert werden.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // ── Navigation ────────────────────────────────────────────────────

  const handleKeepPreferences = () => {
    if (!onboardingPrefs) return;
    setSelectedCuisines(onboardingPrefs.preferred_cuisines);
    setSelectedVibes(onboardingPrefs.preferred_vibes);
    setSelectedPriceRange(onboardingPrefs.preferred_price_range);
    setSelectedTimePreferences(onboardingPrefs.preferred_times);
    setMaxDistance(onboardingPrefs.max_distance);
    setSelectedDietary(onboardingPrefs.dietary_restrictions);
    const times = onboardingPrefs.preferred_times;
    if (times.includes('evening') || times.includes('night')) setSelectedDuration('evening');
    else if (times.includes('morning') || times.includes('lunch')) setSelectedDuration('relaxed');
    else setSelectedDuration('relaxed');
    setCurrentStep(1);
    toast({ title: 'Vorlieben übernommen!', description: 'Passe sie an oder starte direkt.' });
  };

  const handleCustomize = () => {
    if (onboardingPrefs) {
      setSelectedCuisines(onboardingPrefs.preferred_cuisines);
      setSelectedVibes(onboardingPrefs.preferred_vibes);
      setSelectedPriceRange(onboardingPrefs.preferred_price_range);
      setSelectedTimePreferences(onboardingPrefs.preferred_times);
      setMaxDistance(onboardingPrefs.max_distance);
      setSelectedDietary(onboardingPrefs.dietary_restrictions);
    }
    setCurrentStep(1);
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 0: return 'Deine Vorlieben';
      case 1: return 'Dein Date planen';
      default: return 'Preferences';
    }
  };

  const getStepIcon = () => {
    switch (currentStep) {
      case 0: return <Sparkles className="w-5 h-5" />;
      case 1: return <Heart className="w-5 h-5" />;
      default: return <Heart className="w-5 h-5" />;
    }
  };

  // ── Chip renderer ─────────────────────────────────────────────────

  const renderChipGrid = (
    items: Preference[], selectedItems: string[],
    setSelectedItems: React.Dispatch<React.SetStateAction<string[]>>,
    category: keyof UserPreferences
  ) => (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const isSelected = selectedItems.includes(item.id);
        return (
          <button
            type="button"
            key={item.id}
            onClick={() => toggleSelection(item.id, selectedItems, setSelectedItems, category)}
            style={{ WebkitTapHighlightColor: 'transparent' }}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-2 rounded-full border text-sm transition-none select-none",
              isSelected ? "border-primary bg-primary/10 text-foreground" : "border-border bg-card text-muted-foreground"
            )}
          >
            <span>{item.emoji}</span>
            <span className="font-medium">{item.name}</span>
            {isSelected && <Check className="w-3 h-3 ml-0.5" />}
          </button>
        );
      })}
    </div>
  );

  // ── Step renderers ────────────────────────────────────────────────

  const renderConfirmationStep = () => {
    if (!onboardingPrefs) return null;
    const allVibesMap: Record<string, string> = { romantic: '💕 Romantic', casual: '😊 Casual', outdoor: '🌳 Outdoor', upscale: '✨ Upscale', lively: '🎉 Lively', cozy: '🕯️ Cozy', nightlife: '🌙 Nightlife', cultural: '🎭 Cultural', adventurous: '🗺️ Adventurous' };
    const cuisineEmojis: Record<string, string> = { Italian: '🍝', Japanese: '🍣', Mexican: '🌮', French: '🥐', Indian: '🍛', Mediterranean: '🫒', American: '🍔', Thai: '🍜', Chinese: '🥢', Korean: '🍲' };

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-1">Deine Vorlieben stehen schon!</h2>
          <p className="text-sm text-muted-foreground">Basierend auf deinem Onboarding – möchtest du sie übernehmen oder heute anders?</p>
        </div>

        {/* Preference summary */}
        <div className="bg-muted/50 rounded-xl p-4 space-y-3 border border-border">
          {onboardingPrefs.preferred_cuisines.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Küche</p>
              <div className="flex flex-wrap gap-1.5">
                {onboardingPrefs.preferred_cuisines.map(c => (
                  <Badge key={c} variant="secondary" className="text-xs">{cuisineEmojis[c] || '🍽️'} {c}</Badge>
                ))}
              </div>
            </div>
          )}
          {onboardingPrefs.preferred_vibes.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Vibe</p>
              <div className="flex flex-wrap gap-1.5">
                {onboardingPrefs.preferred_vibes.map(v => (
                  <Badge key={v} variant="secondary" className="text-xs">{allVibesMap[v] || v}</Badge>
                ))}
              </div>
            </div>
          )}
          {onboardingPrefs.preferred_price_range.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Budget</p>
              <div className="flex flex-wrap gap-1.5">
                {onboardingPrefs.preferred_price_range.map(p => (
                  <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-1 gap-3">
          <Button onClick={handleKeepPreferences} className="w-full h-12 text-base font-semibold transition-transform active:scale-[0.97]">
            <Check className="w-5 h-5 mr-2" />
            So übernehmen
          </Button>
          <Button onClick={handleCustomize} variant="outline" className="w-full h-12 text-base transition-transform active:scale-[0.97]">
            <Settings className="w-4 h-4 mr-2" />
            Heute anders
          </Button>
        </div>
      </div>
    );
  };


  const renderAllInOnePage = () => (
    <div className="space-y-6">
      {/* Duration Models */}
      <div>
        <h2 className="text-base md:text-lg font-bold mb-1">Wie viel Zeit hast du?</h2>
        <p className="text-muted-foreground text-sm mb-3">Das hilft der KI, passende Vorschläge zu filtern</p>
        <div className="grid grid-cols-2 gap-2">
          {durationModels.map((model) => {
            const isSelected = selectedDuration === model.id;
            return (
              <button
                type="button" key={model.id}
                onClick={() => handleDurationSelect(model.id)}
                style={{ WebkitTapHighlightColor: 'transparent' }}
                className={cn(
                  "p-3 rounded-xl border-2 text-left transition-none select-none relative",
                  isSelected ? "border-primary bg-primary/5" : "border-border bg-card"
                )}
              >
                <div className="flex items-start gap-2.5">
                  <div className="text-xl flex-shrink-0 mt-0.5">{model.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">{model.title}</h3>
                    <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{model.desc}</p>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Start Templates */}
      {selectedDuration && (
        <>
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Quick Start</h3>
            <div className="flex flex-wrap gap-2">
              {learnedTemplate && (
                <button type="button" onClick={() => applyQuickStartTemplate(learnedTemplate)}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  className={cn(
                    "inline-flex items-center gap-2 px-3 py-2 rounded-full border text-sm transition-none select-none",
                    isTemplateCurrentlySelected(learnedTemplate) ? "border-primary bg-primary/10" : "border-border bg-card"
                  )}
                >
                  <span>{learnedTemplate.emoji}</span>
                  <span className="font-medium">{learnedTemplate.title}</span>
                  <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">KI</Badge>
                  {isTemplateCurrentlySelected(learnedTemplate) && <Check className="w-3 h-3" />}
                </button>
              )}
              {quickStartTemplates.map((t) => (
                <button type="button" key={t.id} onClick={() => applyQuickStartTemplate(t)}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  className={cn(
                    "inline-flex items-center gap-2 px-3 py-2 rounded-full border text-sm transition-none select-none",
                    isTemplateCurrentlySelected(t) ? "border-primary bg-primary/10" : "border-border bg-card"
                  )}
                >
                  <span>{t.emoji}</span>
                  <span className="font-medium">{t.title}</span>
                  {isTemplateCurrentlySelected(t) && <Check className="w-3 h-3" />}
                </button>
              ))}
            </div>
          </div>

          {/* Cuisine */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Küche</h3>
            {renderChipGrid(cuisines, selectedCuisines, setSelectedCuisines, 'preferred_cuisines')}
          </div>

          {/* Vibes */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Vibe</h3>
            {selectedDurationModel?.excludeVibes.length ? (
              <p className="text-xs text-muted-foreground mb-2 italic">Einige Vibes basierend auf Zeitmodell ausgeblendet</p>
            ) : null}
            {renderChipGrid(vibes, selectedVibes, setSelectedVibes, 'preferred_vibes')}
          </div>

          {/* Budget */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Budget</h3>
            {selectedDurationModel && selectedPriceRange.length > 0 && (
              <p className="text-xs text-muted-foreground mb-2 italic">Vorauswahl basierend auf „{selectedDurationModel.title}"</p>
            )}
            {renderChipGrid(priceRanges, selectedPriceRange, setSelectedPriceRange, 'preferred_price_range')}
          </div>
        </>
      )}

      {/* Date & Time */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Wann geht's los?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium mb-2 block">Datum</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-10", !selectedDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span className="truncate">{selectedDate ? format(selectedDate, "PPP") : "Datum wählen"}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={selectedDate} onSelect={(d) => { setSelectedDate(d); setUserModifiedDate(true); }}
                  disabled={(d) => d < new Date()} initialFocus className="pointer-events-auto"
                  defaultMonth={selectedDate || (initialProposedDate ? new Date(initialProposedDate) : undefined)} />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Uhrzeit</label>
            <Select value={selectedTime} onValueChange={(t) => { setSelectedTime(t); setUserModifiedTime(true); }}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Uhrzeit wählen" /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }, (_, i) => {
                  const h = i.toString().padStart(2, '0');
                  return <SelectItem key={`${h}:00`} value={`${h}:00`}>{h}:00</SelectItem>;
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
        {prefilledFromProposal && (selectedDate || selectedTime) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-md p-2">
            <Sparkles className="w-3 h-3" /><span>Vorausgefüllt aus deinem Proposal</span>
          </div>
        )}
      </div>

      {/* Time Preference Chips */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Tageszeit</h3>
        {renderChipGrid(timePreferences, selectedTimePreferences, setSelectedTimePreferences, 'preferred_times')}
      </div>

      {/* Advanced Options */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleTrigger asChild>
          <button type="button" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full">
            <Settings className="w-4 h-4" /><span>Erweiterte Optionen</span>
            <ChevronDown className={cn("w-4 h-4 ml-auto transition-transform", showAdvanced && "rotate-180")} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-5 pt-4">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Entfernung</h3>
            <Slider value={[maxDistance]} onValueChange={(v) => setMaxDistance(v[0])} max={50} min={1} step={1} className="w-full" />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>1 km</span><span className="font-medium text-foreground">{maxDistance} km</span><span>50 km</span>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Diät / Unverträglichkeiten</h3>
            {renderChipGrid(dietaryRequirements, selectedDietary, setSelectedDietary, 'dietary_restrictions')}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Selection summary */}
      {(selectedCuisines.length > 0 || selectedVibes.length > 0) && (
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Deine Auswahl</p>
          <div className="flex flex-wrap gap-1.5">
            {selectedDuration && (
              <Badge variant="outline" className="text-xs">
                {durationModels.find(d => d.id === selectedDuration)?.emoji} {durationModels.find(d => d.id === selectedDuration)?.title}
              </Badge>
            )}
            {selectedCuisines.map(c => <Badge key={c} variant="outline" className="text-xs">{cuisines.find(x => x.id === c)?.emoji} {c}</Badge>)}
            {selectedVibes.map(v => <Badge key={v} variant="outline" className="text-xs">{allVibes.find(x => x.id === v)?.emoji} {v}</Badge>)}
            {selectedPriceRange.map(p => <Badge key={p} variant="outline" className="text-xs">{p}</Badge>)}
          </div>
        </div>
      )}
    </div>
  );

  // ── Status helpers ────────────────────────────────────────────────

  const getCompletionStatus = () => {
    if (planningMode === 'collaborative' && collaborativeSession) {
      const u = collaborativeSession.hasUserSetPreferences;
      const p = collaborativeSession.hasPartnerSetPreferences;
      return { userCompleted: u, partnerCompleted: p, bothCompleted: u && p, analysisComplete: u && p && !aiAnalyzing && venueRecommendations.length > 0 };
    }
    return { userCompleted: false, partnerCompleted: false, bothCompleted: false, analysisComplete: false };
  };

  const status = getCompletionStatus();

  // ── Render ────────────────────────────────────────────────────────

  return (
    <SafeComponent>
      <Card>
        {currentStep > 0 && (
          <CardHeader className="px-4 md:px-6 pt-4 md:pt-6 pb-3 md:pb-4">
            <div className="space-y-3 md:space-y-0 md:flex md:items-center md:justify-between">
              <CardTitle className="flex flex-wrap items-center gap-2 text-lg md:text-xl">
                {getStepIcon()}
                <span className="font-bold">{getStepTitle()}</span>
                {planningMode === 'collaborative' && status.userCompleted && (
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" /> Saved
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">Step {currentStep} / {totalSteps}</Badge>
                {planningMode === 'collaborative' && (
                  <div className="flex items-center gap-1">
                    <div className={cn("w-2 h-2 rounded-full", status.userCompleted ? "bg-primary" : "bg-muted-foreground/30")} />
                    <div className={cn("w-2 h-2 rounded-full", status.partnerCompleted ? "bg-primary" : "bg-muted-foreground/30")} />
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
        )}
        <CardContent className="px-4 md:px-6 pb-4 md:pb-6 space-y-4 md:space-y-6">
          {currentStep === 0 && renderConfirmationStep()}
          {currentStep === 1 && renderCombinedStep()}
          {currentStep === 2 && renderConfirmStep()}

          {currentStep > 0 && (
            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 pt-4 md:pt-6">
              <Button onClick={prevStep} variant="outline" disabled={currentStep === 1 && !onboardingPrefs} className="w-full sm:w-auto">
                Zurück
              </Button>
              
              {currentStep < totalSteps ? (
                <Button onClick={nextStep} disabled={currentStep === 1 && !selectedDuration} className="w-full sm:w-auto">
                  Weiter
                </Button>
              ) : (
                <Button onClick={submitPreferences} disabled={loading} className="w-full sm:w-auto">
                  {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Speichern...</>) : '🚀 Los geht\'s'}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Collaborative: Waiting for partner */}
      {planningMode === 'collaborative' && (status.userCompleted || status.partnerCompleted) && (
        <div className="my-6 border-t border-border" />
      )}

      {planningMode === 'collaborative' && collaborativeSession && (() => {
        const userReady = collaborativeSession.hasUserSetPreferences;
        const partnerReady = collaborativeSession.hasPartnerSetPreferences;
        if (userReady && hasCompletedAllSteps && !partnerReady) {
          return (
            <div className="space-y-4">
              <CollaborativeWaitingState partnerName={partnerName} sessionId={sessionId}
                hasPartnerSetPreferences={partnerReady} isWaitingForPartner={true}
                hasCurrentUserSetPreferences={userReady} currentUserName={user?.name || 'You'} />
              <Card className="border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle className="h-6 w-6 text-primary" />
                    <h3 className="text-lg font-semibold">Deine Präferenzen gespeichert!</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">Warte auf {partnerName}...</p>
                  <div className="bg-muted/50 rounded-lg p-3 border border-border">
                    <p className="text-sm text-muted-foreground">
                      <strong>Nächster Schritt:</strong> Unsere KI analysiert eure Kompatibilität sobald beide bereit sind.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        }
        return null;
      })()}

      {/* AI Analysis Overlay */}
      {planningMode === 'collaborative' && collaborativeSession?.hasUserSetPreferences && collaborativeSession?.hasPartnerSetPreferences && hasCompletedAllSteps && aiAnalyzing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 relative">
            <Button variant="ghost" size="icon"
              className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-background shadow-md hover:bg-destructive hover:text-destructive-foreground z-10"
              onClick={() => {
                if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
                setAiAnalysisStartTime(null);
                toast({ title: 'Abgebrochen', description: 'Du kannst deine Präferenzen erneut anpassen.' });
              }}
            >
              <X className="h-4 w-4" />
            </Button>
            <Card className="border-primary/20 bg-card shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Loader2 className="h-6 w-6 text-primary animate-spin" />
                  <h3 className="text-lg font-semibold">{timeoutTriggered ? "Dauert etwas länger..." : "KI-Analyse läuft"}</h3>
                </div>
                <p className="text-muted-foreground">{timeoutTriggered ? "Wir zeigen dir die besten verfügbaren Ergebnisse." : "Kompatibilität wird analysiert und Venues gesucht..."}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Redirecting Overlay */}
      {planningMode === 'collaborative' && collaborativeSession?.hasUserSetPreferences && collaborativeSession?.hasPartnerSetPreferences && hasCompletedAllSteps && !aiAnalyzing && (() => {
        const hasVenues = venueRecommendations.length > 0;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="w-full max-w-md mx-4 relative">
              <Button variant="ghost" size="icon"
                className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-background shadow-md hover:bg-destructive hover:text-destructive-foreground z-10"
                onClick={() => {
                  if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
                  setAutoNavigating(false); setHasAutoNavigated(false); setAiAnalysisStartTime(null);
                  toast({ title: 'Auto-Redirect gestoppt', description: 'Nutze den Button um deine Matches manuell zu sehen.' });
                }}
              >
                <X className="h-4 w-4" />
              </Button>
              <Card className={cn("bg-card shadow-lg", hasVenues ? "border-primary/20" : "border-muted-foreground/20")}>
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    {autoNavigating ? <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      : hasVenues ? <CheckCircle className="h-6 w-6 text-primary" />
                      : <Clock className="h-6 w-6 text-muted-foreground" />}
                    <h3 className="text-lg font-semibold">
                      {autoNavigating ? 'Weiterleitung...' : hasVenues ? 'KI-Analyse fertig!' : 'Fast bereit...'}
                    </h3>
                  </div>
                  {hasVenues ? (
                    <>
                      <p className="text-foreground mb-2">{venueRecommendations.length} perfekte Venues für euch gefunden!</p>
                      {compatibilityScore && (
                        <p className="text-sm text-muted-foreground mb-4">
                          Kompatibilität: {typeof compatibilityScore === 'object' ? compatibilityScore.overall_score : compatibilityScore}%
                        </p>
                      )}
                      {!autoNavigating && (
                        <Button onClick={() => { setHasAutoNavigated(true); onDisplayVenues?.(); }} className="mt-2">Matches ansehen</Button>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-muted-foreground mb-4">Wir suchen die besten Venues für euch...</p>
                      <Button onClick={() => {
                        if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
                        setHasAutoNavigated(true); onDisplayVenues?.();
                      }} variant="outline" className="gap-2">
                        <AlertCircle className="h-4 w-4" /> Trotzdem weiter
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        );
      })()}

      {/* Solo mode AI status */}
      {planningMode !== 'collaborative' && aiAnalyzing && (
        <Card className="border-primary/20 mt-6">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
              <h3 className="text-lg font-semibold">KI-Analyse läuft</h3>
            </div>
            <p className="text-muted-foreground">Analysiere Präferenzen und suche perfekte Venues...</p>
          </CardContent>
        </Card>
      )}
    </SafeComponent>
  );
};

export default PreferencesStep;
