import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Slider } from '@/components/ui/slider';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { bowlChopsticks } from '@lucide/lab';

import {
  ArrowLeft, ArrowRight, Check, Clock, MapPin, Heart, Navigation, Loader2, X,
  Icon, ChevronDown, Save, HeartHandshake, Ban,
  Pizza, Fish, Flame, Croissant, CookingPot, Leaf, Beef, Soup,
  Smile, TreePine, Moon, Theater, Compass,
  PiggyBank, CreditCard, Gem, Crown,
  Sunrise, Sun, CloudSun, Sunset, MoonStar, Clock3,
  Salad, Sprout, WheatOff, MilkOff, CircleDot, Star,
  Accessibility, ParkingCircle, TrainFront, Dog, CigaretteOff, 
  type LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import OccasionPicker from '@/components/date-planning/preferences/OccasionPicker';
import MoodPicker from '@/components/date-planning/preferences/MoodPicker';
import PriorityPicker, { DEFAULT_PRIORITY_WEIGHTS, type PriorityWeights } from '@/components/date-planning/preferences/PriorityPicker';
import type { DateOccasion } from '@/components/date-planning/preferences/preferencesData';
import { Sparkles, SlidersHorizontal, SmilePlus } from 'lucide-react';
import type { DailyMood } from '@/utils/moodStorage';
import SituationalActiveBanner from '@/components/date-planning/preferences/SituationalActiveBanner';
import SecondaryCategoryPicker from '@/components/date-planning/preferences/SecondaryCategoryPicker';
import { getSituationalCategory, type SituationalCategoryId, type SituationalCategory } from '@/lib/situationalCategories';

// Icon + color mapping (slimmed down)
const prefIconMap: Record<string, { icon: LucideIcon | null; labIcon?: any; bg: string; fg: string }> = {
  italian:        { icon: Pizza,           bg: 'bg-red-500/15', fg: 'text-red-500' },
  japanese:       { icon: Fish,            bg: 'bg-orange-500/15', fg: 'text-orange-500' },
  mexican:        { icon: Flame,           bg: 'bg-yellow-600/15', fg: 'text-yellow-600' },
  french:         { icon: Croissant,       bg: 'bg-amber-500/15', fg: 'text-amber-500' },
  indian:         { icon: Soup,            bg: 'bg-orange-600/15', fg: 'text-orange-600' },
  mediterranean:  { icon: Leaf,            bg: 'bg-emerald-500/15', fg: 'text-emerald-500' },
  american:       { icon: Beef,            bg: 'bg-sky-500/15', fg: 'text-sky-500' },
  thai:           { icon: CookingPot,      bg: 'bg-lime-500/15', fg: 'text-lime-500' },
  chinese:        { icon: null, labIcon: bowlChopsticks, bg: 'bg-rose-500/15', fg: 'text-rose-500' },
  korean:         { icon: CookingPot,      bg: 'bg-violet-500/15', fg: 'text-violet-500' },
  romantic:       { icon: HeartHandshake,  bg: 'bg-pink-500/15', fg: 'text-pink-500' },
  casual:         { icon: Smile,           bg: 'bg-sky-500/15', fg: 'text-sky-500' },
  outdoor:        { icon: TreePine,        bg: 'bg-green-500/15', fg: 'text-green-500' },
  nightlife:      { icon: Moon,            bg: 'bg-indigo-500/15', fg: 'text-indigo-500' },
  cultural:       { icon: Theater,         bg: 'bg-purple-500/15', fg: 'text-purple-500' },
  adventurous:    { icon: Compass,         bg: 'bg-teal-500/15', fg: 'text-teal-500' },
  budget:         { icon: PiggyBank,       bg: 'bg-green-500/15', fg: 'text-green-500' },
  moderate:       { icon: CreditCard,      bg: 'bg-blue-500/15', fg: 'text-blue-500' },
  upscale:        { icon: Gem,             bg: 'bg-cyan-500/15', fg: 'text-cyan-500' },
  luxury:         { icon: Crown,           bg: 'bg-amber-500/15', fg: 'text-amber-500' },
  brunch:         { icon: Sunrise,         bg: 'bg-orange-400/15', fg: 'text-orange-400' },
  lunch:          { icon: Sun,             bg: 'bg-yellow-500/15', fg: 'text-yellow-500' },
  afternoon:      { icon: CloudSun,        bg: 'bg-amber-400/15', fg: 'text-amber-400' },
  dinner:         { icon: Sunset,          bg: 'bg-orange-600/15', fg: 'text-orange-600' },
  evening:        { icon: MoonStar,        bg: 'bg-indigo-500/15', fg: 'text-indigo-500' },
  flexible:       { icon: Clock3,          bg: 'bg-slate-400/15', fg: 'text-slate-400' },
  vegetarian:     { icon: Salad,           bg: 'bg-green-500/15', fg: 'text-green-500' },
  vegan:          { icon: Sprout,          bg: 'bg-lime-500/15', fg: 'text-lime-500' },
  gluten_free:    { icon: WheatOff,        bg: 'bg-amber-500/15', fg: 'text-amber-500' },
  dairy_free:     { icon: MilkOff,         bg: 'bg-sky-400/15', fg: 'text-sky-400' },
  halal:          { icon: CircleDot,       bg: 'bg-emerald-600/15', fg: 'text-emerald-600' },
  kosher:         { icon: Star,            bg: 'bg-blue-600/15', fg: 'text-blue-600' },
  wheelchair:       { icon: Accessibility,   bg: 'bg-blue-500/15', fg: 'text-blue-500' },
  parking:          { icon: ParkingCircle,   bg: 'bg-sky-500/15', fg: 'text-sky-500' },
  public_transport: { icon: TrainFront,      bg: 'bg-violet-500/15', fg: 'text-violet-500' },
  pet_friendly:     { icon: Dog,             bg: 'bg-amber-500/15', fg: 'text-amber-500' },
  non_smoking:      { icon: CigaretteOff,    bg: 'bg-red-500/15', fg: 'text-red-500' },
};

function PrefIcon({ id, size = 'md' }: { id: string; size?: 'sm' | 'md' | 'lg' }) {
  const config = prefIconMap[id];
  if (!config) return null;
  const sizeClasses = { sm: 'w-8 h-8 [&_svg]:w-4 [&_svg]:h-4', md: 'w-10 h-10 [&_svg]:w-5 [&_svg]:h-5', lg: 'w-12 h-12 [&_svg]:w-6 [&_svg]:h-6' };
  return (
    <div className={cn('rounded-xl flex items-center justify-center flex-shrink-0', config.bg, sizeClasses[size])}>
      {config.labIcon ? <Icon iconNode={config.labIcon} className={cn(config.fg)} /> : config.icon ? <config.icon className={cn(config.fg)} /> : null}
    </div>
  );
}

interface Preference { id: string; name: string; emoji: string; desc?: string; }

// --- Accordion Section Component ---
function AccordionSection({ title, icon, selectedCount, children, defaultOpen = false }: {
  title: string; icon: React.ReactNode; selectedCount: number; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-card">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 select-none"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-semibold text-foreground">{title}</span>
          {selectedCount > 0 && (
            <span className="text-xs font-medium bg-primary/15 text-primary px-2 py-0.5 rounded-full">
              {selectedCount}
            </span>
          )}
        </div>
        <ChevronDown className={cn('w-5 h-5 text-muted-foreground transition-transform duration-200', isOpen && 'rotate-180')} />
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Grid selection (icons + checkmark) ---
function SelectionGrid({ items, selected, onToggle, columns = 2 }: {
  items: Preference[]; selected: string[]; onToggle: (id: string) => void; columns?: number;
}) {
  return (
    <div className={cn('grid gap-2.5', columns === 2 ? 'grid-cols-2' : 'grid-cols-3')}>
      {items.map((item) => (
        <button
          type="button"
          key={item.id}
          onClick={() => onToggle(item.id)}
          style={{ WebkitTapHighlightColor: 'transparent' }}
          className="p-3 rounded-xl border border-border bg-background text-foreground select-none active:scale-[0.97] transition-transform"
        >
          <PrefIcon id={item.id} size="sm" />
          <div className="font-medium text-xs mt-1.5">{item.name}</div>
          {selected.includes(item.id) && <Check className="w-4 h-4 mx-auto mt-1 text-primary" />}
        </button>
      ))}
    </div>
  );
}

// --- List selection (icon + label + desc + checkmark) ---
function SelectionList({ items, selected, onToggle, iconMap }: {
  items: Preference[]; selected: string[]; onToggle: (id: string) => void; iconMap?: Record<string, string>;
}) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <button
          type="button"
          key={item.id}
          onClick={() => onToggle(item.id)}
          style={{ WebkitTapHighlightColor: 'transparent' }}
          className="w-full p-3 rounded-xl border border-border bg-background text-foreground select-none flex items-center gap-3 active:scale-[0.98] transition-transform"
        >
          <PrefIcon id={iconMap?.[item.id] || item.id} size="sm" />
          <div className="flex-1 text-left">
            <div className="font-medium text-sm">{item.name}</div>
            {item.desc && <div className="text-xs text-muted-foreground">{item.desc}</div>}
          </div>
          {selected.includes(item.id) && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
        </button>
      ))}
    </div>
  );
}

// --- Single selection list ---
function SingleSelectionList({ items, selected, onToggle }: {
  items: Preference[]; selected: string; onToggle: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <button
          type="button"
          key={item.id}
          onClick={() => onToggle(item.id)}
          style={{ WebkitTapHighlightColor: 'transparent' }}
          className="w-full p-3 rounded-xl border border-border bg-background text-foreground select-none flex items-center gap-3 active:scale-[0.98] transition-transform"
        >
          <PrefIcon id={item.id} size="sm" />
          <div className="flex-1 text-left">
            <div className="font-medium text-sm">{item.name}</div>
            {item.desc && <div className="text-xs text-muted-foreground">{item.desc}</div>}
          </div>
          {selected === item.id && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
        </button>
      ))}
    </div>
  );
}

const Preferences = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isOnboarding = searchParams.get('onboarding') === 'true';
  const initialStep = parseInt(searchParams.get('step') || '0', 10);
  const { t } = useTranslation();
  const { updateCuisines, updateVibes, updateUserLocation } = useApp();
  const { user } = useAuth();

  // Situational category — ephemeral filter from Home quick-actions
  const [situationalCategory, setSituationalCategory] = useState<SituationalCategory | null>(null);
  useEffect(() => {
    const fromUrl = searchParams.get('category') as SituationalCategoryId | null;
    if (fromUrl) {
      const cat = getSituationalCategory(fromUrl);
      if (cat) {
        setSituationalCategory(cat);
        try { window.sessionStorage.setItem('hioutz-situational-category', cat.id); } catch {}
        // Clean URL so a refresh doesn't re-apply (session storage is the source of truth)
        searchParams.delete('category');
        setSearchParams(searchParams, { replace: true });
        return;
      }
    }
    // No URL param — restore from sessionStorage if present
    try {
      const stored = window.sessionStorage.getItem('hioutz-situational-category') as SituationalCategoryId | null;
      const cat = getSituationalCategory(stored);
      if (cat) setSituationalCategory(cat);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearSituationalCategory = useCallback(() => {
    setSituationalCategory(null);
    try { window.sessionStorage.removeItem('hioutz-situational-category'); } catch {}
    // Clearing the primary also clears the secondary — it has no meaning alone.
    setSecondaryCategoryId(null);
    try { window.sessionStorage.removeItem('hioutz-situational-secondary'); } catch {}
  }, []);

  // Optional secondary "Danach noch …?" category — combines with the primary
  // one in the recommendation pipeline. Persisted in sessionStorage so it
  // survives navigation between Preferences → Results.
  const [secondaryCategoryId, setSecondaryCategoryId] = useState<SituationalCategoryId | null>(null);
  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem('hioutz-situational-secondary') as SituationalCategoryId | null;
      if (stored && getSituationalCategory(stored)) setSecondaryCategoryId(stored);
    } catch {}
  }, []);

  const handleSecondaryChange = useCallback((id: SituationalCategoryId | null) => {
    setSecondaryCategoryId(id);
    try {
      if (id) window.sessionStorage.setItem('hioutz-situational-secondary', id);
      else window.sessionStorage.removeItem('hioutz-situational-secondary');
    } catch {}
  }, []);


  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [excludedCuisines, setExcludedCuisines] = useState<string[]>([]);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string[]>([]);
  const [selectedTimePreferences, setSelectedTimePreferences] = useState<string[]>([]);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [selectedAccessibility, setSelectedAccessibility] = useState<string[]>([]);
  const [homeAddress, setHomeAddress] = useState<string>('');
  const [homeLatitude, setHomeLatitude] = useState<number | null>(null);
  const [homeLongitude, setHomeLongitude] = useState<number | null>(null);
  const [maxDistance, setMaxDistance] = useState<number>(10);
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);
  const [locationError, setLocationError] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedOccasion, setSelectedOccasion] = useState<DateOccasion | null>(null);
  const [selectedMood, setSelectedMood] = useState<DailyMood | null>(null);
  const [priorityWeights, setPriorityWeights] = useState<PriorityWeights>({ ...DEFAULT_PRIORITY_WEIGHTS });

  useEffect(() => {
    const loadExistingPreferences = async () => {
      if (!user) return;
      try {
        const { data } = await supabase
          .from('user_preferences')
          .select('home_latitude, home_longitude, home_address, preferred_cuisines, preferred_vibes, preferred_price_range, preferred_times, dietary_restrictions, preferred_activities, preferred_entertainment, preferred_duration, accessibility_needs, preferred_venue_types, lifestyle_data')
          .eq('user_id', user.id)
          .single();
        if (data) {
          if (data.home_latitude) setHomeLatitude(data.home_latitude);
          if (data.home_longitude) setHomeLongitude(data.home_longitude);
          if (data.home_address) setHomeAddress(data.home_address);
          if ((data as any).max_distance) setMaxDistance((data as any).max_distance);
          if (data.preferred_cuisines) setSelectedCuisines(data.preferred_cuisines);
          if ((data as any).excluded_cuisines) setExcludedCuisines((data as any).excluded_cuisines);
          if (data.preferred_vibes) setSelectedVibes(data.preferred_vibes);
          if (data.preferred_price_range) setSelectedPriceRange(data.preferred_price_range);
          if (data.preferred_times) setSelectedTimePreferences(data.preferred_times);
          if (data.dietary_restrictions) setSelectedDietary(data.dietary_restrictions);
          if ((data as any).accessibility_needs) setSelectedAccessibility((data as any).accessibility_needs);
          // Load AI signal preferences from lifestyle_data
          if (data.lifestyle_data) {
            const ld = data.lifestyle_data as any;
            if (ld.occasion) setSelectedOccasion(ld.occasion);
            if (ld.mood) setSelectedMood(ld.mood);
            if (ld.priority_weights) setPriorityWeights({ ...DEFAULT_PRIORITY_WEIGHTS, ...ld.priority_weights });
          }
        }
      } catch (error) {
        console.log('No existing preferences found');
      }
    };
    loadExistingPreferences();
  }, [user]);

  const toggleSelection = (item: string, selectedItems: string[], setSelectedItems: React.Dispatch<React.SetStateAction<string[]>>) => {
    setSelectedItems(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  const useCurrentLocation = async () => {
    setIsLocating(true);
    setLocationError('');
    if (!navigator.geolocation) { setLocationError(t('preferences.locationNotSupported')); setIsLocating(false); return; }
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
      });
      setHomeLatitude(position.coords.latitude);
      setHomeLongitude(position.coords.longitude);
      try {
        const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`);
        if (response.ok) {
          const data = await response.json();
          setHomeAddress([data.city, data.principalSubdivision, data.countryName].filter(Boolean).join(', ') || 'Current Location');
        } else { setHomeAddress('Current Location'); }
      } catch { setHomeAddress('Current Location'); }
    } catch { setLocationError(t('preferences.locationError')); }
    finally { setIsLocating(false); }
  };

  const clearHomeLocation = () => { setHomeAddress(''); setHomeLatitude(null); setHomeLongitude(null); setLocationError(''); setSuggestions([]); };

  // Autocomplete suggestions
  const [suggestions, setSuggestions] = useState<{ display_name: string; lat: string; lon: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSuggestions = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query.trim())}&format=json&limit=5&addressdetails=1`,
          { headers: { 'Accept-Language': 'de' } }
        );
        const data = await res.json();
        if (data?.length > 0) {
          setSuggestions(data.map((d: any) => ({ display_name: d.display_name, lat: d.lat, lon: d.lon })));
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch { setSuggestions([]); }
    }, 350);
  }, []);

  const selectSuggestion = (suggestion: { display_name: string; lat: string; lon: string }) => {
    const shortName = suggestion.display_name.split(',').slice(0, 3).join(',').trim();
    setHomeAddress(shortName);
    setHomeLatitude(parseFloat(suggestion.lat));
    setHomeLongitude(parseFloat(suggestion.lon));
    setSuggestions([]);
    setShowSuggestions(false);
    setLocationError('');
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const geocodeAddress = async (event?: React.SyntheticEvent) => {
    event?.preventDefault();
    event?.stopPropagation();
    if (!homeAddress.trim()) return;
    setIsGeocodingAddress(true);
    setLocationError('');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(homeAddress.trim())}&format=json&limit=1&addressdetails=1`,
        { headers: { 'Accept-Language': 'de' } }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        setHomeLatitude(parseFloat(lat));
        setHomeLongitude(parseFloat(lon));
        setHomeAddress(display_name.split(',').slice(0, 3).join(',').trim());
      } else {
        setLocationError(t('preferences.addressNotFound', 'Adresse nicht gefunden. Bitte versuche es erneut.'));
      }
    } catch {
      setLocationError(t('preferences.geocodeError', 'Fehler bei der Adresssuche.'));
    } finally {
      setIsGeocodingAddress(false);
    }
  };

  const handleSave = async () => {
    updateCuisines(selectedCuisines);
    updateVibes(selectedVibes);
    if (user) {
      setIsSaving(true);
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError || !authData.user) throw authError || new Error('Not authenticated');
        const currentUserId = authData.user.id;
        const preferencePayload = {
          user_id: currentUserId,
          home_latitude: homeLatitude, home_longitude: homeLongitude, home_address: homeAddress || null, max_distance: maxDistance,
          preferred_cuisines: selectedCuisines.length > 0 ? selectedCuisines : null,
          excluded_cuisines: excludedCuisines.length > 0 ? excludedCuisines : null,
          preferred_vibes: selectedVibes.length > 0 ? selectedVibes : null,
          preferred_price_range: selectedPriceRange.length > 0 ? selectedPriceRange : null,
          preferred_times: selectedTimePreferences.length > 0 ? selectedTimePreferences : null,
          dietary_restrictions: selectedDietary.length > 0 ? selectedDietary : null,
          accessibility_needs: selectedAccessibility.length > 0 ? selectedAccessibility : null,
          lifestyle_data: {
            occasion: selectedOccasion,
            mood: selectedMood,
            priority_weights: priorityWeights,
          },
        };
        const { data: existing, error: existErr } = await supabase.from('user_preferences').select('id').eq('user_id', currentUserId).maybeSingle();
        if (existErr) throw existErr;
        const mutation = existing
          ? await supabase.from('user_preferences').update(preferencePayload).eq('user_id', currentUserId)
          : await supabase.from('user_preferences').insert(preferencePayload);
        if (mutation.error) throw mutation.error;
        try {
          const { initializePreferenceVectors } = await import('@/services/preferenceInitService');
          await initializePreferenceVectors(user.id, { cuisines: selectedCuisines, vibes: selectedVibes, priceRange: selectedPriceRange, times: selectedTimePreferences, dietary: selectedDietary });
        } catch (e) { console.error('Failed to initialize preference vectors:', e); }
        try { const { awardPoints } = await import('@/services/awardPointsService'); await awardPoints('preferences_set'); } catch (e) { console.error('Failed to award preferences points:', e); }
        // Sync location to global app state so planner/recommendations use the new city
        if (homeLatitude && homeLongitude) {
          updateUserLocation({ latitude: homeLatitude, longitude: homeLongitude, address: homeAddress || undefined });
        }
        toast({ title: t('preferences.prefsSaved'), description: t('preferences.prefsSavedDesc') });
      } catch (error) {
        console.error('Error saving preferences:', error);
        toast({ variant: 'destructive', title: t('preferences.prefsError'), description: t('preferences.prefsErrorDesc') });
      } finally { setIsSaving(false); }
    }
    navigate(isOnboarding ? '/home' : '/friends');
  };

  // Data definitions
  const cuisines: Preference[] = [
    { id: 'italian', name: t('preferences.cuisine_italian'), emoji: '🍝' },
    { id: 'japanese', name: t('preferences.cuisine_japanese'), emoji: '🍣' },
    { id: 'mexican', name: t('preferences.cuisine_mexican'), emoji: '🌮' },
    { id: 'french', name: t('preferences.cuisine_french'), emoji: '🥐' },
    { id: 'indian', name: t('preferences.cuisine_indian'), emoji: '🍛' },
    { id: 'mediterranean', name: t('preferences.cuisine_mediterranean'), emoji: '🫒' },
    { id: 'american', name: t('preferences.cuisine_american'), emoji: '🍔' },
    { id: 'thai', name: t('preferences.cuisine_thai'), emoji: '🍜' },
    { id: 'chinese', name: t('preferences.cuisine_chinese'), emoji: '🥢' },
    { id: 'korean', name: t('preferences.cuisine_korean'), emoji: '🍲' },
  ];

  const vibes: Preference[] = [
    { id: 'romantic', name: t('preferences.vibe_romantic'), emoji: '💕', desc: t('preferences.vibe_romanticDesc') },
    { id: 'casual', name: t('preferences.vibe_casual'), emoji: '😊', desc: t('preferences.vibe_casualDesc') },
    { id: 'outdoor', name: t('preferences.vibe_outdoor'), emoji: '🌳', desc: t('preferences.vibe_outdoorDesc') },
    { id: 'nightlife', name: t('preferences.vibe_nightlife'), emoji: '🌃', desc: t('preferences.vibe_nightlifeDesc') },
    { id: 'cultural', name: t('preferences.vibe_cultural'), emoji: '🎭', desc: t('preferences.vibe_culturalDesc') },
    { id: 'adventurous', name: t('preferences.vibe_adventurous'), emoji: '🗺️', desc: t('preferences.vibe_adventurousDesc') },
  ];

  const priceRanges: Preference[] = [
    { id: 'budget', name: t('preferences.price_budget'), emoji: '💰', desc: t('preferences.price_budgetDesc') },
    { id: 'moderate', name: t('preferences.price_moderate'), emoji: '💳', desc: t('preferences.price_moderateDesc') },
    { id: 'upscale', name: t('preferences.price_upscale'), emoji: '💎', desc: t('preferences.price_upscaleDesc') },
    { id: 'luxury', name: t('preferences.price_luxury'), emoji: '👑', desc: t('preferences.price_luxuryDesc') },
  ];

  const timePreferences: Preference[] = [
    { id: 'brunch', name: t('preferences.time_brunch'), emoji: '🌅', desc: t('preferences.time_brunchDesc') },
    { id: 'lunch', name: t('preferences.time_lunch'), emoji: '☀️', desc: t('preferences.time_lunchDesc') },
    { id: 'afternoon', name: t('preferences.time_afternoon'), emoji: '🌤️', desc: t('preferences.time_afternoonDesc') },
    { id: 'dinner', name: t('preferences.time_dinner'), emoji: '🌆', desc: t('preferences.time_dinnerDesc') },
    { id: 'evening', name: t('preferences.time_evening'), emoji: '🌙', desc: t('preferences.time_eveningDesc') },
    { id: 'flexible', name: t('preferences.time_flexible'), emoji: '🕐', desc: t('preferences.time_flexibleDesc') },
  ];

  const dietaryRequirements: Preference[] = [
    { id: 'vegetarian', name: t('preferences.dietary_vegetarian'), emoji: '🥬' },
    { id: 'vegan', name: t('preferences.dietary_vegan'), emoji: '🌱' },
    { id: 'gluten_free', name: t('preferences.dietary_gluten_free'), emoji: '🚫' },
    { id: 'dairy_free', name: t('preferences.dietary_dairy_free'), emoji: '🥛' },
    { id: 'halal', name: t('preferences.dietary_halal'), emoji: '☪️' },
    { id: 'kosher', name: t('preferences.dietary_kosher'), emoji: '✡️' },
  ];

  const accessibilityNeeds: Preference[] = [
    { id: 'wheelchair', name: t('preferences.access_wheelchair'), emoji: '♿' },
    { id: 'parking', name: t('preferences.access_parking'), emoji: '🅿️' },
    { id: 'public_transport', name: t('preferences.access_public_transport'), emoji: '🚇' },
    { id: 'pet_friendly', name: t('preferences.access_pet_friendly'), emoji: '🐕' },
    { id: 'non_smoking', name: t('preferences.access_non_smoking'), emoji: '🚭' },
  ];

  const [step, setStep] = useState(Math.min(Math.max(initialStep, 0), 2));
  const steps = [
    { title: t('preferences.stepContext', 'Dein Kontext'), subtitle: t('preferences.stepContextDesc', 'Anlass, Stimmung & was dir wichtig ist'), icon: <Sparkles className="w-5 h-5 text-primary" /> },
    { title: t('preferences.stepTaste', 'Geschmack'), subtitle: t('preferences.stepTasteDesc', 'Was isst du gerne & welche Stimmung magst du?'), icon: <Heart className="w-5 h-5 text-pink-500" /> },
    { title: t('preferences.stepPractical', 'Praktisches'), subtitle: t('preferences.stepPracticalDesc', 'Budget, Timing & Standort'), icon: <MapPin className="w-5 h-5 text-emerald-500" /> },
  ];

  const canGoNext = step < 2;
  const canGoBack = step > 0;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="max-w-md mx-auto">
        {situationalCategory && (
          <div className="px-4 pt-4">
            <SituationalActiveBanner category={situationalCategory} onClear={clearSituationalCategory} />
            <div className="mt-2">
              <SecondaryCategoryPicker
                primary={situationalCategory}
                secondaryId={secondaryCategoryId}
                onChange={handleSecondaryChange}
              />
            </div>
          </div>
        )}
        {/* Header */}
        <div className="p-4 pt-12 bg-card shadow-sm sticky top-0 z-10 space-y-3">
          <div className="flex items-center gap-3">
            <Button onClick={() => canGoBack ? setStep(s => s - 1) : navigate(-1)} variant="ghost" size="icon" className="text-muted-foreground flex-shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-semibold text-foreground">{steps[step].title}</h1>
              <p className="text-xs text-muted-foreground">{steps[step].subtitle}</p>
            </div>
            <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
              {step + 1}/3
            </span>
          </div>
          {/* Progress bar */}
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div key={i} className={cn('h-1 rounded-full flex-1 transition-colors duration-300', i <= step ? 'bg-primary' : 'bg-muted')} />
            ))}
          </div>
          {/* Navigation buttons */}
          <div className="flex gap-2 pt-1">
            {canGoNext ? (
              <Button onClick={() => setStep(s => s + 1)} className="flex-1 h-10 font-semibold text-sm">
                {t('home.wizardNext')} <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={isSaving} className="flex-1 h-10 font-semibold text-sm">
                {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('preferences.saving')}</> : <><Save className="w-4 h-4 mr-2" />{t('preferences.findDates') || 'Speichern & weiter'}</>}
              </Button>
            )}
          </div>
        </div>

        {/* Step content */}
        <div className="px-4 py-5 space-y-3 pb-6">

          {/* Step 0: Kontext */}
          {step === 0 && (
            <>
              <AccordionSection title="Anlass" icon={<Sparkles className="w-5 h-5 text-primary" />} selectedCount={selectedOccasion ? 1 : 0} defaultOpen>
                <OccasionPicker selectedOccasion={selectedOccasion} onSelectOccasion={setSelectedOccasion} />
              </AccordionSection>

              <AccordionSection title="Stimmung" icon={<SmilePlus className="w-5 h-5 text-primary" />} selectedCount={selectedMood ? 1 : 0} defaultOpen>
                <MoodPicker selectedMood={selectedMood} onSelectMood={setSelectedMood} />
              </AccordionSection>

              <AccordionSection title="Prioritäten" icon={<SlidersHorizontal className="w-5 h-5 text-primary" />} selectedCount={Object.values(priorityWeights).filter(v => v !== 1.0).length}>
                <PriorityPicker weights={priorityWeights} onChangeWeights={setPriorityWeights} />
              </AccordionSection>
            </>
          )}

          {/* Step 1: Geschmack + Vibes */}
          {step === 1 && (
            <>
              <AccordionSection title={t('preferences.whatCraving') || 'Küche'} icon={<Heart className="w-5 h-5 text-pink-500" />} selectedCount={selectedCuisines.length} defaultOpen>
                <SelectionGrid items={cuisines} selected={selectedCuisines} onToggle={(id) => toggleSelection(id, selectedCuisines, setSelectedCuisines)} />
              </AccordionSection>

              <AccordionSection title={'Nie wieder vorschlagen'} icon={<Ban className="w-5 h-5 text-destructive" />} selectedCount={excludedCuisines.length}>
                <p className="text-xs text-muted-foreground mb-3">Küchen, die du <strong>nie</strong> vorgeschlagen bekommen möchtest.</p>
                <SelectionGrid items={cuisines} selected={excludedCuisines} onToggle={(id) => toggleSelection(id, excludedCuisines, setExcludedCuisines)} />
              </AccordionSection>

              <AccordionSection title={t('preferences.whatVibe') || 'Vibe'} icon={<HeartHandshake className="w-5 h-5 text-rose-500" />} selectedCount={selectedVibes.length} defaultOpen>
                <SelectionList items={vibes} selected={selectedVibes} onToggle={(id) => toggleSelection(id, selectedVibes, setSelectedVibes)} />
              </AccordionSection>

              <AccordionSection title={t('preferences.dietaryRequirements') || 'Ernährung'} icon={<Salad className="w-5 h-5 text-green-500" />} selectedCount={selectedDietary.length}>
                <SelectionGrid items={dietaryRequirements} selected={selectedDietary} onToggle={(id) => toggleSelection(id, selectedDietary, setSelectedDietary)} />
              </AccordionSection>
            </>
          )}

          {/* Step 2: Praktisches */}
          {step === 2 && (
            <>
              <AccordionSection title={t('preferences.whatBudget') || 'Budget'} icon={<CreditCard className="w-5 h-5 text-blue-500" />} selectedCount={selectedPriceRange.length} defaultOpen>
                <SelectionList items={priceRanges} selected={selectedPriceRange} onToggle={(id) => toggleSelection(id, selectedPriceRange, setSelectedPriceRange)} />
              </AccordionSection>

              <AccordionSection title={t('preferences.homeLocation') || 'Standort'} icon={<MapPin className="w-5 h-5 text-emerald-500" />} selectedCount={homeLatitude ? 1 : 0}>
                <div className="space-y-3">
                  <Button onClick={useCurrentLocation} disabled={isLocating} variant="outline" className="w-full h-11 border-primary/30 text-primary text-sm">
                    {isLocating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('preferences.gettingLocation')}</> : <><Navigation className="w-4 h-4 mr-2" />{t('preferences.useCurrentLocation')}</>}
                  </Button>
                  <div className="space-y-2">
                    <div className="relative" ref={suggestionsRef}>
                      <Input
                        type="text"
                        placeholder={t('preferences.enterAddress', 'Stadt, Adresse oder Ort eingeben...')}
                        value={homeAddress}
                        onChange={(e) => { setHomeAddress(e.target.value); fetchSuggestions(e.target.value); }}
                        onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setShowSuggestions(false); void geocodeAddress(e); } }}
                        className="w-full h-11 pl-9 text-sm"
                      />
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                          {suggestions.map((s, i) => (
                            <button
                              key={i}
                              type="button"
                              className="w-full text-left px-3 py-2.5 text-xs hover:bg-accent transition-colors flex items-start gap-2 border-b border-border/50 last:border-0"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => selectSuggestion(s)}
                            >
                              <MapPin className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />
                              <span className="text-foreground/80 line-clamp-2">{s.display_name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {!homeLatitude && (
                      <Button
                        type="button"
                        onClick={(e) => { setShowSuggestions(false); void geocodeAddress(e); }}
                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        disabled={!homeAddress.trim() || isGeocodingAddress}
                        size="sm"
                        className="w-full h-11"
                      >
                        {isGeocodingAddress ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-1" />{t('preferences.confirmLocation', 'Bestätigen')}</>}
                      </Button>
                    )}
                  </div>
                  {homeLatitude && homeLongitude && (
                    <div className="p-2.5 bg-success/10 rounded-lg border border-success/20 flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <Check className="w-4 h-4 text-success shrink-0" />
                        <span className="text-xs text-foreground/80 truncate">{homeAddress || `${homeLatitude.toFixed(4)}, ${homeLongitude.toFixed(4)}`}</span>
                      </div>
                      <Button type="button" onClick={clearHomeLocation} variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive h-7 w-7 p-0 shrink-0">
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                  {locationError && (
                    <div className="p-2.5 bg-destructive/10 rounded-lg border border-destructive/20">
                      <p className="text-xs text-destructive">{locationError}</p>
                    </div>
                  )}

                  {/* Max distance slider */}
                  <div className="pt-2 space-y-2">
                    <p className="text-sm font-medium text-foreground">{t('preferences.maxDistance', 'Max. Entfernung')}</p>
                    <Slider value={[maxDistance]} onValueChange={v => setMaxDistance(v[0])} min={1} max={20} step={1} className="w-full" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1 km</span>
                      <span className="font-medium text-foreground">{maxDistance} km</span>
                      <span>20 km</span>
                    </div>
                  </div>
                </div>
              </AccordionSection>

              <AccordionSection title={t('preferences.whenBest') || 'Timing'} icon={<Clock className="w-5 h-5 text-amber-500" />} selectedCount={selectedTimePreferences.length}>
                <SelectionGrid items={timePreferences} selected={selectedTimePreferences} onToggle={(id) => toggleSelection(id, selectedTimePreferences, setSelectedTimePreferences)} />
              </AccordionSection>

              <AccordionSection title={t('preferences.specialNeedsTitle') || 'Barrierefreiheit'} icon={<Accessibility className="w-5 h-5 text-blue-500" />} selectedCount={selectedAccessibility.length}>
                <SelectionList items={accessibilityNeeds} selected={selectedAccessibility} onToggle={(id) => toggleSelection(id, selectedAccessibility, setSelectedAccessibility)} />
              </AccordionSection>
            </>
          )}
        </div>

        {/* Bottom bar removed – buttons are now in the sticky header */}
      </div>
    </div>
  );
};

export default Preferences;
