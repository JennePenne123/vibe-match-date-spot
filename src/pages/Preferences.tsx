import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { bowlChopsticks } from '@lucide/lab';
import {
  ArrowLeft, Check, Clock, MapPin, Coffee, Heart, Navigation, Loader2, X,
  Icon, ChevronDown, Save,
  Pizza, Fish, Flame, Croissant, CookingPot, Leaf, Beef, Soup,
  HeartHandshake, Smile, TreePine, Moon, Theater, Compass,
  PiggyBank, CreditCard, Gem, Crown,
  Sunrise, Sun, CloudSun, Sunset, MoonStar, Clock3,
  Zap, Hourglass, Timer, Shuffle,
  Wine, Tent, Martini, Palette, Dumbbell, PartyPopper,
  Guitar, Headphones, MessageCircle, Gamepad2, Music4, Tv,
  Salad, Sprout, WheatOff, MilkOff, CircleDot, Star,
  Accessibility, ParkingCircle, TrainFront, Dog, CigaretteOff,
  Sparkles, Ticket,
  Landmark, Film, Trophy, Waves, Mountain, Drama,
  Footprints, Target, Lock, Bike, Building2,
  type LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

const MapPreview = lazy(() => import('@/components/MapPreview'));

// Icon + color mapping
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
  quick:          { icon: Zap,             bg: 'bg-yellow-500/15', fg: 'text-yellow-500' },
  relaxed:        { icon: Hourglass,       bg: 'bg-teal-500/15', fg: 'text-teal-500' },
  extended:       { icon: Timer,           bg: 'bg-blue-500/15', fg: 'text-blue-500' },
  spontaneous:    { icon: Shuffle,         bg: 'bg-purple-400/15', fg: 'text-purple-400' },
  dining:         { icon: Wine,            bg: 'bg-red-500/15', fg: 'text-red-500' },
  dining_plus:    { icon: Tent,            bg: 'bg-pink-500/15', fg: 'text-pink-500' },
  cocktails:      { icon: Martini,         bg: 'bg-violet-500/15', fg: 'text-violet-500' },
  cultural_act:   { icon: Palette,         bg: 'bg-cyan-500/15', fg: 'text-cyan-500' },
  active:         { icon: Dumbbell,        bg: 'bg-rose-500/15', fg: 'text-rose-500' },
  nightlife_act:  { icon: PartyPopper,     bg: 'bg-fuchsia-500/15', fg: 'text-fuchsia-500' },
  live_music:          { icon: Guitar,         bg: 'bg-red-500/15', fg: 'text-red-500' },
  dj_playlist:         { icon: Headphones,     bg: 'bg-indigo-500/15', fg: 'text-indigo-500' },
  quiet_conversation:  { icon: MessageCircle,  bg: 'bg-sky-500/15', fg: 'text-sky-500' },
  games:               { icon: Gamepad2,       bg: 'bg-emerald-500/15', fg: 'text-emerald-500' },
  dancing:             { icon: Music4,         bg: 'bg-pink-500/15', fg: 'text-pink-500' },
  sports_viewing:      { icon: Tv,             bg: 'bg-blue-500/15', fg: 'text-blue-500' },
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
  museum:           { icon: Landmark,        bg: 'bg-amber-500/15', fg: 'text-amber-500' },
  gallery:          { icon: Palette,         bg: 'bg-fuchsia-500/15', fg: 'text-fuchsia-500' },
  theater_venue:    { icon: Drama,           bg: 'bg-purple-500/15', fg: 'text-purple-500' },
  cinema:           { icon: Film,            bg: 'bg-sky-500/15', fg: 'text-sky-500' },
  concert_hall:     { icon: Music4,          bg: 'bg-rose-500/15', fg: 'text-rose-500' },
  exhibition:       { icon: Ticket,          bg: 'bg-teal-500/15', fg: 'text-teal-500' },
  mini_golf:        { icon: Target,          bg: 'bg-green-500/15', fg: 'text-green-500' },
  bowling:          { icon: Trophy,          bg: 'bg-orange-500/15', fg: 'text-orange-500' },
  escape_room:      { icon: Lock,            bg: 'bg-indigo-500/15', fg: 'text-indigo-500' },
  climbing:         { icon: Mountain,        bg: 'bg-emerald-500/15', fg: 'text-emerald-500' },
  swimming:         { icon: Waves,           bg: 'bg-cyan-500/15', fg: 'text-cyan-500' },
  hiking:           { icon: Footprints,      bg: 'bg-lime-500/15', fg: 'text-lime-500' },
  cycling:          { icon: Bike,            bg: 'bg-sky-500/15', fg: 'text-sky-500' },
  karaoke:          { icon: Headphones,      bg: 'bg-pink-500/15', fg: 'text-pink-500' },
  comedy_club:      { icon: Smile,           bg: 'bg-yellow-500/15', fg: 'text-yellow-500' },
  arcade:           { icon: Gamepad2,        bg: 'bg-violet-500/15', fg: 'text-violet-500' },
  live_event:       { icon: Sparkles,        bg: 'bg-amber-500/15', fg: 'text-amber-500' },
  spa_wellness:     { icon: Building2,       bg: 'bg-teal-500/15', fg: 'text-teal-500' },
  template_romantic: { icon: Heart,          bg: 'bg-pink-500/15', fg: 'text-pink-500' },
  template_casual:   { icon: Coffee,         bg: 'bg-amber-500/15', fg: 'text-amber-500' },
  template_trendy:   { icon: Sparkles,       bg: 'bg-violet-500/15', fg: 'text-violet-500' },
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
  const [searchParams] = useSearchParams();
  const isOnboarding = searchParams.get('onboarding') === 'true';
  const { t } = useTranslation();
  const { updateCuisines, updateVibes } = useApp();
  const { user } = useAuth();

  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string[]>([]);
  const [selectedTimePreferences, setSelectedTimePreferences] = useState<string[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<string>('');
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [selectedEntertainment, setSelectedEntertainment] = useState<string[]>([]);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [selectedAccessibility, setSelectedAccessibility] = useState<string[]>([]);
  const [selectedVenueTypes, setSelectedVenueTypes] = useState<string[]>([]);
  const [homeAddress, setHomeAddress] = useState<string>('');
  const [homeLatitude, setHomeLatitude] = useState<number | null>(null);
  const [homeLongitude, setHomeLongitude] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadExistingPreferences = async () => {
      if (!user) return;
      try {
        const { data } = await supabase
          .from('user_preferences')
          .select('home_latitude, home_longitude, home_address, preferred_cuisines, preferred_vibes, preferred_price_range, preferred_times, dietary_restrictions, preferred_activities, preferred_entertainment, preferred_duration, accessibility_needs, preferred_venue_types')
          .eq('user_id', user.id)
          .single();
        if (data) {
          if (data.home_latitude) setHomeLatitude(data.home_latitude);
          if (data.home_longitude) setHomeLongitude(data.home_longitude);
          if (data.home_address) setHomeAddress(data.home_address);
          if (data.preferred_cuisines) setSelectedCuisines(data.preferred_cuisines);
          if (data.preferred_vibes) setSelectedVibes(data.preferred_vibes);
          if (data.preferred_price_range) setSelectedPriceRange(data.preferred_price_range);
          if (data.preferred_times) setSelectedTimePreferences(data.preferred_times);
          if (data.dietary_restrictions) setSelectedDietary(data.dietary_restrictions);
          if ((data as any).preferred_activities) setSelectedActivities((data as any).preferred_activities);
          if ((data as any).preferred_entertainment) setSelectedEntertainment((data as any).preferred_entertainment);
          if ((data as any).preferred_duration) setSelectedDuration((data as any).preferred_duration);
          if ((data as any).accessibility_needs) setSelectedAccessibility((data as any).accessibility_needs);
          if ((data as any).preferred_venue_types) setSelectedVenueTypes((data as any).preferred_venue_types);
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

  const toggleSingleSelection = (item: string, setSelectedItem: React.Dispatch<React.SetStateAction<string>>) => {
    setSelectedItem(prev => prev === item ? '' : item);
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

  const clearHomeLocation = () => { setHomeAddress(''); setHomeLatitude(null); setHomeLongitude(null); setLocationError(''); };

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
          home_latitude: homeLatitude, home_longitude: homeLongitude, home_address: homeAddress || null,
          preferred_cuisines: selectedCuisines.length > 0 ? selectedCuisines : null,
          preferred_vibes: selectedVibes.length > 0 ? selectedVibes : null,
          preferred_price_range: selectedPriceRange.length > 0 ? selectedPriceRange : null,
          preferred_times: selectedTimePreferences.length > 0 ? selectedTimePreferences : null,
          dietary_restrictions: selectedDietary.length > 0 ? selectedDietary : null,
          preferred_activities: selectedActivities.length > 0 ? selectedActivities : null,
          preferred_entertainment: selectedEntertainment.length > 0 ? selectedEntertainment : null,
          preferred_duration: selectedDuration || null,
          accessibility_needs: selectedAccessibility.length > 0 ? selectedAccessibility : null,
          preferred_venue_types: selectedVenueTypes.length > 0 ? selectedVenueTypes : null,
        };
        const { data: existing, error: existErr } = await supabase.from('user_preferences').select('id').eq('user_id', currentUserId).maybeSingle();
        if (existErr) throw existErr;
        const mutation = existing
          ? await supabase.from('user_preferences').update(preferencePayload).eq('user_id', currentUserId)
          : await supabase.from('user_preferences').insert(preferencePayload);
        if (mutation.error) throw mutation.error;
        try {
          const { initializePreferenceVectors } = await import('@/services/preferenceInitService');
          await initializePreferenceVectors(user.id, { cuisines: selectedCuisines, vibes: selectedVibes, priceRange: selectedPriceRange, times: selectedTimePreferences, dietary: selectedDietary, activities: selectedActivities, venueTypes: selectedVenueTypes });
        } catch (e) { console.error('Failed to initialize preference vectors:', e); }
        try { const { awardPoints } = await import('@/services/awardPointsService'); await awardPoints('preferences_set'); } catch (e) { console.error('Failed to award preferences points:', e); }
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
  const durations: Preference[] = [
    { id: 'quick', name: t('preferences.duration_quick'), emoji: '⚡', desc: t('preferences.duration_quickDesc') },
    { id: 'relaxed', name: t('preferences.duration_relaxed'), emoji: '⏰', desc: t('preferences.duration_relaxedDesc') },
    { id: 'extended', name: t('preferences.duration_extended'), emoji: '🕐', desc: t('preferences.duration_extendedDesc') },
    { id: 'spontaneous', name: t('preferences.duration_spontaneous'), emoji: '🤷', desc: t('preferences.duration_spontaneousDesc') },
  ];
  const activities: Preference[] = [
    { id: 'dining', name: t('preferences.activity_dining'), emoji: '🍽️', desc: t('preferences.activity_diningDesc') },
    { id: 'dining_plus', name: t('preferences.activity_dining_plus'), emoji: '🎪', desc: t('preferences.activity_dining_plusDesc') },
    { id: 'cocktails', name: t('preferences.activity_cocktails'), emoji: '🍸', desc: t('preferences.activity_cocktailsDesc') },
    { id: 'cultural', name: t('preferences.activity_cultural'), emoji: '🎨', desc: t('preferences.activity_culturalDesc') },
    { id: 'active', name: t('preferences.activity_active'), emoji: '🎳', desc: t('preferences.activity_activeDesc') },
    { id: 'nightlife', name: t('preferences.activity_nightlife'), emoji: '🎉', desc: t('preferences.activity_nightlifeDesc') },
  ];
  const entertainment: Preference[] = [
    { id: 'live_music', name: t('preferences.ent_live_music'), emoji: '🎵' },
    { id: 'dj_playlist', name: t('preferences.ent_dj_playlist'), emoji: '🎧' },
    { id: 'quiet_conversation', name: t('preferences.ent_quiet_conversation'), emoji: '💬' },
    { id: 'games', name: t('preferences.ent_games'), emoji: '🎮' },
    { id: 'dancing', name: t('preferences.ent_dancing'), emoji: '💃' },
    { id: 'sports_viewing', name: t('preferences.ent_sports_viewing'), emoji: '📺' },
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
  const allVenueTypes: Preference[] = [
    { id: 'museum', name: t('preferences.venue_museum'), emoji: '🏛️' },
    { id: 'gallery', name: t('preferences.venue_gallery'), emoji: '🎨' },
    { id: 'theater_venue', name: t('preferences.venue_theater'), emoji: '🎭' },
    { id: 'cinema', name: t('preferences.venue_cinema'), emoji: '🎬' },
    { id: 'concert_hall', name: t('preferences.venue_concert'), emoji: '🎵' },
    { id: 'exhibition', name: t('preferences.venue_exhibition'), emoji: '🎟️' },
    { id: 'mini_golf', name: t('preferences.venue_mini_golf'), emoji: '⛳' },
    { id: 'bowling', name: t('preferences.venue_bowling'), emoji: '🎳' },
    { id: 'escape_room', name: t('preferences.venue_escape_room'), emoji: '🔐' },
    { id: 'climbing', name: t('preferences.venue_climbing'), emoji: '🧗' },
    { id: 'swimming', name: t('preferences.venue_swimming'), emoji: '🏊' },
    { id: 'hiking', name: t('preferences.venue_hiking'), emoji: '🥾' },
    { id: 'cycling', name: t('preferences.venue_cycling'), emoji: '🚴' },
    { id: 'karaoke', name: t('preferences.venue_karaoke'), emoji: '🎤' },
    { id: 'comedy_club', name: t('preferences.venue_comedy'), emoji: '😂' },
    { id: 'arcade', name: t('preferences.venue_arcade'), emoji: '🕹️' },
    { id: 'live_event', name: t('preferences.venue_live_event'), emoji: '✨' },
    { id: 'spa_wellness', name: t('preferences.venue_spa'), emoji: '🧖' },
  ];

  const activityIconMap: Record<string, string> = { cultural: 'cultural_act', nightlife: 'nightlife_act' };

  const [step, setStep] = useState(0);
  const steps = [
    { title: 'Geschmack', subtitle: 'Was isst du gerne?', icon: <Heart className="w-5 h-5 text-pink-500" /> },
    { title: 'Stimmung & Stil', subtitle: 'Wie soll sich dein Date anfühlen?', icon: <HeartHandshake className="w-5 h-5 text-rose-500" /> },
    { title: 'Praktisches', subtitle: 'Wann, wie lange & wo?', icon: <MapPin className="w-5 h-5 text-emerald-500" /> },
  ];

  const canGoNext = step < 2;
  const canGoBack = step > 0;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="p-4 pt-12 bg-card shadow-sm sticky top-0 z-10 space-y-3">
          <div className="flex items-center gap-3">
            <Button onClick={() => canGoBack ? setStep(s => s - 1) : navigate(-1)} variant="ghost" size="icon" className="text-muted-foreground flex-shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
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
        </div>

        {/* Step content */}
        <div className="px-4 py-5 space-y-3 pb-32">

          {/* Step 1: Geschmack */}
          {step === 0 && (
            <>
              <AccordionSection title={t('preferences.whatCraving') || 'Küche'} icon={<Heart className="w-5 h-5 text-pink-500" />} selectedCount={selectedCuisines.length} defaultOpen>
                <SelectionGrid items={cuisines} selected={selectedCuisines} onToggle={(id) => toggleSelection(id, selectedCuisines, setSelectedCuisines)} />
              </AccordionSection>

              <AccordionSection title={t('preferences.whatBudget') || 'Budget'} icon={<CreditCard className="w-5 h-5 text-blue-500" />} selectedCount={selectedPriceRange.length}>
                <SelectionList items={priceRanges} selected={selectedPriceRange} onToggle={(id) => toggleSelection(id, selectedPriceRange, setSelectedPriceRange)} />
              </AccordionSection>

              <AccordionSection title={t('preferences.dietaryRequirements') || 'Ernährung'} icon={<Salad className="w-5 h-5 text-green-500" />} selectedCount={selectedDietary.length}>
                <SelectionGrid items={dietaryRequirements} selected={selectedDietary} onToggle={(id) => toggleSelection(id, selectedDietary, setSelectedDietary)} />
              </AccordionSection>
            </>
          )}

          {/* Step 2: Stimmung & Stil */}
          {step === 1 && (
            <>
              <AccordionSection title={t('preferences.whatVibe') || 'Vibe'} icon={<HeartHandshake className="w-5 h-5 text-rose-500" />} selectedCount={selectedVibes.length} defaultOpen>
                <SelectionList items={vibes} selected={selectedVibes} onToggle={(id) => toggleSelection(id, selectedVibes, setSelectedVibes)} />
              </AccordionSection>

              <AccordionSection title={t('preferences.whatActivity') || 'Aktivitäten'} icon={<Coffee className="w-5 h-5 text-orange-500" />} selectedCount={selectedActivities.length}>
                <SelectionList items={activities} selected={selectedActivities} onToggle={(id) => toggleSelection(id, selectedActivities, setSelectedActivities)} iconMap={activityIconMap} />
              </AccordionSection>

              <AccordionSection title={t('preferences.whatEntertainment') || 'Entertainment'} icon={<Guitar className="w-5 h-5 text-red-500" />} selectedCount={selectedEntertainment.length}>
                <SelectionGrid items={entertainment} selected={selectedEntertainment} onToggle={(id) => toggleSelection(id, selectedEntertainment, setSelectedEntertainment)} />
              </AccordionSection>

              <AccordionSection title={t('preferences.experiences') || 'Erlebnisse'} icon={<Ticket className="w-5 h-5 text-purple-500" />} selectedCount={selectedVenueTypes.length}>
                <SelectionGrid items={allVenueTypes} selected={selectedVenueTypes} onToggle={(id) => toggleSelection(id, selectedVenueTypes, setSelectedVenueTypes)} columns={3} />
              </AccordionSection>
            </>
          )}

          {/* Step 3: Praktisches */}
          {step === 2 && (
            <>
              <AccordionSection title={t('preferences.whenBest') || 'Timing'} icon={<Clock className="w-5 h-5 text-amber-500" />} selectedCount={selectedTimePreferences.length} defaultOpen>
                <SelectionGrid items={timePreferences} selected={selectedTimePreferences} onToggle={(id) => toggleSelection(id, selectedTimePreferences, setSelectedTimePreferences)} />
              </AccordionSection>

              <AccordionSection title={t('preferences.howLong') || 'Dauer'} icon={<Timer className="w-5 h-5 text-teal-500" />} selectedCount={selectedDuration ? 1 : 0}>
                <SingleSelectionList items={durations} selected={selectedDuration} onToggle={(id) => toggleSingleSelection(id, setSelectedDuration)} />
              </AccordionSection>

              <AccordionSection title={t('preferences.specialNeedsTitle') || 'Barrierefreiheit'} icon={<Accessibility className="w-5 h-5 text-blue-500" />} selectedCount={selectedAccessibility.length}>
                <SelectionList items={accessibilityNeeds} selected={selectedAccessibility} onToggle={(id) => toggleSelection(id, selectedAccessibility, setSelectedAccessibility)} />
              </AccordionSection>

              <AccordionSection title={t('preferences.homeLocation') || 'Standort'} icon={<MapPin className="w-5 h-5 text-emerald-500" />} selectedCount={homeLatitude ? 1 : 0}>
                <div className="space-y-3">
                  <Button onClick={useCurrentLocation} disabled={isLocating} variant="outline" className="w-full h-11 border-primary/30 text-primary text-sm">
                    {isLocating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('preferences.gettingLocation')}</> : <><Navigation className="w-4 h-4 mr-2" />{t('preferences.useCurrentLocation')}</>}
                  </Button>
                  <div className="relative">
                    <Input type="text" placeholder={t('preferences.enterAddress')} value={homeAddress} onChange={(e) => setHomeAddress(e.target.value)} className="w-full h-11 pl-9 text-sm" />
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                  {homeLatitude && homeLongitude && (
                    <>
                      <div className="p-2.5 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className="text-xs text-green-800 dark:text-green-300">{homeAddress || `${homeLatitude.toFixed(4)}, ${homeLongitude.toFixed(4)}`}</span>
                        </div>
                        <Button onClick={clearHomeLocation} variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive h-7 w-7 p-0">
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <Suspense fallback={<Skeleton className="h-[140px] w-full rounded-lg" />}>
                        <MapPreview latitude={homeLatitude} longitude={homeLongitude} address={homeAddress} height="140px" zoom={14} />
                      </Suspense>
                    </>
                  )}
                  {locationError && (
                    <div className="p-2.5 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                      <p className="text-xs text-red-600 dark:text-red-400">{locationError}</p>
                    </div>
                  )}
                </div>
              </AccordionSection>
            </>
          )}
        </div>

        {/* Sticky bottom buttons */}
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-background/80 backdrop-blur-lg border-t border-border p-4">
          <div className="max-w-md mx-auto flex gap-3">
            {canGoBack && (
              <Button onClick={() => setStep(s => s - 1)} variant="outline" className="h-12 px-6">
                <ArrowLeft className="w-4 h-4 mr-1" /> Zurück
              </Button>
            )}
            {canGoNext ? (
              <Button onClick={() => setStep(s => s + 1)} className="flex-1 h-12 font-semibold text-base">
                Weiter <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={isSaving} className="flex-1 h-12 font-semibold text-base">
                {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('preferences.saving')}</> : <><Save className="w-4 h-4 mr-2" />{t('preferences.findDates') || 'Speichern & weiter'}</>}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preferences;
