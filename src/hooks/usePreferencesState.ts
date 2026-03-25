import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  durationModels, quickStartTemplates, allVibes,
  haveSame, type UserPreferences, type DatePreferences, type QuickStartTemplate,
  type DateOccasion,
} from '@/components/date-planning/preferences/preferencesData';
import type { DailyMood } from '@/pages/MoodCheckIn';
import { getTodayMoodFromStorage } from '@/components/date-planning/preferences/MoodPicker';

interface UsePreferencesStateProps {
  sessionId: string;
  partnerId: string;
  partnerName: string;
  aiAnalyzing: boolean;
  onPreferencesComplete: (preferences: DatePreferences) => void;
  initialProposedDate?: string;
  planningMode?: 'solo' | 'collaborative';
  collaborativeSession?: {
    hasUserSetPreferences: boolean;
    hasPartnerSetPreferences: boolean;
    canShowResults: boolean;
  };
  onDisplayVenues?: () => void;
  venueRecommendations?: any[];
}

export const usePreferencesState = (props: UsePreferencesStateProps) => {
  const {
    sessionId, partnerId, partnerName, aiAnalyzing,
    onPreferencesComplete, initialProposedDate, planningMode = 'solo',
    collaborativeSession, onDisplayVenues, venueRecommendations = [],
  } = props;

  const { user } = useAuth();

  // ── State ──────────────────────────────────────────────────────
  const [flowState, setFlowState] = useState<'confirm' | 'customize'>('confirm');
  const [loading, setLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [onboardingPrefs, setOnboardingPrefs] = useState<UserPreferences | null>(null);
  const [onboardingLoaded, setOnboardingLoaded] = useState(false);

  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string[]>([]);
  const [selectedTimePreferences, setSelectedTimePreferences] = useState<string[]>([]);
  const [maxDistance, setMaxDistance] = useState(15);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedOccasion, setSelectedOccasion] = useState<DateOccasion | null>(null);
  const [selectedMood, setSelectedMood] = useState<DailyMood | null>(() => getTodayMoodFromStorage());

  const [userModifiedDate, setUserModifiedDate] = useState(false);
  const [userModifiedTime, setUserModifiedTime] = useState(false);
  const [userModifiedTimePrefs, setUserModifiedTimePrefs] = useState(false);
  const [prefilledFromProposal, setPrefilledFromProposal] = useState(false);
  const [autoNavigating, setAutoNavigating] = useState(false);
  const [hasAutoNavigated, setHasAutoNavigated] = useState(false);
  const [timeoutTriggered, setTimeoutTriggered] = useState(false);

  const [openSections, setOpenSections] = useState<string[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ── Derived ──────────────────────────────────────────────────────
  const durationModel = durationModels.find(d => d.id === selectedDuration);
  const filteredVibes = durationModel ? allVibes.filter(v => !durationModel.excludeVibes.includes(v.id)) : allVibes;
  const filteredTemplates = selectedDuration ? quickStartTemplates.filter(t => t.fitsDuration.includes(selectedDuration)) : quickStartTemplates;

  const learnedTemplate = onboardingPrefs ? {
    id: 'ai-learned', title: 'Für dich', emoji: '🤖',
    cuisines: onboardingPrefs.preferred_cuisines,
    vibes: onboardingPrefs.preferred_vibes,
    priceRange: onboardingPrefs.preferred_price_range,
    timePreferences: onboardingPrefs.preferred_times,
  } : null;

  const status = (() => {
    if (planningMode === 'collaborative' && collaborativeSession) {
      const u = collaborativeSession.hasUserSetPreferences;
      const p = collaborativeSession.hasPartnerSetPreferences;
      return { userCompleted: u, partnerCompleted: p, bothCompleted: u && p, analysisComplete: u && p && !aiAnalyzing && venueRecommendations.length > 0 };
    }
    return { userCompleted: false, partnerCompleted: false, bothCompleted: false, analysisComplete: false };
  })();

  // ── Effects ──────────────────────────────────────────────────────

  // Load onboarding preferences
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const { data, error } = await supabase.from('user_preferences').select('*').eq('user_id', user.id).single();
        if (error || !data) { setOnboardingLoaded(true); setFlowState('customize'); return; }
        const has = (arr: any) => arr && arr.length > 0;
        if (has(data.preferred_cuisines) || has(data.preferred_vibes) || has(data.preferred_price_range) || has(data.preferred_times)) {
          setOnboardingPrefs({
            preferred_cuisines: data.preferred_cuisines || [],
            preferred_vibes: data.preferred_vibes || [],
            preferred_price_range: data.preferred_price_range || [],
            preferred_times: data.preferred_times || [],
            max_distance: data.max_distance || 15,
            dietary_restrictions: data.dietary_restrictions || [],
          });
        } else {
          setFlowState('customize');
        }
        setOnboardingLoaded(true);
      } catch {
        setOnboardingLoaded(true);
        setFlowState('customize');
      }
    })();
  }, [user?.id]);

  // Prefill from proposal date
  useEffect(() => {
    if (!initialProposedDate || prefilledFromProposal) return;
    const dt = new Date(initialProposedDate);
    if (isNaN(dt.getTime())) return;
    if (!userModifiedDate) setSelectedDate(dt);
    if (!userModifiedTime) {
      try {
        const hhmm = format(dt, 'HH:mm');
        setSelectedTime(hhmm);
        if (!userModifiedTimePrefs) {
          const hours = parseInt(hhmm.split(':')[0]);
          let timePref = 'evening';
          if (hours >= 9 && hours < 12) timePref = 'morning';
          else if (hours >= 12 && hours < 15) timePref = 'lunch';
          else if (hours >= 15 && hours < 18) timePref = 'afternoon';
          else if (hours >= 21 || hours < 9) timePref = 'night';
          setSelectedTimePreferences(prev => prev.includes(timePref) ? prev : [...prev, timePref]);
        }
      } catch { /* ignore */ }
    }
    setPrefilledFromProposal(true);
  }, [initialProposedDate, prefilledFromProposal]);

  // Auto-navigate when collaborative results ready
  useEffect(() => {
    if (planningMode !== 'collaborative' || !collaborativeSession || !onDisplayVenues || hasAutoNavigated || autoNavigating) return;

    const bothReady = collaborativeSession.hasUserSetPreferences && collaborativeSession.hasPartnerSetPreferences;
    const shouldAuto = bothReady && hasSubmitted && !aiAnalyzing && venueRecommendations.length > 0;

    if (shouldAuto) {
      setAutoNavigating(true);
      setHasAutoNavigated(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      const timer = setTimeout(() => onDisplayVenues(), 2000);
      return () => clearTimeout(timer);
    }

    if (bothReady && hasSubmitted && !timeoutRef.current) {
      timeoutRef.current = setTimeout(() => {
        if (!hasAutoNavigated) {
          setTimeoutTriggered(true);
          setAutoNavigating(true);
          setHasAutoNavigated(true);
          onDisplayVenues();
        }
      }, 10000);
    }

    return () => { if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; } };
  }, [planningMode, collaborativeSession, hasSubmitted, aiAnalyzing, venueRecommendations.length, onDisplayVenues, hasAutoNavigated, autoNavigating]);

  // ── Handlers ──────────────────────────────────────────────────────

  const toggle = useCallback((item: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
    setSelectedTemplateId(null);
  }, []);

  const toggleCuisine = useCallback((id: string) => toggle(id, setSelectedCuisines), [toggle]);
  const toggleVibe = useCallback((id: string) => toggle(id, setSelectedVibes), [toggle]);
  const togglePrice = useCallback((id: string) => toggle(id, setSelectedPriceRange), [toggle]);
  const toggleTime = useCallback((id: string) => toggle(id, setSelectedTimePreferences), [toggle]);
  const toggleDietary = useCallback((id: string) => toggle(id, setSelectedDietary), [toggle]);

  const isTemplateActive = useCallback((t: { id: string; cuisines: string[]; vibes: string[]; priceRange: string[]; timePreferences: string[] }) =>
    selectedTemplateId === t.id || (haveSame(selectedCuisines, t.cuisines) && haveSame(selectedVibes, t.vibes) && haveSame(selectedPriceRange, t.priceRange) && haveSame(selectedTimePreferences, t.timePreferences)),
    [selectedTemplateId, selectedCuisines, selectedVibes, selectedPriceRange, selectedTimePreferences]);

  const applyTemplate = useCallback((t: QuickStartTemplate | { id: string; cuisines: string[]; vibes: string[]; priceRange: string[]; timePreferences: string[] }) => {
    if (isTemplateActive(t)) {
      setSelectedTemplateId(null); setSelectedCuisines([]); setSelectedVibes([]); setSelectedPriceRange([]); setSelectedTimePreferences([]);
    } else {
      setSelectedTemplateId(t.id); setSelectedCuisines(t.cuisines); setSelectedVibes(t.vibes); setSelectedPriceRange(t.priceRange); setSelectedTimePreferences(t.timePreferences);
    }
  }, [isTemplateActive]);

  const selectDuration = useCallback((id: string) => {
    const deselect = selectedDuration === id;
    setSelectedDuration(deselect ? null : id);
    if (!deselect) {
      const m = durationModels.find(d => d.id === id);
      if (m) {
        if (!userModifiedTimePrefs) setSelectedTimePreferences(m.suggestTimes);
        if (selectedPriceRange.length === 0) setSelectedPriceRange(m.suggestPrice);
        if (m.excludeVibes.length) setSelectedVibes(prev => prev.filter(v => !m.excludeVibes.includes(v)));
      }
    }
  }, [selectedDuration, userModifiedTimePrefs, selectedPriceRange.length]);

  const handleKeepPreferences = useCallback(() => {
    if (!onboardingPrefs) return;
    setSelectedCuisines(onboardingPrefs.preferred_cuisines);
    setSelectedVibes(onboardingPrefs.preferred_vibes);
    setSelectedPriceRange(onboardingPrefs.preferred_price_range);
    setSelectedTimePreferences(onboardingPrefs.preferred_times);
    setMaxDistance(onboardingPrefs.max_distance);
    setSelectedDietary(onboardingPrefs.dietary_restrictions);
    const t = onboardingPrefs.preferred_times;
    setSelectedDuration(t.includes('evening') || t.includes('night') ? 'evening' : 'relaxed');
    setFlowState('customize');
    toast({ title: 'Übernommen!', description: 'Passe bei Bedarf an oder starte direkt.' });
  }, [onboardingPrefs]);

  const handleCustomize = useCallback(() => {
    if (onboardingPrefs) {
      setSelectedCuisines(onboardingPrefs.preferred_cuisines);
      setSelectedVibes(onboardingPrefs.preferred_vibes);
      setSelectedPriceRange(onboardingPrefs.preferred_price_range);
      setSelectedTimePreferences(onboardingPrefs.preferred_times);
      setMaxDistance(onboardingPrefs.max_distance);
      setSelectedDietary(onboardingPrefs.dietary_restrictions);
    }
    setFlowState('customize');
  }, [onboardingPrefs]);

  const handleDateChange = useCallback((d: Date | undefined) => {
    setSelectedDate(d);
    setUserModifiedDate(true);
  }, []);

  const handleTimeChange = useCallback((t: string) => {
    setSelectedTime(t);
    setUserModifiedTime(true);
  }, []);

  const handleDisplayVenues = useCallback(() => {
    setHasAutoNavigated(true);
    onDisplayVenues?.();
  }, [onDisplayVenues]);

  const toggleSection = useCallback((id: string) => {
    setOpenSections(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  }, []);

  const submitPreferences = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) throw authError || new Error('Not authenticated');

      const uid = authData.user.id;
      const payload = {
        user_id: uid,
        preferred_cuisines: selectedCuisines, preferred_vibes: selectedVibes,
        preferred_price_range: selectedPriceRange, preferred_times: selectedTimePreferences,
        max_distance: maxDistance, dietary_restrictions: selectedDietary,
        updated_at: new Date().toISOString(),
      };

      const { data: existing } = await supabase.from('user_preferences').select('id').eq('user_id', uid).maybeSingle();
      const mutation = existing
        ? await supabase.from('user_preferences').update(payload).eq('user_id', uid)
        : await supabase.from('user_preferences').insert(payload);
      if (mutation.error) throw mutation.error;

      if (planningMode === 'collaborative' && sessionId) {
        const { data: sessionData } = await supabase.from('date_planning_sessions').select('initiator_id').eq('id', sessionId).single();
        if (sessionData) {
          const isInit = sessionData.initiator_id === user.id;
          await supabase.from('date_planning_sessions').update({
            [isInit ? 'initiator_preferences_complete' : 'partner_preferences_complete']: true,
            [isInit ? 'initiator_preferences' : 'partner_preferences']: payload,
            updated_at: new Date().toISOString(),
          }).eq('id', sessionId);
        }
      }

      toast({
        title: 'Gespeichert!',
        description: planningMode === 'collaborative' && collaborativeSession && !collaborativeSession.hasPartnerSetPreferences
          ? `Warte auf ${partnerName}...`
          : 'KI-Analyse startet...',
      });

      onPreferencesComplete({
        preferred_cuisines: selectedCuisines, preferred_vibes: selectedVibes,
        preferred_price_range: selectedPriceRange, preferred_times: selectedTimePreferences,
        max_distance: maxDistance, dietary_restrictions: selectedDietary,
        preferred_date: selectedDate, preferred_time: selectedTime,
        occasion: selectedOccasion,
      });
      setHasSubmitted(true);
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({ title: 'Fehler', description: 'Präferenzen konnten nicht gespeichert werden.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user?.id, selectedCuisines, selectedVibes, selectedPriceRange, selectedTimePreferences, maxDistance, selectedDietary, selectedDate, selectedTime, selectedOccasion, planningMode, sessionId, collaborativeSession, partnerName, onPreferencesComplete]);

  return {
    // State
    flowState, setFlowState, loading, hasSubmitted, onboardingPrefs, onboardingLoaded,
    selectedDuration, selectedCuisines, selectedVibes, selectedPriceRange,
    selectedTimePreferences, maxDistance, setMaxDistance, selectedDietary,
    selectedDate, selectedTime, selectedTemplateId,
    selectedOccasion, setSelectedOccasion,
    selectedMood, setSelectedMood,
    autoNavigating, timeoutTriggered, openSections,
    // Derived
    durationModel, filteredVibes, filteredTemplates, learnedTemplate, status,
    // Handlers
    toggleCuisine, toggleVibe, togglePrice, toggleTime, toggleDietary,
    isTemplateActive, applyTemplate, selectDuration,
    handleKeepPreferences, handleCustomize,
    handleDateChange, handleTimeChange, handleDisplayVenues,
    toggleSection, submitPreferences,
    user,
  };
};
