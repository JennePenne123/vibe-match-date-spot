import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, Clock, Sparkles, Loader2, Check, Settings, CalendarIcon, CheckCircle, AlertCircle, X, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import SafeComponent from '@/components/SafeComponent';
import CollaborativeWaitingState from '@/components/date-planning/CollaborativeWaitingState';

// ── Types ──────────────────────────────────────────────────────

interface Preference {
  id: string;
  name: string;
  emoji: string;
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

// ── Data ──────────────────────────────────────────────────────

const cuisines: Preference[] = [
  { id: 'Italian', name: 'Italienisch', emoji: '🍝' },
  { id: 'Japanese', name: 'Japanisch', emoji: '🍣' },
  { id: 'Mexican', name: 'Mexikanisch', emoji: '🌮' },
  { id: 'French', name: 'Französisch', emoji: '🥐' },
  { id: 'Indian', name: 'Indisch', emoji: '🍛' },
  { id: 'Mediterranean', name: 'Mediterran', emoji: '🫒' },
  { id: 'American', name: 'Amerikanisch', emoji: '🍔' },
  { id: 'Thai', name: 'Thai', emoji: '🍜' },
  { id: 'Chinese', name: 'Chinesisch', emoji: '🥢' },
  { id: 'Korean', name: 'Koreanisch', emoji: '🍲' },
];

const durationModels = [
  { id: 'quick', title: 'Quick & Sweet', emoji: '⚡', desc: '1–2 h', excludeVibes: ['lively'], suggestTimes: ['morning', 'lunch', 'afternoon'], suggestPrice: ['$', '$$'] },
  { id: 'relaxed', title: 'Relaxed', emoji: '☀️', desc: '2–4 h', excludeVibes: [] as string[], suggestTimes: ['lunch', 'afternoon'], suggestPrice: ['$$', '$$$'] },
  { id: 'evening', title: 'Full Evening', emoji: '🌆', desc: '4+ h', excludeVibes: [] as string[], suggestTimes: ['evening', 'night'], suggestPrice: ['$$', '$$$', '$$$$'] },
  { id: 'adventure', title: 'All-Day', emoji: '🗺️', desc: 'Ganzer Tag', excludeVibes: [] as string[], suggestTimes: ['morning', 'lunch', 'afternoon', 'evening'], suggestPrice: ['$', '$$', '$$$'] },
];

const allVibes: Preference[] = [
  { id: 'romantic', name: 'Romantisch', emoji: '💕' },
  { id: 'casual', name: 'Casual', emoji: '😊' },
  { id: 'outdoor', name: 'Outdoor', emoji: '🌳' },
  { id: 'upscale', name: 'Upscale', emoji: '✨' },
  { id: 'lively', name: 'Lively', emoji: '🎉' },
  { id: 'cozy', name: 'Gemütlich', emoji: '🕯️' },
];

const priceRanges: Preference[] = [
  { id: '$', name: 'Budget', emoji: '💰' },
  { id: '$$', name: 'Moderate', emoji: '💳' },
  { id: '$$$', name: 'Gehoben', emoji: '💎' },
  { id: '$$$$', name: 'Luxus', emoji: '👑' },
];

const timePreferences: Preference[] = [
  { id: 'morning', name: 'Morgens', emoji: '🌅' },
  { id: 'lunch', name: 'Mittag', emoji: '☀️' },
  { id: 'afternoon', name: 'Nachmittag', emoji: '🌤️' },
  { id: 'evening', name: 'Abend', emoji: '🌆' },
  { id: 'night', name: 'Nacht', emoji: '🌙' },
];

const dietaryRequirements: Preference[] = [
  { id: 'vegetarian', name: 'Vegetarisch', emoji: '🥬' },
  { id: 'vegan', name: 'Vegan', emoji: '🌱' },
  { id: 'gluten-free', name: 'Glutenfrei', emoji: '🚫' },
  { id: 'dairy-free', name: 'Laktosefrei', emoji: '🥛' },
  { id: 'halal', name: 'Halal', emoji: '☪️' },
  { id: 'kosher', name: 'Koscher', emoji: '✡️' },
];

const quickStartTemplates = [
  { id: 'romantic-dinner', title: 'Romantic Dinner', emoji: '💕', cuisines: ['Italian', 'French'], vibes: ['romantic', 'upscale'], priceRange: ['$$$', '$$$$'], timePreferences: ['evening'], fitsDuration: ['evening', 'adventure'] },
  { id: 'casual-brunch', title: 'Casual Brunch', emoji: '☕', cuisines: ['American', 'Mediterranean'], vibes: ['casual', 'cozy'], priceRange: ['$', '$$'], timePreferences: ['morning', 'lunch'], fitsDuration: ['quick', 'relaxed', 'adventure'] },
  { id: 'trendy-cocktail', title: 'Cocktail Bar', emoji: '🍸', cuisines: ['American'], vibes: ['lively', 'upscale'], priceRange: ['$$', '$$$'], timePreferences: ['evening', 'night'], fitsDuration: ['evening'] },
  { id: 'coffee-walk', title: 'Coffee & Walk', emoji: '☕🚶', cuisines: ['American', 'Italian'], vibes: ['casual', 'outdoor'], priceRange: ['$'], timePreferences: ['morning', 'afternoon'], fitsDuration: ['quick'] },
];

// ── Component ──────────────────────────────────────────────────

const PreferencesStep: React.FC<PreferencesStepProps> = (props) => {
  const {
    sessionId, partnerId, partnerName, compatibilityScore, aiAnalyzing,
    onPreferencesComplete, initialProposedDate, planningMode = 'solo',
    collaborativeSession, onManualContinue, onDisplayVenues, venueRecommendations = [],
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

  const toggle = (item: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
    setSelectedTemplateId(null);
  };

  const haveSame = (a: string[], b: string[]) => a.length === b.length && [...a].sort().every((v, i) => v === [...b].sort()[i]);

  const isTemplateActive = (t: { id: string; cuisines: string[]; vibes: string[]; priceRange: string[]; timePreferences: string[] }) =>
    selectedTemplateId === t.id || (haveSame(selectedCuisines, t.cuisines) && haveSame(selectedVibes, t.vibes) && haveSame(selectedPriceRange, t.priceRange) && haveSame(selectedTimePreferences, t.timePreferences));

  const applyTemplate = (t: typeof quickStartTemplates[0]) => {
    if (isTemplateActive(t)) {
      setSelectedTemplateId(null); setSelectedCuisines([]); setSelectedVibes([]); setSelectedPriceRange([]); setSelectedTimePreferences([]);
    } else {
      setSelectedTemplateId(t.id); setSelectedCuisines(t.cuisines); setSelectedVibes(t.vibes); setSelectedPriceRange(t.priceRange); setSelectedTimePreferences(t.timePreferences);
    }
  };

  const selectDuration = (id: string) => {
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
  };

  const handleKeepPreferences = () => {
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
    setFlowState('customize');
  };

  const submitPreferences = async () => {
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
      });
      setHasSubmitted(true);
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({ title: 'Fehler', description: 'Präferenzen konnten nicht gespeichert werden.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // ── Render helpers ──────────────────────────────────────────────

  const toggleSection = (id: string) => setOpenSections(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  const summaryText = (items: string[], all: Preference[]) => {
    if (!items.length) return 'Keine Auswahl';
    const mapped = items.map(id => all.find(x => x.id === id)).filter(Boolean).map(x => `${x!.emoji} ${x!.name}`);
    return mapped.length <= 2 ? mapped.join(', ') : `${mapped.slice(0, 2).join(', ')} +${mapped.length - 2}`;
  };

  const Chip = ({ item, selected, onPress }: { item: Preference; selected: boolean; onPress: () => void }) => (
    <button
      type="button" onClick={onPress}
      style={{ WebkitTapHighlightColor: 'transparent' }}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-2 rounded-full border text-sm transition-colors select-none active:scale-[0.97]',
        selected ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-card text-muted-foreground hover:border-primary/30'
      )}
    >
      <span>{item.emoji}</span>
      <span className="font-medium">{item.name}</span>
      {selected && <Check className="w-3 h-3 ml-0.5 text-primary" />}
    </button>
  );

  const ChipGrid = ({ items, selected, setter }: { items: Preference[]; selected: string[]; setter: React.Dispatch<React.SetStateAction<string[]>> }) => (
    <div className="flex flex-wrap gap-2">
      {items.map(item => (
        <Chip key={item.id} item={item} selected={selected.includes(item.id)} onPress={() => toggle(item.id, setter)} />
      ))}
    </div>
  );

  const Section = ({ id, icon, title, summary, count, children }: { id: string; icon: React.ReactNode; title: string; summary: string; count: number; children: React.ReactNode }) => {
    const open = openSections.includes(id);
    return (
      <div className="border border-border rounded-xl overflow-hidden bg-card">
        <button
          type="button" onClick={() => toggleSection(id)}
          style={{ WebkitTapHighlightColor: 'transparent' }}
          className="flex items-center gap-3 w-full p-3.5 text-left select-none active:scale-[0.98] transition-transform"
        >
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted flex items-center justify-center">{icon}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground truncate">{summary}</p>
          </div>
          {count > 0 && <Badge variant="secondary" className="text-xs h-5 px-1.5 flex-shrink-0">{count}</Badge>}
          <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform duration-200 flex-shrink-0', open && 'rotate-180')} />
        </button>
        <div className={cn('grid transition-all duration-200', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
          <div className="overflow-hidden">
            <div className="px-3.5 pb-3.5 pt-1">{children}</div>
          </div>
        </div>
      </div>
    );
  };

  // ── Loading ──────────────────────────────────────────────────────

  if (!onboardingLoaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // ── Confirm screen ──────────────────────────────────────────────

  if (flowState === 'confirm' && onboardingPrefs) {
    const emojiMap: Record<string, string> = {
      Italian: '🍝', Japanese: '🍣', Mexican: '🌮', French: '🥐', Indian: '🍛',
      Mediterranean: '🫒', American: '🍔', Thai: '🍜', Chinese: '🥢', Korean: '🍲',
      romantic: '💕', casual: '😊', outdoor: '🌳', upscale: '✨', lively: '🎉', cozy: '🕯️',
    };

    const PreviewBadges = ({ items, fallback }: { items: string[]; fallback: string }) =>
      items.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {items.map(item => (
            <Badge key={item} variant="secondary" className="text-xs">
              {emojiMap[item] || fallback} {item}
            </Badge>
          ))}
        </div>
      ) : null;

    return (
      <SafeComponent>
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-1">Deine Vorlieben</h2>
            <p className="text-sm text-muted-foreground">Aus deinem Onboarding — übernehmen oder anpassen?</p>
          </div>

          <div className="bg-muted/50 rounded-xl p-4 space-y-3 border border-border">
            {onboardingPrefs.preferred_cuisines.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Küche</p>
                <PreviewBadges items={onboardingPrefs.preferred_cuisines} fallback="🍽️" />
              </div>
            )}
            {onboardingPrefs.preferred_vibes.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Vibe</p>
                <PreviewBadges items={onboardingPrefs.preferred_vibes} fallback="✨" />
              </div>
            )}
            {onboardingPrefs.preferred_price_range.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Budget</p>
                <PreviewBadges items={onboardingPrefs.preferred_price_range} fallback="💰" />
              </div>
            )}
            {onboardingPrefs.preferred_times.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Tageszeit</p>
                <div className="flex flex-wrap gap-1.5">
                  {onboardingPrefs.preferred_times.map(t => {
                    const tp = timePreferences.find(p => p.id === t);
                    return <Badge key={t} variant="secondary" className="text-xs">{tp?.emoji || '🕐'} {tp?.name || t}</Badge>;
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3">
            <Button onClick={handleKeepPreferences} className="w-full h-12 text-base font-semibold active:scale-[0.97] transition-transform">
              <Check className="w-5 h-5 mr-2" />
              So übernehmen
            </Button>
            <Button onClick={handleCustomize} variant="outline" className="w-full h-12 text-base active:scale-[0.97] transition-transform">
              <Settings className="w-4 h-4 mr-2" />
              Heute anders
            </Button>
          </div>
        </div>
      </SafeComponent>
    );
  }

  // ── Customize screen ──────────────────────────────────────────

  return (
    <SafeComponent>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Dein Date planen</h2>
          </div>
          {planningMode === 'collaborative' && (
            <div className="flex items-center gap-1">
              <div className={cn('w-2 h-2 rounded-full', status.userCompleted ? 'bg-primary' : 'bg-muted-foreground/30')} />
              <div className={cn('w-2 h-2 rounded-full', status.partnerCompleted ? 'bg-primary' : 'bg-muted-foreground/30')} />
            </div>
          )}
        </div>

        {/* Duration */}
        <div>
          <p className="text-sm font-semibold text-foreground mb-1">Wie viel Zeit hast du?</p>
          <p className="text-xs text-muted-foreground mb-3">Hilft der KI, passende Vorschläge zu finden</p>
          <div className="grid grid-cols-2 gap-2">
            {durationModels.map(m => {
              const sel = selectedDuration === m.id;
              return (
                <button
                  key={m.id} type="button" onClick={() => selectDuration(m.id)}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  className={cn(
                    'p-3 rounded-xl border-2 text-left select-none active:scale-[0.97] transition-transform',
                    sel ? 'border-primary bg-primary/5' : 'border-border bg-card'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{m.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm leading-tight">{m.title}</p>
                      <p className="text-[11px] text-muted-foreground">{m.desc}</p>
                    </div>
                    {sel && (
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

        {/* Quick Start + Sections — only after duration selected */}
        {selectedDuration && (
          <>
            {/* Quick Start */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Quick Start</p>
              <div className="flex flex-wrap gap-2">
                {learnedTemplate && (
                  <button
                    type="button" onClick={() => applyTemplate(learnedTemplate as any)}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                    className={cn(
                      'inline-flex items-center gap-2 px-3 py-2 rounded-full border text-sm select-none active:scale-[0.97] transition-transform',
                      isTemplateActive(learnedTemplate) ? 'border-primary bg-primary/10' : 'border-border bg-card'
                    )}
                  >
                    <span>{learnedTemplate.emoji}</span>
                    <span className="font-medium">{learnedTemplate.title}</span>
                    <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">KI</Badge>
                    {isTemplateActive(learnedTemplate) && <Check className="w-3 h-3" />}
                  </button>
                )}
                {filteredTemplates.map(t => (
                  <button
                    key={t.id} type="button" onClick={() => applyTemplate(t)}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                    className={cn(
                      'inline-flex items-center gap-2 px-3 py-2 rounded-full border text-sm select-none active:scale-[0.97] transition-transform',
                      isTemplateActive(t) ? 'border-primary bg-primary/10' : 'border-border bg-card'
                    )}
                  >
                    <span>{t.emoji}</span>
                    <span className="font-medium">{t.title}</span>
                    {isTemplateActive(t) && <Check className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Accordion Sections */}
            <div className="space-y-2">
              <Section id="cuisine" icon={<span className="text-sm">🍽️</span>} title="Küche"
                summary={summaryText(selectedCuisines, cuisines)} count={selectedCuisines.length}>
                <ChipGrid items={cuisines} selected={selectedCuisines} setter={setSelectedCuisines} />
              </Section>

              <Section id="vibes" icon={<span className="text-sm">✨</span>} title="Vibe"
                summary={summaryText(selectedVibes, allVibes)} count={selectedVibes.length}>
                {durationModel?.excludeVibes.length ? (
                  <p className="text-xs text-muted-foreground mb-2 italic">Einige Vibes basierend auf Zeitmodell ausgeblendet</p>
                ) : null}
                <ChipGrid items={filteredVibes} selected={selectedVibes} setter={setSelectedVibes} />
              </Section>

              <Section id="budget" icon={<span className="text-sm">💰</span>} title="Budget"
                summary={summaryText(selectedPriceRange, priceRanges)} count={selectedPriceRange.length}>
                <ChipGrid items={priceRanges} selected={selectedPriceRange} setter={setSelectedPriceRange} />
              </Section>

              <Section id="time" icon={<span className="text-sm">🕐</span>} title="Tageszeit"
                summary={summaryText(selectedTimePreferences, timePreferences)} count={selectedTimePreferences.length}>
                <ChipGrid items={timePreferences} selected={selectedTimePreferences} setter={setSelectedTimePreferences} />
              </Section>

              <Section id="advanced" icon={<Settings className="w-4 h-4 text-muted-foreground" />} title="Erweitert"
                summary={`${maxDistance} km${selectedDietary.length > 0 ? ` · ${selectedDietary.length} Diät` : ''}`} count={selectedDietary.length}>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Entfernung</p>
                    <Slider value={[maxDistance]} onValueChange={v => setMaxDistance(v[0])} max={50} min={1} step={1} className="w-full" />
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                      <span>1 km</span>
                      <span className="font-medium text-foreground">{maxDistance} km</span>
                      <span>50 km</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Diät / Unverträglichkeiten</p>
                    <ChipGrid items={dietaryRequirements} selected={selectedDietary} setter={setSelectedDietary} />
                  </div>
                </div>
              </Section>
            </div>
          </>
        )}

        {/* Date & Time Picker */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Wann geht's los?</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Datum</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('w-full justify-start text-left font-normal h-10', !selectedDate && 'text-muted-foreground')}>
                    <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="truncate text-xs">{selectedDate ? format(selectedDate, 'dd.MM.yy') : 'Wählen'}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={selectedDate}
                    onSelect={d => { setSelectedDate(d); setUserModifiedDate(true); }}
                    disabled={d => d < new Date()} initialFocus className="pointer-events-auto"
                    defaultMonth={selectedDate || (initialProposedDate ? new Date(initialProposedDate) : undefined)}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Uhrzeit</label>
              <Select value={selectedTime} onValueChange={t => { setSelectedTime(t); setUserModifiedTime(true); }}>
                <SelectTrigger className="h-10"><SelectValue placeholder="Wählen" /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => {
                    const h = i.toString().padStart(2, '0');
                    return <SelectItem key={`${h}:00`} value={`${h}:00`}>{h}:00</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Selection summary */}
        {(selectedCuisines.length > 0 || selectedVibes.length > 0) && (
          <div className="bg-muted/50 rounded-lg p-3 space-y-2 border border-border">
            <p className="text-xs font-medium text-muted-foreground">Deine Auswahl</p>
            <div className="flex flex-wrap gap-1.5">
              {selectedDuration && (
                <Badge variant="outline" className="text-xs">
                  {durationModels.find(d => d.id === selectedDuration)?.emoji} {durationModels.find(d => d.id === selectedDuration)?.title}
                </Badge>
              )}
              {selectedCuisines.slice(0, 3).map(c => <Badge key={c} variant="outline" className="text-xs">{cuisines.find(x => x.id === c)?.emoji} {c}</Badge>)}
              {selectedCuisines.length > 3 && <Badge variant="outline" className="text-xs">+{selectedCuisines.length - 3}</Badge>}
              {selectedVibes.slice(0, 3).map(v => <Badge key={v} variant="outline" className="text-xs">{allVibes.find(x => x.id === v)?.emoji} {v}</Badge>)}
              {selectedVibes.length > 3 && <Badge variant="outline" className="text-xs">+{selectedVibes.length - 3}</Badge>}
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center gap-3 pt-2">
          {onboardingPrefs && (
            <Button onClick={() => setFlowState('confirm')} variant="outline" className="active:scale-[0.97] transition-transform">
              Zurück
            </Button>
          )}
          <Button onClick={submitPreferences} disabled={loading || !selectedDuration} className="flex-1 h-12 text-base font-semibold active:scale-[0.97] transition-transform">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Speichern...</> : '🚀 Los geht\'s'}
          </Button>
        </div>
      </div>

      {/* Collaborative: Waiting for partner */}
      {planningMode === 'collaborative' && collaborativeSession && status.userCompleted && hasSubmitted && !status.partnerCompleted && (
        <div className="mt-6 space-y-4">
          <div className="border-t border-border" />
          <CollaborativeWaitingState
            partnerName={partnerName} sessionId={sessionId}
            hasPartnerSetPreferences={status.partnerCompleted} isWaitingForPartner
            hasCurrentUserSetPreferences={status.userCompleted} currentUserName={user?.name || 'Du'}
          />
          <Card className="border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <h3 className="text-base font-semibold">Deine Präferenzen gespeichert!</h3>
              </div>
              <p className="text-sm text-muted-foreground">Warte auf {partnerName}...</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Analysis Overlay */}
      {planningMode === 'collaborative' && collaborativeSession?.hasUserSetPreferences && collaborativeSession?.hasPartnerSetPreferences && hasSubmitted && aiAnalyzing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-md mx-4 border-primary/20 shadow-lg">
            <CardContent className="p-6 text-center">
              <Loader2 className="h-6 w-6 text-primary animate-spin mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-1">{timeoutTriggered ? 'Dauert etwas länger...' : 'KI-Analyse läuft'}</h3>
              <p className="text-sm text-muted-foreground">{timeoutTriggered ? 'Zeige dir die besten Ergebnisse.' : 'Kompatibilität wird analysiert...'}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Redirecting Overlay */}
      {planningMode === 'collaborative' && collaborativeSession?.hasUserSetPreferences && collaborativeSession?.hasPartnerSetPreferences && hasSubmitted && !aiAnalyzing && (() => {
        const hasVenues = venueRecommendations.length > 0;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Card className={cn('w-full max-w-md mx-4 shadow-lg', hasVenues ? 'border-primary/20' : 'border-muted-foreground/20')}>
              <CardContent className="p-6 text-center">
                {autoNavigating ? <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-3" />
                  : hasVenues ? <CheckCircle className="h-6 w-6 text-primary mx-auto mb-3" />
                  : <Clock className="h-6 w-6 text-muted-foreground mx-auto mb-3" />}
                <h3 className="text-lg font-semibold mb-1">
                  {autoNavigating ? 'Weiterleitung...' : hasVenues ? 'Analyse fertig!' : 'Fast bereit...'}
                </h3>
                {hasVenues ? (
                  <>
                    <p className="text-foreground mb-1">{venueRecommendations.length} Venues gefunden!</p>
                    {!autoNavigating && (
                      <Button onClick={() => { setHasAutoNavigated(true); onDisplayVenues?.(); }} className="mt-3">Matches ansehen</Button>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground mb-3">Suche läuft...</p>
                    <Button onClick={() => { setHasAutoNavigated(true); onDisplayVenues?.(); }} variant="outline" size="sm">
                      <AlertCircle className="h-4 w-4 mr-1" /> Trotzdem weiter
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        );
      })()}

      {/* Solo mode AI status */}
      {planningMode !== 'collaborative' && aiAnalyzing && (
        <Card className="border-primary/20 mt-6">
          <CardContent className="p-6 text-center">
            <Loader2 className="h-6 w-6 text-primary animate-spin mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-1">KI-Analyse läuft</h3>
            <p className="text-sm text-muted-foreground">Analysiere Präferenzen und suche Venues...</p>
          </CardContent>
        </Card>
      )}
    </SafeComponent>
  );
};

export default PreferencesStep;
